# THE ENGINEER'S JOURNEY — análisis y mapa de transformación

Documento previo a cualquier línea de código. Cubre: qué es hoy el proyecto, qué se
reutiliza, dónde el brief contradice al CV publicado, qué mundo se construye y en qué
orden.

---

## 1. Estado actual del proyecto

| Aspecto | Realidad |
| --- | --- |
| Framework | **Vue 3.2.13**, SPA de un solo componente |
| Build | **Vue CLI 5** (`@vue/cli-service`, webpack 5), Babel |
| Routing | **Ninguno**. Una sola página, navegación por anclas `#about`, `#experience`… |
| Estado | Ninguno. `data()` local en un componente |
| 3D | **Ninguno**. No hay Three.js, ni WebGL, ni canvas |
| Estilos | Bootstrap 5.1.3 + tema Start Bootstrap Resume vendorizados (`styles.css`, 11.4k líneas) + `custom.css` (257 líneas propias) |
| Contenido | **`src/data/resume.js`** — fuente única de verdad, ya desacoplada del template |
| SEO | `public/index.html`: OG completo, Twitter card, JSON-LD `Person`, `<noscript>` con el CV en texto |
| Deploy | `deploy.bat` → build + force-push de `dist/` a `gh-pages`. `publicPath: "/CV/"` |
| Assets | 5 imágenes, ~2.2 MB. Ningún modelo 3D, ninguna textura |

### Lo que se reutiliza tal cual

- **`src/data/resume.js`** — se conserva como fuente única (pasa a `resume.ts`). El mundo
  3D lee de aquí. La regla de la cabecera ("no client names, no invented metrics") sigue
  vigente y se cumple en §2.5.
- **El contenido de `public/index.html`** — OG, Twitter card y JSON-LD son la capa que ven
  los crawlers y las previsualizaciones de LinkedIn y WhatsApp. Se trasladan íntegros a la
  Metadata API de Next (`app/layout.tsx`), verificando que la URL canónica y las rutas
  absolutas de `og-image.png` no cambien.
- **La ofuscación del email** (`profile.email` partido en `user`/`domain`, `mailto:`
  ensamblado en el click). El mundo 3D repite ese mecanismo; no se sirve un `mailto:` plano.
- **La hoja de impresión** de `custom.css` — el botón "Download PDF" sigue funcionando
  sobre la capa de texto.
- **`deploy.bat` y el flujo de GitHub Pages** — sin cambios.

### Lo que se retira

- **Bootstrap + tema Resume** (`styles.css`, 11.4k líneas) y `scripts.js` (ScrollSpy).
  Sostienen un layout de CV tradicional que deja de existir. La capa de texto que los
  sustituye necesita ~200 líneas de CSS propio, no 11.400.
- **El `<nav>` lateral con foto circular** — el brief pide explícitamente que no haya
  navbar dominante.
- **Bootstrap JS por CDN** y **Font Awesome por CDN** (`index.html`): dos peticiones
  externas bloqueantes que no aportan nada a una experiencia WebGL. Los pocos iconos
  necesarios pasan a SVG inline.

### Restricciones heredadas que no se tocan

- **`cert1.png` y `cert2.png` no se publican nunca.** Muestran número de cédula. El
  comentario en `resume.js:141-144` lo documenta y la importación es explícita justo para
  evitar que webpack los empaquete. El mundo 3D respeta esto: esos dos certificados
  existen como texto, jamás como imagen ni como textura.
- **Sin `mailto:` en el markup servido.**
- **Sin métricas inventadas.** Ningún "+40% performance" decorativo en una pared 3D.

---

## 2. Auditoría de contenido — brief vs. CV publicado

Esto es lo primero que hay que resolver, porque define qué se puede construir.

El brief pide "no inventar nada, usar solamente la información del CV", pero aporta datos
que **no están en `resume.js`** y que en varios casos lo **contradicen**. El commit más
reciente (`0bd5eff Reposition CV as fullstack engineer / architect`) reposicionó el perfil
deliberadamente, y `resume.js` lleva una regla explícita de no nombrar clientes.

### 2.1 Contradicciones directas

| Dato | Brief | `resume.js` (publicado) |
| --- | --- | --- |
| Título | Senior Python / Full Stack Engineer | **Senior Fullstack Engineer & Software Architect** |
| Ubicación | Barranquilla, Colombia | **Colombia · Remote** |
| Universidad | 2015–2022 | **2015–2020** |
| Años | "9+ years" | "since 2016" → en 2026 son **10 años** |

### 2.2 Empresas y etapas del brief ausentes del CV

| Brief | Estado en `resume.js` |
| --- | --- |
| 2024 — **PersonalSoft**, Senior Software Engineer | No existe. El bloque actual es "2023 – Present, Contract and in-house engagements" |
| 2023 — **BYONDIT** / **Imagine Apps** | No existen por nombre. Caen dentro del mismo bloque anonimizado |
| 2021 — **Freelance** (construction management, Supabase) | No existe como etapa. Marzo 2021 está dentro de **Opensols** (Ago 2018 – Mar 2022) |
| 2022 — **Indra** | ✅ Sí existe, Mar 2022 – Mar 2023 |
| 2016 — Android | ✅ Sí existe, **Cloud Technology Center**, Abr 2016 – Ene 2018 |

