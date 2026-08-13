# Prompt para Claude Code — Rediseño de la escena 3D como ciudad (portafolio)

> Pegá todo lo que sigue a partir de la línea `---` en Claude Code.

---

Vas a rediseñar la escena 3D de mi sitio de portafolio: pasar del "sitio de sistemas" actual a una **ciudad al atardecer** donde cada edificio es un rol de mi carrera. Trabajá de forma incremental: leé primero el código existente, proponé un plan corto, esperá mi OK, y recién ahí implementá.

## CONTEXTO DEL PROYECTO

### Stack real

- **Framework**: Next.js 16 (App Router, export estático a GitHub Pages — `next.config.ts` tiene `output: "export"` y `basePath`). React 19.
- **3D**: `@react-three/fiber` ^9.7 sobre `three` ^0.185. **No hay `@react-three/drei`, ni postprocesado, ni `CSS2DRenderer` instalados hoy** — si los necesitás, pedímelo antes de agregar dependencias.
- **Lenguaje**: TypeScript estricto. ESLint con `eslint-config-next`.
- **Entrada de la escena**: [src/world/World.tsx](src/world/World.tsx) (contenido del canvas) montado por [src/world/WorldCanvas.tsx](src/world/WorldCanvas.tsx) → [src/world/WorldStage.tsx](src/world/WorldStage.tsx) → [src/world/WorldStageLoader.tsx](src/world/WorldStageLoader.tsx) → [app/page.tsx](app/page.tsx).
- **Fuente de datos de contenido**: [src/data/resume.ts](src/data/resume.ts) — única fuente de verdad de texto. Reglas de esa casa: se nombran empleadores, no clientes finales; **no se inventan métricas**; ahí no va nada de 3D.
- **Fuente de datos de escena**: [src/data/world.ts](src/data/world.ts) — `Station[]`, cada estación referencia una `Experience` por `id` y declara sus `layers` (interface / service / data / ai), `complexity` 1–5, `boundary` y `position`.
- **Motor auxiliar existente que hay que reutilizar, no reescribir**:
  - [src/world/engine/palette.ts](src/world/engine/palette.ts) — paleta única, exportada también como CSS custom properties desde [app/layout.tsx](app/layout.tsx). Si cambia la paleta, cambia acá y el HUD la hereda.
  - [src/world/engine/metrics.ts](src/world/engine/metrics.ts) — `LAYER_HEIGHT`, `stationHalf`, `stationHeight`, `framingDistance`.
  - [src/world/engine/quality.ts](src/world/engine/quality.ts) — `detectQuality()` y `prefersReducedMotion()` ya existen y ya están cableados.
  - [src/world/engine/journey.ts](src/world/engine/journey.ts) — store de recorrido (`goToStation`, `selectStation`, `tick`).
  - [src/world/engine/useTextTexture.ts](src/world/engine/useTextTexture.ts) y [useIconTexture.ts](src/world/engine/useIconTexture.ts) — ya generan `CanvasTexture`; el generador de ventanas debe seguir ese mismo patrón.
