---
name: ask-nojau-po
description: "Router de instancia Nojau: qué skill usar y qué hacer si algo falla (sin match de tenant, guard del plugin, tag de sistema, duplicado, sin ok, credenciales, GRANT). Trigger: 'qué skill uso', 'algo falló', 'error al escribir', 'no escribe', 'sin match', 'tag de sistema', 'plugin rechazó', '/ask-nojau-po'."
license: Apache-2.0
metadata:
  author: andeveling
  version: "1.0"
model: sonnet
effort: low
allowed-tools: Read
---

# Ask nojau-po

No recuerdas cada skill ni cada recovery. Esta es la **única puerta**.
Nombra el camino; no reimplementes el trabajo aquí.

## Flujo principal: ficha → instancia

Dani pega NIT/nombre + fichas. Tú configuras el tenant **sin servidores**.

1. Identificar tenant (`companies`) y confirmar.
2. Leer estado (paneles + tags + terms).
3. Goal → **`ok` de Dani**.
4. Escribir con `nojau_agent_write` (una fila, `WHERE id=`).
5. Verificar por lecturas.

- Instancia completa → `../agent-config/SKILL.md`
- Solo tags → `../conversation-tags/SKILL.md`

Sin `ok` no hay escritura. Un tenant por goal.

## On-ramps: algo se rompió

Elige **una** rama. Muestra a Dani el error copiable y la solución.
Detalle de copy: `../agent-config/references/errores-frecuentes.md` y
`../conversation-tags/references/errores-frecuentes.md`.

| Señal | Qué hacer |
| --- | --- |
| Sin match en `companies` | Pide NIT exacto o nombre de factura. No adivines `db_name`. No escribas. |
| Dani no dio `ok` | Enseña el goal. Espera. No escribas. |
| Ficha incompleta | Pide **solo** el campo que falta. Conserva lo ya dado. |
| Guard: INSERT `agent_configs` | Los paneles ya existen. `SELECT id, type` y `UPDATE WHERE id=`. |
| Guard: type `onboarding`/`commerce` | Panel legacy. Solo los 5 types de `references/paneles.md`. |
| Guard: `tool_id` | Omite `tool_id`. Las tools no se asignan por SQL. |
| Guard: `system_key` / tag Nueva, Abandonada, Finalizada | Crea un tag **custom**. No toques el de sistema. |
| Guard: UPDATE sin `WHERE id=` | Relee el id. Una fila. |
| Duplicado de tag (UNIQUE, incluye soft-deleted) | Variante `_2` o reactivar (`is_active=1`). |
| `assignment_case` > 500 | Recorta. Reintenta. |
| `Sin credenciales` / plugin no carga | **Admin**, no Dani. Ver Escalada. |
| Plugin failed / `Cannot find package '@opencode/plugin'` | El `.ts` no debe importar `@opencode/plugin`. Exporta `{ id, setup }` (como `engram.ts`). No listes un archivo en `plugin`/`plugins` del jsonc: V2 carga `~/.config/opencode/plugins/*.ts` solo. |
| `GRANT` / `command denied` | **Admin**: grants en `db/`. No pidas a Dani un password. |
| Escribió en el tenant equivocado | Para. Confirma company otra vez. No “corrijas” el otro tenant. |
| Quiere campañas, WPI, Ciesa, clasificador | Fuera de scope. Dilo y sigue con paneles/tags/terms. |

## Escalada (humano admin, no Dani)

Solo si el plugin no puede leer/escribir **después** de tenant confirmado:

1. Credenciales: `~/.config/opencode/nojau-agent-db.json` (lo deja admin).
2. Plugin: `~/.config/opencode/plugins/agent-config.ts` (lo pone `install.sh`).
3. GRANTs por tenant: `db/create-opencode-agent-user.sql`.

A Dani: “esto lo resuelve admin; tú no tienes que configurar nada”.
No le pidas host, password ni SQL de GRANT.

Reinstalar (admin o Dani, una línea):

```bash
curl -fsSL https://raw.githubusercontent.com/Andeveling/nojau-po/main/install.sh | bash
```

## Skills de este kit

| Quiero… | Skill |
| --- | --- |
| Qué hacer / algo falló | **esta** (`ask-nojau-po`) |
| Configurar la instancia | `agent-config` |
| Solo etiquetas de bandeja | `conversation-tags` |

## Hecho

Dani tiene un siguiente paso concreto (pegar un campo, decir `ok`, o
esperar a admin) y tú **no escribiste** sin tenant validado y sin `ok`.
