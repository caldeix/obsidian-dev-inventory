---
name: lib-autenticacion
project: Infrastructure
app_type: library
languages: [PHP, JavaScript]
databases: []
owner: carlos.martin
criticality: medium
environments:
  pro: npm.empresa.com
dependencies: []
last_updated: 2025-11-05
deprecated: false
cicd: false
repo_url: https://bitbucket.org/empresa/lib-autenticacion
version: 2.1.0
description: Librería compartida de autenticación JWT y control de acceso RBAC.
created: 2023-05-10
---

# lib-autenticacion

Librería interna que centraliza la lógica de autenticación JWT y autorización basada en roles (RBAC). Publicada en el registro npm privado de la empresa.

Usada por [[api-pagos]] y [[webapp-clientes]] como dependencia directa.

## Entornos

| Entorno | Host |
|---------|------|
| PRO | npm.empresa.com |
