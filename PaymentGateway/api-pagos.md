---
name: api-pagos
project: PaymentGateway
app_type: api
languages: [PHP, Java]
databases: [MySQL, Redis]
owner: carlos.martin
criticality: critical
environments:
  dev: 192.168.1.10
  pre: 192.168.1.20
  pro: payments.empresa.com
dependencies: [lib-autenticacion]
last_updated: 2026-05-15
deprecated: false
cicd: true
repo_url: https://bitbucket.org/empresa/api-pagos
version: 3.2.1
description: API REST de procesamiento de pagos y transacciones en tiempo real.
created: 2024-03-01
---



# api-pagos

API REST principal de procesamiento de pagos. Expone endpoints para autorización, captura y reversión de transacciones. Integrada con pasarela de pago externa vía webhooks.

Depende de [[lib-autenticacion]] para la validación de tokens JWT en cada petición.

## Entornos

| Entorno | Host |
|---------|------|
| DEV | 192.168.1.10 |
| PRE | 192.168.1.20 |
| PRO | payments.empresa.com |
