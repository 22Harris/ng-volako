import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { EvenementService } from '../../../core/services/evenement.service';
import { AlertService } from '../../../shared/components/alert/alert.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EvenementFormComponent } from '../evenement-form/evenement-form.component';
import { CentsPipe } from '../../../shared/pipes/cents.pipe';
import {
  CATEGORIE_CONFIG,
  RECURRENCE_CONFIG,
  STATUT_CONFIG,
  ALL_CATEGORIES,
} from '../../../core/utils/evenement-category.utils';
import { Evenement, EvenementCategorie, EvenementStatut } from '../../../core/models/evenement.model';

@Component({
  selector: 'app-evenement-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatButtonModule, MatTooltipModule, CentsPipe],
  template: `
    <div class="page">

      <!-- ── En-tête ── -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Événements</h1>
          <p class="page-sub">Suivi de vos dépenses récurrentes</p>
        </div>
        <button class="btn-new" (click)="openForm()">
          <mat-icon>add</mat-icon>
          Nouvel événement
        </button>
      </div>

      <!-- ── KPI ── -->
      <div class="kpi-row">
        <div class="kpi-card kpi-total">
          <div class="kpi-icon"><mat-icon>account_balance_wallet</mat-icon></div>
          <div class="kpi-body">
            <span class="kpi-label">Budget mensuel</span>
            <span class="kpi-value">{{ totalMontant() | cents }}</span>
            <span class="kpi-sub">{{ filtered().length }} événement(s)</span>
          </div>
        </div>
        <div class="kpi-card kpi-paye">
          <div class="kpi-icon"><mat-icon>check_circle</mat-icon></div>
          <div class="kpi-body">
            <span class="kpi-label">Payé</span>
            <span class="kpi-value">{{ totalPaye() | cents }}</span>
            <span class="kpi-sub">{{ countPaye() }} réglé(s)</span>
          </div>
        </div>
        <div class="kpi-card kpi-attente">
          <div class="kpi-icon"><mat-icon>schedule</mat-icon></div>
          <div class="kpi-body">
            <span class="kpi-label">En attente</span>
            <span class="kpi-value">{{ totalAttente() | cents }}</span>
            <span class="kpi-sub">{{ countAttente() }} en cours</span>
          </div>
        </div>
        <div class="kpi-card kpi-retard">
          <div class="kpi-icon"><mat-icon>warning</mat-icon></div>
          <div class="kpi-body">
            <span class="kpi-label">En retard</span>
            <span class="kpi-value">{{ totalRetard() | cents }}</span>
            <span class="kpi-sub">{{ countRetard() }} en retard</span>
          </div>
        </div>
      </div>

      <!-- ── Filtres ── -->
      <div class="filters-card">
        <!-- Catégories -->
        <div class="cat-chips">
          <button class="cat-chip" [class.active]="activeCategorie() === null"
            (click)="activeCategorie.set(null)">
            <mat-icon>apps</mat-icon> Toutes
          </button>
          @for (cat of allCats; track cat) {
            <button class="cat-chip" [class.active]="activeCategorie() === cat"
              (click)="activeCategorie.set(cat)"
              [style.--fg]="catConfig[cat].fg"
              [style.--bg]="catConfig[cat].bg">
              <mat-icon>{{ catConfig[cat].icon }}</mat-icon>
              {{ catConfig[cat].label }}
            </button>
          }
        </div>
        <!-- Statut -->
        <div class="statut-tabs">
          <button class="stat-tab" [class.active]="activeStatut() === null"
            (click)="activeStatut.set(null)">Tous</button>
          <button class="stat-tab en-attente" [class.active]="activeStatut() === 'EN_ATTENTE'"
            (click)="activeStatut.set('EN_ATTENTE')">En attente</button>
          <button class="stat-tab paye" [class.active]="activeStatut() === 'PAYE'"
            (click)="activeStatut.set('PAYE')">Payé</button>
          <button class="stat-tab retard" [class.active]="activeStatut() === 'EN_RETARD'"
            (click)="activeStatut.set('EN_RETARD')">En retard</button>
        </div>
      </div>

      <!-- ── Grille de cartes ── -->
      @if (filtered().length > 0) {
        <div class="cards-grid">
          @for (ev of filtered(); track ev.id) {
            <div class="ev-card">
              <div class="card-top">
                <div class="cat-icon-wrap"
                  [style.background]="catConfig[ev.categorie].bg"
                  [style.color]="catConfig[ev.categorie].fg">
                  <mat-icon>{{ catConfig[ev.categorie].icon }}</mat-icon>
                </div>
                <div class="card-head">
                  <span class="card-titre">{{ ev.titre }}</span>
                  <span class="card-cat">{{ catConfig[ev.categorie].label }}</span>
                </div>
                <span class="statut-badge"
                  [style.background]="statutConfig[ev.statut].bg"
                  [style.color]="statutConfig[ev.statut].fg">
                  <mat-icon>{{ statutConfig[ev.statut].icon }}</mat-icon>
                  {{ statutConfig[ev.statut].label }}
                </span>
              </div>

              <div class="card-amount">{{ ev.montant | cents }}</div>

              <div class="card-meta">
                <span class="meta-item">
                  <mat-icon>calendar_today</mat-icon>
                  {{ ev.dateEcheance | date:'dd/MM/yyyy' }}
                </span>
                <span class="meta-item">
                  <mat-icon>{{ recurrenceConfig[ev.recurrence].icon }}</mat-icon>
                  {{ recurrenceConfig[ev.recurrence].label }}
                </span>
              </div>

              @if (ev.notes) {
                <p class="card-notes">{{ ev.notes }}</p>
              }

              <div class="card-actions">
                <button class="act-btn toggle"
                  [class.is-paye]="ev.statut === 'PAYE'"
                  (click)="toggleStatut(ev)"
                  [matTooltip]="ev.statut === 'PAYE' ? 'Marquer en attente' : 'Marquer comme payé'">
                  <mat-icon>{{ ev.statut === 'PAYE' ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                </button>
                <div class="act-right">
                  <button class="act-btn edit" (click)="openForm(ev)" matTooltip="Modifier">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button class="act-btn del" (click)="confirmDelete(ev)" matTooltip="Supprimer">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">
          <div class="empty-icon"><mat-icon>event_busy</mat-icon></div>
          <h3>Aucun événement</h3>
          <p>{{ activeCategorie() || activeStatut() ? 'Aucun résultat pour ces filtres.' : 'Commencez par créer un événement récurrent.' }}</p>
          @if (!activeCategorie() && !activeStatut()) {
            <button class="btn-new" (click)="openForm()">
              <mat-icon>add</mat-icon> Créer un événement
            </button>
          }
        </div>
      }

    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 20px; }

    /* ── Header ── */
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      flex-wrap: wrap; gap: 12px;
    }
    .page-title { font-size: 26px; font-weight: 800; color: #0d1b2a; margin: 0 0 4px; }
    .page-sub   { font-size: 13px; color: #78909c; margin: 0; }
    .btn-new {
      display: flex; align-items: center; gap: 8px;
      height: 44px; padding: 0 22px; border: none; border-radius: 12px; cursor: pointer;
      background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
      color: white; font-size: 14px; font-weight: 700;
      box-shadow: 0 4px 14px rgba(21,101,192,.4);
      transition: box-shadow .2s, transform .15s;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
      &:hover { box-shadow: 0 8px 24px rgba(21,101,192,.55); transform: translateY(-1px); }
    }

    /* ── KPI ── */
    .kpi-row {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
    }
    .kpi-card {
      background: white; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      padding: 18px 20px; display: flex; align-items: center; gap: 16px;
      border-left: 4px solid transparent;
    }
    .kpi-total  { border-left-color: #1565c0; .kpi-icon { background: #e3f2fd; color: #1565c0; } }
    .kpi-paye   { border-left-color: #2e7d32; .kpi-icon { background: #e8f5e9; color: #2e7d32; } }
    .kpi-attente{ border-left-color: #f57f17; .kpi-icon { background: #fff8e1; color: #f57f17; } }
    .kpi-retard { border-left-color: #c62828; .kpi-icon { background: #fde8e8; color: #c62828; } }
    .kpi-icon {
      width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 24px; width: 24px; height: 24px; }
    }
    .kpi-body { display: flex; flex-direction: column; min-width: 0; }
    .kpi-label { font-size: 11px; font-weight: 700; color: #78909c; text-transform: uppercase; letter-spacing: .5px; }
    .kpi-value { font-size: 18px; font-weight: 800; color: #0d1b2a; line-height: 1.3; }
    .kpi-sub   { font-size: 11px; color: #90a4ae; }

    /* ── Filtres ── */
    .filters-card {
      background: white; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      padding: 16px 20px; display: flex; flex-direction: column; gap: 12px;
    }
    .cat-chips {
      display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
    }
    .cat-chip {
      display: flex; align-items: center; gap: 6px;
      height: 34px; padding: 0 12px; border-radius: 20px; cursor: pointer;
      border: 1.5px solid #e2e8f0; background: white;
      font-size: 13px; font-weight: 500; color: #546e7a;
      transition: all .15s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { border-color: #90a4ae; background: #f5f7fa; }
      &.active {
        border-color: var(--fg, #1565c0);
        background: var(--bg, #e3f2fd);
        color: var(--fg, #1565c0);
        font-weight: 700;
      }
    }
    .statut-tabs { display: flex; gap: 6px; }
    .stat-tab {
      height: 32px; padding: 0 14px; border-radius: 8px; cursor: pointer;
      border: 1.5px solid #e2e8f0; background: white;
      font-size: 12px; font-weight: 600; color: #546e7a;
      transition: all .15s;
      &:hover { border-color: #90a4ae; }
      &.active { background: #0d1b2a; border-color: #0d1b2a; color: white; }
      &.en-attente.active { background: #f57f17; border-color: #f57f17; color: white; }
      &.paye.active       { background: #2e7d32; border-color: #2e7d32; color: white; }
      &.retard.active     { background: #c62828; border-color: #c62828; color: white; }
    }

    /* ── Grille de cartes ── */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .ev-card {
      background: white; border-radius: 18px;
      box-shadow: 0 2px 10px rgba(13,27,42,.08);
      padding: 20px; display: flex; flex-direction: column; gap: 14px;
      transition: box-shadow .2s, transform .15s;
      &:hover { box-shadow: 0 8px 28px rgba(13,27,42,.13); transform: translateY(-2px); }
    }
    .card-top {
      display: flex; align-items: flex-start; gap: 12px;
    }
    .cat-icon-wrap {
      width: 44px; height: 44px; border-radius: 13px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    .card-head { flex: 1; min-width: 0; }
    .card-titre { display: block; font-size: 15px; font-weight: 700; color: #0d1b2a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .card-cat   { display: block; font-size: 12px; color: #90a4ae; margin-top: 2px; }
    .statut-badge {
      display: flex; align-items: center; gap: 4px; flex-shrink: 0;
      height: 26px; padding: 0 10px; border-radius: 20px;
      font-size: 11px; font-weight: 700; white-space: nowrap;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }
    .card-amount {
      font-size: 28px; font-weight: 800; color: #0d1b2a;
      letter-spacing: -.5px; line-height: 1;
    }
    .card-meta {
      display: flex; gap: 16px; flex-wrap: wrap;
    }
    .meta-item {
      display: flex; align-items: center; gap: 5px;
      font-size: 12px; color: #78909c;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .card-notes {
      font-size: 12px; color: #90a4ae; margin: 0;
      background: #f8fafc; border-radius: 8px; padding: 8px 10px;
      border-left: 3px solid #dde6f0; line-height: 1.5;
    }
    .card-actions {
      display: flex; align-items: center; justify-content: space-between;
      padding-top: 10px; border-top: 1px solid #f0f4f8; margin-top: auto;
    }
    .act-right { display: flex; gap: 4px; }
    .act-btn {
      width: 34px; height: 34px; border-radius: 9px; border: none; cursor: pointer;
      background: #f5f7fa; display: flex; align-items: center; justify-content: center;
      color: #90a4ae; transition: background .15s, color .15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { background: #e8edf2; color: #0d1b2a; }
      &.toggle { width: auto; padding: 0 12px; gap: 6px; font-size: 13px; font-weight: 600;
        &:hover { background: #e8f5e9; color: #2e7d32; }
        &.is-paye { background: #e8f5e9; color: #2e7d32; }
      }
      &.edit:hover { background: #e3f2fd; color: #1565c0; }
      &.del:hover  { background: #fde8e8; color: #c62828; }
    }

    /* ── Empty state ── */
    .empty-state {
      text-align: center; padding: 60px 24px;
      display: flex; flex-direction: column; align-items: center; gap: 14px;
      background: white; border-radius: 18px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
    }
    .empty-icon {
      width: 72px; height: 72px; border-radius: 20px;
      background: #e3f2fd; color: #1565c0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 36px; width: 36px; height: 36px; }
    }
    .empty-state h3 { font-size: 18px; font-weight: 800; color: #0d1b2a; margin: 0; }
    .empty-state p  { font-size: 14px; color: #90a4ae; margin: 0; }

    @media (max-width: 1100px) { .cards-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 700px)  {
      .cards-grid { grid-template-columns: 1fr; }
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
    }
  `],
})
export class EvenementListComponent implements OnInit {
  private readonly service   = inject(EvenementService);
  private readonly alert     = inject(AlertService);
  private readonly dialog    = inject(MatDialog);

