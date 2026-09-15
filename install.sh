#!/usr/bin/env bash
# Dani — una sola línea, sin configurar nada:
#
#   curl -fsSL https://raw.githubusercontent.com/Andeveling/nojau-po/main/install.sh | bash
#
# No pide datos. Copia skills + plugin a OpenCode. Las credenciales las deja
# el admin una vez en ~/.config/opencode/nojau-agent-db.json (Dani no las toca).

set -euo pipefail

REPO_SLUG="${NOJAU_PO_REPO:-Andeveling/nojau-po}"
REPO_URL="https://github.com/${REPO_SLUG}.git"
INSTALL_DIR="${NOJAU_PO_HOME:-$HOME/.local/share/nojau-po}"
OPENCODE_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"

say() { printf 'nojau-po: %s\n' "$*"; }
die() { printf 'nojau-po: ERROR %s\n' "$*" >&2; exit 1; }

if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
  die "no corras esto como root"
fi

need() { command -v "$1" >/dev/null 2>&1 || die "falta '$1' (pide a admin que lo instale)"; }
need git
need curl

# Si esto se ejecuta desde un clone local, úsalo; si viene de curl | bash, clona.
ROOT=""
if [[ -n "${BASH_SOURCE[0]:-}" && -f "${BASH_SOURCE[0]:-}" ]]; then
  _here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  if [[ -f "$_here/plugins/agent-config.ts" && -d "$_here/skills/agent-config" ]]; then
    ROOT="$_here"
  fi
fi

if [[ -z "$ROOT" ]]; then
  if [[ -d "$INSTALL_DIR/.git" ]]; then
    say "actualizando $INSTALL_DIR"
    git -C "$INSTALL_DIR" fetch --depth 1 origin main >/dev/null 2>&1 || git -C "$INSTALL_DIR" fetch --depth 1 origin
    git -C "$INSTALL_DIR" reset --hard origin/main >/dev/null 2>&1 || git -C "$INSTALL_DIR" pull --ff-only
  else
    say "descargando $REPO_SLUG"
    mkdir -p "$(dirname "$INSTALL_DIR")"
    rm -rf "$INSTALL_DIR"
    git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
  fi
  ROOT="$INSTALL_DIR"
fi

[[ -f "$ROOT/plugins/agent-config.ts" ]] || die "plugin no encontrado en $ROOT"
[[ -d "$ROOT/skills/agent-config" ]] || die "skill agent-config no encontrada"

mkdir -p "$OPENCODE_DIR/plugins" "$OPENCODE_DIR/skills" "$HOME/.agents/skills"

say "instalando plugin"
cp "$ROOT/plugins/agent-config.ts" "$OPENCODE_DIR/plugins/agent-config.ts"

say "instalando skills"
rm -rf "$OPENCODE_DIR/skills/agent-config" "$OPENCODE_DIR/skills/conversation-tags"
rm -rf "$HOME/.agents/skills/agent-config" "$HOME/.agents/skills/conversation-tags"
cp -a "$ROOT/skills/agent-config" "$OPENCODE_DIR/skills/agent-config"
cp -a "$ROOT/skills/conversation-tags" "$OPENCODE_DIR/skills/conversation-tags"
cp -a "$ROOT/skills/agent-config" "$HOME/.agents/skills/agent-config"
cp -a "$ROOT/skills/conversation-tags" "$HOME/.agents/skills/conversation-tags"

if command -v npx >/dev/null 2>&1; then
  say "registrando skills en agentes (npx skills)"
  npx --yes skills add "$REPO_SLUG" -g -y -s '*' >/dev/null 2>&1 || true
fi

# OpenCode V2 carga solo ~/.config/opencode/plugins/*.ts (como engram).
# No toques opencode.jsonc: "plugin" + ruta a un .ts falla
# ("configured plugin path must be a directory" + Cannot find @opencode/plugin).

CREDS="$OPENCODE_DIR/nojau-agent-db.json"
ALT="$OPENCODE_DIR/nojau-tenant-db.json"
if [[ -f "$CREDS" || -f "$ALT" ]]; then
  say "credenciales OK (ya estaban en esta máquina)"
else
  say "plugin y skills listos. Las credenciales las pone admin (no Dani)."
fi

say "listo. Abre OpenCode y escribe: configurar instancia"
