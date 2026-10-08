import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

export interface StationState {
  id: number;
  ticket: string | null;
  patient: string | null;
}

export interface QueueState {
  next_ticket: string;
  issued: number;
  served: number;
  queue: string[];
  stations: StationState[];
}

@Injectable({ providedIn: 'root' })
export class QueueApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8000/api';
  readonly state = signal<QueueState | null>(null);

  refresh(): Observable<QueueState> {
    return this.http.get<QueueState>(`${this.baseUrl}/state`).pipe(tap((state) => this.state.set(state)));
  }

  createTicket(): Observable<QueueState> {
    return this.http.post<QueueState>(`${this.baseUrl}/tickets`, {}).pipe(tap((state) => this.state.set(state)));
  }

  callNext(stationId: number): Observable<QueueState> {
    return this.http.post<QueueState>(`${this.baseUrl}/stations/${stationId}/call`, {}).pipe(tap((state) => this.state.set(state)));
  }

  finish(stationId: number): Observable<QueueState> {
    return this.http.post<QueueState>(`${this.baseUrl}/stations/${stationId}/finish`, {}).pipe(tap((state) => this.state.set(state)));
  }
}
