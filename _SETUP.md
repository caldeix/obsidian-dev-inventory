# Configuración del vault — DEV_INVENTORY

Manual de configuración inicial para que el sistema funcione correctamente en Obsidian.

---

## 1. Requisitos previos

**Versión mínima de Obsidian recomendada:** 1.5.0 o superior.

### Plugins necesarios

#### Dataview

1. Ir a **Ajustes → Plugins de la comunidad → Examinar**.
2. Buscar "Dataview" e instalar.
3. Activar el plugin con el interruptor.
4. Abrir **Ajustes → Dataview** y verificar estas opciones:
   - **Enable JavaScript Queries** → activado ✓
   - **Enable Inline Queries** → activado ✓
   - **Automatic View Refreshing** → activado ✓ (recomendado)

> Sin "Enable JavaScript Queries" el dashboard mostrará el código fuente en lugar de renderizarse.

#### Templater

1. Ir a **Ajustes → Plugins de la comunidad → Examinar**.
2. Buscar "Templater" e instalar y activar.
3. Abrir **Ajustes → Templater**:
   - **Template folder location** → dejar en blanco o apuntar a la raíz del vault.
   - **Trigger Templater on new file creation** → opcional, puede desactivarse.

---

## 2. Activar el snippet CSS

El snippet `devinventory.css` ya está colocado en `.obsidian/snippets/`. Solo hay que activarlo:

1. Ir a **Ajustes → Apariencia**.
2. Bajar hasta la sección **Fragmentos CSS**.
3. Pulsar el botón de recarga (icono circular) si el snippet no aparece.
4. Activar el interruptor junto a **devinventory**.

**Qué hace el snippet:** aplica el diseño visual del inventario — tarjetas KPI con borde de color, barras de lenguajes, badges de criticidad, estilos de la tabla con filas resaltables y cabeceras ordenables, y oculta el título inline en las notas del inventario para un aspecto más limpio.

---

## 3. Configurar el modo de vista

DataviewJS solo renderiza en **modo lectura**. Para que el dashboard se vea correctamente al abrir el vault:

1. Ir a **Ajustes → Editor**.
2. Buscar **Default view for new tabs** y seleccionar **Reading view** (Vista de lectura).

Alternativamente, cuando estés en `index.md`, pulsa `Ctrl+E` (Windows/Linux) o `Cmd+E` (Mac) para alternar entre edición y lectura.

---

## 4. Primer uso

1. Abre `index.md` desde el panel lateral (aparece en la raíz del vault).
2. Asegúrate de estar en **modo lectura** (`Ctrl+E` si ves el código fuente).
3. El dashboard se renderizará automáticamente con los datos de los programas de ejemplo incluidos.
4. Para crear tu primer programa, pulsa el botón **＋ Nuevo programa** en la parte superior del dashboard, o usa el comando global con `Ctrl+P` → buscar `DEV: ⚡ Nueva entrada`.

**Organización automática de carpetas:**
Al guardar un nuevo programa, el sistema crea automáticamente la carpeta del proyecto si no existe. Los programas marcados como deprecated se guardan en `[Proyecto]/⚠ DEPRECATED/`.

---

## 5. Flujo de trabajo recomendado

### Añadir un programa nuevo

1. Pulsar **＋ Nuevo programa** en el dashboard, o `Ctrl+P` → `DEV: ⚡ Nueva entrada`.
2. Rellenar el formulario (nombre y proyecto son obligatorios).
3. Pulsar **Guardar**. La nota se crea automáticamente en `[Proyecto]/nombre.md`.
4. El dashboard se refresca automáticamente gracias al refresco de Dataview.

### Marcar un programa como deprecated

1. Abrir la nota del programa.
2. Cambiar a modo edición (`Ctrl+E`).
3. En el frontmatter, editar: `deprecated: true`.
4. Mover el archivo manualmente a `[Proyecto]/⚠ DEPRECATED/nombre.md` desde el panel lateral (clic derecho → Mover archivo).

### Añadir comentarios a una nota

1. Abre la nota del programa en **modo lectura**.
2. El bloque de `_comment-btn.md` puede incrustarse con `![[_comment-btn]]`.
3. Pulsa el botón **＋ Añadir comentario**.
4. Escribe el texto y pulsa **Añadir**. Se añade al final del archivo como callout con la fecha de hoy.

### Buscar en la tabla del dashboard

- El campo de búsqueda filtra simultáneamente en nombre, proyecto, lenguajes, bases de datos, owner, tipo y entorno PRO.
- Usa los desplegables para filtrar por un valor específico de proyecto, lenguaje, base de datos, tipo, criticidad u owner.
- El botón **Deprecated** muestra también los programas deprecados en la tabla.
- El botón **Solo CI/CD** filtra para mostrar únicamente programas con CI/CD activo.
- Haz clic en cualquier cabecera de columna para ordenar (segundo clic invierte el orden).

---

## 6. Solución de problemas comunes

### El dashboard muestra el código fuente en lugar de renderizarse

**Causa:** estás en modo edición.
**Solución:** pulsa `Ctrl+E` (o `Cmd+E` en Mac) para cambiar a modo lectura.

### Dataview no encuentra las notas / el dashboard aparece vacío

**Causa:** el plugin Dataview no tiene JavaScript habilitado.
**Solución:**
1. Ir a **Ajustes → Dataview**.
2. Activar **Enable JavaScript Queries**.
3. Recargar Obsidian (`Ctrl+R`).

### El snippet CSS no aplica (sin estilos visuales)

**Causa:** el snippet no está activado en Ajustes.
**Solución:**
1. Ir a **Ajustes → Apariencia → Fragmentos CSS**.
2. Pulsar el icono de recarga para que Obsidian detecte el archivo.
3. Activar el interruptor junto a **devinventory**.

### El modal no abre al pulsar el botón

**Causa:** estás en modo edición, no en modo lectura.
**Solución:** cambiar a modo lectura con `Ctrl+E`. Los bloques DataviewJS solo son interactivos en modo lectura.

### Error "_lib.js no encontrado" en el dashboard

**Causa:** el archivo `_lib.js` no está en la raíz del vault o fue movido.
**Solución:** verificar que `_lib.js` existe en `M:\DEV_INVENTORY\_lib.js`. Si fue borrado, restaurarlo desde el historial de versiones de Obsidian o desde el control de versiones del proyecto.

### Las fechas muestran "Sin fecha" aunque el frontmatter tenga valor

**Causa:** formato de fecha incorrecto en el frontmatter.
**Solución:** asegurarse de que el campo `last_updated` usa el formato `YYYY-MM-DD` (por ejemplo `2026-05-01`). No usar formatos con hora o zona horaria.
