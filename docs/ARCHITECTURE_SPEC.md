# Especificación de Arquitectura — Guardarropa Inteligente

## 1. Visión del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    GUARDARROPA INTELIGENTE                       │
├─────────────────────────────────────────────────────────────────┤
│  Flutter App (iOS/Android)                                       │
│  ├── UI (Material 3, diseño inclusivo)                          │
│  ├── Cámara / Galería → captura fotos                            │
│  ├── Clasificación IA (OpenAI Vision / Gemini)                   │
│  ├── Almacenamiento local (SQLite/Hive)                          │
│  └── Motor de sugerencias (reglas + IA)                           │
├─────────────────────────────────────────────────────────────────┤
│  Backend (opcional MVP: Firebase/Supabase)                       │
│  ├── Auth (email, Google, Apple)                                 │
│  ├── Sync guardarropa (multi-dispositivo)                        │
│  └── Recordatorios push (eventos calendario)                     │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Modelo de Datos

### Prenda (Garment)
- `id`, `name`, `imagePath`, `category`, `subcategory`, `colors`, `occasion`, `season`, `createdAt`, `lastWornAt`, `wearCount`

### Categorías (inclusivas, no binarias)
- **Tipo:** camiseta, pantalón, falda, vestido, chaqueta, calzado, accesorio
- **Ocasión:** casual, formal, deportivo, trabajo, ocasión especial
- **Estación:** primavera, verano, otoño, invierno, todo el año

### Outfit (combinación)
- `id`, `garmentIds[]`, `occasion`, `createdAt`, `rating` (opcional)

## 3. Flujos Principales

1. **Añadir prenda:** Foto → IA sugiere categoría/color/ocasión → Usuario confirma → Guardar
2. **Ver sugerencias:** Abrir app → Motor genera 1-3 outfits → Usuario elige
3. **Recordatorio:** Notificación contextual (evento mañana) → Deep link a sugerencias

## 4. Stack MVP

| Componente | Tecnología |
|------------|------------|
| Frontend | Flutter 3.x |
| Estado | Riverpod |
| DB local | Hive / SQLite (sqflite) |
| Cámara | image_picker, camera |
| IA | OpenAI API / Google Gemini (clasificación) |
| Backend (fase 2) | Supabase (auth, storage, realtime) |

## 5. Principios de Inclusividad

- Lenguaje neutro en toda la UI
- Categorías sin presuposición de género
- Preferencias de estilo opcionales (formal, casual, etc.)
- Contraste WCAG AA, soporte tamaño de fuente del sistema
