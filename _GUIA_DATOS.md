# Guía de referencia — DEV_INVENTORY

Descripción de cada campo, sección del dashboard y comportamiento del sistema. Orientado al usuario final, sin código.

---

## 1. Campos de cada programa

Cada programa del inventario es una nota con un bloque de metadatos (frontmatter) al principio del archivo.

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `name` | texto | ✓ | Identificador único del programa. Usar kebab-case: `api-pagos`, `webapp-clientes`. |
| `project` | texto | ✓ | Nombre del proyecto al que pertenece. Define la carpeta donde se guarda la nota. |
| `app_type` | enum | ✓ | Tipo de aplicación: `api`, `webapp`, `batch`, `library` o `cli`. |
| `languages` | lista | — | Lenguajes de programación usados. Ej: `[PHP, JavaScript, Vue]`. |
| `databases` | lista | — | Bases de datos utilizadas. Ej: `[MySQL, Redis]`. |
| `owner` | texto | — | Responsable técnico del programa. Formato recomendado: `nombre.apellido`. |
| `criticality` | enum | — | Nivel de criticidad: `critical`, `high`, `medium` o `low`. Ver sección 8. |
| `environments.dev` | texto | — | IP o DNS del entorno de desarrollo. |
| `environments.pre` | texto | — | IP o DNS del entorno de preproducción. |
| `environments.pro` | texto | — | IP o DNS del entorno de producción. |
| `dependencies` | lista | — | Nombres de otros programas del inventario de los que depende este. |
| `last_updated` | fecha | — | Fecha de la última actualización significativa del programa. Formato `YYYY-MM-DD`. |
| `deprecated` | booleano | — | `true` si el programa está en desuso. Por defecto `false`. |
| `cicd` | booleano | — | `true` si el programa tiene pipeline de CI/CD activo. Por defecto `false`. |
| `repo_url` | URL | — | Enlace al repositorio de código fuente. |
| `version` | texto | — | Versión actual del programa. Formato semver recomendado: `1.2.3`. |
| `description` | texto | — | Descripción breve del propósito del programa. |
| `created` | fecha | — | Fecha en que se registró el programa en el inventario. Se asigna automáticamente. |

---

## 2. Dashboard — Fila de stats (KPIs)

La primera sección del dashboard muestra cinco tarjetas con métricas clave.

**Total programas activos**
Cuenta todos los programas del inventario donde `deprecated: false` o el campo no está definido. Los programas con `deprecated: true` no se cuentan aquí, independientemente del proyecto al que pertenezcan.

**Deprecated**
Número total acumulado de programas con `deprecated: true` en todo el vault, de todos los proyectos. Refleja el histórico total, no solo los deprecados recientemente.

**Con CI/CD**
Programas activos (no deprecated) que tienen `cicd: true`. Los programas deprecated con CI/CD no se suman.

**Actualizados este mes**
Programas activos cuyo campo `last_updated` cae dentro del mes natural actual (por ejemplo, si hoy es 31 de mayo de 2026, cuenta los programas con `last_updated` entre `2026-05-01` y `2026-05-31`).

**Criticidad critical**
Programas activos con `criticality: critical`. Solo el nivel más alto; los niveles `high`, `medium` y `low` no se suman aquí.

---

## 3. Dashboard — Desglose por lenguaje y base de datos

**Cómo se calculan los totales**
Un programa que usa tres lenguajes (`[PHP, JavaScript, Vue]`) suma una unidad en cada uno de los tres. Por tanto, la suma de todos los contadores de lenguajes puede ser mayor que el total de programas.

**Qué significa la longitud de la barra**
La barra más larga corresponde al lenguaje (o base de datos) más usado. El resto se dimensionan proporcionalmente. Si PHP tiene 8 usos y JavaScript tiene 4, la barra de PHP ocupa el 100% y la de JavaScript el 50%.

**¿Se incluyen los deprecated?**
No. Los desgloses de lenguajes y bases de datos solo consideran programas activos (`deprecated: false`). Los programas deprecados no distorsionan las estadísticas del inventario vivo.

---

## 4. Dashboard — Stats de antigüedad

Muestra cuántos programas activos (no deprecated) caen en cada tramo de tiempo, calculado a partir del campo `last_updated` y la fecha de hoy.

| Tramo | Criterio |
|-------|----------|
| Este mes | `last_updated` dentro del mes natural actual |
| 1–3 meses | Entre 31 y 90 días desde hoy |
| 3–6 meses | Entre 91 y 180 días desde hoy |
| 6–12 meses | Entre 181 y 365 días desde hoy |
| 1–2 años | Entre 366 y 730 días desde hoy |
| 2+ años | Más de 730 días desde hoy |

**Si un programa no tiene `last_updated`:** no entra en ningún tramo. El badge de fecha en la tabla mostrará "Sin fecha" en gris.

---

## 5. Tabla de programas

La tabla muestra todos los programas del vault (activos y, si el toggle está activado, también los deprecated).

### Buscador

El campo de búsqueda filtra simultáneamente por todas las columnas de texto: nombre, proyecto, tipo de aplicación, lenguajes, bases de datos, owner, criticidad, entorno PRO y versión. No distingue mayúsculas de minúsculas. El filtro se aplica en tiempo real mientras escribes.

