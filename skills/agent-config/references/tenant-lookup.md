# Tenant lookup

Dani da NIT o nombre — nunca `db_name`. Siempre lectura en la DB central
antes de tocar el tenant.

1. `SELECT id, name, nit FROM companies WHERE nit = '<NIT>'`
   o `WHERE name LIKE '%<nombre>%'`.
2. `Tenant.id = Company.nit` → `tenancy_db_name` (`nojau_<id>_tenant`).
3. Muestra nombre + NIT + DB y pide confirmación.
4. Sin match no escribas.

Ejemplo: Evacol → confirma `nojau_27_tenant` (NOJAU-2860).
