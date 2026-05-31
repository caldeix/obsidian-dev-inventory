---
name: batch-conciliacion
project: PaymentGateway
app_type: batch
languages: [PHP]
databases: [MySQL]
owner: carlos.martin
criticality: high
environments:
  dev: 192.168.1.10
  pre: 192.168.1.20
  pro: payments.empresa.com
dependencies: [api-pagos, lib-autenticacion]
last_updated: 2026-04-10
deprecated: false
cicd: true
repo_url: https://bitbucket.org/empresa/batch-conciliacion
version: 1.5.0
description: Proceso batch nocturno de conciliación bancaria. Ejecuta a las 02:00 UTC.
created: 2024-06-15
---

# batch-conciliacion

Proceso batch programado que concilia las transacciones del día contra el extracto bancario. Se ejecuta cada noche a las 02:00 UTC mediante cron en el servidor de producción.

Consume los endpoints de [[api-pagos]] para obtener el listado de transacciones del día.

## Entornos

| Entorno | Host |
|---------|------|
| DEV | 192.168.1.10 |
| PRE | 192.168.1.20 |
| PRO | payments.empresa.com |