Las tres primeras filas parecen ser justo lo que el commit `0bd5eff` retiró.

### 2.3 Tecnologías del brief que no aparecen en el CV

Presentes y usables: Python, Django, FastAPI, Node.js, TypeScript, JavaScript, Java, Dart,
SQL, Angular, React, Vue, Flutter, Xamarin, .NET, Ionic, PostgreSQL, SQL Server, MySQL,
DynamoDB, Redis, Airflow, Power BI, AWS, AWS Lambda, VPC, Azure, Docker, GitHub Actions,
Pydantic, SQLAlchemy, REST APIs.

**Ausentes de `resume.js`** — no se pueden representar hasta que se agreguen:

`Next.js` · `Tailwind CSS` · `React Native` · `Expo` · `Supabase` · `MongoDB`¹ ·
`Jenkins` · `Azure DevOps` · `Git/GitHub`² · `Microservices`³ · `Swagger/OpenAPI` ·
`Serverless`³ · `SendGrid` · `SignNow` · `JWT` · `Redux` · `Sequelize` · `Kubernetes`

¹ MongoDB aparece solo dentro del nombre de una certificación, no como skill.
² Git está implícito en `GitHub Actions` pero no listado.
³ El trabajo serverless sí está descrito en el highlight de Indra (Lambda/DynamoDB/VPC);
falta como etiqueta en `skills`. Microservicios no aparece en ninguna forma.

### 2.4 Dominios

| Dominio | Respaldo en el CV |
| --- | --- |
| Banking / Fintech | ✅ loan app con cálculo de pagos (Indra), auto-insurance, digital wallet, data quality para sector financiero |
| Healthcare | ✅ telemedicina (Opensols) |
| Energy | ✅ clientes del sector energía (Opensols) |
| Education | ✅ gestión académica escolar (Cloud Technology Center) |
| **Logistics** | ❌ no aparece |
| **Investment platform** | ❌ no aparece |
| **Construction management** | ❌ no aparece (viene del freelance 2021 del brief) |

### 2.0 El CV real (PDF) es la fuente — sustituye a todo lo anterior de §2

Henry aportó su CV en PDF. Manda sobre cualquier suposición previa, y corrige varias:

| | Lo que se asumió | El CV real |
| --- | --- | --- |
| Título | Senior Fullstack Engineer & Software Architect | **Senior Full Stack Engineer** |
| Ubicación | Colombia · Remote | **Barranquilla, Colombia** · Remote — EST overlap |
| Rol actual | PersonalSoft, 2024 – Present | **Imagine Apps**, Senior Software Engineer, **Jun 2025 – Present** |
| PersonalSoft | El puesto más reciente y mayor | **Mobile Developer (Flutter)**, Ago 2024 – Jun 2025, app bancaria |
| Imagine Apps | Una etapa | **Dos**: freelance Oct 2023 – Ago 2024, y lead desde Jun 2025 |
| Freelance 2021 | Se descartó por no existir | **Existe**: Independent Clients, 2021 – 2022 |
| Universidad | 2015 – 2020 | **2015 – 2022** |
| Certificación Apps.co | Listada | **No aparece** — retirada |

Los highlights que se habían atribuido a PersonalSoft (reporting multi-tenant, automatización
sobre ERP, asistente RAG) son en realidad del rol de lead en Imagine Apps, y el PDF los
describe con más precisión: integraciones SFTP y ERPs **Siigo y SIESA**, Power BI ejecutivo,
LLM incluidos **modelos locales self-hosted**, plataforma de simulación **Cosmicfrog**.

El mundo pasa de seis a **ocho estaciones**, y la que cierra el eje es Imagine Apps 2025.
Se añade `careerHighlights`: los seis titulares que el CV pone antes de la experiencia.

Una nota: el resumen del CV dice "9+ years" y el mundo calcula 10 desde 2016. No se
contradicen, pero si prefieres que el mundo diga "9+", es una línea.

### 2.5b Decisión previa — se nombran los empleadores

**Reemplaza a §2.5.** Henry pidió priorizar sus dos últimos trabajos por nombre, así que
el CV pasa a nombrar empleadores y el mundo con ellos:

| Estación | Rol | Periodo |
| --- | --- | --- |
| PersonalSoft | Senior Software Engineer | 2024 – Present |
| Imagine Apps | Fullstack & Mobile Developer | 2023 – 2024 |
| BYONDIT | Mobile & Backend Developer | 2023 |
| Indra | Full Stack Developer | Mar 2022 – Mar 2023 |
| Opensols | Full Stack Developer | Ago 2018 – Mar 2022 |
| Cloud Technology Center | Android Developer | Abr 2016 – Ene 2018 |

