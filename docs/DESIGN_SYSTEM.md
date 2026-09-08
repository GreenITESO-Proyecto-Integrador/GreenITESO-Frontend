# Guía de Fundamentos del Sistema de Diseño — GreenITESO

**Versión:** 2.0 (Soporte Oficial Tailwind CSS v4, Vite 6 & React 19)

**Propósito:** Sirve como la única fuente de verdad (_Single Source of Truth_) para garantizar la homogeneidad, accesibilidad y consistencia visual de todas las pantallas e interfaces de GreenITESO.

## 1. Principios de Diseño Base

1. **Mobile-First & PWA First:** Toda interfaz se diseña considerando primero la experiencia táctil en pantallas móviles pequeñas ($\ge 320\text{px}$) y escalando progresivamente hacia tablets y escritorio.
2. **Claridad Ecológica y Gamificada:** La jerarquía debe destacar métricas ambientales y puntos de acción sin saturar al usuario con elementos competitivos estridentes.
3. **Consistencia Atómica:** Todo elemento interactivo (botones, tarjetas, inputs) debe reutilizar los mismos tokens de borde, sombra, radio y estados (`hover`, `focus`, `active`, `disabled`).

## 2. Tipografía y Escala Tipográfica

Utilizamos **Plus Jakarta Sans** como fuente primaria para toda la plataforma. Ofrece una alta legibilidad en pantallas móviles y un carácter moderno ideal para aplicaciones ecológicas y de gamificación.

- **Fuente Principal:** `Plus Jakarta Sans`, sans-serif
- **Importación CDN (`index.html` o `src/index.css`):**

  ```
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
  ```

### Jerarquía Tipográfica y Tokens

| **Rol Visual**         | **Peso (Font Weight)**         | **Clase Tailwind v4**                   | **Tamaño / Interlineado**     | **Uso Recomendado**                                                                 |
| ---------------------- | ------------------------------ | --------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------- |
| **Display / Hero**     | `800` (ExtraBold)              | `text-3xl sm:text-4xl font-extrabold`   | `30px / 36px`                 | Marcadores de puntos destacados, felicitaciones de logros, pantallas de bienvenida. |
| **Título H1**          | `700` (Bold)                   | `text-2xl font-bold`                    | `24px / 32px`                 | Encabezados principales de pantalla (Misiones, Clanes, Perfil, Feed).               |
| **Título H2**          | `700` (Bold)                   | `text-xl font-bold`                     | `20px / 28px`                 | Encabezados de sección dentro de vistas y modales principales.                      |
| **Subtítulo H3**       | `600` (SemiBold)               | `text-lg font-semibold`                 | `18px / 28px`                 | Títulos de tarjetas, nombres de misiones y módulos secundarios.                     |
| **Cuerpo Principal**   | `400` / `500` (Regular/Medium) | `text-sm sm:text-base`                  | `14px / 20px` o `16px / 24px` | Textos explicativos, descripciones de misiones, entradas del feed social.           |
| **Cuerpo Secundario**  | `400` (Regular)                | `text-xs sm:text-sm text-secondary-300` | `12px / 16px`                 | Metadatos, marcas de tiempo, explicaciones auxiliares.                              |
| **Captions / Badges**  | `600` (SemiBold)               | `text-xs font-semibold tracking-wider`  | `12px / 16px`                 | Etiquetas de estado (`APROBADO`, `PENDIENTE`), contadores de medallas.              |
| **Métricas Tabulares** | `700` (Bold)                   | `font-bold tabular-nums`                | Variable                      | Marcadores de puntos, rankings y contadores de impacto para evitar saltos de ancho. |

## 3. Paleta de Colores Centralizada y Semántica

### 3.1 Escala Primaria: Verde Ecológico / Gamificación

