# BIOFILA

Sistema de gestión de turnos para un laboratorio y sus cuatro módulos de atención. La interfaz está hecha en Angular; la API y la lógica de la fila están en Python con FastAPI.

## Requisitos

- Python 3.10 o posterior
- Node.js 24.15 o posterior y npm

## Ejecutar en local

Abre dos terminales desde la carpeta del repositorio.

**Terminal 1 — API Python**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — interfaz Angular**

```bash
cd frontend
npm install
npm start
```

Abre `http://localhost:4200`. La documentación interactiva de la API está en `http://localhost:8000/docs`.

## Qué incluye

- Crear turnos y mostrar la fila en tiempo real.
- Llamar al siguiente turno desde cualquiera de cuatro estaciones.
- Finalizar atenciones y consultar indicadores.
- Timbres sintetizados de recepción para emisión, llamada y cierre, con control de sonido.
- Interfaz adaptable con paleta azul y violeta iridiscente.

La API mantiene la fila en memoria mientras el proceso está activo; al reiniciarlo, los turnos comienzan de nuevo. No se guardan datos personales de pacientes.

