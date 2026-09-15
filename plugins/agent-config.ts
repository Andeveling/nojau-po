import { Plugin } from "@opencode/plugin"
import { tool } from "@opencode-ai/plugin"
import { SQL } from "bun"
import { homedir } from "os"

// Configuración de instancia para Dani (Comercial, sin servidores).
// Costura única: guards espejo del CRUD de Agent Panels + Conversation Tags.
// Sin endpoints nuevos. Una DB por llamada, cualquier tenant.

const DEFAULT_TENANT_DB = process.env.NOJAU_DB_DATABASE ?? "nojau_36_tenant"
const CENTRAL_DB = process.env.NOJAU_DB_CENTRAL ?? "nojau_academy"
const CREDS_DIR = `${homedir()}/.config/opencode`
const CREDS_FILES = [
  `${CREDS_DIR}/nojau-agent-db.json`,
  `${CREDS_DIR}/nojau-tenant-db.json`,
]
const DB_NAME = /^[A-Za-z0-9_]+$/

export const PANEL_TYPES = [
  "orchestrator",
  "attraction",
  "retention",
  "activity",
  "ticket",
] as const

const CHILD_TABLES = [
  "agent_instructions",
  "agent_activation_cases",
  "agent_transfer_cases",
  "agent_faqs",
  "agent_button_rules",
] as const

export const READ_TABLES = [
  "companies",
  "conversation_tags",
  "agent_configs",
  "agent_instructions",
  "agent_activation_cases",
  "agent_transfer_cases",
  "agent_faqs",
  "agent_button_rules",
  "agent_legal_terms",
  "agent_tools",
] as const

export const WRITE_TABLES = [
  "conversation_tags",
  "agent_configs",
  "agent_instructions",
  "agent_activation_cases",
  "agent_transfer_cases",
  "agent_faqs",
  "agent_button_rules",
  "agent_legal_terms",
] as const

type WriteSpec = {
  insertRequired: string[]
  insertForbidden: string[]
  updateForbidden: string[]
  allowInsert: boolean
  allowDelete: boolean
}

const WRITE_SPEC: Record<(typeof WRITE_TABLES)[number], WriteSpec> = {
  conversation_tags: {
    insertRequired: ["name", "assignment_case"],
    insertForbidden: ["system_key", "deleted_at"],
    updateForbidden: ["system_key", "deleted_at"],
    allowInsert: true,
    allowDelete: false,
  },
  agent_configs: {
    insertRequired: [],
    insertForbidden: ["type", "tenant_id"],
    updateForbidden: ["type", "tenant_id"],
    allowInsert: false,
    allowDelete: false,
  },
  agent_instructions: {
    insertRequired: ["agent_config_id", "when_text", "type", "rule", "why_useful"],
    insertForbidden: ["tool_id"],
    updateForbidden: ["tool_id", "agent_config_id"],
    allowInsert: true,
    allowDelete: true,
  },
  agent_activation_cases: {
    insertRequired: ["agent_config_id", "description"],
    insertForbidden: [],
    updateForbidden: ["agent_config_id"],
    allowInsert: true,
    allowDelete: true,
  },
  agent_transfer_cases: {
    insertRequired: ["agent_config_id", "description"],
    insertForbidden: [],
    updateForbidden: ["agent_config_id"],
    allowInsert: true,
    allowDelete: true,
  },
  agent_faqs: {
    insertRequired: ["agent_config_id", "question", "answer"],
    insertForbidden: [],
    updateForbidden: ["agent_config_id"],
    allowInsert: true,
    allowDelete: true,
  },
  agent_button_rules: {
    insertRequired: ["agent_config_id", "button_type", "rule"],
    insertForbidden: [],
    updateForbidden: ["agent_config_id"],
    allowInsert: true,
    allowDelete: true,
  },
  agent_legal_terms: {
    insertRequired: [],
    insertForbidden: [],
    updateForbidden: [],
    allowInsert: true,
    allowDelete: true,
  },
}