El bloque anónimo "2023 – Present" se divide: sus highlights encajan con el stack que el
brief declara para PersonalSoft (Django, PostgreSQL, Airflow, Angular, RPA, RAG) y se
quedan ahí. Imagine Apps y BYONDIT reciben highlights redactados **solo** con lo que el
brief declara de cada uno — tecnologías e integraciones nombradas, nada más.

La regla de la cabecera de `resume.ts` cambia en consecuencia: se nombran empleadores, no
clientes de esos empleadores.

**Pendiente de confirmar**: los periodos de Imagine Apps (2023 – 2024) y BYONDIT (2023)
salen del brief, que solo daba el año. Si son otros, es una línea en `resume.ts`.

### 2.5 Decisión inicial — híbrido (sustituida por §2.5b)

Se conserva la **estructura narrativa** del brief (mobile → fullstack → cloud/serverless →
sistemas paralelos → arquitectura + AI) porque describe bien la evolución, pero **sin
nombrar empresas que el CV no nombra**. En concreto:

- **No se añaden** PersonalSoft, BYONDIT ni Imagine Apps. El bloque "2023 – Present" sigue
  anónimo y se representa visualmente como lo que el brief describe: varios sistemas
  simultáneos (mobile, backend, web, cloud, data, AI) sin etiquetarlos con marcas.
- **No se añade una quinta estación "Freelance 2021"**: marzo de 2021 cae dentro de
  Opensols (Ago 2018 – Mar 2022) y una estación nueva contradiría las fechas publicadas.
  El trabajo de proyectos variados que el brief sitúa ahí ya vive en esa estación.
- El arco de siete pasos del brief se representa como **progresión visual** dentro y entre
  las cuatro estaciones reales, no como cuatro etiquetas nuevas en el CV.
- **Título, ubicación y fechas de universidad**: mandan los de `resume.js`
  (Senior Fullstack Engineer & Software Architect · Colombia · Remote · 2015–2020).
  Los años de experiencia se **calculan** desde 2016 en lugar de escribirse a mano.

### 2.6 Decisión tomada — tecnologías

Las 18 tecnologías de §2.3 **se incorporan a `resume.js`**. Son experiencia declarada por
Henry en el brief, no inferencias mías, y por tanto entran en el mundo y en la capa de
texto. `skills` se reorganiza de 6 a 8 categorías para acomodarlas sin convertirse en una
lista indistinta, y esas categorías alimentan directamente los distritos del mundo.

Sigue en pie lo que **no** se incorpora, por no estar declarado en ninguna parte: los
dominios ❌ de §2.4 (logistics, investment platform, construction management) y cualquier
detalle de proyecto, cliente o métrica que no exista ya en un highlight.

---

## 3. Arquitectura propuesta

### 3.1 Principio rector: dos capas, un solo contenido

```
             src/data/resume.ts          ← única fuente de verdad
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
   WORLD LAYER (WebGL)         TEXT LAYER (DOM semántico)
   la experiencia              SEO · a11y · print · fallback
```

La capa de texto **no es un fallback escondido**: se monta siempre en el árbol, es
alcanzable con un *skip link* ("Skip to text version", primer tabbable de la página), y es
lo que se imprime. Nada de contenido oculto por CSS para engañar al crawler — el mismo
contenido, dos presentaciones, una elegible por el usuario.

La capa de texto se activa automáticamente cuando: no hay WebGL2, `prefers-reduced-motion:
reduce`, el detector de calidad devuelve tier bajo, o el usuario lo pide.

### 3.2 Stack 3D — decisión tomada

**Migración a Next.js (App Router) + React Three Fiber + Drei.** Decisión de Henry, tomada
con la consecuencia sobre la mesa: el proyecto Vue se retira entero.

Qué implica en la práctica:

- Vue 3, Vue CLI, Bootstrap y el tema Start Bootstrap Resume desaparecen. `App.vue`,
  `Portafolio.vue`, `main.js`, `styles.css` y `scripts.js` se retiran.
- **TypeScript**, que es el default de Next hoy y ya figura en el perfil.
- El ecosistema R3F es el más maduro para 3D en web. **Drei** entra en la fase 2, cuando
  haya algo que anclar: `<Html>` para colgar DOM accesible de posiciones 3D e `<Instances>`
  para los elementos repetidos de las estaciones. No se instala antes de usarse.
- Todo el 3D vive en componentes `'use client'` cargados con `next/dynamic` y
  `ssr: false`. El contenido de texto se renderiza en Server Components, así que llega al
  HTML servido sin depender de WebGL.
- `resume.js` **sobrevive la migración**: pasa a `resume.ts`, mismo contenido y misma regla
  de cabecera, ampliado según §2.6.

**Sin GLTF externos en fases 1–4.** Toda la geometría es procedural (cajas, extrusiones,
líneas, instancias). Un mundo generado por código pesa kilobytes y encaja con la metáfora.

