# BIOFILA

Sistema de gestión de turnos para un laboratorio y sus cuatro módulos de atención. La interfaz está hecha en Angular; la API y la lógica de la fila están en Python con FastAPI.

## Requisitos

- Python 3.10 o posterior
- Node.js 22.22.3 o 24.15 o posterior y npm (Angular 22 no admite Node 25)

## Ejecutar en local

### Demostración rápida en Mac

1. Descarga el proyecto desde GitHub con **Code → Download ZIP** y descomprime la carpeta.
2. Abre Terminal, escribe `cd ` (con un espacio) y arrastra la carpeta descomprimida a la ventana.
3. Presiona Enter y después ejecuta `bash start-demo-mac.command`.
4. La primera vez instalará las dependencias; después abrirá la aplicación en `http://localhost:4200`.
5. Mantén abierta la ventana de Terminal durante la presentación. Presiona **Ctrl+C** al terminar.

Necesitas Python 3 y Node.js/npm instalados. La primera ejecución necesita conexión a internet para descargar las dependencias.

### Inicio manual

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

## Compartir

Comparte el enlace del repositorio para que otras personas descarguen el código. `localhost:4200` solo funciona en tu propia laptop. Para una URL pública que abra la aplicación sin instalarla, hay que desplegar Angular y alojar la API Python en un servicio web.

## Qué incluye

- Crear turnos y mostrar la fila en tiempo real.
- Llamar al siguiente turno desde cualquiera de cuatro estaciones.
- Finalizar atenciones y consultar indicadores.
- Timbres sintetizados de recepción para emisión, llamada y cierre, con control de sonido.
- Interfaz adaptable con paleta azul y violeta iridiscente.

La API mantiene la fila en memoria mientras el proceso está activo; al reiniciarlo, los turnos comienzan de nuevo. No se guardan datos personales de pacientes.
