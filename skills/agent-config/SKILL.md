---
name: agent-config
description: "Configura una instancia completa para Dani (Comercial, sin servidores): Agent Panels (orquestador + 4 subagentes), Conversation Tags y Terms Gate. Ficha por pieza, tenant validado contra companies, goal aprobado con ok, escritura con guards. Trigger: 'configurar instancia', 'configurar agente', 'paneles Evacol', 'FAQs del orquestador', '/agent-config'."
license: Apache-2.0
metadata:
  author: andeveling
  version: "1.0"
model: sonnet
effort: medium
allowed-tools: Read, Glob, Grep
---

# Agent config (instancia completa)

Configuras **todo** lo que Dani necesita en un tenant, sin código ni
servidores. Escribes solo con `nojau_agent_write` y solo después del `ok`
al goal. Sin `ok` no hay escritura.

Tags en detalle: `../conversation-tags/SKILL.md` (mismo plugin).
Si algo falla: `../ask-nojau-po/SKILL.md` (router: no improvises recovery).

## Qué cubre

| Pieza | Tablas | Operación típica |
| --- | --- | --- |
| Paneles | `agent_configs` | UPDATE `instructions` / `name` / `response_size` / `is_active` |
| Instrucciones | `agent_instructions` | INSERT/UPDATE/DELETE (`when_text`, `type`, `rule`, `why_useful`) |
| Activación | `agent_activation_cases` | INSERT/UPDATE/DELETE `description` |
| Transfer | `agent_transfer_cases` | INSERT/UPDATE/DELETE `description` |
| FAQs | `agent_faqs` | INSERT/UPDATE/DELETE `question`+`answer` |
| Botones | `agent_button_rules` | INSERT/UPDATE/DELETE `button_type`+`rule` |
| Terms Gate | `agent_legal_terms` | `document_url`, `gate_mode`, `gated_tools` |
| Tags | `conversation_tags` | ver skill conversation-tags |

Tipos de panel: `orchestrator`, `attraction`, `retention`, `activity`,
`ticket`. Legacy `onboarding`/`commerce`: no se tocan.

## Ficha de entrada

Dani pega texto o tabla. Campos comunes: NIT o nombre, aprobador, y luego
por pieza (panel + tipo de fila + textos). Si falta un campo, pide solo ese.

## Checklist

### 1. Identificar tenant

NIT o nombre contra `companies`. Sin match no escribas.
`references/tenant-lookup.md`.

### 2. Leer estado actual

```
SELECT id, type, name, is_active, response_size FROM agent_configs
  WHERE type IN ('orchestrator','attraction','retention','activity','ticket');
```

Luego hijos por `agent_config_id`, tags custom, y `agent_legal_terms`.
Muestra el mapa a Dani antes de proponer cambios.

### 3. Redactar fichas + goal

Un goal `docs/goals/<nit>-<fecha>.md` (plantilla `assets/goal-template.md`)
con objetivo, fichas, SQL exacto por tabla, verificación, fuera de scope.
**Gate: sin `ok` no escribas.**

Detalle de paneles: `references/paneles.md`.
Detalle de tags: `../conversation-tags/references/tag-naming.md`.

### 4. Escribir (orden)

1. `UPDATE agent_configs` (nunca INSERT de configs).
2. Hijos: INSERT/UPDATE/DELETE con `agent_config_id` del panel confirmado.
3. Tags (skill conversation-tags).
4. Terms Gate.

Una fila por sentencia. Nunca `tool_id` en instrucciones. Nunca
`system_key` en tags. Nunca `type`/`tenant_id` en configs.

### 5. Verificar por lecturas

Relee cada fila tocada y el listado del panel. Reporta qué cambió y dónde
verlo en `/agents` y en la bandeja. Errores: `references/errores-frecuentes.md`.

## Límites

- Sin `ok` de Dani no hay escritura.
- Un tenant por goal.
- No creas tenants ni tocas `companies`.
- No reentrenas el clasificador, no campañas, no WPI, no Ciesa.
- PDFs de instrucciones / legal: CloudStorage o URL; no subas archivos por SQL.
