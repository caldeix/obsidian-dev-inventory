---
name: webapp-legacy
project: CustomerPortal
app_type: webapp
languages: [PHP, JavaScript]
databases: [MySQL]
owner: ana.lopez
criticality: low
environments:
  pro: legacy.empresa.com
dependencies: []
last_updated: 2023-06-30
deprecated: true
cicd: false
repo_url: https://bitbucket.org/empresa/webapp-legacy
version: 1.2.0
description: Portal web heredado, reemplazado por webapp-clientes en septiembre 2024.
created: 2020-03-01
---

# webapp-legacy

Portal web original del sistema. Desarrollado en PHP puro con jQuery. **Deprecado en septiembre 2024**, sustituido por [[webapp-clientes]].

El servidor de `legacy.empresa.com` se mantiene activo en modo solo-lectura durante el período de transición. Fecha prevista de baja definitiva: Q3 2026.
