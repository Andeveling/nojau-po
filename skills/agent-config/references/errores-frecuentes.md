# Errores frecuentes

## Tenant

```
Error: Sin match en companies para '<dato>' — no escribo sin tenant validado
```

Pega NIT exacto o el nombre de factura.

## INSERT de agent_configs

```
Error: agent_configs: INSERT prohibido (los paneles ya existen; usa UPDATE WHERE id = <n>)
```

Lee el `id` por `type` y actualiza.

## Panel legacy

```
Error: Bloqueado: agent_configs id=<n> type=onboarding no es panel
```

Solo `orchestrator|attraction|retention|activity|ticket`.

## tool_id

```
Error: tool_id prohibido en INSERT agent_instructions
```

Las tools no se asignan por SQL.

## Tag de sistema

```
Error: Bloqueado: id=<n> es tag de sistema (system_key=<clave>)
```

Ver `../conversation-tags/references/errores-frecuentes.md`.

## Sin WHERE id

```
Error: UPDATE exige WHERE id = <n>
```

Una fila, siempre por id numérico.