| **Token CSS**         | **Código HEX** | **HSL (para CSS Vars)** | **Propósito y Uso Semántico**                                                            |
| --------------------- | -------------- | ----------------------- | ---------------------------------------------------------------------------------------- |
| `--color-primary-50`  | `#f0f6eb`      | `93 30% 94%`            | Fondos de tarjetas activas, hover suave, contenedores de badges positivos.               |
| `--color-primary-100` | `#d1e3c2`      | `93 40% 83%`            | Bordes acentuados, fondos de chips y estados deshabilitados suaves.                      |
| `--color-primary-200` | `#bbd5a4`      | `93 43% 74%`            | Indicadores de progreso, bordes interactivos en hover.                                   |
| `--color-primary-300` | `#9cc27a`      | `93 41% 62%`            | Barras de progreso activas, íconos secundarios.                                          |
| `--color-primary-400` | `#89b661`      | `93 38% 55%`            | Acentos de éxito, estados interactivos secundarios.                                      |
| `--color-primary-500` | `#6ba439`      | `93 48% 43%`            | **VERDE BASE ITESO:** Botones primarios, Call-To-Actions principales, puntos acumulados. |
| `--color-primary-600` | `#619534`      | `93 48% 39%`            | Hover de botones primarios, enlaces activos y acentos de $\text{CO}_2$.                  |
| `--color-primary-700` | `#4c7428`      | `93 49% 31%`            | Texto sobre fondos verdes claros, íconos de alto contraste.                              |
| `--color-primary-800` | `#3b5a1f`      | `93 49% 24%`            | Encabezados de contraste verde.                                                          |
| `--color-primary-900` | `#2d4518`      | `93 48% 18%`            | Elementos de máxima jerarquía sobre fondos claros.                                       |

### 3.2 Escala Secundaria: Gris Salvia / Estructuras Base

| **Token CSS**           | **Código HEX** | **HSL (para CSS Vars)** | **Propósito y Uso Semántico**                                       |
| ----------------------- | -------------- | ----------------------- | ------------------------------------------------------------------- |
| `--color-secondary-50`  | `#e9ebea`      | `147 7% 92%`            | **FONDO PRINCIPAL APP:** Canvas de fondo neutro de la aplicación.   |
| `--color-secondary-100` | `#bac1bd`      | `147 6% 74%`            | Líneas divisoras, bordes neutrales de campos de entrada y tarjetas. |
| `--color-secondary-200` | `#99a39d`      | `147 5% 62%`            | Placeholders de formularios, bordes de elementos deshabilitados.    |
| `--color-secondary-300` | `#6a7971`      | `147 7% 45%`            | Texto secundario, subtítulos, marcas de tiempo y etiquetas neutras. |
| `--color-secondary-400` | `#4d5f55`      | `147 10% 34%`           | Íconos secundarios, estados de interacción neutra.                  |
| `--color-secondary-500` | `#21372b`      | `147 25% 17%`           | **TEXTO BASE:** Encabezados y cuerpo de texto principal.            |
| `--color-secondary-600` | `#1e3227`      | `147 25% 16%`           | Elementos de estructura oscura.                                     |
| `--color-secondary-700` | `#17271f`      | `147 26% 12%`           | Barras de navegación superior/inferior en acentos oscuros.          |
| `--color-secondary-800` | `#121e18`      | `147 25% 9%`            | Texto de máxima accesibilidad y contraste AAA.                      |
| `--color-secondary-900` | `#0e1712`      | `147 24% 6%`            | Contrastes máximos.                                                 |

### 3.3 Colores Semánticos de Estado y Auditoría (`FR-VAL-02`)

| **Estado / Dominio**       | **Fondo (bg)**  | **Texto (text)**   | **Borde (border)**   | **Uso**                                                   |
| -------------------------- | --------------- | ------------------ | -------------------- | --------------------------------------------------------- |
| **Aprobado / Exitoso**     | `bg-primary-50` | `text-primary-700` | `border-primary-200` | Registro aprobado, misión completada, logro desbloqueado. |
| **Pendiente de Auditoría** | `bg-amber-50`   | `text-amber-800`   | `border-amber-200`   | Evidencia en revisión por administración.                 |
| **Rechazado / Alerta**     | `bg-red-50`     | `text-red-700`     | `border-red-200`     | Evidencia rechazada, error de validación, eliminación.    |
| **Información / Neutral**  | `bg-sky-50`     | `text-sky-800`     | `border-sky-200`     | Avisos generales del sistema, tutoriales.                 |

### 3.4 Identidad Visual de Impacto Ambiental

Para mantener la asociación mental intuitiva de métricas ambientales:

