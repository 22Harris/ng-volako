import { Component, Inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-container">
      <div class="dialog-icon-wrapper">
        <mat-icon class="dialog-icon">warning_amber</mat-icon>
      </div>
      <h2 class="dialog-title">{{ data.title }}</h2>
      <p class="dialog-message">{{ data.message }}</p>
      <div class="dialog-actions">
        <button class="btn-cancel" mat-dialog-close>Annuler</button>
        <button class="btn-confirm" [mat-dialog-close]="true">
          <mat-icon>delete_outline</mat-icon>
          Confirmer
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 28px 24px;
      gap: 0;
      text-align: center;
    }

    .dialog-icon-wrapper {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      box-shadow: 0 4px 16px rgba(255, 152, 0, 0.2);
    }

    .dialog-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #f57c00;
    }

    .dialog-title {
      margin: 0 0 10px;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a1a2e;
      letter-spacing: -0.01em;
    }

    .dialog-message {
      margin: 0 0 28px;
      font-size: 0.9rem;
      color: #6b7280;
      line-height: 1.5;
      max-width: 280px;
    }

    .dialog-actions {
      display: flex;
      gap: 12px;
      width: 100%;
      justify-content: center;
    }

    .btn-cancel, .btn-confirm {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 24px;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .btn-cancel {
      background: #f1f5f9;
      color: #475569;
      flex: 1;
      max-width: 130px;
      justify-content: center;
    }

    .btn-cancel:hover {
      background: #e2e8f0;
      color: #1e293b;
    }

    .btn-confirm {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: #fff;
      flex: 1;
      max-width: 150px;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
    }

    .btn-confirm:hover {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      box-shadow: 0 6px 16px rgba(239, 68, 68, 0.45);
      transform: translateY(-1px);
    }

    .btn-confirm mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
