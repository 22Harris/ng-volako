import { Injectable, signal } from '@angular/core';

export type AlertType = 'success' | 'error' | 'info';

export interface AlertMessage {
  type: AlertType;
  text: string;
  id: number;
}

@Injectable({ providedIn: 'root' })
export class AlertService {
  private counter = 0;
  alerts = signal<AlertMessage[]>([]);

  success(text: string, duration = 4000): void {
    this.show({ type: 'success', text, id: ++this.counter }, duration);
  }

  error(text: string, duration = 4000): void {
    this.show({ type: 'error', text, id: ++this.counter }, duration);
  }

  info(text: string, duration = 4000): void {
    this.show({ type: 'info', text, id: ++this.counter }, duration);
  }

  dismiss(id: number): void {
    this.alerts.update(list => list.filter(a => a.id !== id));
  }

  private show(alert: AlertMessage, duration: number): void {
    this.alerts.update(list => [...list, alert]);
    setTimeout(() => this.dismiss(alert.id), duration);
  }
}
