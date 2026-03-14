# Métricas de éxito y feedback diario

> Guardarropa Inteligente MVP — Seguimiento iterativo

---

## Métricas de validación (post-lanzamiento)

| Métrica | Objetivo | Cómo medir |
|---------|----------|------------|
| **Activación** | ≥30% completan onboarding | % usuarios que añaden ≥1 prenda |
| **Retención D7** | ≥20% vuelven | % usuarios que abren app 7 días después |
| **Core action** | ≥40% usan sugerencias | % usuarios que abren pantalla sugerencias |
| **Satisfacción** | ≥4/5 | Encuesta NPS o rating in-app |

---

## Checklist feedback diario

### Antes de cada sesión
- [ ] Revisar métricas del día anterior (si hay datos)
- [ ] Revisar issues/errores reportados
- [ ] Priorizar 1-3 tareas del backlog

### Durante la sesión
- [ ] Validar que el flujo principal funciona (añadir prenda → ver sugerencias)
- [ ] Probar en dispositivo real si es posible
- [ ] Documentar decisiones de producto/diseño

### Al final del día
- [ ] Actualizar estado de tareas completadas
- [ ] Registrar bloqueos o riesgos
- [ ] Preparar prioridades para mañana

---

## Riesgos a vigilar

1. **Calidad IA clasificación** — Si usuarios corrigen mucho → mejorar prompts o modelo
2. **Fricción onboarding** — Si abandono alto al añadir primera prenda → simplificar flujo
3. **Uso de sugerencias** — Si pocos abren → mejorar visibilidad o valor percibido

---

## Próximos pasos (post-MVP)

- Integración calendario (recordatorios contextuales)
- API key OpenAI (EXPO_PUBLIC_OPENAI_API_KEY) para clasificación real
- Analytics (Firebase / Mixpanel)
- Pruebas con usuarios reales

## Stack actual: React Native (Expo)

Proyecto en `guardarropa-app/`. Ejecutar: `npm start`
