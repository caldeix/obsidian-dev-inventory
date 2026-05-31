---
name: batch-reportes
project: Reports
app_type: batch
languages: [PHP]
databases: [MySQL, PostgreSQL]
owner: ana.lopez
criticality: low
environments:
  pro: reports.empresa.com
dependencies: []
last_updated: 2024-01-20
deprecated: false
cicd: false
repo_url: https://bitbucket.org/empresa/batch-reportes
version: 1.0.2
description: Generación mensual de informes de actividad para el equipo de negocio.
created: 2023-01-15
---

# batch-reportes

Genera informes mensuales en PDF y CSV con métricas de actividad de la plataforma. Lee de MySQL (transacciones) y PostgreSQL (datos analíticos del data warehouse).

No tiene CI/CD — los despliegues son manuales vía SSH. Pendiente de migrar al pipeline de Jenkins.

## Entornos

| Entorno | Host |
|---------|------|
| PRO | reports.empresa.com |
