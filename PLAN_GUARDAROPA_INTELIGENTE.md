# 📋 Plan Estratégico: Guardarropa Inteligente

> Análisis multiagente siguiendo la doctrina NEXUS del AI System Agency  
> Fecha: 12 de marzo de 2025

---

## 1. Resumen Ejecutivo

Tu idea de **Guardarropa Inteligente** se alinea con un mercado en crecimiento (apps de outfit planning con IA) y con tendencias de sostenibilidad y personalización. El análisis cruzado de los agentes Strategy, Product, Design, Project Management e Engineering identifica **oportunidades de diferenciación** y un camino claro para validar product-market fit en 4–6 semanas siguiendo NEXUS-Sprint.

---

## 2. Análisis por Perspectiva de Agentes

### 2.1 Strategy Orchestrator — Oportunidad de Mercado

**Landscape competitivo (2024–2025):**

| Competidor | Fortaleza | Debilidad | Oportunidad para ti |
|------------|-----------|-----------|---------------------|
| **10outfits** | 50k+ usuarios, 4.9 rating, IA OpenAI/Gemini | Posible fricción en onboarding | Enfoque en simplicidad y recordatorios contextuales |
| **FitWardrobe** | Privacidad on-device, gratis en beta | Menos features de calendario | Combinar privacidad + recordatorios inteligentes |
| **StylistIQ** | Calendario + eventos, Outfit Verifier | Menos enfoque en inclusividad | **Tu ventaja: experiencia inclusiva explícita** |
| **RISE** | Velocidad, escaneo código de barras | Menos personalización | Tu propuesta: fotos + clasificación + sugerencias |
| **StylVerse** | Analytics, cost-per-wear | Orientado a compra | Tu propuesta: uso diario, no shopping |
| **Stylebook** | Power users iOS | Manual, sin IA | Tu propuesta: IA + automatización |
| **Cladwell** | Capsule wardrobe | Suscripción, nicho | Tu propuesta: más amplio, gratuito inicial |

**Posicionamiento sugerido (Strategic Blueprint):**

- **Problema:** "¿Qué me pongo hoy?" consume tiempo y genera estrés; las apps actuales no integran bien calendario, eventos y preferencias de género.
- **Oportunidad:** App que combina **fotos + IA + calendario + recordatorios** con **experiencia explícitamente inclusiva** (género, cuerpo, estilo).
- **TAM/SAM/SOM:** Mercado global de apps de moda/personal styling en crecimiento; segmento "wardrobe management + outfit suggestion" aún fragmentado.

---

### 2.2 Product Orchestrator — Visión y Features

**Product Vision (alineada con tu idea):**

> "Una app que permite al usuario fotografiar su ropa, clasificarla en categorías y recibir sugerencias de outfits personalizadas para su día a día, con recordatorios basados en calendario y propuestas para eventos específicos, en una experiencia inclusiva para todos los géneros."

**Feature Specification — MoSCoW para MVP:**

| Prioridad | Feature | Descripción | Agente clave |
|-----------|---------|-------------|--------------|
| **MUST** | Captura y clasificación de prendas | Foto → categoría (tipo, color, ocasión) | AI Engineer, UX Architect |
| **MUST** | Sugerencias de outfit diarias | IA sugiere combinaciones según preferencias | AI Engineer |
| **MUST** | Recordatorios basados en calendario | Notificaciones para eventos/días específicos | Backend Architect |
| **MUST** | Experiencia inclusiva | Sin presuposiciones de género, lenguaje neutro | UX Researcher, Brand Guardian |
| **SHOULD** | Outfits para eventos | "Reunión", "cita", "entrevista", etc. | Product Manager |
| **SHOULD** | Integración calendario (Google/Apple) | Sincronización de eventos | Backend Architect |
| **COULD** | Wear analytics / cost-per-wear | Uso de prendas, sostenibilidad | Analytics Reporter |
| **WON'T** (MVP) | Virtual try-on, compra, social | Fuera de alcance inicial | — |

**Roadmap sugerido:**

1. **Fase 0–1 (2 semanas):** Discovery + Strategy + Arquitectura  
2. **Fase 2–3 (3 semanas):** Build core (fotos, clasificación, sugerencias, recordatorios)  
3. **Fase 4 (1 semana):** Hardening + QA  
4. **Fase 5–6 (1–2 semanas):** Launch + validación

---

### 2.3 Design Orchestrator — UX e Inclusividad

**Pipeline de diseño aplicado:**

