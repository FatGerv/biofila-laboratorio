#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Falta Python 3. Instálalo y vuelve a abrir este archivo."
  read -r -p "Presiona Enter para cerrar. "
  exit 1
fi
if ! command -v npm >/dev/null 2>&1 || ! command -v node >/dev/null 2>&1; then
  echo "Falta Node.js y npm. Instálalos y vuelve a abrir este archivo."
  read -r -p "Presiona Enter para cerrar. "
  exit 1
fi

node_supported() {
  node -e 'const [major, minor, patch] = process.versions.node.split(".").map(Number); process.exit((major === 22 && (minor > 22 || (minor === 22 && patch >= 3))) || (major === 24 && minor >= 15) || major >= 26 ? 0 : 1)' >/dev/null 2>&1
}
if ! node_supported; then
  for version_dir in "$HOME"/.nvm/versions/node/v24.* "$HOME"/.nvm/versions/node/v22.* "$HOME"/.nvm/versions/node/v26.*; do
    if [ -x "$version_dir/bin/node" ]; then
      export PATH="$version_dir/bin:$PATH"
      node_supported && break
    fi
  done
fi
if ! node_supported; then
  echo "Angular 22 requiere Node 22.22.3+, 24.15+ o 26+. Instala una de esas versiones y vuelve a abrir este archivo."
  read -r -p "Presiona Enter para cerrar. "
  exit 1
fi

if [ ! -x backend/.venv/bin/python ]; then
  python3 -m venv backend/.venv
fi
backend/.venv/bin/python -m pip install -r backend/requirements.txt

if [ ! -x frontend/node_modules/.bin/ng ]; then
  (cd frontend && npm install --cache "$ROOT_DIR/.npm-cache")
fi

backend/.venv/bin/uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 > backend/.biofila-api.log 2>&1 &
API_PID=$!
frontend/node_modules/.bin/ng serve --host 127.0.0.1 --poll 1500 > frontend/.biofila-angular.log 2>&1 &
FRONTEND_PID=$!

cleanup() {
  kill "$API_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Iniciando Biofila. La primera vez puede tardar mientras se instalan las dependencias."
ready=0
for attempt in $(seq 1 120); do
  if curl --silent --fail http://127.0.0.1:4200 >/dev/null && curl --silent --fail http://127.0.0.1:8000/api/health >/dev/null; then
    ready=1
    break
  fi
  if ! kill -0 "$API_PID" 2>/dev/null || ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    break
  fi
  sleep 1
done

if [ "$ready" -eq 1 ]; then
  echo "Biofila está lista. Se abrirá en http://localhost:4200"
  open http://localhost:4200
else
  echo "No se pudieron iniciar los servicios. Revisa backend/.biofila-api.log y frontend/.biofila-angular.log"
fi
echo "Deja esta ventana abierta durante la demostración. Presiona Ctrl+C para cerrar Biofila."
while kill -0 "$API_PID" 2>/dev/null && kill -0 "$FRONTEND_PID" 2>/dev/null; do sleep 1; done