- $\text{CO}_2$ **Evitado (**$\text{kg}$**):** Fondo `bg-primary-50`, Texto `text-primary-700`, Íconos de Hoja/Planta.
- **Agua Ahorrada (**$\text{Litros}$**):** Fondo `bg-sky-50`, Texto `text-sky-700`, Íconos de Gota de Agua.
- **Plástico Reciclado/Evitado (**$\text{kg}$**):** Fondo `bg-emerald-50`, Texto `text-emerald-700`, Íconos de Reciclaje/Contenedor.

## 4. Sistema de Espaciado, Retícula y Puntos de Quiebre (Layout Rules)

### 4.1 Escala de Radios de Borde (Border Radius)

- **Contenedores y Tarjetas Grandes (`rounded-2xl`):** `1rem` ($16\text{px}$) — Tarjetas de misiones, modales, paneles de impacto.
- **Botones e Inputs (`rounded-xl`):** `0.75rem` ($12\text{px}$) — Botones de acción, campos de texto, dropdowns.
- **Badges y Chips (`rounded-full`):** `9999px` — Contador de puntos, etiquetas de estado, avatares.

### 4.2 Sombras y Elevación Visual (Elevation Tokens)

- **Flat / Base (`shadow-none`):** Elementos dentro de contenedores o formularios.
- **Tarjeta Suave (`shadow-sm`):** `0 1px 2px 0 rgb(0 0 0 / 0.05)` — Tarjetas de misiones, listas de clanes.
- **Elemento Interactivo Hover (`shadow-md`):** `0 4px 6px -1px rgb(0 0 0 / 0.1)` — Tarjetas al hacer hover/press.
- **Modales / Elevación Flotante (`shadow-lg`):** `0 10px 15px -3px rgb(0 0 0 / 0.1)` — Modales de confirmación, menús desplegables, barra de navegación inferior.

### 4.3 Puntos de Quiebre Responsive (Breakpoints)

- **Mobile (Base):** `< 640px` (Vista de 1 columna, navegación fija inferior).
- **Tablet (`sm` / `md`):** `640px` – `768px` (Retículas de 2 columnas para tarjetas y dashboards).
- **Escritorio (`lg` / `xl`):** `1024px` + (Contenedores centrados con ancho máximo `max-w-5xl` o `max-w-7xl`).

## 5. Reglas Mobile-First y PWA

1. **Objetivo Táctil Mínimo (**$\ge 44 \times 44\text{px}$**):**
   Cualquier elemento interactivo (botones, íconos de navegación, opciones de listas) debe contar con una zona de toque de al menos $44\text{px}$ de alto/ancho para garantizar facilidad de uso en pantallas táctiles móviles.
2. **Navegación Inferior Fija (Bottom Navigation Bar):**
   - Ubicación: `fixed bottom-0 left-0 right-0 z-50`
   - Fondo: Blanco (`bg-white`) con borde superior `border-t border-secondary-100`.
   - Padding Seguro para iOS/Android: Incluir `pb-[env(safe-area-inset-bottom,16px)]` para evitar interferencia con la barra de gestos nativa del sistema operativo.
3. **Área de Contenido Seguro (Safe Scroll Area):**
   Para evitar que el último elemento de una pantalla quede oculto bajo la barra de navegación inferior, todo contenedor principal de pantalla debe incluir padding inferior equivalente: `pb-24`.

## 6. Configuración de Archivos Core (`vite.config.ts` e `index.css`)

### 6.1 `vite.config.ts` (Tailwind CSS v4 + React 19)

```
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 6.2 `src/index.css` (Definición de Variables `@theme` y Shadcn)

```
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: 'Plus Jakarta Sans', sans-serif;

  /* Escala Completa Primaria (Verde ITESO) */
  --color-primary-50: #f0f6eb;
  --color-primary-100: #d1e3c2;
  --color-primary-200: #bbd5a4;
  --color-primary-300: #9cc27a;
  --color-primary-400: #89b661;
  --color-primary-500: #6ba439;
  --color-primary-600: #619534;
  --color-primary-700: #4c7428;
  --color-primary-800: #3b5a1f;
  --color-primary-900: #2d4518;

  /* Escala Completa Secundaria (Gris Salvia / Estructura) */
  --color-secondary-50: #e9ebea;
  --color-secondary-100: #bac1bd;
  --color-secondary-200: #99a39d;
  --color-secondary-300: #6a7971;
  --color-secondary-400: #4d5f55;
  --color-secondary-500: #21372b;
  --color-secondary-600: #1e3227;
  --color-secondary-700: #17271f;
  --color-secondary-800: #121e18;
  --color-secondary-900: #0e1712;

  /* Mapeo Semántico Shadcn/UI */
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));

  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));

  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));

  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));

  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));

  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));

  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));

  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));

  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));

  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 4px);
  --radius-sm: calc(var(--radius) - 8px);
}

