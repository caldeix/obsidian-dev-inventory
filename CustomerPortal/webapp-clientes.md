---
name: webapp-clientes
project: CustomerPortal
app_type: webapp
languages: [JavaScript, Vue]
databases: [MySQL]
owner: ana.lopez
criticality: high
environments:
  dev: 192.168.1.30
  pre: 192.168.1.31
  pro: clientes.empresa.com
dependencies: [api-pagos, lib-autenticacion]
last_updated: 2026-03-22
deprecated: false
cicd: true
repo_url: https://bitbucket.org/empresa/webapp-clientes
version: 2.0.4
description: Portal web de autoservicio para clientes. SPA en Vue 3 + Vite.
created: 2024-09-01
---

# webapp-clientes

Portal de autoservicio para clientes finales. Permite consultar historial de transacciones, descargar facturas y gestionar métodos de pago.

Construido como SPA con Vue 3 + Vite. Se comunica con [[api-pagos]] para todas las operaciones financieras y usa [[lib-autenticacion]] para la sesión del usuario.

## Entornos

| Entorno | Host |
|---------|------|
| DEV | 192.168.1.30 |
| PRE | 192.168.1.31 |
| PRO | clientes.empresa.com |
