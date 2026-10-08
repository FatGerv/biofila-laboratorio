import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { QueueApiService, QueueState, StationState } from './queue-api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
  readonly api = inject(QueueApiService);
  readonly soundEnabled = signal(true);
  readonly busy = signal(false);
  readonly clock = signal(new Date());
  readonly notice = signal('');
  readonly apiOnline = signal(false);
  private audio?: AudioContext;
  private pollTimer?: number;
  private clockTimer?: number;
  private noticeTimer?: number;

  ngOnInit(): void {
    this.refresh();
    this.pollTimer = window.setInterval(() => this.refresh(true), 5000);
    this.clockTimer = window.setInterval(() => this.clock.set(new Date()), 1000);
  }

  ngOnDestroy(): void {
    window.clearInterval(this.pollTimer);
    window.clearInterval(this.clockTimer);
    window.clearTimeout(this.noticeTimer);
    void this.audio?.close();
  }

  get waitingCount(): number {
    return this.api.state()?.queue.length ?? 0;
  }

  get servingCount(): number {
    return this.api.state()?.stations.filter((station) => station.ticket).length ?? 0;
  }

  newTicket(): void {
    const ticket = this.api.state()?.next_ticket ?? 'nuevo turno';
    this.perform(this.api.createTicket(), 'ticket', `${ticket} agregado a la fila`);
  }

  callNext(stationId: number): void {
    const ticket = this.api.state()?.queue[0] ?? 'Turno';
    this.perform(this.api.callNext(stationId), 'call', `${ticket} llamado al módulo 0${stationId}`);
  }

  finish(station: StationState): void {
    this.perform(this.api.finish(station.id), 'done', `${station.ticket} · atención finalizada`);
  }

  toggleSound(): void {
    this.soundEnabled.update((enabled) => !enabled);
    if (this.soundEnabled()) this.playChime('ticket');
  }

  private refresh(silent = false): void {
    this.api.refresh().subscribe({
      next: () => { this.apiOnline.set(true); },
      error: () => { this.apiOnline.set(false); if (!silent) this.showNotice('No se pudo conectar con la API de Biofila.'); },
    });
  }

  private perform(action: Observable<QueueState>, chime: 'ticket' | 'call' | 'done', message: string): void {
    this.busy.set(true);
    action.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () => { this.apiOnline.set(true); this.playChime(chime); this.showNotice(message); },
      error: (error: HttpErrorResponse) => {
        this.apiOnline.set(error.status !== 0);
        this.showNotice(error.error?.detail ?? 'No se pudo completar la acción.');
      },
    });
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    window.clearTimeout(this.noticeTimer);
    this.noticeTimer = window.setTimeout(() => this.notice.set(''), 2600);
  }

  private playChime(kind: 'ticket' | 'call' | 'done'): void {
    if (!this.soundEnabled()) return;
    const Audio = window.AudioContext;
    if (!Audio) return;
    this.audio ??= new Audio();
    if (this.audio.state === 'suspended') void this.audio.resume();
    const notes = kind === 'call' ? [659.25, 783.99, 987.77] : kind === 'done' ? [783.99, 523.25] : [987.77, 783.99];
    const gap = kind === 'call' ? 0.16 : 0.22;
    notes.forEach((frequency, index) => {
      const start = this.audio!.currentTime + index * gap;
      [[1, 1], [2.76, 0.23], [5.4, 0.08]].forEach(([ratio, volume]) => {
        const oscillator = this.audio!.createOscillator();
        const gain = this.audio!.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency * ratio, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.12 * volume, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.52);
        oscillator.connect(gain);
        gain.connect(this.audio!.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.54);
      });
    });
  }
}