### 3.3 Despliegue — el punto crítico de la migración

El sitio se publica en GitHub Pages bajo `/CV/`. Next.js necesita configuración explícita
para eso, y omitir cualquiera de estas cuatro cosas produce una página en blanco:

| Requisito | Motivo |
| --- | --- |
| `output: 'export'` | GitHub Pages sirve archivos estáticos; no hay servidor Node |
| `basePath: '/CV'` + `assetPrefix` | Equivalente al `publicPath: "/CV/"` actual |
| `images: { unoptimized: true }` | El optimizador de imágenes de Next requiere servidor |
| **`.nojekyll` en la raíz publicada** | Sin él Jekyll ignora todo directorio que empiece por `_`, incluido `_next/`, y el sitio carga sin JS ni CSS |

`deploy.bat` cambia `dist/` por `out/` y añade el `.nojekyll`. El resto del flujo
(force-push a `gh-pages`) y la URL de publicación no cambian.

### 3.4 Estructura de archivos

```
app/
  layout.tsx                 metadata, JSON-LD, fuentes, <noscript>
  page.tsx                   Server Component: monta la capa de texto + carga el mundo
  globals.css                tokens, HUD, hoja de impresión
src/
  data/
    resume.ts                fuente única de verdad (contenido, cero datos 3D)
    world.ts                 mapea resume.ts → estaciones, distritos y POIs
  world/
    WorldCanvas.tsx          <Canvas> de R3F, dynamic import, ssr:false
    engine/
      quality.ts             tiers (high/mid/low) → partículas, sombras, DPR
      CameraRig.tsx          rail, damping, focus, transiciones cinematográficas
      useJourney.ts          estado del recorrido (posición en el rail, zona activa)
      palette.ts             tokens de color compartidos DOM ↔ WebGL
    materials/
      FlowLine.tsx           shader del flujo de datos (requests circulando)
    zones/                   cada zona en su propio chunk async
      Entrance/  Journey/  Districts/  Stack/  Domains/  Archive/  Observatory/
  hud/
    Hud.tsx  NavRail.tsx  DetailPanel.tsx  Hints.tsx  Toggles.tsx
  text/
    ResumeDocument.tsx       el CV semántico, imprimible (Server Component)
```

`resume.ts` **no lleva coordenadas ni datos 3D**. Todo eso vive en `world.ts`, que lo
importa y lo enriquece. Un cambio de copy sigue siendo un cambio de una línea en un
archivo.

---

## 4. Mapa de transformación

| Sección actual | Nueva zona 3D | Propósito | Elementos 3D | Contenido (fuente) | Interacciones | Cámara |
| --- | --- | --- | --- | --- | --- | --- |
| `#about` | **01 THE ENTRANCE** | Presentar a Henry y abrir el mundo | Atrio arquitectónico, nombre proyectado sobre muro, retícula de suelo, partículas lentas, umbral iluminado al fondo | `profile.firstName/lastName/role/location/summary`, años derivados de 2016 | Un solo CTA físico: cruzar el umbral | Dolly lento hacia el umbral; al entrar, vuelo continuo hacia la ciudad |
| `#experience` | **02 THE JOURNEY** | La carrera como recorrido físico | Rail que atraviesa 4 estaciones; la arquitectura crece en altura/densidad en cada una | `experience[]` completo | Avanzar (scroll/flechas), acercarse a una estación la enciende, click abre el panel de highlights | La cámara sigue el rail; en cada estación desacelera y encuadra |
| — | **03 THE DISTRICTS** | Lo que hoy construye, en detalle | 4 distritos colgando de la última estación: Systems, Data, Cloud & Delivery, AI Lab | Highlights de "2023 – Present" + `skills` | Activar un sistema → los requests circulan; activar el pipeline → recorre build→deploy | Entrada cenital al distrito, luego órbita local |
| `#skills` | **04 THE STACK** | Ecosistema técnico, no barras de progreso | Estructura central visible desde toda la ciudad; nodos conectados por categoría, tamaño según peso real en el perfil | `skills[]` (6 categorías) | Hover ilumina el nodo y sus conexiones; click filtra en qué estaciones aparece esa tecnología | Órbita + zoom, sin recorrido lineal |
| — | **05 THE DOMAINS** | Que la experiencia no es de un solo producto | 4 barrios con silueta propia: Banking/Fintech, Healthcare, Energy, Education | Derivado de los highlights de `experience[]` | Click → qué se construyó ahí y con qué | Panorámica lateral |
| `#education` + `#certifications` | **06 THE ARCHIVE** | Formación y certificaciones | Sala sobria, volúmenes con la información grabada — deliberadamente más pequeña que los distritos | `education[]`, `certifications[]` | Click → detalle; solo los 2 certificados sin cédula ofrecen "View certificate" | Travelling corto, sin espectáculo |
| Iconos sociales | **07 THE OBSERVATORY** | Cierre: ver la evolución completa | Mirador sobre toda la ciudad ya recorrida, iluminada por etapas | Nombre, rol, "Let's build something", email ofuscado, LinkedIn, GitHub | Revelar email (mismo mecanismo actual), abrir enlaces | Retirada aérea; el mundo entero queda encuadrado |

