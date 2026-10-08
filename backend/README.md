# Backend de Biofila

API REST en Python con FastAPI. La cola vive en memoria durante la ejecución del proceso.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Documentación interactiva: `http://localhost:8000/docs`.
