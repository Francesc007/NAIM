import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Garment } from '../types/garment';
import { garmentRepository } from '../services/garmentRepository';

const STORAGE_KEY = '@naim_garments';

interface GarmentContextValue {
  garments: Garment[];
  loading: boolean;
  refresh: () => Promise<void>;
  addGarment: (g: Garment) => Promise<void>;
  updateGarment: (g: Garment) => Promise<void>;
  deleteGarment: (id: string) => Promise<void>;
  markWorn: (id: string) => Promise<void>;
}

const GarmentContext = createContext<GarmentContextValue | null>(null);

export function GarmentProvider({ children }: { children: React.ReactNode }) {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { getInventoryFromSupabase } = await import('../services/databaseService');
      const fromSupabase = await getInventoryFromSupabase();
      if (fromSupabase.length > 0) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fromSupabase));
        setGarments(fromSupabase);
      } else {
        const list = await garmentRepository.getAll();
        setGarments(list);
      }
    } catch (error) {
      console.warn('[NAIM] Error cargando prendas:', error);
      const list = await garmentRepository.getAll();
      setGarments(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const { supabase } = require('../lib/supabase');
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) refresh();
    });
    return () => subscription?.unsubscribe();
  }, [refresh]);

  const addGarment = useCallback(async (g: Garment) => {
    try {
      await garmentRepository.add(g);
      const list = await garmentRepository.getAll();
      setGarments(list);
    } catch (error) {
      console.warn('[NAIM] Error guardando prenda:', error);
      throw error;
    }
  }, []);

  const updateGarment = useCallback(async (g: Garment) => {
    try {
      await garmentRepository.update(g);
      setGarments((prev) =>
        prev.map((item) => (item.id === g.id ? g : item))
      );
    } catch (error) {
      console.warn('[NAIM] Error actualizando prenda:', error);
      throw error;
    }
  }, []);

  const deleteGarment = useCallback(async (id: string) => {
    try {
      await garmentRepository.delete(id);
      setGarments((prev) => prev.filter((g) => g.id !== id));
    } catch (error) {
      console.warn('[NAIM] Error eliminando prenda:', error);
      throw error;
    }
  }, []);

  const markWorn = useCallback(async (id: string) => {
    try {
      await garmentRepository.markWorn(id);
      await refresh();
    } catch (error) {
      console.warn('[NAIM] Error actualizando uso:', error);
      throw error;
    }
  }, [refresh]);

  const value: GarmentContextValue = {
    garments,
    loading,
    refresh,
    addGarment,
    updateGarment,
    deleteGarment,
    markWorn,
  };

  return (
    <GarmentContext.Provider value={value}>{children}</GarmentContext.Provider>
  );
}

export function useGarments() {
  const ctx = useContext(GarmentContext);
  if (!ctx) throw new Error('useGarments must be used within GarmentProvider');
  return ctx;
}