:root {
  --background: 147 7% 92%; /* secondary-50 (#e9ebea) */
  --foreground: 147 25% 17%; /* secondary-500 (#21372b) */

  --card: 0 0% 100%;
  --card-foreground: 147 25% 17%;

  --popover: 0 0% 100%;
  --popover-foreground: 147 25% 17%;

  --primary: 93 48% 43%; /* primary-500 (#6ba439) */
  --primary-foreground: 0 0% 100%;

  --secondary: 147 7% 92%;
  --secondary-foreground: 147 25% 17%;

  --muted: 147 7% 92%;
  --muted-foreground: 147 7% 45%;

  --accent: 93 30% 94%;
  --accent-foreground: 93 49% 31%;

  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;

  --border: 147 6% 74%;
  --input: 147 6% 74%;
  --ring: 93 48% 43%;

  --radius: 0.75rem;
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-sans);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
```

## 7. Directivas para la Formulación de Formularios e Controles Interactivos

Para mantener consistencia en campos de texto, selecciones y botones sin importar la pantalla:

1. **Campos de Texto / Inputs:**
   - Clase Estándar: `h-11 px-4 rounded-xl border border-secondary-100 bg-white text-secondary-500 placeholder:text-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all`
2. **Estados Enfoque y Accesibilidad (`Focus Ring`):**
   - Todo elemento interactivo debe incluir la clase de enfoque semántica: `focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none`.
3. **Botón Principal:**
   - `min-h-[44px] bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-semibold rounded-xl px-5 shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`
4. **Botón Secundario / Outlined:**
   - `min-h-[44px] bg-white border border-secondary-100 hover:border-secondary-200 text-secondary-500 font-semibold rounded-xl px-5 transition-colors cursor-pointer`

## 8. Iconografía y Símbolos

- **Librería Oficial:** Lucide React (`lucide-react`).
- **Tamaños Estándar:**
  - En línea / Badges / Acciones de lista: `size-4` ($16\text{px}$) o `size-5` ($20\text{px}$).
  - Destacados / Tarjetas principales: `size-6` ($24\text{px}$).
  - Estados vacíos (_Empty states_) / Logros: `size-10` ($40\text{px}$) a `size-12` ($48\text{px}$).
- **Comportamiento:** Los íconos deben heredar el color del texto mediante `currentColor` (clases de color de Tailwind).

## 9. Uso de shadcn/ui — Instalación Bajo Demanda

**shadcn/ui** proporciona componentes accesibles y reutilizables basados en Radix UI y Tailwind CSS. **No se instalan como un paquete monolítico**, sino que **se agregan bajo demanda** directamente al proyecto según sea necesario.

### 9.1 Cómo Agregar Componentes

Cuando necesites un componente específico (ej: Button, Input, Card), instálalo únicamente con:

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add card
```

Esto crea el archivo del componente en `src/components/ui/<component>.tsx` listo para usar.

### 9.2 Componentes Disponibles en GreenITESO

Actualmente disponibles:

- **Button** (`src/components/ui/button.tsx`) — Botones primarios, secundarios y ghost.
- **Input** (`src/components/ui/input.tsx`) — Campos de texto accesibles.
- **Card** (`src/components/ui/card.tsx`) — Contenedores de tarjetas.

### 9.3 Importación y Uso

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function MyComponent() {
  return (
    <>
      <Button className="bg-primary-500 hover:bg-primary-600">Acción</Button>
      <Input placeholder="Ingresa aquí" className="border-secondary-100" />
    </>
  );
}
```

### 9.4 Personalización

Los componentes de shadcn heredan los colores y estilos de Tailwind. Personaliza con clases de la paleta GreenITESO:

```tsx
<Button variant="outline" className="border-secondary-300 text-secondary-500">
  Secundario
</Button>
```

**Nota:** No modifiques directamente los componentes de `src/components/ui/`. Si necesitas variaciones, extiéndelos creando componentes propios en `src/components/custom/`.
