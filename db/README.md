# Grants del usuario opencode (`opencode_agent`)

Mínimo privilegio para que Comercial configure **una instancia completa**
(Agent Panels + Conversation Tags + Terms Gate) sin servidores.
Template: `create-opencode-agent-user.sql`. DigitalOcean exige GRANT por DB.

| Tabla | SELECT | INSERT | UPDATE | DELETE | Notas |
| --- | --- | --- | --- | --- | --- |
| `agent_configs` | sí | no | sí | no | Solo paneles. `type`/`tenant_id` bloqueados en plugin |
| `agent_instructions` | sí | sí | sí | sí | `tool_id` prohibido en plugin |
| `agent_activation_cases` | sí | sí | sí | sí | Hijo de panel |
| `agent_transfer_cases` | sí | sí | sí | sí | Hijo de panel |
| `agent_faqs` | sí | sí | sí | sí | Hijo de panel |
| `agent_button_rules` | sí | sí | sí | sí | Hijo de panel |
| `agent_legal_terms` | sí | sí | sí | sí | Terms Gate |
| `agent_tools` | sí | no | no | no | Catálogo |
| `conversation_tags` | sí | sí | sí | no | Desactivar = `is_active=0`. `system_key` bloqueado |
| `companies` (central) | sí | no | no | no | Tenant check |

Verificación: `SHOW GRANTS FOR 'opencode_agent'@'%'`.
