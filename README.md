# Guardarropa Inteligente — React Native (Expo)

App de guardarropa con IA para sugerencias de outfit personalizadas e inclusivas.

## Requisitos

- Node.js 18+
- npm o yarn
- Expo Go (para probar en dispositivo)

## Instalación

```bash
cd guardarropa-app
npm install
```

## Cómo ejecutar

### En el navegador (recomendado)
```bash
npm run web
```
Abre http://localhost:8082 en tu navegador. Si no se abre automáticamente, ve manualmente a esa URL.

> **Nota:** Si tienes `npm start` corriendo, deténlo primero (Ctrl+C) para evitar conflictos de puerto.

### En el celular (Expo Go)
```bash
npm start
```
- **Mismo WiFi:** Escanea el QR con Expo Go
- **QR no funciona:** Usa modo túnel: `npm run tunnel` (genera URL pública para escanear)

## Clasificación con IA (opcional)

Para usar clasificación real con OpenAI Vision, crea un archivo `.env` en la raíz:

```
EXPO_PUBLIC_OPENAI_API_KEY=tu_api_key
```

Sin API key, la app usa valores por defecto y el usuario confirma/corrige manualmente.

## Estructura del proyecto

```
guardarropa-app/
├── App.tsx
├── src/
│   ├── components/     # GarmentCard, etc.
│   ├── config/         # Categorías inclusivas
│   ├── context/        # GarmentContext (estado global)
│   ├── navigation/     # Stack + Tab navigator
│   ├── screens/        # Home, Wardrobe, AddGarment, Suggestions
│   ├── services/       # garmentRepository, aiClassification, suggestionEngine
│   ├── theme/          # Colores, design system
│   └── types/          # Garment, etc.
└── package.json
```

## Flujos principales

1. **Añadir prenda:** Foto (galería) → IA sugiere categoría → Usuario confirma → Guardar
2. **Ver sugerencias:** Inicio → "Ver sugerencias de hoy" → Motor combina prendas
3. **Guardarropa:** Tab con lista de prendas (long press para eliminar)

## Roadmap y validación

Ver `../docs/METRICAS_Y_FEEDBACK.md` y `../PLAN_GUARDAROPA_INTELIGENTE.md`.