export const TABLE_DESCRIPTIONS: Record<string, string> = {
  companies:
    "Solo lectura central: valida tenant por NIT o nombre. Sin escritura.",
  conversation_tags:
    "Tags de bandeja. INSERT name+assignment_case, sin system_key. UPDATE/DELETE WHERE id= y system_key NULL. Desactivar = is_active=0.",
  agent_configs:
    "Paneles (orchestrator/attraction/retention/activity/ticket). Solo UPDATE WHERE id=. Prohibido INSERT/DELETE y cambiar type/tenant_id. Legacy onboarding/commerce bloqueados.",
  agent_instructions:
    "Instrucciones del panel. INSERT exige agent_config_id, when_text, type, rule, why_useful. tool_id prohibido (SaveAgentInstructionRequest).",
  agent_activation_cases:
    "Casos de activación. INSERT exige agent_config_id + description. Solo paneles especializados.",
  agent_transfer_cases:
    "Casos de transferencia. INSERT exige agent_config_id + description.",
  agent_faqs:
    "FAQs del panel. INSERT exige agent_config_id, question, answer.",
  agent_button_rules:
    "Reglas de botones. INSERT exige agent_config_id, button_type, rule.",
  agent_legal_terms:
    "Terms Gate del tenant (document_url, gate_mode, gated_tools). Una fila típica.",
  agent_tools:
    "Catálogo de tools. Solo lectura — no se asignan por SQL (tool_id prohibido en instrucciones).",
}

type DbConfig = {
  hostname: string
  port: number
  username: string
  password: string
  database: string
}

const clients = new Map<string, SQL>()

async function loadConfig(database: string): Promise<DbConfig> {
  for (const path of CREDS_FILES) {
    const file = Bun.file(path)
    if (await file.exists()) {
      const saved = (await file.json()) as DbConfig & { central_database?: string }
      return {
        hostname: saved.hostname,
        port: saved.port ?? 25060,
        username: saved.username,
        password: saved.password,
        database,
      }
    }
  }
  const hostname = process.env.NOJAU_DB_HOST
  const username = process.env.NOJAU_DB_USERNAME
  const password = process.env.NOJAU_DB_PASSWORD
  if (!hostname || !username || !password) {
    throw new Error(
      `Sin credenciales: el admin debe dejar ${CREDS_FILES[0]} en esta máquina`,
    )
  }
  return {
    hostname,
    port: parseInt(process.env.NOJAU_DB_PORT ?? "25060"),
    username,
    password,
    database,
  }
}

