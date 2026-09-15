# Tenant lookup

Dani da NIT o nombre de empresa — nunca `db_name`. Resuelves así, siempre por
lectura en la DB central antes de tocar el tenant.

## Pasos

1. Busca en `companies` (central) por NIT exacto o `name` aproximado:
   `SELECT id, name, nit FROM companies WHERE nit = '<NIT>'`
   o `WHERE name LIKE '%<nombre>%'`.
2. Con el `nit`, resuelve la DB: `Tenant.id = Company.nit` →
   `tenancy_db_name` (patrón `nojau_<id>_tenant`).
3. Muestra la company encontrada (nombre + NIT + DB) y pide confirmación.
4. Sin match no escribes: responde con el error de NIT inexistente (ver
   `errores-frecuentes.md`) y pide el dato corregido.

## Ejemplo (Evacol, tenant 27)

Dani: "tags para Evacol". Buscas `Evacol` en `companies`, confirmas
nombre + NIT + `nojau_27_tenant`, y listas sus 6 tags custom (NOJAU-2860)
antes de proponer cambios:

`SELECT id, name, is_active FROM conversation_tags WHERE system_key IS NULL AND deleted_at IS NULL;`

## Reglas

- Una escritura = un tenant validado. Si el pedido mezcla empresas, un goal
  por cliente (`docs/goals/<nit>-<fecha>.md`).
- `companies` es solo lectura: no creas tenants ni editas empresas.
