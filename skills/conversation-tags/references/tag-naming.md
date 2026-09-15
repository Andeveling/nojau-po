# Tag naming

El `name` identifica la etiqueta en la bandeja humana y en el clasificador.
El CRUD solo recorta espacios (`NormalizeConversationTagNameAction`), así que
la convención la pones tú antes de escribir.

## Convención: snake_case en español

- Minúsculas, palabras con guion bajo: `reclamo_garantia`, `pedido_mayorista`.
- Corto (≤ 40 caracteres) y en palabras del cliente, no internas.
- Sin tildes ni eñes si el teclado de Dani las omite: prefiere `cotizacion`
  sobre `cotización` para que el filtro de la bandeja siempre matchee.

## Anti-ejemplos

| Mal | Por qué |
| --- | --- |
| `Reclamo Garantía` | Espacios y mayúsculas: dos fichas distintas para el mismo tag |
| `RECLAMO` | Mayúsculas: la collation es case-insensitive, colisiona con `reclamo` |
| `reclamo... urgente!!!` | Signos: imposibles de dictar por chat y de filtrar |
| `Nueva`, `Abandonada`, `Finalizada` | Reservados del sistema (`system_key`): el plugin los bloquea |
| `tag1`, `varios` | Genéricos: no dicen cuándo asignar el tag |

## Regla de duplicado

`name` es UNIQUE **incluyendo filas soft-deleted**: antes de proponer un
nombre, lee por `name` exacto en el tenant. Si existe aunque esté borrada o
inactiva, propón variante (`reclamo_garantia_2`) o reactiva la existente con
`UPDATE is_active = 1`.