Las zonas 03–08 del brief (Mobile World, Full Stack World, Backend World, Database World,
Cloud City, Architecture World) **se consolidan en THE DISTRICTS**. Como zonas
independientes repetirían el mismo contenido de `resume.js` cuatro veces y alargarían el
recorrido sin añadir información — el propio brief autoriza combinarlas.

---

## 5. Las zonas en detalle

### 01 — THE ENTRANCE

Interior arquitectónico, no un fondo con texto encima. El nombre está **proyectado sobre
un muro** con la deformación correcta; el rol aparece grabado en el suelo. Escala humana,
luz fría, una sola fuente cálida marcando la salida. Sin HUD todavía.

Los años **se calculan** desde 2016, no se escriben a mano — el brief decía "9+", en 2026
son 10.

### 02 — THE JOURNEY

Cuatro estaciones sobre un rail. La complejidad arquitectónica crece de forma medible:
volumen construido, número de nodos, densidad de conexiones y actividad de partículas.

**2016 · Android Developer — Cloud Technology Center**
Un laboratorio pequeño: un dispositivo, un banco de trabajo, un único servicio detrás.
Java, Android, gestión académica escolar (asistencia, notas, certificados, cartera
digital), API REST en ASP.NET/C# con MySQL. La escena más simple del mundo, a propósito.

**2018–2022 · Full Stack Developer — Opensols**
El taller se convierte en edificio. Aparecen tres capas visibles —web, móvil, datos— y por
primera vez se ve **flujo** entre ellas. Python, Django, Vue.js, Flutter, Xamarin, .NET.
Sectores energía y salud: telemedicina, reporte de proyectos, gestión empresarial.
Procesamiento de datasets grandes.

**2022–2023 · Full Stack Developer — Indra**
Primera infraestructura cloud. Se materializa el diagrama real del CV:

```
Internet → Lambda → DynamoDB          (todo dentro de una VPC visible)
```

App de préstamos en Flutter con cálculo de pagos, descuentos y notificaciones; servicios
serverless en Python y JavaScript; producto de seguros de auto en Ionic + Angular.

**2023 – Present · Senior Fullstack Engineer & Software Architect**
La estación más grande, y el punto donde el rail se bifurca hacia los distritos. Cuatro
sistemas simultáneos, tomados literalmente de los highlights:

1. Plataforma de reporting multi-tenant — modelo de contrato canónico + adaptadores SQL
   por tenant, Django, PostgreSQL, Redis, materialización con Airflow, portal Angular.
2. Automatización de facturas sobre un ERP legacy sin API — extracción documental + RPA
   con **checkpoint de validación humana antes de confirmar nada** (se representa
   explícitamente: el flujo se detiene y espera).
3. Pipelines de ingesta y controles de calidad de datos para reporting del sector financiero.
4. Asistente conversacional con RAG sobre canales de mensajería.

### 03 — THE DISTRICTS

**Systems** — la arquitectura viva que pide el brief, con la topología real:

```
                 CLIENT
                   │
                 API  (FastAPI · Django · Node/Express)
                   │
      ┌────────────┼────────────┐
      ▼            ▼            ▼
   SERVICE      SERVICE      SERVICE
      └────────────┼────────────┘
                   ▼
              PostgreSQL · SQL Server
```

Los requests son partículas en shader recorriendo las aristas. Al activar un servicio, su
carga sube y las respuestas vuelven. Aquí también viven las superficies móviles (Flutter,
Ionic/Angular) conectadas a la misma API — que es la verdad del CV: el móvil nunca fue una
isla.

**Data** — cada motor con forma propia, sin logos gigantes: PostgreSQL como núcleo denso,
SQL Server como estructura ortogonal, Redis como capa rápida en superficie, DynamoDB como
nodos distribuidos, Airflow como grafo de tareas que se ejecuta por etapas, Power BI como
superficie de salida.

**Cloud & Delivery** — AWS, Azure, Docker, GitHub Actions. Línea de producción activable:

```
CODE → BUILD → TEST → CONTAINER → DEPLOY → CLOUD
```

**AI Lab** — laboratorio sobrio, no una nave espacial. El agente ejecuta el ciclo real:
recibe una pregunta → recupera contexto → consulta datos → usa herramientas → responde.
Sin nombres de modelos ni proveedores: el CV no los menciona.

```
              AGENT
                │
     ┌──────────┼──────────┐
     ▼          ▼          ▼
   DATA       TOOLS       LLM
     │
  DATABASE
```

### 04 — THE STACK