  evenements = signal<Evenement[]>([]);
  activeCategorie = signal<EvenementCategorie | null>(null);
  activeStatut    = signal<EvenementStatut | null>(null);

  readonly catConfig       = CATEGORIE_CONFIG;
  readonly recurrenceConfig = RECURRENCE_CONFIG;
  readonly statutConfig    = STATUT_CONFIG;
  readonly allCats         = ALL_CATEGORIES;

  filtered = computed(() => {
    let list = this.evenements();
    if (this.activeCategorie()) list = list.filter(e => e.categorie === this.activeCategorie());
    if (this.activeStatut())    list = list.filter(e => e.statut === this.activeStatut());
    return list;
  });

  totalMontant  = computed(() => this.filtered().reduce((s, e) => s + e.montant, 0));
  totalPaye     = computed(() => this.filtered().filter(e => e.statut === 'PAYE').reduce((s, e) => s + e.montant, 0));
  totalAttente  = computed(() => this.filtered().filter(e => e.statut === 'EN_ATTENTE').reduce((s, e) => s + e.montant, 0));
  totalRetard   = computed(() => this.filtered().filter(e => e.statut === 'EN_RETARD').reduce((s, e) => s + e.montant, 0));
  countPaye     = computed(() => this.filtered().filter(e => e.statut === 'PAYE').length);
  countAttente  = computed(() => this.filtered().filter(e => e.statut === 'EN_ATTENTE').length);
  countRetard   = computed(() => this.filtered().filter(e => e.statut === 'EN_RETARD').length);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.service.getAll().subscribe(list => this.evenements.set(list));
  }

  openForm(ev?: Evenement): void {
    const ref = this.dialog.open(EvenementFormComponent, {
      data: { evenement: ev },
      panelClass: 'volako-dialog',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.load(); });
  }

  toggleStatut(ev: Evenement): void {
    const newStatut = ev.statut === 'PAYE' ? 'EN_ATTENTE' : 'PAYE';
    this.service.update(ev.id, { statut: newStatut }).subscribe(() => {
      this.alert.success(newStatut === 'PAYE' ? 'Marqué comme payé' : 'Remis en attente');
      this.load();
    });
  }

  confirmDelete(ev: Evenement): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Supprimer l\'événement', message: `Supprimer "${ev.titre}" ?` },
    });
    ref.afterClosed().subscribe(ok => {
      if (ok) {
        this.service.delete(ev.id).subscribe(() => {
          this.alert.success('Événement supprimé');
          this.load();
        });
      }
    });
  }
}