export function resolveDatabase(requested?: string): string {
  const name = (requested ?? DEFAULT_TENANT_DB).trim().replace(/`/g, "")
  if (!DB_NAME.test(name)) {
    throw new Error(`DB no válida: ${requested ?? ""}`)
  }
  return name
}

async function dbFor(database: string): Promise<SQL> {
  const hit = clients.get(database)
  if (hit) return hit
  const cfg = await loadConfig(database)
  const conn = new SQL({
    adapter: "mysql",
    hostname: cfg.hostname,
    port: cfg.port,
    username: cfg.username,
    password: cfg.password,
    database: cfg.database,
    ssl: "require",
    max: 3,
    connectionTimeout: 15,
  })
  clients.set(database, conn)
  return conn
}

const READ_ONLY = /^\s*(select|with|show|describe|desc|explain)\b/i
const READ_FORBIDDEN =
  /\b(insert|update|delete|replace|create|alter|drop|truncate|grant|revoke|call|set|use|lock|unlock|load|handler|rename|purge|reset|flush|kill|shutdown|outfile|dumpfile)\b/i

function referencedTables(sql: string): Array<{ db?: string; table: string }> {
  const out: Array<{ db?: string; table: string }> = []
  const re = /\b(?:from|join)\s+(?:`?([A-Za-z0-9_]+)`?\.)?`?([A-Za-z0-9_]+)`?/gi
  for (const m of sql.matchAll(re)) {
    out.push({ db: m[1], table: m[2] })
  }
  return out
}

function isAllowed(list: readonly string[], table: string): boolean {
  const t = table.toLowerCase()
  return list.includes(t)
}

export function assertReadGuards(sql: string, database: string): void {
  const q = sql.trim().replace(/--.*$/gm, "")
  if (!READ_ONLY.test(q)) {
    throw new Error(
      "Solo lectura: la consulta debe empezar con SELECT/WITH/SHOW/DESCRIBE/EXPLAIN",
    )
  }
  if (READ_FORBIDDEN.test(q)) {
    throw new Error("Solo lectura: escritura/DDL no permitida")
  }
  if (/;\s*\S/.test(q)) {
    throw new Error("Una sola sentencia por llamada")
  }
  for (const ref of referencedTables(q)) {
    if (!isAllowed(READ_TABLES, ref.table)) {
      throw new Error(`Tabla no permitida para lectura: ${ref.table}`)
    }
    if (ref.db && ref.db !== database) {
      throw new Error(
        `DB calificada no permitida: ${ref.db}.${ref.table} (usa database = ${database})`,
      )
    }
  }
}

export type WriteOp = {
  operation: "INSERT" | "UPDATE" | "DELETE"
  table: string
  id: number | null
  parentConfigId: number | null
}

function splitSqlList(s: string): string[] {
  const out: string[] = []
  let cur = ""
  let quote: string | null = null
  for (const ch of s) {
    if (quote) {
      cur += ch
      if (ch === quote) quote = null
      continue
    }
    if (ch === "'" || ch === '"') {
      quote = ch
      cur += ch
      continue
    }
    if (ch === ",") {
      out.push(cur.trim())
      cur = ""
      continue
    }
    cur += ch
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

function literalInt(raw: string | undefined): number | null {
  if (!raw) return null
  const m = raw.trim().match(/^(\d+)$/)
  return m ? parseInt(m[1], 10) : null
}

function exactIdWhere(where: string): number {
  const tail = where.trim().replace(/;\s*$/, "")
  if (/1\s*=\s*1/.test(tail)) {
    throw new Error("WHERE 1=1 no permitido")
  }
  const m = tail.match(/^`?id`?\s*=\s*(\d+)\s*(limit\s+\d+\s*)?$/i)
  if (!m) {
    throw new Error("Solo por id: WHERE id = <n> (sin OR/AND)")
  }
  return parseInt(m[1], 10)
}

function specOf(table: string): WriteSpec {
  if (!isAllowed(WRITE_TABLES, table)) {
    throw new Error(`Tabla no permitida para escritura: ${table}`)
  }
  return WRITE_SPEC[table as (typeof WRITE_TABLES)[number]]
}

export function assertWriteGuards(sql: string): WriteOp {
  const q = sql.trim().replace(/--.*$/gm, "")
  if (!q) throw new Error("Vacía: pasa un INSERT, UPDATE o DELETE")
  if (/;\s*\S/.test(q)) {
    throw new Error("Una sola sentencia por llamada")
  }
  if (/\bjoin\b/i.test(q)) {
    throw new Error("JOIN no permitido en escritura (una tabla, una fila)")
  }
  if (/\binsert\b[\s\S]*\bselect\b/i.test(q)) {
    throw new Error("INSERT ... SELECT no permitido")
  }
  const head = q.split(/\s+/)[0]?.toLowerCase()
  if (head === "insert") return assertInsertGuards(q)
  if (head === "update") return assertUpdateGuards(q)
  if (head === "delete") return assertDeleteGuards(q)
  throw new Error("Solo INSERT/UPDATE/DELETE en tablas de la allowlist (DDL no permitida)")
}

function assertInsertGuards(q: string): WriteOp {
  const m = q.match(/^insert\s+into\s+`?([A-Za-z0-9_]+)`?\s*\(([^)]+)\)\s*values\s*\(([\s\S]+)\)\s*;?\s*$/i)
  if (!m) {
    throw new Error("Usa INSERT INTO <tabla> (cols) VALUES (...) — una fila")
  }
  const table = m[1].toLowerCase()
  const spec = specOf(table)
  if (!spec.allowInsert) {
    throw new Error(
      `${table}: INSERT prohibido (los paneles ya existen; usa UPDATE WHERE id = <n>)`,
    )
  }
  if (/\)\s*,\s*\(/.test(q)) {
    throw new Error("Una fila por INSERT")
  }
  const cols = m[2].split(",").map((c) => c.replace(/[`"'\s]/g, "").toLowerCase())
  for (const need of spec.insertRequired) {
    if (!cols.includes(need)) {
      throw new Error(`INSERT ${table} exige ${spec.insertRequired.join(" + ")}`)
    }
  }
  for (const ban of spec.insertForbidden) {
    if (cols.includes(ban)) {
      throw new Error(`${ban} prohibido en INSERT ${table}`)
    }
  }
  const vals = splitSqlList(m[3])
  const parentIdx = cols.indexOf("agent_config_id")
  const parentConfigId = parentIdx >= 0 ? literalInt(vals[parentIdx]) : null
  if (cols.includes("agent_config_id") && parentConfigId === null) {
    throw new Error("agent_config_id debe ser un entero literal")
  }
  return { operation: "INSERT", table, id: null, parentConfigId }
}

function setColumns(setClause: string): string[] {
  return splitSqlList(setClause).map((part) =>
    part.split("=")[0]?.replace(/[`"'\s]/g, "").toLowerCase() ?? "",
  )
}

function assertUpdateGuards(q: string): WriteOp {
  const whereIdx = q.search(/\bwhere\b/i)
  if (whereIdx < 0) {
    throw new Error("UPDATE exige WHERE id = <n>")
  }
  const head = q.slice(0, whereIdx)
  const hm = head.match(/^update\s+`?([A-Za-z0-9_]+)`?\s+set\s+([\s\S]+)$/i)
  if (!hm) throw new Error("Usa UPDATE <tabla> SET ... WHERE id = <n>")
  const table = hm[1].toLowerCase()
  const spec = specOf(table)
  const cols = setColumns(hm[2])
  for (const ban of spec.updateForbidden) {
    if (cols.includes(ban)) {
      throw new Error(`${ban} no se toca por UPDATE ${table}`)
    }
  }
  return {
    operation: "UPDATE",
    table,
    id: exactIdWhere(q.slice(whereIdx + 5)),
    parentConfigId: null,
  }
}

function assertDeleteGuards(q: string): WriteOp {
  const m = q.match(/^delete\s+from\s+`?([A-Za-z0-9_]+)`?\s+where\s+([\s\S]+)$/i)
  if (!m) {
    throw new Error("Usa DELETE FROM <tabla> WHERE id = <n>")
  }
  const table = m[1].toLowerCase()
  const spec = specOf(table)
  if (!spec.allowDelete) {
    throw new Error(
      `${table}: DELETE físico prohibido (desactivar es UPDATE is_active = 0)`,
    )
  }
  return {
    operation: "DELETE",
    table,
    id: exactIdWhere(m[2]),
    parentConfigId: null,
  }
}

async function assertTagIsCustom(conn: SQL, database: string, id: number): Promise<void> {
  const rows = (await conn.unsafe(
    `SELECT id, system_key FROM \`${database}\`.conversation_tags WHERE id = ${id} LIMIT 1`,
  )) as Array<{ id: number; system_key: string | null }>
  const row = rows[0]
  if (!row) {
    throw new Error(`Sin fila: no existe conversation_tags id=${id} en ${database}`)
  }
  if (row.system_key !== null) {
    throw new Error(`Bloqueado: id=${id} es tag de sistema (system_key=${row.system_key})`)
  }
}

async function assertPanelConfig(
  conn: SQL,
  database: string,
  configId: number,
): Promise<void> {
  const rows = (await conn.unsafe(
    `SELECT id, type FROM \`${database}\`.agent_configs WHERE id = ${configId} LIMIT 1`,
  )) as Array<{ id: number; type: string | null }>
  const row = rows[0]
  if (!row) {
    throw new Error(`Sin fila: no existe agent_configs id=${configId} en ${database}`)
  }
  if (!PANEL_TYPES.includes(row.type as (typeof PANEL_TYPES)[number])) {
    throw new Error(
      `Bloqueado: agent_configs id=${configId} type=${row.type} no es panel (solo ${PANEL_TYPES.join(", ")})`,
    )
  }
}

async function assertChildOnPanel(
  conn: SQL,
  database: string,
  table: string,
  id: number,
): Promise<void> {
  const rows = (await conn.unsafe(
    `SELECT agent_config_id FROM \`${database}\`.${table} WHERE id = ${id} LIMIT 1`,
  )) as Array<{ agent_config_id: number }>
  const row = rows[0]
  if (!row) {
    throw new Error(`Sin fila: no existe ${table} id=${id} en ${database}`)
  }
  await assertPanelConfig(conn, database, row.agent_config_id)
}

export async function runReadQuery(
  sql: string,
  database?: string,
  limit = 50,
): Promise<string> {
  const dbName = resolveDatabase(database)
  assertReadGuards(sql, dbName)
  const capped = Math.min(limit, 200)
  const conn = await dbFor(dbName)
  const rows = (await conn.unsafe(sql)) as unknown[]
  const sliced = Array.isArray(rows) ? rows.slice(0, capped) : rows
  const total = Array.isArray(rows) ? rows.length : 1
  return JSON.stringify(
    { rows: sliced, returned: Array.isArray(sliced) ? sliced.length : 1, total },
    null,
    2,
  )
}

export async function runWriteQuery(sql: string, database?: string): Promise<string> {
  const parsed = assertWriteGuards(sql)
  const dbName = resolveDatabase(database)
  const conn = await dbFor(dbName)

  if (parsed.table === "conversation_tags" && parsed.operation !== "INSERT" && parsed.id !== null) {
    await assertTagIsCustom(conn, dbName, parsed.id)
  }
  if (parsed.table === "agent_configs" && parsed.id !== null) {
    await assertPanelConfig(conn, dbName, parsed.id)
  }
  if ((CHILD_TABLES as readonly string[]).includes(parsed.table)) {
    if (parsed.operation === "INSERT" && parsed.parentConfigId !== null) {
      await assertPanelConfig(conn, dbName, parsed.parentConfigId)
    }
    if (parsed.operation !== "INSERT" && parsed.id !== null) {
      await assertChildOnPanel(conn, dbName, parsed.table, parsed.id)
    }
  }

  const result = (await conn.unsafe(sql)) as unknown
  if (parsed.operation === "INSERT") {
    const insertId = (result as { insertId?: unknown } | null)?.insertId
    if (typeof insertId === "number") {
      const rows = (await conn.unsafe(
        `SELECT * FROM \`${dbName}\`.${parsed.table} WHERE id = ${insertId} LIMIT 1`,
      )) as unknown[]
      return JSON.stringify(
        { ok: true, operation: "INSERT", table: parsed.table, id: insertId, row: rows[0] },
        null,
        2,
      )
    }
    return JSON.stringify(
      { ok: true, operation: "INSERT", table: parsed.table, note: "Verifica con lectura" },
      null,
      2,
    )
  }
  const rows =
    parsed.operation === "DELETE"
      ? []
      : ((await conn.unsafe(
          `SELECT * FROM \`${dbName}\`.${parsed.table} WHERE id = ${parsed.id} LIMIT 1`,
        )) as unknown[])
  return JSON.stringify(
    {
      ok: true,
      operation: parsed.operation,
      table: parsed.table,
      id: parsed.id,
      row: rows[0] ?? null,
    },
    null,
    2,
  )
}

export async function runTables(): Promise<string> {
  return JSON.stringify(
    [
      ...WRITE_TABLES.map((table) => ({
        table,
        mode: "read+write",
        scope: "tenant",
        description: TABLE_DESCRIPTIONS[table],
      })),
      {
        table: "agent_tools",
        mode: "read",
        scope: "tenant",
        description: TABLE_DESCRIPTIONS.agent_tools,
      },
      {
        table: "companies",
        mode: "read",
        scope: `central (${CENTRAL_DB})`,
        description: TABLE_DESCRIPTIONS.companies,
      },
    ],
    null,
    2,
  )
}

const READ_DESC = `Lee paneles agent_* + conversation_tags + agent_legal_terms (tenant) y companies (central ${CENTRAL_DB}). Solo SELECT/WITH/SHOW/DESCRIBE/EXPLAIN, una sentencia, max 200 filas, allowlist.`
const WRITE_DESC = `Escribe paneles (agent_configs UPDATE only; instructions/faqs/activations/transfers/button_rules) + conversation_tags + agent_legal_terms. INSERT de hijos exige agent_config_id de un panel. Tags: name+assignment_case, sin system_key. Solo con goal aprobado (ok de Dani).`
const TABLES_DESC = `Lista allowlist: paneles Agent Panels, conversation_tags, agent_legal_terms, agent_tools (read), companies (central read).`

const agentReadV1 = tool({
  description: READ_DESC,
  args: {
    sql: tool.schema.string().describe("Consulta SELECT read-only"),
    database: tool.schema.string().optional().describe("DB destino (default tenant). companies vive en la central."),
    limit: tool.schema.number().optional().describe("Max filas (default 50, max 200)"),
  },
  async execute(args) {
    try {
      return await runReadQuery(args.sql, args.database, args.limit ?? 50)
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`
    }
  },
})

const agentWriteV1 = tool({
  description: WRITE_DESC,
  args: {
    sql: tool.schema.string().describe("INSERT/UPDATE/DELETE de una fila en la allowlist"),
    database: tool.schema.string().optional().describe("Tenant DB validada contra companies"),
  },
  async execute(args) {
    try {
      return await runWriteQuery(args.sql, args.database)
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`
    }
  },
})

const agentTablesV1 = tool({
  description: TABLES_DESC,
  args: {},
  async execute() {
    try {
      return await runTables()
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`
    }
  },
})

const v2 = Plugin.define({
  id: "nojau-agent-config",
  async setup(ctx) {
    await ctx.tool.transform((editor) => {
      editor.add({
        name: "nojau_agent_read",
        description: READ_DESC,
        input: {
          type: "object",
          properties: {
            sql: { type: "string", description: "Consulta SELECT read-only" },
            database: { type: "string", description: "DB destino (default tenant). companies vive en la central." },
            limit: { type: "number", description: "Max filas (default 50, max 200)" },
          },
          required: ["sql"],
          additionalProperties: false,
        },
        execute: async (input) => {
          const args = input as { sql: string; database?: string; limit?: number }
          try {
            return { content: await runReadQuery(args.sql, args.database, args.limit ?? 50) }
          } catch (e) {
            return { content: `Error: ${e instanceof Error ? e.message : String(e)}` }
          }
        },
      })
      editor.add({
        name: "nojau_agent_write",
        description: WRITE_DESC,
        input: {
          type: "object",
          properties: {
            sql: { type: "string", description: "INSERT/UPDATE/DELETE de una fila en la allowlist" },
            database: { type: "string", description: "Tenant DB validada contra companies" },
          },
          required: ["sql"],
          additionalProperties: false,
        },
        execute: async (input) => {
          const args = input as { sql: string; database?: string }
          try {
            return { content: await runWriteQuery(args.sql, args.database) }
          } catch (e) {
            return { content: `Error: ${e instanceof Error ? e.message : String(e)}` }
          }
        },
      })
      editor.add({
        name: "nojau_agent_tables",
        description: TABLES_DESC,
        input: {
          type: "object",
          properties: {},
          required: [],
          additionalProperties: false,
        },
        execute: async () => {
          try {
            return { content: await runTables() }
          } catch (e) {
            return { content: `Error: ${e instanceof Error ? e.message : String(e)}` }
          }
        },
      })
    })
  },
})

export default {
  ...v2,
  async server() {
    return {
      tool: {
        nojau_agent_read: agentReadV1,
        nojau_agent_write: agentWriteV1,
        nojau_agent_tables: agentTablesV1,
      },
    }
  },
}