Ecosistema conectado, jamás porcentajes. Las seis categorías de `resume.js` son racimos;
el peso visual de cada tecnología sale de **cuántas estaciones y distritos la usan**
—dato derivado, no una opinión—, lo que naturalmente da presencia a Python, Django,
FastAPI, PostgreSQL, Airflow, AWS, Azure, Docker y Angular. Click en una tecnología:
se iluminan las estaciones del Journey donde aparece.

### 06 — THE ARCHIVE

Universidad Libre Seccional Barranquilla (Systems Engineering, 2015–2020), ILAC
(Pre-Advanced, nivel 10, 2022), y las cuatro certificaciones. Solo Udemy e ILAC muestran
imagen. **EF SET y Apps.co son texto y nada más** — sus certificados llevan cédula.

### 07 — THE OBSERVATORY

El mundo recorrido, visible en su totalidad y encendido por etapas. Email con el mismo
mecanismo de revelación en dos pasos que hoy. "LET'S BUILD SOMETHING."

---

## 6. Sistema de cámara, navegación e interacción

**Nunca hay free-fly WASD por defecto.** El brief pide explícitamente no convertirlo en un
videojuego difícil de controlar.

| Contexto | Control |
| --- | --- |
| Recorrido | Scroll (o `↓`/`→`) avanza sobre el rail con damping; el rail no se puede abandonar |
| Mirar | Movimiento del ratón desplaza el encuadre unos grados (parallax), sin tomar el control |
| Punto de interés | Hover ilumina · click hace zoom cinemático y abre el panel · `Esc` vuelve al rail |
| Dentro de un distrito | Órbita local acotada, con límites suaves |
| Salto directo | Nav discreta al borde: `ENTRANCE · JOURNEY · SYSTEMS · STACK · AI · CONTACT` |
| Teclado | Tab recorre los POIs en orden narrativo; Enter activa; skip-link a la capa de texto |
| Móvil | Scroll-driven con cámara automática, tap para POI, escenas simplificadas |

Transiciones con easing de curva larga (~1.2 s), cambio de profundidad de campo y de
iluminación al entrar en zona. Ningún corte duro.

**Guía inicial**: tres palabras que aparecen y se retiran solas tras la primera
interacción — `EXPLORE` · `MOVE` · `INTERACT`.

---

## 7. Dirección de arte

Visualización arquitectónica, no estética hacker. Sin verde Matrix, sin glitches, sin HUDs
saturados, sin texto flotante decorativo.

| Rol | Color | Uso |
| --- | --- | --- |
| Base | `#0A0C0F` → `#14181D` | Vacío y superficies |
| Estructura | `#2A3138` | Aristas, retícula, arquitectura |
| Texto / neutro | `#E6EAEE` | Tipografía grabada y proyectada |
| Active | `#4DA3FF` | Foco, hover, selección (hereda el azul actual del CV) |
| Data | `#3FBFA8` | Flujo de datos, pipelines |
| Cloud | `#8AA6C4` | Infraestructura |
| AI | `#A98BFF` | Laboratorio y agente |
| Alert | `#FF6B57` | Solo el checkpoint humano de la automatización |

Regla: **máximo dos acentos simultáneos en pantalla**. La luz hace el trabajo dramático,
no la saturación.

Sonido: capa ambiental muy sutil (ventilación, corriente, clicks de interacción),
**silenciada por defecto**, con toggle siempre visible.

---

## 8. Presupuesto de rendimiento

| Métrica | Objetivo |
| --- | --- |
| FPS | 60 desktop · 30+ móvil |
| Draw calls por zona | ≤ 120, con `InstancedMesh` para todo lo repetido |
| Partículas | 6.000 desktop · 1.500 móvil, animadas **en shader** (cero trabajo de CPU por frame) |
| DPR | Cap 1.5 (2.0 solo en escenas estáticas) |
| Texturas | Ninguna externa en fases 1–4; geometría y materiales procedurales |
| JS inicial | ≤ 320 KB gzip (React + Next runtime ~90 KB, Three core ~150 KB); cada zona en su chunk async |
| Primer render | La capa de texto llega en el HTML servido; el mundo se carga después, sin bloquear |
| Zonas fuera de vista | Congeladas: no se actualizan ni se renderizan |
| Tier bajo | Detección por benchmark corto → menos partículas, sin sombras, o capa de texto |

---

## 9. Plan por fases

