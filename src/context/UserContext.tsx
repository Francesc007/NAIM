import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_NAME_KEY = '@guardarropa_user_name';

interface UserContextType {
  userName: string | null;
  setUserName: (name: string | null) => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userName, setUserNameState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(USER_NAME_KEY).then((stored) => {
      setUserNameState(stored || null);
      setIsLoading(false);
    });
  }, []);

  const setUserName = async (name: string | null) => {
    if (name?.trim()) {
      await AsyncStorage.setItem(USER_NAME_KEY, name.trim());
      setUserNameState(name.trim());
    } else {
      await AsyncStorage.removeItem(USER_NAME_KEY);
      setUserNameState(null);
    }
  };

  return (
    <UserContext.Provider value={{ userName, setUserName, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