| Etapa | Entregable | Consideración para Guardarropa Inteligente |
|-------|------------|--------------------------------------------|
| **UX Strategy** | User Experience Strategy Document | Personas diversas (género, edad, estilo), Jobs-to-be-done: "decidir qué ponerse en <2 min" |
| **Information Architecture** | IA Map | Categorías de prendas flexibles (no binarias), ocasiones configurables |
| **User Flows** | User Flow Diagrams | Flujo: foto → clasificación (asistida por IA) → guardarropa → sugerencia matutina |
| **Wireframes** | Wireframe Set | Onboarding sin preguntas de género obligatorias; preferencias opcionales |
| **Visual Design** | High-Fidelity UI | Paleta neutra, iconografía inclusiva, tipografía legible |
| **Design System** | Design System Spec | Tokens de accesibilidad (contraste, tamaño), soporte dark mode |

**Innovaciones de diseño sugeridas:**

1. **Clasificación asistida por IA:** El usuario confirma o corrige; la IA aprende sin imponer categorías rígidas.
2. **Preferencias de estilo vs. género:** "Formal", "casual", "deportivo" en lugar de "masculino/femenino".
3. **Recordatorios contextuales:** "Mañana tienes reunión a las 10h — ¿quieres ver sugerencias?" en lugar de notificaciones genéricas.
4. **Onboarding progresivo:** Empezar con 5–10 prendas para validar valor antes de pedir un guardarropa completo.

---

### 2.4 Project Management (Product Operations Orchestrator) — Ejecución

**Modo NEXUS recomendado:** **NEXUS-Sprint** (4–6 semanas, 18–22 agentes)

**Bucle Product Operations:**

```
Strategy → Planning → Execution → Operations → Measurement → Improvement
```

**Agentes core (siempre activos):**

| Agente | Rol en Guardarropa Inteligente |
|--------|--------------------------------|
| **Agents Orchestrator** | Control del pipeline Dev↔QA |
| **Senior Project Manager** | Spec → tareas, alcance realista |
| **Sprint Prioritizer** | Backlog MoSCoW, RICE |
| **UX Architect** | Flujos, wireframes, design system |
| **Frontend Developer** | UI (React Native / Flutter para móvil) |
| **Backend Architect** | API, base de datos, calendario |
| **AI Engineer** | Clasificación de prendas, sugerencias de outfit |
| **DevOps Automator** | CI/CD, despliegue |
| **Evidence Collector** | QA por tarea |
| **Reality Checker** | Quality gate final |

**Agentes de soporte (según fase):**

- **Brand Guardian:** Identidad inclusiva  
- **Analytics Reporter:** Métricas de validación  
- **Rapid Prototyper:** Experimentos de onboarding  
- **Feedback Synthesizer:** Síntesis de feedback post-lanzamiento  

**MVP Feature Lock Protocol:** Una vez iniciado Sprint 1, el alcance MVP se bloquea. Nuevas ideas → `BACKLOG_LATER.md`.

---

### 2.5 Engineering (Master Orchestrator) — Arquitectura Técnica

**Stack MVP (React Native):**

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| **Frontend** | React Native (Expo) | Cross-platform, acceso a cámara, hot reload |
| **Navegación** | React Navigation (Stack + Bottom Tabs) | Flujos estándar, tipos TypeScript |
| **Estado** | React Context | Simple, sin dependencias extra para MVP |
| **Persistencia** | expo-file-system (JSON) | Local, sin backend inicial |
| **IA** | OpenAI Vision (opcional) | Clasificación de imágenes; fallback a valores por defecto |
| **Calendario** | (Fase posterior) | Recordatorios contextuales |

**Innovaciones técnicas:**

1. **Clasificación híbrida:** IA sugiere categorías; el usuario confirma → dataset de entrenamiento propio para mejorar.
2. **Sugerencias offline-first:** Cache de outfits precalculados para uso sin conexión.
3. **Privacidad:** Opción de procesamiento on-device para fotos (similar a FitWardrobe) como diferenciador.
4. **API de eventos:** Abstracción para Google/Apple/Outlook para recordatorios unificados.

---

## 3. Mejoras e Innovaciones Identificadas

### 3.1 Sobre tu idea original

| Aspecto | Tu idea | Mejora sugerida |
|---------|---------|-----------------|
| **Clasificación** | Usuario clasifica en categorías | IA sugiere categorías; usuario confirma/corrige (menos fricción) |
| **Recordatorios** | Basados en calendario | Recordatorios contextuales: "Evento X mañana — ¿ver sugerencias?" |
| **Inclusividad** | Para todos los géneros | Diseño desde cero: lenguaje neutro, categorías no binarias, preferencias de estilo |
| **Sugerencias** | Combinaciones personalizadas | Añadir: clima, ocasión del día, frecuencia de uso (evitar repetir) |
| **Onboarding** | Implícito | Onboarding progresivo: 5–10 prendas primero, validar valor rápido |

### 3.2 Innovaciones adicionales

