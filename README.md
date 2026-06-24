# Guardarropa Inteligente — React Native (Expo)

App de guardarropa con IA para sugerencias de outfit personalizadas e inclusivas.

## Requisitos

- Node.js 18+
- npm o yarn
- Expo Go o dev client (para probar en dispositivo)

## Instalación

```bash
cd guardarropa-app
npm install
cp .env.example .env
# Editar .env con tus keys (ver sección Variables de entorno)
```

## Variables de entorno

Copia `.env.example` a `.env` y configura:

| Variable | Uso |
|----------|-----|
| `EXPO_PUBLIC_SUPABASE_URL` | Backend Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Auth anónima + DB |
| `EXPO_PUBLIC_GROQ_API_KEY` | Clasificación de prendas + sugerencias de outfit |
| `EXPO_PUBLIC_WEATHER_API_KEY` | Clima en Home y contexto de sugerencias |

> **Seguridad:** Nunca commitees `.env`. Si alguna key estuvo en el repositorio, rótala en los dashboards de Groq, OpenWeather y Supabase.

Reinicia Metro tras cambiar `.env`:

```bash
npm start
```

## ⚠️ Expo Go en Play Store vs SDK 55 (error común)

NAIM usa **Expo SDK 55**. La versión de **Expo Go en Play Store sigue en SDK 54** (transición oficial de Expo, 2026).

Si ves: *"This project is incompatible with this version of Expo Go / requires a newer version"* — **no es un bug tuyo**. Reinstalar desde Play Store **no sirve** hasta que publiquen SDK 55 en la tienda.

### Opción A — Instalar Expo Go SDK 55 en Android (sin Play Store)

1. Abre en el celular: https://expo.dev/go?device=true&platform=android&sdkVersion=55  
2. Descarga e instala ese APK (desinstala antes la Expo Go de Play Store si hace falta)
3. En PC: `npm start` y escanea el QR **desde esa Expo Go**

**Alternativa con cable USB:** conecta el Android, ejecuta `npm start` y pulsa **`a`** en la terminal; Expo puede instalar Expo Go SDK 55 automáticamente.

### Opción B — Usar tu APK de NAIM (recomendado, ya lo tienes)

No necesitas Expo Go. Instala el APK de EAS (`preview`) y conecta a Metro:

```bash
npm run start:dev
npm run tunnel
```

Escanea el QR con la **app NAIM instalada**, no con Expo Go.

---

## Cómo ejecutar

### En el navegador
```bash
npm run web
```
Abre http://localhost:8082

### En el celular con Expo Go (recomendado)

El proyecto incluye `expo-dev-client`. Sin el flag `--go`, Expo genera un QR para **development build** que **no abre en Expo Go**.

```bash
npm start          # mismo WiFi — fuerza Expo Go
npm run start:lan  # explícito LAN + clear cache
npm run phone      # túnel — si el QR no conecta en tu red
```

1. Instala **Expo Go** (Play Store / App Store)
2. Escanea el QR **desde Expo Go** (no con la cámara del sistema)
3. En terminal debe decir **`Using Expo Go`** (no "development build")
4. Si dice development build, pulsa **`s`** o reinicia con `npm start`

### En el celular con APK de EAS (dev client)

Si instalaste el APK desde `eas build --profile preview`:

```bash
npm run start:dev
npm run tunnel
```

Escanea el QR con la **app NAIM instalada**, no con Expo Go.

> `production` genera `.aab` (Play Store). Para instalar directo en Android usa **`preview`** (`.apk`).

## Solución de problemas (celular)

| Síntoma | Causa | Solución |
|---------|-------|----------|
| QR no abre la app | Modo development build | `npm start` o pulsa `s` en terminal |
| Unable to connect | Red distinta / firewall | `npm run phone` |
| APK instalado pero pantalla en blanco | Falta Metro + dev client | `npm run start:dev` + QR con app NAIM |
| `eas build --local` falla en Windows | Solo macOS/Linux | `eas build --profile preview` en la nube |

## Supabase (backend)

1. Habilita **Anonymous sign-ins** en Authentication → Providers
2. Ejecuta las migraciones en SQL Editor:
   - `supabase/migrations/001_items_rls.sql`
   - `supabase/migrations/002_storage_garment_images.sql`

## Build de producción (EAS)

Configura secrets en EAS (no van en git):

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_GROQ_API_KEY --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_WEATHER_API_KEY --value "..."
eas build --platform android --profile preview
eas build --platform android --profile production
```

## Estructura del proyecto

```
guardarropa-app/
├── App.tsx
├── app.config.js
├── eas.json
├── supabase/migrations/
├── src/
│   ├── components/
│   ├── config/
│   ├── context/
│   ├── hooks/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   ├── theme/
│   └── types/
└── package.json
```

## Flujos principales

1. **Añadir prenda:** Consentimiento IA → Foto → Groq clasifica → Usuario confirma → Upload Storage + Supabase
2. **Ver sugerencias:** Inicio → Sugerencias de hoy → Groq combina prendas
3. **Guardarropa:** Tab con lista de prendas (eliminar sincroniza con Supabase)

## Roadmap y validación

Ver `../docs/METRICAS_Y_FEEDBACK.md` y `../PLAN_GUARDAROPA_INTELIGENTE.md`.
