---
name: conversation-tags
description: "Configura Conversation Tags de cualquier tenant con Dani (Comercial, sin servidores): ficha por tag, tenant validado contra companies, goal por cliente aprobado con ok, escritura con guards y verificación por lecturas. Trigger: 'crear tags', 'configurar etiquetas', 'nuevo conversation tag', 'tags de Evacol', '/conversation-tags'."
license: Apache-2.0
metadata:
  author: andeveling
  version: "1.0"
model: sonnet
effort: medium
allowed-tools: Read, Glob, Grep
---

# Conversation Tags

Módulo de **tags** de la skill `agent-config` (instancia completa: paneles +
tags + Terms Gate). Aquí solo `conversation_tags`.
Si algo falla: `../ask-nojau-po/SKILL.md`.

Configuras etiquetas de conversación en el tenant que Dani te pida, sin
código ni servidores. Escribes solo con `nojau_agent_write` y solo después
del `ok` al goal. Sin `ok` no hay escritura.

## Ficha de entrada (una por tag, pegada en el chat)

Dani pega texto o tabla simple con: NIT o nombre de empresa, `name`
borrador, `assignment_case` borrador y aprobador. Si falta un campo, pide
solo ese campo — no reinterrogues lo ya dado.

## Checklist (5 pasos, en orden)

### 1. Identificar tenant

Resuelve NIT o nombre contra `companies` (central) y muestra la company
encontrada para confirmar. Sin match no escribes. Detalle en
`references/tenant-lookup.md`.

### 2. Nombrar tag

Normaliza el `name` según `references/tag-naming.md` (snake_case,
anti-ejemplos). Verifica duplicado por lectura **incluyendo borradas**: el
UNIQUE de `name` abarca soft-deleted, así que un nombre reutilizado falla
aunque no se vea en la bandeja.

### 3. Redactar `assignment_case`

Máximo 500 caracteres, en palabras del cliente. Arma el goal del cliente en
`docs/goals/<nit>-<fecha>.md` (plantilla en `assets/goal-template.md`) con
objetivo, fichas, config DB exacta, verificación y fuera de scope. **Gate:
sin `ok` de Dani al goal, no escribes.**

### 4. Activar

Con el `ok`, ejecuta el `INSERT` (o `UPDATE is_active = 0/1`) por tag en la
tenant DB validada. Nunca menciones `system_key` ni `deleted_at`: el plugin
los prohíbe y los tags de sistema (`Nueva`, `Abandonada`, `Finalizada`) están
bloqueados. Desactivar es `UPDATE`, nunca DELETE físico.

### 5. Verificar en bandeja

Verifica **por lecturas**: `SELECT` del tag creado/ajustado y listado de tags
custom del tenant. Reporta qué quedó configurado y dónde verificarlo en la
bandeja humana. Si algo falla, responde con el error copiable de
`references/errores-frecuentes.md` y su solución.

## References

- `references/tag-naming.md` — snake_case y anti-ejemplos.
- `references/tenant-lookup.md` — NIT/nombre contra `companies`, ejemplo
  Evacol tenant 27.
- `references/errores-frecuentes.md` — duplicado (incluye soft-deleted),
  >500 chars, tag de sistema, NIT inexistente.

## Límites

- **Sin `ok` de Dani no hay escritura.** El goal existe para eso.
- **Sistema intocable:** `Nueva`, `Abandonada`, `Finalizada` no se editan,
  desactivan ni borran.
- **Un tenant por escritura:** cada tag va solo a la DB validada en el paso 1.
- **No creas tenants ni tocas `companies`** (solo lectura).
- **No reentrenas el clasificador** ni tocas campañas, WPI o endpoints Ciesa.
