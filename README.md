![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)
![Date](https://img.shields.io/badge/date-2026--05--31-green?style=flat-square)
![Author](https://img.shields.io/badge/author-caldeix-orange?style=flat-square)
![Entorno](https://img.shields.io/badge/entorno-Obsidian-7C3AED?style=flat-square&logo=obsidian&logoColor=white)

# OBSIDIAN_DEV_INVENTORY

> Vault de Obsidian para llevar el inventario centralizado del software de empresa: aplicaciones, APIs, batches y librerías, con dashboard interactivo, KPIs y búsqueda en tiempo real.

---

## Screenshots

![Dashboard — vista general](img/dashboard1.png)

![Dashboard — tabla de programas](img/dashboard2.png)

---

## Configuración

1. Abre el vault en Obsidian (`Archivo → Abrir vault → selecciona esta carpeta`).
2. Instala los plugins de comunidad requeridos:
   - **Dataview** — activa *JavaScript Queries* en sus ajustes.
   - **Templater** — establece esta carpeta como carpeta de plantillas.
3. Ve a `Ajustes → Apariencia → Fragmentos CSS` y activa **devinventory**.
4. Abre [`_SETUP.md`](_SETUP.md) para la guía completa de instalación paso a paso.

## Uso

- El dashboard principal es [`index.md`](index.md) — ábrelo en modo lectura.
- Pulsa **＋ Nuevo programa** para registrar una nueva aplicación mediante formulario.
- Usa el buscador y los filtros desplegables para localizar cualquier programa.
- Cada programa tiene su propia nota con metadatos YAML, entornos (DEV / PRE / PRO) y comentarios.
- Consulta [`_GUIA_DATOS.md`](_GUIA_DATOS.md) para la referencia completa de todos los campos.

---

## Documentación técnica

Para entender cómo está construido el vault a nivel de código — estructura DataviewJS, lógica del dashboard, sistema de plantillas y CSS — consulta la guía técnica:

📄 [`TECHNICAL.md`](TECHNICAL.md)

---

<div align="center">

Desarrollado por [caldev](https://github.com/caldeix) ❤️ · [GitHub](https://github.com/caldeix) · [ME](https://caldeix.github.io/me/)

</div>