- **HUD**: [src/hud/Hud.tsx](src/hud/Hud.tsx), [src/hud/NavRail.tsx](src/hud/NavRail.tsx), [src/hud/StationPanel.tsx](src/hud/StationPanel.tsx).
- **Fallback accesible**: el botón **"Read as text"** de [src/hud/Hud.tsx:53](src/hud/Hud.tsx#L53) lleva a [src/text/ResumeDocument.tsx](src/text/ResumeDocument.tsx). Debe seguir funcionando exactamente igual después del refactor.
- **Idioma**: la **UI del sitio está en inglés** (es un CV para reclutadores). Los rótulos, paneles y el documento de texto siguen en inglés. **Hablame a mí en español** y escribí los comentarios de código en inglés, como el código que ya está.

### Las 8 experiencias → los 8 edificios

Esta es la ciudad. Cada entrada corresponde 1:1 con una `Experience` de `resume.ts` (mismo `id`), y todos los campos derivan de datos reales de ese archivo — nada inventado.

```ts
const CIUDAD: BuildingSpec[] = [
  {
    id: 'cloudtech',
    nombre: 'CloudTechnologyCenter — Android Developer',
    distrito: 'mobile',
    anioInicio: 2016, anioFin: 2018,
    meses: 21,          // Abr 2016 – Ene 2018
    alcance: 3,         // dos apps de producción, dominio escolar acotado
    actividad: 0.05,    // < 0.15 → paleta gris legacy: el único edificio apagado de la ciudad
    stack: ['Java', 'Android'],
    capitulos: [
      { titulo: 'Problem',      texto: 'School academic management on paper: attendance, grades, minutes and certificates handled by hand.' },
      { titulo: 'Architecture', texto: 'Two native Android clients over the school management backend — one interface, one API, one database.' },
      { titulo: 'Stack',        texto: 'Java · Android SDK' },
      { titulo: 'Result',       texto: 'Two production Android applications covering attendance, grades, minutes, digital wallet, agenda and certificate generation.' },
    ],
  },
  {
    id: 'opensols',
    nombre: 'Opensols — Full Stack Developer',
    distrito: 'backend',
    anioInicio: 2018, anioFin: 2022,
    meses: 43,          // Ago 2018 – Mar 2022 · el período más largo
    alcance: 7,         // varios proyectos en paralelo, clientes corporativos y sector energía
    actividad: 0.15,
    stack: ['Vue.js', 'Python', 'Django', '.NET', 'Xamarin'],
    capitulos: [
      { titulo: 'Problem',      texto: 'Corporate clients — including the energy sector — needing web and mobile systems: telemedicine, field incident capture, large flight datasets.' },
      { titulo: 'Architecture', texto: 'Vue.js front ends over Python/Django and .NET services; a dynamic form builder in .NET rendered by a Xamarin mobile client.' },
      { titulo: 'Stack',        texto: 'Vue.js · Python · Django · .NET Framework · Xamarin · Jitsi · Wompi' },
      { titulo: 'Result',       texto: 'Telemedicine platform with virtual appointments and online payments; efficient pagination keeping response times stable on large flight datasets; improvements to ISA Transelca technical examination software.' },
    ],
  },
  {
    id: 'freelance',
    nombre: 'Independent Clients — Software Engineer',
    distrito: 'clients',
    anioInicio: 2021, anioFin: 2022,
    meses: 18,
    alcance: 4,         // tres productos completos, equipos de una persona
    actividad: 0.15,
    stack: ['Vue.js', 'Node.js', 'TypeScript', 'Flutter'],
    capitulos: [
      { titulo: 'Problem',      texto: 'Small companies running operations on spreadsheets: construction logistics, mechanical services, bulk Excel processing.' },
      { titulo: 'Architecture', texto: 'Vue.js management systems and a Flutter client over a Node.js + TypeScript + MySQL backend.' },
      { titulo: 'Stack',        texto: 'Vue.js · Node.js · TypeScript · MySQL · Flutter · Supabase' },
      { titulo: 'Result',       texto: 'Management system for projects, vehicles, drivers and load tracking; a mechanical services marketplace with geolocation, maps and camera; a Vue.js app processing large Excel datasets.' },
    ],
  },
  {
    id: 'indra',
    nombre: 'Indra — Full Stack Developer',
    distrito: 'backend',
    anioInicio: 2022, anioFin: 2023,
    meses: 12,          // Mar 2022 – Mar 2023
    alcance: 6,         // seguros y préstamos, cuatro frentes en paralelo
    actividad: 0.2,
    stack: ['Java', 'AWS Lambda', 'Python', 'Flutter', 'Angular'],
    perimetro: 'VPC',   // el primer sistema con perímetro de red — ya está en world.ts
    capitulos: [
      { titulo: 'Problem',      texto: 'Insurance plans configured by hand from complex Excel workbooks, and a loan product with no backend.' },
      { titulo: 'Architecture', texto: 'A Java formula engine parsing Excel into structured insurance plans, plus a serverless backend on AWS Lambda with DynamoDB persistence inside a VPC.' },
      { titulo: 'Stack',        texto: 'Java · AWS Lambda · Serverless Framework · Python · DynamoDB · Flutter · Ionic · Angular' },
      { titulo: 'Result',       texto: 'Manual plan configuration replaced by the engine; a Flutter loan-request app with monthly payment calculations, discount rules and push notifications.' },
    ],
  },
  {
    id: 'byondit',
    nombre: 'BYONDIT — Mobile Developer',
    distrito: 'mobile',
    anioInicio: 2023, anioFin: 2023,
    meses: 6,           // Jul 2023 – Dic 2023 · el edificio más bajo
    alcance: 4,
    actividad: 0.18,
    stack: ['Flutter', 'Python', 'AWS'],
    capitulos: [
      { titulo: 'Problem',      texto: 'A digital wallet with virtual and physical cards, shipping to real users without breaking them.' },
      { titulo: 'Architecture', texto: 'Flutter client over a Python backend on AWS, with feature flags gating every release.' },
      { titulo: 'Stack',        texto: 'Flutter · Python · AWS · Split.io · Segment' },
      { titulo: 'Result',       texto: 'Controlled, data-informed releases through feature flags and product analytics.' },
    ],
  },
  {
    id: 'imagineapps-freelance',
    nombre: 'Imagine Apps — Full Stack Engineer (Freelance)',
    distrito: 'clients',
    anioInicio: 2023, anioFin: 2024,
    meses: 11,          // Oct 2023 – Ago 2024
    alcance: 6,         // plataforma de inversión end to end + app de logística
    actividad: 0.2,
    stack: ['React.js', 'Node.js', 'MongoDB', 'React Native'],
    capitulos: [
      { titulo: 'Problem',      texto: 'An investment platform needing identity, signatures and email to be part of the product, not a manual process beside it.' },
      { titulo: 'Architecture', texto: 'React.js front end over Node.js services with MongoDB and SQL Server, cron jobs and S3 storage; third-party identity and signing wired in behind JWT auth.' },
      { titulo: 'Stack',        texto: 'React.js · Node.js · MongoDB · SQL Server · Sequelize · Docker · AWS S3 · SendGrid · SignNow · Withpersona · JWT' },
      { titulo: 'Result',       texto: 'New backend and frontend features shipped end to end; defects resolved in a freight logistics React Native app covering maps, geolocation and Redux state.' },
    ],
  },
  {
    id: 'personalsoft',
    nombre: 'PersonalSoft — Mobile Developer (Flutter)',
    distrito: 'mobile',
    anioInicio: 2024, anioFin: 2025,
    meses: 11,          // Ago 2024 – Jun 2025
    alcance: 5,         // banca, iOS + Android
    actividad: 0.3,
    stack: ['Flutter', 'AWS', 'Azure DevOps'],
    capitulos: [
      { titulo: 'Problem',      texto: 'A cross-platform banking application with client requirements arriving faster than releases.' },
      { titulo: 'Architecture', texto: 'Flutter for iOS and Android, AWS resources managed alongside the full lifecycle in Azure DevOps.' },
      { titulo: 'Stack',        texto: 'Flutter · AWS · Azure DevOps · Figma design systems' },
      { titulo: 'Result',       texto: 'New features delivered into production releases following Agile ceremonies.' },
    ],
  },
  {
    id: 'imagineapps-lead',
    nombre: 'Imagine Apps — Senior Software Engineer (Technical Lead)',
    distrito: 'data',
    anioInicio: 2025, anioFin: null,   // en curso
    meses: 14,          // Jun 2025 – hoy
    alcance: 10,        // equipo distribuido, plataforma multi-nube, varios productos
    actividad: 1,       // el único edificio plenamente encendido
    stack: ['Django', 'FastAPI', 'PostgreSQL', 'Airflow', 'Angular', 'Next.js'],
    perimetro: 'AWS · AZURE',
    capitulos: [
      { titulo: 'Problem',      texto: 'Enterprise value chains moving data by hand between ERPs, SFTP servers and spreadsheets, with no reporting layer on top.' },
      { titulo: 'Architecture', texto: 'Four tiers: portal, microservices, data platform and an AI tier no earlier system has. Integrations replace manual handoffs; Airflow automates the recurring flows.' },
      { titulo: 'Stack',        texto: 'Django · FastAPI · OpenAPI · Docker · CI/CD · PostgreSQL · Apache Airflow · Power BI · Angular · Next.js · TypeScript · Tailwind · Ant Design · AWS · Azure' },
      { titulo: 'Result',       texto: 'Automated ingestion from SFTP and ERPs (Siigo, SIESA) into optimized PostgreSQL models; CI/CD pipelines cutting manual deployment effort; LLM solutions, including self-hosted local models, in production workflows.' },
    ],
  },
];
```

**Reglas al pasar esto a código**: el texto de `nombre` y `capitulos` sale de `resume.ts` — no lo dupliques a mano, derivalo de la `Experience` correspondiente por `id` (como ya hace `world.ts` con `byId`). Lo único que se escribe nuevo en el módulo de la ciudad son los números y el mapeo visual.

## PROBLEMA ACTUAL

La escena de hoy es un "sitio de sistemas" en wireframe, no una ciudad:

- Los edificios de [src/world/zones/Journey/Building.tsx](src/world/zones/Journey/Building.tsx) son columnas + montantes en `lineSegments` sobre fondo casi negro (`palette.void = #0A0C0F`). Toda la escena es grafito: no hay fachada, ni color, ni hora del día.
- La geometría no distingue proyectos: sólo cambia la escala según `complexity` 1–5. Dos roles distintos se leen igual.
- Escala y encuadre: las estaciones están dispersas a lo largo del eje Z (de `z: -42` a `z: -300`) y buena parte del viewport queda vacío. No hay `Box3` que ajuste la cámara al conjunto.
- Sólo hay un nivel de navegación: recorrido por el eje + panel de estación. No se puede "entrar" a un rol.
- El panel de detalle y los rótulos compiten con la geometría que describen.

Lo que **sí** funciona y no quiero perder: la lectura por capas (`interface / service / data / ai`), el perímetro dibujado (`boundary`), el orden cronológico, y que el edificio de 2025 sea el único con capa AI.

## OBJETIVO

Una ciudad al atardecer con fachadas **claras** (crema, azul pálido, verde salvia, terracota) contra un cielo degradado. Ventanas encendidas, algunas parpadeando. El skyline debe leerse **sin leyenda**: la forma de la ciudad cuenta la trayectoria — un edificio gris apagado en 2016, una torre encendida en 2025.

---

## 1. Modelo de datos

Nuevo módulo `src/data/city.ts` (reemplaza el rol de `world.ts` como wiring de escena; `world.ts` puede quedar como fuente de `layers` mientras migramos). Tipo:

```ts
type Capitulo = { titulo: string; texto: string };

type BuildingSpec = {
  id: string;                    // === Experience.id
  nombre: string;
  distrito: 'mobile' | 'backend' | 'data' | 'clients';
  anioInicio: number;
  anioFin: number | null;        // null = en curso
  meses: number;
  alcance: number;               // 1-10
  actividad: number;             // 0-1
  stack: string[];
  perimetro?: string;            // VPC, AWS · AZURE
  capitulos: Capitulo[];
};
```

**Toda** la geometría y el material derivan de ahí. Nada de valores mágicos en el render.

### Mapeos obligatorios

| Propiedad visual | Campo | Fórmula |
|---|---|---|
| Altura | `alcance` | `clamp(2 + alcance * 2.1, 2, 22)` unidades |
| Huella (X/Z) | `meses` | `1.2 + clamp(meses, 6, 48) * 0.09` |
| Ventanas encendidas | `actividad` | fracción de celdas iluminadas |
| Familia de color | `stack[0]` | mapa explícito stack → paleta |
| Cantidad de retranqueos | `meses` | 0 si < 12, 1 si < 36, 2 si ≥ 36 |
| Antena + baliza | `anioFin` / `alcance` | si `anioFin === null` o `alcance >= 8` |

> **Por qué altura ≠ meses.** La plantilla genérica ataba la altura a la duración. Con mis datos eso produce lo contrario de lo que la ciudad tiene que argumentar: Opensols (43 meses) sería la torre más alta y el rol actual (14 meses, lead de un equipo, plataforma multi-nube con capa AI) el más bajo. Invertí los ejes: **la altura mide complejidad del sistema, la huella mide permanencia**. Así Opensols es ancho y escalonado (el que más años ocupó) e Imagine Apps 2025 es la torre alta y delgada, encendida y con baliza. Si no estás de acuerdo con esta decisión, paralo y decímelo antes de implementar.

Si `actividad < 0.15`, paleta gris apagada. Con estos datos eso deja **exactamente un edificio gris**: CloudTechnologyCenter, 2016, el origen de la ciudad. Ese contraste es el que le da sentido al resto.

## 2. Generador de edificios

Módulo `src/world/city/createBuilding.ts` → `createBuilding(spec: BuildingSpec): THREE.Group`. De 3 a 6 mallas por edificio, nunca una sola caja:

1. **Cuerpo base** — `BoxGeometry(w, h, d)`.
2. **Cornisa** — caja de altura `0.15` y **8% más ancha** que el cuerpo, en la coronación de cada tramo. Este único detalle es lo que más rompe el look de caja.
3. **Retranqueos (setbacks)** — cada tramo superior al 70% del ancho anterior y ~35% de la altura anterior.
4. **Azotea** — 1 o 2 cajitas pequeñas (equipos, tanque de agua) posicionadas de forma determinista desde un hash de `spec.id`, **no** con `Math.random()` en cada render.
5. **Antena** — `CylinderGeometry` fino según la regla de la tabla, con luz de baliza en la punta.
6. **Perímetro** — si `spec.perimetro`, la línea de perímetro alrededor de la manzana con su rótulo, como ya lo hace la estación hoy.

Para variedad de planta, algunos edificios usan `THREE.Shape` en L o U + `ExtrudeGeometry`. La forma sale de `hash(spec.id) % 3`.

**Determinismo**: todo lo aleatorio sale de una función propia `hash(seed: string): number` en `src/world/city/hash.ts`. El mismo `id` produce siempre el mismo edificio — importa porque el sitio se exporta estático y el HTML del servidor y el render del cliente tienen que coincidir.

## 3. Materiales y luz

Fachadas claras; las tres tonalidades por cara salen de la **luz real**, no de pintar caras a mano.

- Material: `MeshStandardMaterial` con `roughness: 0.7`, `metalness: 0.05`.
- Paletas base (cuerpo) — **agregalas a `palette.ts`**, no las hardcodees en el componente:
  - crema `#e3d5bd` → Java / .NET (Indra, y el legacy de Opensols)
  - azul pálido `#c8daed` → JavaScript / TypeScript (Node, React, Vue, Next)
  - salvia `#c9dcd1` → Python / datos (Django, FastAPI, Airflow)
  - terracota `#e8bda9` → móvil (Flutter, React Native, Android, Ionic, Xamarin)
  - gris legacy `#b3b8c2` → `actividad < 0.15`
- `DirectionalLight` cálida `#ffb08a`, intensidad ~1.6, ángulo bajo (sol poniente). Con sombras: `castShadow`, `shadow.mapSize 2048`, `shadow.bias -0.0005`.
- `HemisphereLight` con `skyColor: #6b5f8a`, `groundColor: #b8836e`, intensidad ~0.6.
- Cielo: degradado `#151c36 → #39406a → #8a6a7c → #b8836e` (arriba → horizonte). Shader de fondo o esfera invertida; **no** una imagen (el sitio se sirve desde GitHub Pages y no quiero peso extra).
- Reemplazar el `fogExp2` actual (`palette.void`, densidad 0.0075) por uno del color del horizonte, densidad baja, para que los distritos lejanos se integren en vez de flotar.
- Bloom: **sólo si me pedís antes agregar `postprocessing`/`@react-three/postprocessing`**, porque hoy no está instalado. Si lo agregamos: `threshold 0.85`, `strength 0.35`, `radius 0.4`. Con fachadas claras el bloom se desborda y se come el detalle de las cornisas. Si hay que elegir, menos bloom.
- Ojo: la paleta actual (`palette.ts`) alimenta el HUD vía CSS custom properties en `app/layout.tsx`. Si cambia el fondo del mundo, el HUD tiene que seguir legible encima. Verificalo.

## 4. Ventanas y parpadeo

El detalle que más rinde por línea de código. Seguí el patrón de `useTextTexture.ts`: `CanvasTexture` generada y cacheada, una textura compartida por familia de edificio.

- Retícula de celdas en un `<canvas>` offscreen (p. ej. 64×128).
- La fracción encendida la marca `spec.actividad`.
- Encendida `#ffd489`, con ~15% de celdas en `#fff0c4` para variar. Apagada `#4e5a72`.
- Ajustá `texture.repeat` según la altura real del edificio para que las ventanas midan lo mismo en toda la ciudad. Una ventana de 3m en una torre de 22 y otra de 8m en un edificio de 8 se nota inmediatamente.

**Parpadeo**: cada 400–600 ms, redibujá entre 1 y 3 celdas al azar por textura y seteá `texture.needsUpdate = true`.

> Cada ventana debe tener **fase y periodo propios**, derivados de su índice de celda. Si todas parpadean juntas, parece un bug de render, no una ciudad.

Presupuesto: no más del **30–40%** de ventanas encendidas, y de esas sólo un **10%** parpadeando. Más satura y se pierde el contraste con CloudTechnologyCenter apagado.

Alternativa por shader: `ShaderMaterial` con `uniform float uTime` y `hash(cellId)` para la fase; `step()` enciende. Más control, más costo. Elegí uno y justificá cuál.

## 5. Encuadre y etiquetas

- Al cargar, `new THREE.Box3().setFromObject(ciudad)` y ajustá la cámara con un `fitToBox`. Ya existe `framingDistance()` en `metrics.ts`: reusala o reemplazala, pero no dupliques la lógica.
- Rótulos: hoy el texto se proyecta con `ProjectedText`/`useTextTexture` dentro del canvas. Si querés HTML (`CSS2DRenderer`), decímelo primero — es una dependencia nueva de cableado. En cualquiera de los dos casos: ordená por distancia a cámara y **ocultá los que colisionan**; ninguna etiqueta puede quedar cortada por el borde del viewport.
- El panel de detalle (`StationPanel`) va **a la derecha** o como HUD inferior. Nunca encima del edificio seleccionado.
- Los edificios lejanos del eje Z (hoy hasta `z: -300`) se compactan en distritos reales, no en puntos diminutos en la esquina.

## 6. Tres niveles de zoom

Es el cambio de arquitectura de información. Hoy hay uno solo.

| Nivel | Qué se ve | Interacción |
|---|---|---|
| Ciudad | Skyline completo, 4 distritos, años | Orbit libre |
| Distrito | Edificios con rótulo y fachada | Hover destaca, clic entra |
| Edificio | Cámara entra, fachada se desvanece, panel con el caso | Scroll = pisos |

Dentro del edificio, **cada piso es un capítulo del rol**: Problem → Architecture → Stack → Result, tal como vienen en `capitulos`. El scroll sube la cámara piso por piso y sincroniza el panel. El portafolio vive dentro de la metáfora; no es un modal pegado encima. Esto sustituye al `StationPanel` actual como vista de detalle — reusá su contenido, no lo reescribas.

Transiciones con easing (`easeInOutCubic`, ~1.2s), no cortes secos. El store de `journey.ts` ya maneja objetivo y `tick`: extendelo con el nivel de zoom en vez de crear un store paralelo. Al entrar, bajá la opacidad de la fachada a ~0.15 y mostrá las losas de piso.

## 7. Rendimiento

- Son 8 edificios protagonistas: `InstancedMesh` **no** hace falta para ellos. Sí para el relleno urbano de fondo (manzanas anónimas que le dan escala a la ciudad) si lo agregamos — una geometría, color e intensidad emisiva por instancia.
- Objetivo: 60fps en portátil con gráficos integrados.
- LOD: los edificios de relleno y los del distrito lejano usan la caja simple sin cornisas ni azotea.
- El parpadeo corre en un `setInterval`, no en el `requestAnimationFrame`.
- Respetá los tiers de `detectQuality()` que ya existen (`high | mid | low | none`): en `low` se caen sombras, parpadeo y relleno urbano.

## 8. Calidad mínima

- Responsive hasta móvil. En pantallas angostas, cámara más cerrada y menos etiquetas visibles.
- `prefers-reduced-motion`: sin parpadeo de ventanas, sin transiciones de cámara animadas (salto directo). `prefersReducedMotion()` ya está implementado y cableado a `quality.reducedMotion` — usalo, no lo reimplementes.
- Foco de teclado visible. Los edificios navegables con Tab y activables con Enter.
- El botón **"Read as text"** sigue siendo la ruta accesible completa. Verificá que siga funcionando después del refactor.
- El sitio se exporta estático (`next build` → `out/`). Nada de lo nuevo puede depender de un servidor en runtime, y el render inicial no puede diferir entre servidor y cliente (de ahí el determinismo del hash).

---

## Cómo quiero que trabajes

1. Leé el código existente de la escena (`src/world/**`, `src/data/**`, `src/hud/**`) y decime qué encontraste antes de tocar nada.
2. Proponé un plan en pasos, con los archivos que vas a crear o modificar, y decime explícitamente qué se borra de `Journey/` y qué se conserva.
3. Esperá mi confirmación.
4. Implementá en este orden: modelo de datos → generador de edificios → luz y materiales → ventanas → encuadre y etiquetas → niveles de zoom → rendimiento.
5. Después de cada paso, corré `npm run build` y `npm run lint`, y decime qué se ve distinto.

No refactorices nada que no esté en este documento. No agregues dependencias sin preguntarme. No toques `resume.ts` salvo para leerlo. Si algo del plan choca con el código existente, paralo y preguntame.
