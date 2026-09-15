# nojau-po

Kit para que **Dani** configure instancias Nojau (paneles, tags, Terms Gate)
sin servidores y sin tocar config.

## Dani (único paso)

```bash
curl -fsSL https://raw.githubusercontent.com/Andeveling/nojau-po/main/install.sh | bash
```

Abre OpenCode y escribe: **configurar instancia**.

Pega NIT o nombre + las fichas. El agente arma el goal y espera tu **`ok`**.
Sin `ok` no escribe.

Si algo falla, el agente usa **ask-nojau-po**.

## Qué instala (sin preguntas)

- Skills en `~/.config/opencode/skills/` y `~/.agents/skills/`
- Plugin en `~/.config/opencode/plugins/agent-config.ts`

OpenCode V2 **carga solo** los `.ts` de esa carpeta. No hace falta
`opencode.json` / `plugin` / `plugins`. Un archivo `.ts` en el jsonc
rompe el loader (`configured plugin path must be a directory` y
`Cannot find package '@opencode/plugin'`).

## Admin (no Dani)

1. GRANTs por tenant: `db/create-opencode-agent-user.sql`
2. Dejar `~/.config/opencode/nojau-agent-db.json` en la laptop de Dani
   (usuario `opencode_agent`). Ese archivo no vive en este repo.