1. **"Outfit del día en 1 tap":** Una pantalla principal con 1–3 sugerencias listas al abrir la app.
2. **Wear analytics (post-MVP):** Cuántas veces se usa cada prenda → insights de sostenibilidad.
3. **Capsule por viaje/evento:** "Empacar para 3 días de trabajo" → IA sugiere combinaciones mínimas.
4. **Integración con clima:** API de weather para sugerencias adaptadas a temperatura.

---

## 4. Plan Detallado por Fases

### Fase 0 — Discovery (3–5 días)

| Tarea | Agente | Entregable | Prioridad |
|-------|--------|------------|-----------|
| Análisis competitivo | Trend Researcher | Market Analysis Report (TAM/SAM/SOM) | P0 |
| Entrevistas usuario (5–10) | UX Researcher | Personas, journey maps | P0 |
| Feedback existente (apps similares) | Feedback Synthesizer | Pain points priorizados | P1 |
| Auditoría regulatoria (GDPR, datos fotos) | Legal Compliance Checker | Compliance Matrix | P0 |
| Evaluación stack tecnológico | Tool Evaluator | Tech Stack Assessment | P1 |
| Síntesis y decisión GO/NO-GO | Executive Summary Generator | Opportunity Score, decisión | P0 |

**Quality Gate:** Opportunity Score ≥66 → GO. Documentar en Executive Summary.

---

### Fase 1 — Strategy & Architecture (5–7 días)

| Tarea | Agente | Entregable | Prioridad |
|-------|--------|------------|-----------|
| Product Vision Document | Product Strategist, Strategy Orchestrator | Visión, posicionamiento | P0 |
| Brand Foundation (inclusiva) | Brand Guardian | Colores, tipografía, voz | P1 |
| Arquitectura de sistema | Backend Architect | System Architecture Spec | P0 |
| Diseño ML (clasificación, sugerencias) | AI Engineer | ML System Design | P0 |
| UX Strategy + User Flows | UX Architect, UX Researcher | Flujos clave | P0 |
| Task List + Backlog RICE | Senior PM, Sprint Prioritizer | Sprint plan | P0 |

**Quality Gate:** Architecture Package aprobado por Studio Producer + Reality Checker.

---

### Fase 2 — Foundation (3–5 días)

| Tarea | Agente | Entregable | Prioridad |
|-------|--------|------------|-----------|
| CI/CD pipeline | DevOps Automator | Pipeline funcional | P0 |
| Scaffold frontend (React Native/Flutter) | Frontend Developer | App skeleton | P0 |
| Schema DB + API scaffold | Backend Architect | Auth, CRUD base | P0 |
| Design tokens + layout | UX Architect | Design System base | P1 |
| Monitoreo | Infrastructure Maintainer | Dashboards | P1 |

**Quality Gate:** Skeleton funcionando, pipeline operativo.

---

### Fase 3 — Build (2–3 semanas)

| Sprint | Tareas principales | Agentes |
|--------|--------------------|---------|
| **Sprint 1** | Captura fotos, clasificación IA, guardarropa CRUD, onboarding | Frontend, Backend, AI Engineer |
| **Sprint 2** | Motor de sugerencias, pantalla "Outfit del día", recordatorios básicos | AI Engineer, Backend, Frontend |
| **Sprint 3** | Integración calendario, recordatorios contextuales, pulido UX | Backend, Frontend, UX Architect |

**Dev↔QA Loop:** Evidence Collector valida cada tarea. Máximo 3 reintentos por tarea.

---

### Fase 4 — Hardening (3–5 días)

| Tarea | Agente | Entregable |
|-------|--------|------------|
| Suite de pruebas E2E | Evidence Collector | Screenshots, casos de prueba |
| Load testing | Performance Benchmarker | Reporte de rendimiento |
| Auditoría de accesibilidad | UX Architect | Checklist WCAG |
| Reality Check final | Reality Checker | Veredicto READY / NEEDS WORK |

---

### Fase 5 — Launch (1 semana)

| Tarea | Agente | Entregable |
|-------|--------|------------|
| Deploy producción | DevOps Automator | App en stores / web |
| Estrategia adquisición | Growth Hacker | Canales, viral loops |
| Contenido de lanzamiento | Content Creator | Landing, posts |
| Campaña social | Social Media Strategist | Plan multi-plataforma |
| Monitoreo post-lanzamiento | Analytics Reporter | Dashboards en tiempo real |

---

### Fase 6 — Operate & Validate (2+ semanas)

| Tarea | Agente | Métrica objetivo |
|-------|--------|------------------|
| Activación | Analytics Reporter | ≥30% completan onboarding |
| Retención D7 | Analytics Reporter | ≥20% vuelven |
| Core action | Analytics Reporter | ≥40% usan sugerencias |
| Feedback | Feedback Synthesizer | ≥50 respuestas, NPS ≥4/5 |

