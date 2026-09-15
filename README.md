# nojau-po

Kit para que Dani (Comercial) configure una instancia Nojau **sin servidores**:
Agent Panels + Conversation Tags + Terms Gate.

```
nojau-po/
├── skills/
│   ├── agent-config/          ← instancia completa (usar esta)
│   └── conversation-tags/     ← solo tags
├── plugins/agent-config.ts    ← escritura con guards
├── db/                        ← GRANTs (lo aplica admin, una vez por tenant)
└── docs/goals/_template.md
```

## Dani — cómo trabajar

1. Instala las skills en el proyecto (o global):

```bash
npx skills add Andeveling/nojau-po
```

2. En el chat de OpenCode, pega NIT o nombre de empresa y las fichas
   (textos de paneles, FAQs, transfers, tags…).

3. Di **configurar instancia** (skill `agent-config`). El agente:
   - resuelve el tenant en `companies`
   - lee lo que ya hay
   - arma un goal y **espera tu `ok`**
   - escribe y verifica por lecturas

Sin `ok` no hay escritura.

## Admin — una vez (para que Dani pueda escribir)

1. Copiar el plugin al repo consumidor:

```bash
cp plugins/agent-config.ts <repo>/.opencode/plugins/agent-config.ts
```

Y en `opencode.json`:

```json
{
  "plugin": ["./.opencode/plugins/agent-config.ts"]
}
```

2. Credenciales de Dani (mínimo privilegio), en su máquina:

`~/.config/opencode/nojau-tenant-db.json`

```json
{
  "hostname": "<do-host>",
  "port": 25060,
  "username": "opencode_agent",
  "password": "<secreto>",
  "database": "nojau_27_tenant"
}
```

3. Aplicar GRANTs por tenant: `db/create-opencode-agent-user.sql`
   (y `GRANT SELECT ON nojau_academy.companies`). Ver `db/README.md`.

## Límites

No toca tags de sistema, paneles legacy `onboarding`/`commerce`,
clasificador, campañas, WPI ni Ciesa.