| Fase | Entregable | Verificable por |
| --- | --- | --- |
| **1 — Fundación** ✅ | Migración a Next.js + R3F con export estático funcionando en `/CV/`, `resume.ts` ampliado, tiers de calidad, rail de cámara, HUD mínimo, **01 Entrance** completa, capa de texto + skip-link + toggles (mute, reduced motion, text mode), SEO intacto | Se entra, se ve el nombre proyectado, se cruza el umbral; sin JS o sin WebGL el CV sigue leyéndose e imprimiéndose |
| **2 — Journey** ✅ | Las 4 estaciones con crecimiento arquitectónico real, paneles de highlights, nav discreta | El recorrido cuenta la carrera sin leer una sola línea de texto largo |
| **3 — Districts I** | Systems + Data: topología viva, requests circulando, motores de datos | Activar un servicio produce flujo visible extremo a extremo |
| **4 — Districts II** | Cloud & Delivery (pipeline activable) + AI Lab (ciclo del agente, con su checkpoint humano) | El pipeline recorre code→cloud; el agente completa su ciclo |
| **5 — Cierre** | The Stack, The Domains, The Archive, The Observatory | El recorrido tiene final y el contacto funciona con el email ofuscado |
| **6 — Pulido** | Perf real medido, responsive móvil, auditoría a11y, sonido, animaciones finas | Lighthouse y un dispositivo móvil real |

Cada fase deja la web **desplegable**. El trabajo vive en la rama `3d-world`; `main`
conserva el CV actual funcionando hasta que se decida fusionar.

---

## 10. Estado — fases 1 y 2 entregadas

Rama `3d-world`. `main` conserva el CV en Vue intacto.

### Rediseño: la estación deja de ser un edificio

La primera versión de la fase 2 dibujaba cada rol como volúmenes apilados con una hilera
de columnas delante. En pantalla esas columnas leían exactamente como **un gráfico de
barras** — justo lo que el brief prohíbe — y los volúmenes eran cajas negras sin lectura.

Ahora una estación **es su arquitectura**: un diagrama de sistema levantado en el espacio,
con los datos abajo porque son los cimientos, los servicios encima, las interfaces arriba
y —solo en la última— una capa de AI coronando. Cada nodo es una tecnología nombrada en
los highlights de ese rol, colocada en la capa que realmente ocupa, y los requests
circulan por las conexiones. Lo que crece de 2016 a hoy no es el tamaño de un edificio
sino la **profundidad del sistema**: tres capas y seis nodos al principio, cuatro capas
densas con tráfico al final.

### Iconos en los nodos

Cada nodo lleva ahora su marca en la cara. Dos procedencias, un solo lenguaje visual:

- **Marcas** para las treinta tecnologías cuyo logo se reconoce de un vistazo (Python,
  Django, React, Angular, Vue, Flutter, Docker, PostgreSQL, Node.js, Next.js, Tailwind,
  FastAPI, Airflow…). Los paths vienen de Simple Icons (CC0), **extraídos en tiempo de
  autoría** a `icon-paths.ts` en lugar de importar la librería: el bundle carga las treinta
  formas que este CV usa, no las 3.453 del paquete. La dependencia se instaló, se extrajo y
  se desinstaló.
- **Glifos propios** para todo lo demás: las marcas que Amazon y Microsoft pidieron retirar
  de Simple Icons (AWS, Lambda, S3, DynamoDB, SQL Server, Azure DevOps, Power BI), las que
  nunca tuvieron logo público (Siigo, SIESA, Withpersona, Wompi, Split.io, Segment,
  SendGrid, SignNow, SFTP, CI/CD) y lo que no es una marca en absoluto (LLM, modelos
  locales, agentes, y los módulos de la app escolar de 2016). Más un glifo por capa como
  respaldo, para que ningún nodo quede sin marca.

Todo se dibuja **monocromo en el color de su capa**, nunca en colores corporativos: un muro
de logos de marca es exactamente la "sopa de skills" que este diseño evita. Y el icono se
ve siempre, atenuado cuando la estación no está activa — que es lo que impide que una
estación lejana sea una fila de cajas anónimas. El nombre sigue apareciendo solo al llegar.

### Lo que hizo falta arreglar para que se viera

Todo esto salió de mirar capturas, no de leer código:

- **El texto inicial se cortaba** por los lados en cualquier ventana que no fuese 16:9.
  La cámara ahora abre el campo de visión conforme la ventana se estrecha, en vez de
  encoger la tipografía hasta el peor caso.
- **Tirón al cambiar de sección**: cada estación rasterizaba seis u ocho etiquetas en el
  instante de llegar. Las texturas de texto ahora se cachean y comparten.
- **Las dos curvas de cámara estaban desincronizadas.** La de posición y la de mirada
  tenían distinta longitud y se muestreaban por longitud de arco, así que el mismo `t`
  caía en waypoints distintos: la cámara llegaba frente a una estación mirando aún entre
  las dos anteriores. Ahora son una sola lista de waypoints muestreada uniformemente, y la
  posición de una estación en el rail *es* su índice.
- **La estación iluminada y la marcada en la navegación podían discrepar**, porque una se
  calculaba por distancia de cámara y la otra por posición en el rail. Una sola fuente.
- **El umbral entre atrio y estaciones era una constante** mayor que la posición de la
  primera estación, así que la navegación seguía marcando "Identity" al llegar a 2016.
  Ahora sale del propio rail.
- **El encuadre se calculaba sobre la plataforma**, no sobre lo que se dibuja: los nodos
  sobresalen y quedaban cortados.