**Regla de validación:** Si 2+ métricas bajo umbral → Product Review (Studio Producer, Growth Hacker, Analytics, Senior PM).

---

## 5. Tareas Prioritarias (Top 10)

1. **Validar problema con usuarios reales** (entrevistas 5–10 personas) — Fase 0  
2. **Definir categorías de prendas inclusivas** (no binarias) — Fase 1  
3. **Diseñar flujo foto → clasificación → guardarropa** — Fase 1  
4. **Implementar clasificación IA de prendas** (OpenAI Vision / Gemini) — Fase 3  
5. **Implementar motor de sugerencias de outfit** — Fase 3  
6. **Integrar API de calendario** (Google/Apple) — Fase 3  
7. **Sistema de recordatorios push contextuales** — Fase 3  
8. **Onboarding progresivo (5–10 prendas)** — Fase 3  
9. **Auditoría de inclusividad (lenguaje, UI)** — Fase 4  
10. **Configurar analytics de validación** — Fase 2–5  

---

## 6. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Bajo engagement con clasificación manual** | Alta | Alto | IA sugiere categorías; usuario solo confirma |
| **Calidad de sugerencias IA insuficiente** | Media | Alto | Empezar con reglas + IA híbrida; iterar con feedback |
| **Fricción en captura de fotos** | Media | Medio | Guías visuales, fotos en maniquí o plano |
| **Privacidad de fotos (GDPR)** | Media | Alto | Legal Compliance en Fase 0; opción on-device |
| **Scope creep durante build** | Alta | Medio | MVP Feature Lock; Sprint Prioritizer estricto |
| **Competencia establecida (10outfits, etc.)** | Alta | Medio | Diferenciar en inclusividad + recordatorios contextuales |
| **Retención baja post-onboarding** | Media | Alto | Validar valor en primeras 5 prendas; recordatorios útiles |

---

## 7. Estrategia de Validación de Mercado

### 7.1 Pre-build (Fase 0)

1. **Entrevistas cualitativas:** 5–10 personas que usan o han probado apps de outfit/guardarropa.  
   - Preguntas: dolor actual, tiempo en decidir outfit, uso de calendario, preferencias de género en apps.

2. **Análisis de reviews:** Apps competidoras (App Store, Play Store, Reddit).  
   - Identificar quejas recurrentes (onboarding, sugerencias, inclusividad).

3. **Landing page + waitlist:** Descripción del producto, captura de emails.  
   - Métrica: tasa de conversión visitante → email (objetivo >5%).

### 7.2 Post-MVP (Fase 5–6)

1. **Métricas de activación (Startup Validation Metrics):**

   | Métrica | Objetivo | Acción si falla |
   |--------|----------|-----------------|
   | Activación | ≥30% completan onboarding | Rediseñar onboarding |
   | Retención D7 | ≥20% | Revisar valor de sugerencias |
   | Core action | ≥40% usan sugerencias | Simplificar flujo |
   | Satisfacción | ≥4/5 | Feedback Synthesizer → iterar |

2. **A/B tests (Experiment Tracker):**  
   - Onboarding: guiado vs. autónomo  
   - Recordatorios: hora fija vs. contextual  
   - Sugerencias: 1 vs. 3 opciones

3. **Product Review si 2+ métricas bajo umbral:**  
   - Participantes: Studio Producer, Growth Hacker, Analytics Reporter, Senior PM  
   - Opciones: iterar features, ajustar positioning, pivotar

### 7.3 Señales de product-market fit

- Usuarios piden features específicas (no genéricas)  
- Retención D30 >15%  
- NPS ≥40  
- Referidos orgánicos (boca a boca)

---

## 8. Próximos Pasos Inmediatos

1. **Ejecutar Fase 0:** Activar Trend Researcher, UX Researcher, Feedback Synthesizer, Legal Compliance Checker en paralelo.  
2. **Definir proyecto en AI System Agency:** Usar `PROJECT_START_PROMPT.md` con este documento como brief.  
3. **Crear `BACKLOG_LATER.md`:** Para features descartadas del MVP (virtual try-on, compra, social).  
4. **Decisión GO/NO-GO:** Tras Executive Summary con Opportunity Score.

---

## 9. Referencias

- **AI System Agency:** `AI System Agency/Agency-Agents-2026-main/`  
- **NEXUS:** `strategy/nexus-strategy.md`  
- **Runbook MVP:** `strategy/runbooks/scenario-startup-mvp.md`  
- **Phase 0 Playbook:** `strategy/playbooks/phase-0-discovery.md`  
- **Handoff Templates:** `strategy/coordination/handoff-templates.md`  

---

*Documento generado siguiendo las definiciones de Strategy, Product, Design, Project Management e Engineering Orchestrators del AI System Agency. Respetando NEXUS y protocolos de activación de agentes.*
