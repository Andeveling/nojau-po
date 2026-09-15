# nojau-po

Dani configura instancias Nojau (paneles, tags, Terms Gate) **sin servidores
y sin tocar config**.

## Dani

```bash
curl -fsSL https://raw.githubusercontent.com/Andeveling/nojau-po/main/install.sh | bash
```

Luego abre OpenCode y escribe: **configurar instancia**.

Pega NIT o nombre + las fichas. El agente arma el goal y espera tu **`ok`**.
Sin `ok` no escribe.

(No uses un dominio tipo `dev.meta.ai`: el script vive en este repo de GitHub.)

## Qué instala (sin preguntas)

- Skills `agent-config` y `conversation-tags` en OpenCode
- Plugin `agent-config.ts` en `~/.config/opencode/plugins/`

Las credenciales de DB **no las pone Dani**. El admin las deja una vez en
`~/.config/opencode/nojau-agent-db.json` en su máquina.

## Admin (no Dani)

1. GRANTs por tenant: `db/create-opencode-agent-user.sql`
2. Dejar `~/.config/opencode/nojau-agent-db.json` en la laptop de Dani
   (usuario `opencode_agent`, sin secretos en este repo).
