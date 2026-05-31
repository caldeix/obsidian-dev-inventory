# Manual Técnico — OBSIDIAN_DEV_INVENTORY

> Cómo está construido el vault: arquitectura, código DataviewJS, API de Obsidian, sistema CSS y modelo de datos.

---

## Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Modelo de datos — frontmatter YAML](#2-modelo-de-datos--frontmatter-yaml)
3. [_lib.js — librería de utilidades](#3-_libjs--librería-de-utilidades)
4. [index.md — Dashboard DataviewJS](#4-indexmd--dashboard-dataviewjs)
5. [Modal de nuevo programa](#5-modal-de-nuevo-programa)
6. [Sistema de estilos CSS](#6-sistema-de-estilos-css)
7. [_comment-btn.md — componente de comentarios](#7-_comment-btnmd--componente-de-comentarios)
8. [Flujo completo de una entrada nueva](#8-flujo-completo-de-una-entrada-nueva)

---

## 1. Arquitectura general

El vault no usa ningún servidor ni base de datos externa. Todo vive en ficheros `.md` con metadatos YAML en el frontmatter. El motor de visualización es el plugin **Dataview**, que expone un entorno JavaScript dentro de bloques ` ```dataviewjs ``` ` y puede leer los metadatos de todas las notas del vault en tiempo real.

```
DEV_INVENTORY/
├── index.md            ← Dashboard principal (DataviewJS ~650 líneas)
├── _lib.js             ← Utilidades compartidas (patrón módulo eval)
├── _comment-btn.md     ← Componente reutilizable de comentarios
├── _GUIA_DATOS.md      ← Referencia de campos para usuarios
├── _SETUP.md           ← Guía de instalación
├── [Proyecto]/
│   └── nombre-app.md   ← Una nota por programa (datos en frontmatter)
└── .obsidian/
    └── snippets/
        └── devinventory.css  ← Estilos del dashboard
```

**Dependencias de plugins:**

| Plugin | Rol |
|--------|-----|
| Dataview | Motor de queries y renderizado JS en notas |
| Templater | Soporte de plantillas (reservado para expansión futura) |

---

## 2. Modelo de datos — frontmatter YAML

Cada programa es una nota `.md` con un bloque YAML al inicio. Dataview lo parsea automáticamente y lo expone como objeto JavaScript.

```yaml
---
name: api-pagos               # identificador único (obligatorio)
project: PaymentGateway       # agrupa notas en proyectos (obligatorio)
app_type: api                 # api | webapp | batch | library | cli
languages: [PHP, Java]        # array YAML o string separado por comas
databases: [MySQL, Redis]
owner: carlos.martin
criticality: critical         # critical | high | medium | low
environments:
  dev: 192.168.1.10
  pre: 192.168.1.20
  pro: payments.empresa.com
dependencies: [lib-autenticacion]
last_updated: 2026-05-15      # YYYY-MM-DD
deprecated: false
cicd: true
repo_url: https://bitbucket.org/empresa/api-pagos
version: 3.2.1
description: Texto libre.
created: 2024-03-01
---
```

Dataview expone `p.environments` como objeto anidado, `p.languages` como array o string según cómo esté escrito en YAML. La función `normArray()` del dashboard normaliza ambos casos a `string[]`.

---

## 3. `_lib.js` — librería de utilidades

El fichero no es una nota de Obsidian sino un `.js` puro. No puede importarse con `require()` porque Obsidian sandboxea los módulos, así que se carga con el patrón **eval + vault adapter**:

```js
var _lib = eval(await app.vault.adapter.read('_lib.js'));
```

El fichero devuelve un objeto literal `({...})` con cinco funciones:

| Función | Descripción |
|---------|-------------|
| `safeDate(v)` | Normaliza fechas de Dataview (objetos Luxon, timestamps o strings) a `YYYY-MM-DD` |
| `daysAgo(dateStr)` | Devuelve días transcurridos desde una fecha; `Infinity` si inválida |
| `ageBadge(dateStr)` | Devuelve HTML `<span>` con clase de color según antigüedad (≤30d verde → >365d rojo) |
| `showBanner(msg, type)` | Toast flotante en esquina superior derecha, auto-destruido a los 3 s |
| `buildLanguageBar(lang, count, max)` | HTML de barra proporcional para los gráficos de lenguajes |

**Por qué eval y no require:** Obsidian no expone `require()` para ficheros arbitrarios del vault. El patrón eval es el estándar en la comunidad Dataview para compartir código entre notas.

---

## 4. `index.md` — Dashboard DataviewJS

Todo el dashboard es un único bloque ` ```dataviewjs ``` `. Se ejecuta en modo lectura cada vez que Obsidian renderiza la nota.

### 4.1 Query de datos

```js
const all    = dv.pages().where(p => p.name && p.project);
const active = all.where(p => !p.deprecated);
```

`dv.pages()` devuelve todas las notas del vault. El filtro `p.name && p.project` excluye notas de sistema (`_lib.js`, `_SETUP.md`, etc.) que no tienen esos campos.

### 4.2 KPI Cards

Se calculan sobre los arrays `all` y `active`:

```js
// Ejemplo: % con CI/CD
const cicdPct = active.length
  ? Math.round(active.where(p => p.cicd === true).length / active.length * 100)
  : 0;
```

Cada KPI se renderiza como `div.di-kpi-card` con valor y etiqueta, estilado por CSS.

### 4.3 Gráficos de barras

El gráfico de lenguajes acumula frecuencias con un `Map`, ordena por uso y delega el HTML a `buildLanguageBar()`:

```js
var langMap = new Map();
active.array().forEach(p => {
  normArray(p.languages).forEach(l => langMap.set(l, (langMap.get(l)||0)+1));
});
var maxLang = Math.max(...langMap.values());
langMap.forEach((count, lang) => {
  html += buildLanguageBar(lang, count, maxLang);
});
```

### 4.4 Tabla interactiva

La tabla se construye con DOM puro (sin innerHTML masivo) para evitar problemas de XSS y mantener los event listeners:

- **`rows`** — array plano de objetos JavaScript construido desde `all.array()`.
- **`fs`** (filter state) — objeto mutable con el estado de todos los filtros y ordenación.
- **`filtered()`** — función pura que aplica `fs` sobre `rows` y devuelve el subconjunto ordenado.
- **`render()`** — vacía el contenedor y lo reconstruye desde cero llamando a `filtered()`. Se llama en cada cambio de filtro.

La columna **PRO** muestra `envs.pro`, que Dataview parsea del campo `environments.pro` del frontmatter YAML.

### 4.5 Registro de comando global

```js
if (!app.commands.commands['devinventory:new']) {
  app.commands.addCommand({
    id: 'devinventory:new',
    name: 'DEV: ⚡ Nueva entrada',
    callback: () => openNewProgramModal()
  });
}
```

El guard `if (!app.commands.commands[...])` evita registrar el comando múltiples veces si Obsidian re-renderiza la nota.

---

## 5. Modal de nuevo programa

Usa la API nativa de Obsidian (`require('obsidian')`):

```js
var { Modal, Setting, Notice } = require('obsidian');

class NewProgramModal extends Modal {
  onOpen() { /* construye el formulario */ }
  onClose() { this.contentEl.empty(); }
}
new NewProgramModal(app).open();
```

**`Setting`** es el componente de Obsidian para filas de formulario con etiqueta + control. Se usa para todos los campos excepto los entornos, que tienen layout personalizado en tres columnas (DEV / PRE / PRO).

**Autocomplete:** se crean elementos `<datalist>` con los valores ya existentes en el vault, enlazados a los `<input>` mediante `list=`. Esto permite sugerir proyectos, lenguajes, owners y dependencias ya registrados.

**`saveProgram(data)`** genera el frontmatter YAML como string, determina la ruta (`[Proyecto]/⚠ DEPRECATED/nombre.md` si deprecated, `[Proyecto]/nombre.md` si no), crea las carpetas necesarias con `app.vault.createFolder()` y escribe la nota con `app.vault.create()`.

---

## 6. Sistema de estilos CSS

El fichero `.obsidian/snippets/devinventory.css` se aplica **solo** a notas que declaren `cssclasses: [devinventory]` en su frontmatter. Actualmente solo `index.md` lo usa.

### Estructura del CSS

| Bloque | Clases | Descripción |
|--------|--------|-------------|
| Base | `.devinventory` | Oculta el título inline, expande a ancho completo |
| KPI Cards | `.di-kpi-row`, `.di-kpi-card`, `.di-kpi-*` | Layout flex con borde izquierdo de color |
| Gráficos | `.di-bar-row`, `.di-bar-track`, `.di-bar-fill` | Barras proporcionales con `width` inline |
| Tabla | `.di-table-wrap`, `.di-table`, `.di-controls` | Tabla scrollable con cabeceras sticky |
| Badges | `.di-badge`, `.di-badge-critical/high/medium/low` | Píldoras de color por criticidad |
| Age badges | `.di-age-badge`, `.di-age-fresh/ok/warn/old/ancient` | Verde → rojo según antigüedad |
| Modal | `.di-modal` | Padding y estilos del formulario |
| Toast | Inyectado por `showBanner()` | Posición fija, z-index 9999 |

**Variables CSS de Obsidian usadas:** `--background-secondary`, `--background-primary`, `--text-normal`, `--text-muted`, `--interactive-accent`, `--background-modifier-border`. Esto garantiza compatibilidad con cualquier tema (claro u oscuro).

---

## 7. `_comment-btn.md` — componente de comentarios

Nota DataviewJS embebible en cualquier nota de programa. Renderiza un botón "Añadir comentario" que abre un modal nativo de Obsidian, recoge el texto y lo inserta al final de la nota activa como un callout Markdown:

```markdown
> [!note] Comentario — 2026-05-31
> Texto del comentario aquí.
```

Para incrustarlo en una nota de programa basta con añadir:

```markdown
![[_comment-btn]]
```

---

## 8. Flujo completo de una entrada nueva

```
Usuario pulsa "+ Nuevo programa"
        │
        ▼
openNewProgramModal()
  └─ construye formulario con Setting + datalists de autocomplete
        │
        ▼
Usuario rellena campos y pulsa "Guardar"
        │
        ▼
saveProgram(data)
  ├─ genera string de frontmatter YAML
  ├─ calcula ruta: [project]/[name].md  (o ⚠ DEPRECATED/ si deprecated=true)
  ├─ app.vault.createFolder() si no existe
  ├─ app.vault.create(ruta, contenido)
  └─ showBanner("✓ nombre creado", "success")
        │
        ▼
Dataview detecta el nuevo fichero y re-ejecuta el dashboard
→ la nueva entrada aparece en tabla y KPIs automáticamente
```

---

<div align="center">

Desarrollado por [caldev](https://github.com/caldeix) ❤️ · [GitHub](https://github.com/caldeix) · [ME](https://caldeix.github.io/me/)

</div>