- Suelo mate en vez de pulido (cada lámpara dejaba una mancha azul enorme), avenida
  definida por sus bordes en vez de una franja central que llenaba el primer plano, y la
  navegación con nombres de empleador —dos roles comparten 2023 y "2023" dos veces no
  dice nada— sobre su propio fondo.

Dos invariantes viven ahora junto al rail y avisan en desarrollo: que la cámara no
atraviese ninguna estación, y que las posiciones del rail crezcan con la carrera. Los dos
saltaron por errores reales.

### Fase 2 — The Career Journey

- **Las cuatro estaciones construidas**, con un único lenguaje arquitectónico: losa,
  plantas apiladas con retranqueo y una columnata de las tecnologías de ese rol. Lo único
  que cambia entre 2016 y hoy es *cuánto* hay — una planta y seis columnas al principio,
  cuatro plantas y frente completo al final. El argumento se hace en geometría, no en copy.
- **Disposición en avenida**: las estaciones alternan a los lados del camino y la última
  cierra el eje de frente. Se pasa entre ellas, no junto a ellas.
- **La mirada sigue a la arquitectura**: al acercarse a un edificio, la cámara lo encuadra
  y lo suelta al alejarse. Sin eso, un recorrido es un salvapantallas.
- **Revelación progresiva**: las etiquetas de tecnología solo aparecen al llegar a la
  estación. Todo legible a la vez es un diagrama; revelado al acercarse, es un lugar.
- **Panel de detalle** en DOM real (no proyectado en la escena): seleccionable, navegable
  por teclado, cerrable con Esc. Es donde se hacen las afirmaciones del CV.
- **Navegación secundaria** discreta: una lista de años, no un menú de secciones.
- Las posiciones del rail **se miden** contra la curva real (`railAtZ`), no se escriben a
  mano — un punto de control movido no descoloca la navegación.

Dos fallos encontrados y corregidos por verificación, no por lectura: el rail terminaba
**dentro** del último edificio, y con el panel abierto la rueda movía la cámara en lugar
de desplazar el texto.

### Fase 1 — Fundación

Hecho:

- Migración completa a Next.js 16 + React 19 + React Three Fiber, TypeScript, export
  estático verificado bajo `/CV/` con `.nojekyll` en el deploy.
- `resume.ts` como fuente única, ampliado a 8 categorías de skills (§2.6). Los años de
  experiencia se calculan desde 2016 en lugar de escribirse.
- Motor: tiers de calidad, rail de cámara con dos curvas y parallax, estado del recorrido
  fuera de React, partículas movidas en GPU, texto proyectado por `CanvasTexture`.
- **01 The Entrance**: atrio con el nombre proyectado sobre el muro, rol y años grabados en
  los paneles, umbral practicado en el propio muro.
- **02 The Site**: el corredor y el plano del emplazamiento, con la huella de cada estación
  a la escala que le corresponde.
- Capa de texto completa en HTML servido, imprimible, con conmutación en ambos sentidos,
  foco gestionado y red de seguridad si el mundo no arranca.
- SEO trasladado sin pérdidas: OG, Twitter, JSON-LD (ahora derivado de `skills`).
- Verificado en el export: `cert1`/`cert2` no se empaquetan, y el HTML servido no contiene
  ningún `mailto:`.

### Verificado y sin verificar

Verificado: `npm run build` y `npm run lint` limpios; consola del navegador sin errores ni
avisos propios; el CV completo presente en el HTML servido; `cert1`/`cert2` fuera del
bundle; ningún `mailto:` en el markup; y el rail comprobado numéricamente — posiciones
crecientes, cada destino de la navegación resuelve a su estación, y ninguna muestra de la
curva cae dentro de un edificio.

**Sin verificar visualmente**: el aspecto del mundo desde los ajustes de encuadre,
iluminación y techo en adelante. El navegador headless de esta máquina no captura WebGL de
forma fiable, así que la revisión estética queda pendiente de mirarlo en pantalla.

Ruido conocido: React Three Fiber usa internamente `THREE.Clock`, que three 0.185 marca
como obsoleto, y emite un aviso por carga. Es de la librería, no del proyecto; se irá
cuando R3F migre a `THREE.Timer`. No se ancla `three` a una versión anterior por un aviso
cosmético.

## 11. Decisiones registradas

| # | Decisión | Efecto |
| --- | --- | --- |
| 1 | Contenido **híbrido** (§2.5) | Narrativa del brief, sin empresas que el CV no nombra. Cuatro estaciones reales |
| 2 | **Incorporar** las 18 tecnologías del brief (§2.6) | `skills` pasa de 6 a 8 categorías |
| 3 | Migrar a **Next.js + React Three Fiber** (§3.2) | El proyecto Vue se retira; export estático con `basePath` y `.nojekyll` |

Sigue abierto y sin bloquear nada: los dominios de §2.4 sin respaldo (logistics,
investment platform, construction management) quedan fuera hasta que exista un highlight
que los sostenga.
