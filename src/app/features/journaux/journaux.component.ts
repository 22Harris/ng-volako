import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { JournalService } from '../../core/services/journal.service';
import { AlertService } from '../../shared/components/alert/alert.service';
import { Journal, JournalType, JOURNAL_TYPE_LABELS, JOURNAL_PREFIXES } from '../../core/models/journal.model';

const ALL_TYPES: JournalType[] = ['ACHATS', 'VENTES', 'BANQUE', 'CAISSE', 'OD'];

const JOURNAL_ICONS: Record<JournalType, string> = {
  ACHATS: 'shopping_cart',
  VENTES: 'sell',
  BANQUE: 'account_balance',
  CAISSE: 'payments',
  OD:     'edit_note',
};

const JOURNAL_COLORS: Record<JournalType, { bg: string; border: string; text: string }> = {
  ACHATS: { bg: '#fff3e0', border: '#ffe0b2', text: '#e65100' },
  VENTES: { bg: '#e8f5e9', border: '#c8e6c9', text: '#2e7d32' },
  BANQUE: { bg: '#e3f2fd', border: '#bbdefb', text: '#1565c0' },
  CAISSE: { bg: '#fce4ec', border: '#f8bbd0', text: '#880e4f' },
  OD:     { bg: '#f3e5f5', border: '#e1bee7', text: '#6a1b9a' },
};

@Component({
  selector: 'app-journaux',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatTooltipModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Journaux comptables</h1>
        <p class="page-sub">Gérez les 5 journaux de saisie. Activez ceux dont vous avez besoin.</p>
      </div>
    </div>

    <div class="journals-grid">
      @for (type of allTypes; track type) {
        @let journal = findJournal(type);
        @let colors = colorOf(type);
        <div class="journal-card" [style.border-color]="colors.border" [style.background]="colors.bg">
          <div class="jc-icon-wrap" [style.color]="colors.text">
            <mat-icon>{{ iconOf(type) }}</mat-icon>
          </div>
          <div class="jc-body">
            <div class="jc-type" [style.color]="colors.text">{{ type }}</div>
            <div class="jc-name">{{ labelOf(type) }}</div>
            <div class="jc-prefix">Préfixe pièce : <strong>{{ prefixOf(type) }}</strong></div>
          </div>
          <div class="jc-actions">
            @if (journal) {
              <span class="status-active">
                <mat-icon>check_circle</mat-icon> Actif
              </span>
            } @else {
              <button class="btn-activate" (click)="activate(type)" [disabled]="saving() === type">
                @if (saving() === type) {
                  <mat-spinner diameter="14"></mat-spinner>
                } @else {
                  <mat-icon>add_circle_outline</mat-icon>
                }
                Activer
              </button>
            }
          </div>
        </div>
      }
    </div>

    @if (journals().length > 0) {
      <div class="info-card">
        <mat-icon>info</mat-icon>
        <span>
          {{ journals().length }} journal(x) actif(s). Lors de la saisie d'une écriture, sélectionnez le journal
          pour obtenir une numérotation automatique des pièces (ex. VT-2025-00042).
        </span>
      </div>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 26px; font-weight: 800; color: #0d1b2a; margin: 0 0 4px; }
    .page-sub   { font-size: 13px; color: #78909c; margin: 0; }

    .journals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .journal-card {
      border: 2px solid #e8edf2;
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: box-shadow .2s;
      &:hover { box-shadow: 0 4px 16px rgba(13,27,42,.1); }
    }

    .jc-icon-wrap {
      mat-icon { font-size: 32px; width: 32px; height: 32px; }
    }

    .jc-body { flex: 1; }
    .jc-type {
      font-size: 12px; font-weight: 800; letter-spacing: 1px;
      text-transform: uppercase; margin-bottom: 4px;
    }
    .jc-name { font-size: 16px; font-weight: 700; color: #0d1b2a; margin-bottom: 6px; }
    .jc-prefix { font-size: 12px; color: #78909c; }

    .jc-actions { display: flex; justify-content: flex-end; }

    .status-active {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 13px; font-weight: 700; color: #2e7d32;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .btn-activate {
      display: inline-flex; align-items: center; gap: 6px;
      height: 36px; padding: 0 16px; border-radius: 10px; cursor: pointer;
      border: 1.5px solid #dde6f0; background: white; color: #546e7a;
      font-size: 13px; font-weight: 600;
      transition: all .15s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover:not(:disabled) { border-color: #90caf9; color: #1565c0; background: #e3f2fd; }
      &:disabled { opacity: .5; cursor: not-allowed; }
    }

    .info-card {
      display: flex; align-items: flex-start; gap: 10px;
      background: #e8f4fd; border: 1px solid #b3d9ff;
      border-radius: 12px; padding: 14px 18px;
      font-size: 13px; color: #1565c0;
      mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }
    }
  `],
})
export class JournauxComponent implements OnInit {
  private readonly svc      = inject(JournalService);
  private readonly alertSvc = inject(AlertService);

  journals  = signal<Journal[]>([]);
  saving    = signal<JournalType | null>(null);
  allTypes  = ALL_TYPES;

  ngOnInit(): void {
    this.svc.getAll().subscribe(list => this.journals.set(list));
  }

  findJournal(type: JournalType): Journal | undefined {
    return this.journals().find(j => j.type === type);
  }

  iconOf(type: JournalType):   string { return JOURNAL_ICONS[type]; }
  labelOf(type: JournalType):  string { return JOURNAL_TYPE_LABELS[type]; }
  prefixOf(type: JournalType): string { return JOURNAL_PREFIXES[type]; }
  colorOf(type: JournalType) { return JOURNAL_COLORS[type]; }

  activate(type: JournalType): void {
    this.saving.set(type);
    this.svc.getOrCreate(type).subscribe({
      next: (j) => {
        this.journals.update(list => [...list, j]);
        this.alertSvc.success(`Journal ${type} activé`);
        this.saving.set(null);
      },
      error: () => {
        this.alertSvc.error('Erreur lors de l\'activation');
        this.saving.set(null);
      },
    });
  }
}
