import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AlertService } from './alert.service';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="alert-container">
      @for (alert of alertService.alerts(); track alert.id) {
        <div class="alert alert-{{ alert.type }}">
          <mat-icon>{{ alert.type === 'success' ? 'check_circle' : alert.type === 'error' ? 'error' : 'info' }}</mat-icon>
          <span>{{ alert.text }}</span>
          <button mat-icon-button (click)="alertService.dismiss(alert.id)">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .alert-container {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 400px;
    }
    .alert {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,.2);
      animation: slideIn .2s ease-out;
    }
    .alert span { flex: 1; }
    .alert-success { background: #4caf50; color: white; }
    .alert-error   { background: #f44336; color: white; }
    .alert-info    { background: #2196f3; color: white; }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0);   opacity: 1; }
    }
  `]
})
export class AlertComponent {
  alertService = inject(AlertService);
}
