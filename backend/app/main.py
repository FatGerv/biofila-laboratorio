from __future__ import annotations

from threading import Lock

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


class Station(BaseModel):
    id: int
    ticket: str | None = None
    patient: str | None = None


class QueueState(BaseModel):
    next_ticket: str
    issued: int
    served: int
    queue: list[str]
    stations: list[Station]


app = FastAPI(title="Biofila API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

_lock = Lock()
_next_number = 1
_issued = 0
_served = 0
_queue: list[str] = []
_stations = [Station(id=number) for number in range(1, 5)]


def snapshot() -> QueueState:
    return QueueState(
        next_ticket=f"A-{_next_number:03d}",
        issued=_issued,
        served=_served,
        queue=list(_queue),
        stations=[station.model_copy() for station in _stations],
    )


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "biofila-api"}


@app.get("/api/state", response_model=QueueState)
def get_state() -> QueueState:
    with _lock:
        return snapshot()


@app.post("/api/tickets", response_model=QueueState)
def create_ticket() -> QueueState:
    global _next_number, _issued
    with _lock:
        _queue.append(f"A-{_next_number:03d}")
        _next_number += 1
        _issued += 1
        return snapshot()


@app.post("/api/stations/{station_id}/call", response_model=QueueState)
def call_next(station_id: int) -> QueueState:
    station = next((item for item in _stations if item.id == station_id), None)
    if station is None:
        raise HTTPException(status_code=404, detail="La estación no existe.")
    with _lock:
        if station.ticket:
            raise HTTPException(status_code=409, detail="La estación ya está atendiendo un turno.")
        if not _queue:
            raise HTTPException(status_code=409, detail="No hay turnos en espera.")
        station.ticket = _queue.pop(0)
        station.patient = "Paciente en atención"
        return snapshot()


@app.post("/api/stations/{station_id}/finish", response_model=QueueState)
def finish_visit(station_id: int) -> QueueState:
    global _served
    station = next((item for item in _stations if item.id == station_id), None)
    if station is None:
        raise HTTPException(status_code=404, detail="La estación no existe.")
    with _lock:
        if not station.ticket:
            raise HTTPException(status_code=409, detail="La estación no tiene un turno activo.")
        station.ticket = None
        station.patient = None
        _served += 1
        return snapshot()