### Filtros desplegables

Cada desplegable reduce la tabla a los programas que coinciden exactamente con el valor seleccionado. Los filtros se combinan entre sí: puedes filtrar por proyecto "PaymentGateway" y lenguaje "PHP" al mismo tiempo. Para quitar un filtro, selecciona la opción en blanco (primera opción del desplegable).

Filtros disponibles: Proyecto, Lenguaje, Base de datos, Tipo, Criticidad, Owner.

### Toggles

- **Deprecated:** por defecto la tabla oculta los programas deprecated. Al activar este toggle, los programas deprecated aparecen en la tabla (con su badge rojo).
- **Solo CI/CD:** cuando está activo, muestra únicamente los programas con `cicd: true`.

### Ordenar por columna

Haz clic en cualquier cabecera de columna para ordenar la tabla por ese campo en orden ascendente. Un segundo clic invierte el orden (descendente). Una flecha ↑ o ↓ en la cabecera indica la columna activa y el sentido del orden.

### Color de la columna "Última act."

El color del badge de fecha refleja cuánto tiempo lleva sin actualizarse el programa:

| Color | Criterio |
|-------|----------|
| 🟢 Verde | Menos de 30 días |
| 🟡 Amarillo-verde | 1–3 meses |
| 🟠 Naranja | 3–6 meses |
| 🔴 Rojo claro | 6 meses a 1 año |
| 🔴 Rojo intenso | Más de 1 año |
| ⬜ Gris | Sin fecha definida |

---

## 6. Gestión de deprecated

### Qué pasa cuando marcas un programa como deprecated

Cuando creas un programa con `deprecated: true` desde el formulario, el sistema lo guarda directamente en `[Proyecto]/⚠ DEPRECATED/nombre.md`. Si editas manualmente el frontmatter de un programa existente para poner `deprecated: true`, debes mover el archivo a esa subcarpeta tú mismo (clic derecho sobre el archivo en el panel lateral → Mover archivo).

### Cómo reactivar un programa deprecated

1. Abre el archivo del programa en modo edición.
2. Cambia `deprecated: true` a `deprecated: false` en el frontmatter.
3. Mueve el archivo manualmente desde `[Proyecto]/⚠ DEPRECATED/nombre.md` a `[Proyecto]/nombre.md` (clic derecho → Mover archivo).
4. El dashboard lo volverá a contar como activo en el próximo refresco.

### Visibilidad en la tabla

Los programas deprecated **no aparecen en los KPIs ni en los desgloses estadísticos**. Sí aparecen en la tabla si activas el toggle "Deprecated". En la tabla se identifican con el badge rojo **DEPRECATED** en su columna.

---

## 7. Comentarios en las notas

### Cómo añadir un comentario

1. Abre la nota del programa en modo lectura.
2. Si la nota incluye `![[_comment-btn]]`, verás el botón **＋ Añadir comentario**.
3. Pulsa el botón, escribe tu comentario y pulsa **Añadir**.

### Formato del comentario

Los comentarios se guardan al final del archivo con este formato:

```
> [!note] 2026-05-31
> Texto del comentario
```

Este es un callout de Obsidian que se renderiza visualmente como una nota destacada con la fecha.

### Permanencia

Los comentarios son **permanentes y forman parte del archivo**. No se pueden deshacer desde el modal. Si necesitas eliminar un comentario, hazlo manualmente en modo edición.

---

## 8. Criticidad

Define el impacto en el negocio si el programa falla o no está disponible.

| Nivel | Color | Criterio |
|-------|-------|----------|
| **critical** | 🔴 Rojo | Caída tiene impacto directo en negocio o clientes en minutos. No tiene sustituto operativo. |
| **high** | 🟠 Naranja | Impacto grave en pocas horas. Puede haber workaround pero es costoso o manual. |
| **medium** | 🟡 Amarillo | Impacto moderado. Existe workaround funcional que puede sostenerse días. |
| **low** | 🟢 Verde | Impacto mínimo. Herramienta interna, infrecuente o con alternativa inmediata. |

Usa `critical` con criterio: un inventario con demasiados "critical" pierde su utilidad para priorizar incidentes.

---

## 9. Entornos

- Se pueden definir hasta tres entornos por programa: `dev` (desarrollo), `pre` (preproducción) y `pro` (producción).
- Los valores pueden ser IPs (`192.168.1.10`) o nombres DNS (`payments.empresa.com`) indistintamente.
- En la tabla del dashboard solo aparece el entorno **PRO** para no saturar la vista. El detalle completo de los tres entornos está visible en cada nota individual.
- Todos los campos de entorno son opcionales, pero se recomienda siempre definir al menos `pro`.

---

## 10. Dependencias

- El campo `dependencies` contiene los nombres exactos (campo `name`) de otros programas del inventario de los que depende este.
- Permiten razonar sobre el **impacto en cadena**: si `api-pagos` falla, todos los programas que lo tienen como dependencia se verán afectados.
- Son referencias textuales, no links automáticos navegables. Para navegar entre notas relacionadas, usa los wikilinks `[[nombre]]` dentro del cuerpo de la nota.
- Si renombras un programa, actualiza manualmente las dependencias de los programas que lo referenciaban.
