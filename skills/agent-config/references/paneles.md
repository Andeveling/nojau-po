# Paneles (`agent_configs`)

Cinco filas por tenant, sembradas. **Nunca INSERT ni DELETE** de
`agent_configs`. Resuelve el `id` por `type` y haz UPDATE.

| type | Uso | Hijos típicos |
| --- | --- | --- |
| `orchestrator` | Enruta, FAQs globales, `response_size`, `name` | instructions (type `communication`), faqs, legal terms (tenant-wide) |
| `attraction` | Captación | instructions, activation, transfer, faqs, button_rules |
| `retention` | Fidelización | igual |
| `activity` | Actividad | igual |
| `ticket` | Ticket / pedido | igual |

`description` de la UI = columna `instructions`.
`responseSize` = `response_size` (`short`/`medium`/`long`), solo orquestador.

## Instrucciones

Columnas: `when_text`, `type`
(`business|behavior|communication|file_sharing|complaints|privacy_data`),
`rule`, `why_useful`. En orquestador el CRUD fuerza `communication`.
`tool_id` está prohibido.

## Activación / transfer

Una `description` por fila. Cortas, en palabras del cliente.

## FAQs

`question` + `answer`. Globales viven en el orquestador.

## Botones

`button_type` (catálogo de `PromptButtons`) + `rule`.

## Terms Gate

Tabla `agent_legal_terms` (no cuelga de un panel): `document_url`,
`gate_mode` (`strict`/`flexible`), `gated_tools` JSON.
