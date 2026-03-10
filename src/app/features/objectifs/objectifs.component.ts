import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ObjectifService } from '../../core/services/objectif.service';
import { Objectif, ObjectifStatut, ObjectifCategorie, CreateObjectifDto } from '../../core/models/objectif.model';
import { CentsPipe } from '../../shared/pipes/cents.pipe';
import { AlertService } from '../../shared/components/alert/alert.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

type FilterStatut = 'TOUT' | ObjectifStatut;

const CAT_META: Record<string, { label: string; icon: string; color: string }> = {
  SECURITE:       { label: 'Sécurité',       icon: 'shield',          color: '#1565c0' },
  EPARGNE:        { label: 'Épargne',         icon: 'savings',         color: '#2e7d32' },
  INVESTISSEMENT: { label: 'Investissement',  icon: 'trending_up',     color: '#006064' },
  REMBOURSEMENT:  { label: 'Remboursement',   icon: 'credit_card',     color: '#bf360c' },
  PROJET:         { label: 'Projet',          icon: 'rocket_launch',   color: '#f57f17' },
  RETRAITE:       { label: 'Retraite',        icon: 'elderly',         color: '#4a148c' },
  AUTRE:          { label: 'Autre',           icon: 'category',        color: '#546e7a' },
};

@Component({
  selector: 'app-objectifs',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule, CentsPipe, DatePipe],
  template: `
    <div class="page">

      <!-- ── Header ── -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Objectifs d'épargne</h1>
          <p class="page-sub">Suivez vos projets financiers et votre progression</p>
        </div>
        <button class="btn-new" (click)="openForm()">
          <mat-icon>add</mat-icon>
          Nouvel objectif
        </button>
      </div>

      <!-- ── KPI global ── -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-blue">
          <div class="kpi-icon"><mat-icon>flag</mat-icon></div>
          <div>
            <p class="kpi-label">Total à atteindre</p>
            <p class="kpi-val">{{ totalCible() | cents }}</p>
          </div>
        </div>
        <div class="kpi-card kpi-green">
          <div class="kpi-icon"><mat-icon>savings</mat-icon></div>
          <div>
            <p class="kpi-label">Total épargné</p>
            <p class="kpi-val">{{ totalActuel() | cents }}</p>
          </div>
        </div>
        <div class="kpi-card kpi-teal">
          <div class="kpi-icon"><mat-icon>percent</mat-icon></div>
          <div>
            <p class="kpi-label">Progression globale</p>
            <p class="kpi-val">{{ progressionGlobale() }}%</p>
          </div>
        </div>
        <div class="kpi-card kpi-amber">
          <div class="kpi-icon"><mat-icon>emoji_events</mat-icon></div>
          <div>
            <p class="kpi-label">Objectifs atteints</p>
            <p class="kpi-val">{{ objectifsAtteints() }} / {{ objectifs().length }}</p>
          </div>
        </div>
      </div>

      <!-- ── Barre de progression globale ── -->
      <div class="global-bar-card">
        <div class="gb-header">
          <span class="gb-label">Progression globale de tous les objectifs</span>
          <span class="gb-pct">{{ progressionGlobale() }}%</span>
        </div>
        <div class="gb-track">
          <div class="gb-fill" [style.width.%]="progressionGlobale()"></div>
        </div>
        <p class="gb-sub">
          {{ totalActuel() | cents }} épargnés sur {{ totalCible() | cents }} ciblés
          — {{ (totalCible() - totalActuel()) | cents }} restants
        </p>
      </div>

      <!-- ── Filtres ── -->
      <div class="filter-bar">
        @for (btn of filterBtns; track btn.val) {
          <button class="filter-btn" [class.active]="filterStatut() === btn.val"
                  (click)="filterStatut.set(btn.val)">
            {{ btn.label }}
          </button>
        }
      </div>

      <!-- ── Grille objectifs ── -->
      @if (filtered().length === 0) {
        <div class="empty-state">
          <mat-icon>flag</mat-icon>
          <p>Aucun objectif pour le moment</p>
          <button class="btn-new" (click)="openForm()">
            <mat-icon>add</mat-icon>Créer un objectif
          </button>
        </div>
      } @else {
        <div class="obj-grid">
          @for (obj of filtered(); track obj.id) {
            <div class="obj-card" [class.atteint]="obj.statut === 'ATTEINT'">

              <!-- Header -->
              <div class="obj-header">
                <div class="obj-icon-wrap" [style.background]="obj.couleur + '22'">
                  <mat-icon [style.color]="obj.couleur">{{ obj.icone }}</mat-icon>
                </div>
                <div class="obj-header-info">
                  <p class="obj-nom">{{ obj.nom }}</p>
                  <span class="cat-badge" [style.background]="catMeta(obj.categorie).color + '22'"
                                          [style.color]="catMeta(obj.categorie).color">
                    {{ catMeta(obj.categorie).label }}
                  </span>
                </div>
                <span class="statut-badge" [class]="'st-' + obj.statut.toLowerCase()">
                  {{ statutLabel(obj.statut) }}
                </span>
              </div>

              <!-- Description -->
              @if (obj.description) {
                <p class="obj-desc">{{ obj.description }}</p>
              }

              <!-- Montants -->
              <div class="obj-amounts">
                <div class="oa-item">
                  <span class="oa-label">Épargné</span>
                  <span class="oa-val" [style.color]="obj.couleur">{{ obj.montantActuel | cents }}</span>
                </div>
                <div class="oa-sep">/</div>
                <div class="oa-item">
                  <span class="oa-label">Cible</span>
                  <span class="oa-val">{{ obj.montantCible | cents }}</span>
                </div>
                <div class="oa-pct">{{ progressionObj(obj) }}%</div>
              </div>

              <!-- Barre de progression -->
              <div class="prog-track">
                <div class="prog-fill"
                  [style.width.%]="progressionObj(obj)"
                  [style.background]="obj.statut === 'ATTEINT' ? '#43a047' : obj.couleur">
                </div>
              </div>
              <div class="prog-sub">
                <span>{{ (obj.montantCible - obj.montantActuel) | cents }} restants</span>
                <span>Échéance : {{ obj.dateEcheance | date:'dd/MM/yyyy' }}</span>
              </div>

              <!-- Délai restant -->
              @if (obj.statut === 'EN_COURS') {
                <div class="days-left" [class.urgent]="daysLeft(obj.dateEcheance) < 30">
                  <mat-icon>schedule</mat-icon>
                  {{ daysLeft(obj.dateEcheance) }} jours restants
                </div>
              }

              <!-- Actions -->
              <div class="obj-actions">
                @if (obj.statut === 'EN_COURS') {
                  <button class="obj-btn btn-versement" (click)="openVersement(obj)"
                          matTooltip="Ajouter un versement">
                    <mat-icon>add</mat-icon>
                    Verser
                  </button>
                }
                @if (obj.statut === 'ATTEINT') {
                  <div class="atteint-badge">
                    <mat-icon>emoji_events</mat-icon>
                    Objectif atteint !
                  </div>
                }
                <div class="obj-icons">
                  <button class="icon-btn" (click)="togglePause(obj)" matTooltip="{{ obj.statut === 'EN_PAUSE' ? 'Reprendre' : 'Mettre en pause' }}">
                    <mat-icon>{{ obj.statut === 'EN_PAUSE' ? 'play_arrow' : 'pause' }}</mat-icon>
                  </button>
                  <button class="icon-btn danger" (click)="deleteObj(obj)" matTooltip="Supprimer">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>

            </div>
          }
        </div>
      }

      <!-- ── Versement dialog (inline) ── -->
      @if (versementObjId()) {
        <div class="versement-overlay" (click)="cancelVersement()">
          <div class="versement-modal" (click)="$event.stopPropagation()">
            <h3>Ajouter un versement</h3>
            <p>{{ versementObjNom() }}</p>
            <label class="v-label">Montant (Ar)</label>
            <input class="v-input" type="number" [(ngModel)]="versementMontant" placeholder="0"
                   (keyup.enter)="confirmVersement()"/>
            <div class="v-actions">
              <button class="v-btn-cancel" (click)="cancelVersement()">Annuler</button>
              <button class="v-btn-save" (click)="confirmVersement()">
                <mat-icon>add</mat-icon>Enregistrer
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ── Formulaire création objectif ── -->
      @if (formOpen()) {
        <div class="versement-overlay" (click)="cancelForm()">
          <div class="versement-modal create-modal" (click)="$event.stopPropagation()">
            <h3>Nouvel objectif</h3>

            <label class="v-label">Nom *</label>
            <input class="v-input" [(ngModel)]="formNom" placeholder="ex: Fonds d'urgence"/>

            <label class="v-label">Description</label>
            <input class="v-input" [(ngModel)]="formDesc" placeholder="(optionnel)"/>

            <div class="form-row">
              <div class="form-col">
                <label class="v-label">Catégorie *</label>
                <select class="v-input v-select" [(ngModel)]="formCategorie">
                  @for (cat of categories; track cat.val) {
                    <option [value]="cat.val">{{ cat.label }}</option>
                  }
                </select>
              </div>
              <div class="form-col">
                <label class="v-label">Icône Material</label>
                <select class="v-input v-select" [(ngModel)]="formIcone">
                  @for (ic of iconOptions; track ic) {
                    <option [value]="ic">{{ ic }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-col">
                <label class="v-label">Montant cible (Ar) *</label>
                <input class="v-input" type="number" min="1" [(ngModel)]="formMontantCible" placeholder="0"/>
              </div>
              <div class="form-col">
                <label class="v-label">Déjà épargné (Ar)</label>
                <input class="v-input" type="number" min="0" [(ngModel)]="formMontantActuel" placeholder="0"/>
              </div>
            </div>

            <div class="form-row">
              <div class="form-col">
                <label class="v-label">Date de début *</label>
                <input class="v-input" type="date" [(ngModel)]="formDateDebut"/>
              </div>
              <div class="form-col">
                <label class="v-label">Date d'échéance *</label>
                <input class="v-input" type="date" [(ngModel)]="formDateEcheance"/>
              </div>
            </div>

            <label class="v-label">Couleur</label>
            <div class="color-row">
              @for (c of colorOptions; track c) {
                <button class="color-swatch" [style.background]="c"
                        [class.selected]="formCouleur === c"
                        (click)="formCouleur = c"></button>
              }
            </div>

            <div class="v-actions">
              <button class="v-btn-cancel" (click)="cancelForm()">Annuler</button>
              <button class="v-btn-save" (click)="confirmCreate()"
                      [disabled]="!formNom || formMontantCible <= 0 || !formDateDebut || !formDateEcheance">
                <mat-icon>add</mat-icon>Créer
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 20px; padding-bottom: 32px; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-title  { font-size: 26px; font-weight: 800; color: #0d1b2a; margin: 0 0 4px; }
    .page-sub    { font-size: 13px; color: #78909c; margin: 0; }

    .btn-new {
      display: flex; align-items: center; gap: 8px; padding: 10px 20px;
      border-radius: 10px; border: none; cursor: pointer;
      background: #1565c0; color: white; font-size: 13px; font-weight: 600;
      transition: background .15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { background: #0d47a1; }
    }

    /* ── KPI ── */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .kpi-card {
      background: white; border-radius: 14px; padding: 16px 18px;
      display: flex; align-items: center; gap: 14px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07); border-left: 4px solid transparent;
    }
    .kpi-blue  { border-color: #1565c0; .kpi-icon { background: #e3f2fd; color: #1565c0; } }
    .kpi-green { border-color: #2e7d32; .kpi-icon { background: #e8f5e9; color: #2e7d32; } }
    .kpi-teal  { border-color: #006064; .kpi-icon { background: #e0f7fa; color: #006064; } }
    .kpi-amber { border-color: #f57f17; .kpi-icon { background: #fff8e1; color: #f57f17; } }
    .kpi-icon {
      width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    .kpi-label { font-size: 11px; color: #78909c; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; margin: 0 0 4px; }
    .kpi-val   { font-size: 17px; font-weight: 800; color: #0d1b2a; margin: 0; }

    /* ── Global bar ── */
    .global-bar-card {
      background: white; border-radius: 14px; padding: 18px 22px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
    }
    .gb-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .gb-label  { font-size: 13px; font-weight: 600; color: #263238; }
    .gb-pct    { font-size: 18px; font-weight: 800; color: #1565c0; }
    .gb-track  { height: 14px; background: #f0f4f8; border-radius: 7px; overflow: hidden; margin-bottom: 8px; }
    .gb-fill   { height: 100%; background: linear-gradient(90deg, #1565c0, #42a5f5); border-radius: 7px; transition: width .7s cubic-bezier(.4,0,.2,1); }
    .gb-sub    { font-size: 12px; color: #78909c; margin: 0; }

    /* ── Filters ── */
    .filter-bar {
      display: flex; gap: 6px; flex-wrap: wrap;
      background: white; border-radius: 12px; padding: 10px 14px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
    }
    .filter-btn {
      padding: 7px 14px; border-radius: 8px; border: none; cursor: pointer;
      font-size: 12px; font-weight: 600; background: #f0f4f8; color: #546e7a;
      transition: background .15s, color .15s;
      &:hover  { background: #e0e8f0; color: #263238; }
      &.active { background: #1565c0; color: white; }
    }

    /* ── Obj grid ── */
    .obj-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .obj-card {
      background: white; border-radius: 16px; padding: 20px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      display: flex; flex-direction: column; gap: 14px;
      transition: box-shadow .15s;
      &:hover { box-shadow: 0 4px 16px rgba(13,27,42,.12); }
      &.atteint { border: 2px solid #66bb6a; background: #f9fff9; }
    }

    .obj-header { display: flex; align-items: flex-start; gap: 12px; }
    .obj-icon-wrap {
      width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    .obj-header-info { flex: 1; min-width: 0; }
    .obj-nom { font-size: 14px; font-weight: 700; color: #0d1b2a; margin: 0 0 4px; }
    .cat-badge {
      font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 12px;
    }
    .statut-badge {
      padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 800;
      text-transform: uppercase; letter-spacing: .3px; flex-shrink: 0;
    }
    .st-en_cours   { background: #e3f2fd; color: #1565c0; }
    .st-atteint    { background: #e8f5e9; color: #2e7d32; }
    .st-en_pause   { background: #fff8e1; color: #f57f17; }
    .st-abandonne  { background: #f0f0f0; color: #78909c; }

    .obj-desc { font-size: 12px; color: #78909c; margin: 0; }

    .obj-amounts { display: flex; align-items: center; gap: 8px; }
    .oa-item { display: flex; flex-direction: column; }
    .oa-label { font-size: 10px; color: #90a4ae; font-weight: 600; text-transform: uppercase; }
    .oa-val   { font-size: 14px; font-weight: 700; color: #0d1b2a; }
    .oa-sep   { font-size: 18px; color: #b0bec5; margin: 0 4px; }
    .oa-pct   { margin-left: auto; font-size: 20px; font-weight: 900; color: #263238; }

    .prog-track { height: 10px; background: #f0f4f8; border-radius: 5px; overflow: hidden; }
    .prog-fill  { height: 100%; border-radius: 5px; transition: width .6s cubic-bezier(.4,0,.2,1); }
    .prog-sub {
      display: flex; justify-content: space-between;
      font-size: 11px; color: #90a4ae;
    }

    .days-left {
      display: flex; align-items: center; gap: 5px;
      font-size: 11px; font-weight: 600; color: #546e7a;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
      &.urgent { color: #c62828; }
    }

    .obj-actions { display: flex; align-items: center; gap: 8px; padding-top: 4px; border-top: 1px solid #f0f4f8; }
    .obj-btn {
      display: flex; align-items: center; gap: 5px; padding: 7px 14px;
      border-radius: 8px; border: none; cursor: pointer; font-size: 12px; font-weight: 700;
      transition: background .15s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .btn-versement { background: #e3f2fd; color: #1565c0; &:hover { background: #bbdefb; } }

    .atteint-badge {
      display: flex; align-items: center; gap: 5px; flex: 1;
      font-size: 12px; font-weight: 700; color: #2e7d32;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #fbc02d; }
    }

    .obj-icons { display: flex; gap: 4px; margin-left: auto; }
    .icon-btn {
      display: flex; align-items: center; justify-content: center;
      width: 30px; height: 30px; border: none; border-radius: 7px;
      background: transparent; cursor: pointer; color: #78909c; transition: background .12s;
      mat-icon { font-size: 16px; }
      &:hover  { background: #f0f4f8; color: #0d1b2a; }
      &.danger:hover { background: #fde8e8; color: #c62828; }
    }

    /* ── Empty ── */
    .empty-state {
      background: white; border-radius: 14px; padding: 56px 24px;
      text-align: center; color: #90a4ae; box-shadow: 0 2px 8px rgba(13,27,42,.07);
      mat-icon {
        font-size: 64px; width: 64px; height: 64px; margin-bottom: 16px;
        color: #bbdefb; display: block; margin-left: auto; margin-right: auto;
      }
      p { font-size: 15px; margin: 0 0 28px; }
      .btn-new {
        display: inline-flex;
        background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
        padding: 14px 32px; font-size: 14px; border-radius: 12px;
        box-shadow: 0 4px 16px rgba(21,101,192,.35);
        transition: background .2s, box-shadow .2s, transform .15s;
        &:hover {
          background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%);
          box-shadow: 0 6px 24px rgba(21,101,192,.45);
          transform: translateY(-2px);
        }
      }
    }

    /* ── Versement overlay ── */
    .versement-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn .15s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .versement-modal {
      background: white; border-radius: 16px; padding: 28px 32px; width: 360px;
      box-shadow: 0 8px 32px rgba(0,0,0,.25);
      h3 { font-size: 18px; font-weight: 800; color: #0d1b2a; margin: 0 0 4px; }
      p  { font-size: 13px; color: #78909c; margin: 0 0 20px; }
    }
    .create-modal { width: 520px; }
    .form-row { display: flex; gap: 14px; }
    .form-col  { flex: 1; display: flex; flex-direction: column; }
    .v-select  { font-weight: 600; font-size: 13px; }
    .color-row { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .color-swatch {
      width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent; cursor: pointer;
      transition: transform .15s, border-color .15s;
      &:hover   { transform: scale(1.15); }
      &.selected { border-color: #0d1b2a; transform: scale(1.15); }
    }
    .v-label { font-size: 12px; font-weight: 700; color: #546e7a; display: block; margin-bottom: 6px; }
    .v-input {
      width: 100%; padding: 10px 14px; border: 1px solid #dde3ea; border-radius: 8px;
      font-size: 14px; color: #0d1b2a; margin-bottom: 16px; box-sizing: border-box;
      &:focus { outline: none; border-color: #1565c0; }
    }
    .v-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }
    .v-btn-cancel {
      padding: 10px 18px; border-radius: 8px; border: 1px solid #dde3ea;
      background: white; color: #546e7a; font-size: 13px; font-weight: 600; cursor: pointer;
      &:hover { background: #f0f4f8; }
    }
    .v-btn-save {
      display: flex; align-items: center; gap: 6px; padding: 10px 18px;
      border-radius: 8px; border: none; background: #1565c0; color: white;
      font-size: 13px; font-weight: 700; cursor: pointer;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover    { background: #0d47a1; }
      &:disabled { background: #b0bec5; cursor: default; }
    }

    @media (max-width: 1200px) { .obj-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 1000px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 700px)  { .obj-grid { grid-template-columns: 1fr; } }
  `],
})
export class ObjectifsComponent implements OnInit {
  private readonly objectifService = inject(ObjectifService);
  private readonly alert           = inject(AlertService);
  private readonly dialog          = inject(MatDialog);

  objectifs   = signal<Objectif[]>([]);
  filterStatut = signal<FilterStatut>('TOUT');

  // Versement state
  versementObjId  = signal<number | null>(null);
  versementObjNom = signal('');
  versementMontant = 0;

  // Création objectif state
  formOpen           = signal(false);
  formNom            = '';
  formDesc           = '';
  formCategorie: ObjectifCategorie = 'EPARGNE';
  formMontantCible   = 0;
  formMontantActuel  = 0;
  formDateDebut      = '';
  formDateEcheance   = '';
  formCouleur        = '#1565c0';
  formIcone          = 'savings';

  readonly categories: { val: ObjectifCategorie; label: string }[] = [
    { val: 'EPARGNE',        label: 'Épargne' },
    { val: 'SECURITE',       label: 'Sécurité' },
    { val: 'INVESTISSEMENT', label: 'Investissement' },
    { val: 'REMBOURSEMENT',  label: 'Remboursement' },
    { val: 'PROJET',         label: 'Projet' },
    { val: 'RETRAITE',       label: 'Retraite' },
    { val: 'AUTRE',          label: 'Autre' },
  ];

  readonly iconOptions = [
    'savings', 'shield', 'trending_up', 'credit_card',
    'rocket_launch', 'elderly', 'home', 'directions_car',
    'school', 'beach_access', 'medical_services', 'category',
  ];

  readonly colorOptions = [
    '#1565c0', '#2e7d32', '#006064', '#bf360c',
    '#f57f17', '#4a148c', '#880e4f', '#546e7a',
  ];

  readonly filterBtns: { val: FilterStatut; label: string }[] = [
    { val: 'TOUT',        label: 'Tous' },
    { val: 'EN_COURS',    label: 'En cours' },
    { val: 'ATTEINT',     label: 'Atteints' },
    { val: 'EN_PAUSE',    label: 'En pause' },
    { val: 'ABANDONNE',   label: 'Abandonnés' },
  ];

  ngOnInit(): void {
    this.objectifService.getAll().subscribe(list => this.objectifs.set(list));
  }

  filtered = computed(() => {
    const f = this.filterStatut();
    return f === 'TOUT' ? this.objectifs() : this.objectifs().filter(o => o.statut === f);
  });

  totalCible         = computed(() => this.objectifs().reduce((s, o) => s + o.montantCible,  0));
  totalActuel        = computed(() => this.objectifs().reduce((s, o) => s + o.montantActuel, 0));
  progressionGlobale = computed(() =>
    this.totalCible() > 0 ? Math.round(this.totalActuel() / this.totalCible() * 100) : 0
  );
  objectifsAtteints  = computed(() => this.objectifs().filter(o => o.statut === 'ATTEINT').length);

  progressionObj(obj: Objectif): number {
    return obj.montantCible > 0 ? Math.min(Math.round(obj.montantActuel / obj.montantCible * 100), 100) : 0;
  }

  daysLeft(dateEcheance: string): number {
    const today = new Date('2026-03-03');
    const echeance = new Date(dateEcheance);
    return Math.max(0, Math.round((echeance.getTime() - today.getTime()) / 86_400_000));
  }

  catMeta(cat: string) { return CAT_META[cat] ?? CAT_META['AUTRE']; }

  statutLabel(s: ObjectifStatut): string {
    return { EN_COURS: 'En cours', ATTEINT: 'Atteint', EN_PAUSE: 'En pause', ABANDONNE: 'Abandonné' }[s] ?? s;
  }

  openForm(): void {
    this.formNom           = '';
    this.formDesc          = '';
    this.formCategorie     = 'EPARGNE';
    this.formMontantCible  = 0;
    this.formMontantActuel = 0;
    this.formDateDebut     = '2026-03-06';
    this.formDateEcheance  = '';
    this.formCouleur       = '#1565c0';
    this.formIcone         = 'savings';
    this.formOpen.set(true);
  }

  cancelForm(): void { this.formOpen.set(false); }

  confirmCreate(): void {
    if (!this.formNom || this.formMontantCible <= 0 || !this.formDateDebut || !this.formDateEcheance) return;
    const dto: CreateObjectifDto = {
      nom:           this.formNom,
      description:   this.formDesc || undefined,
      categorie:     this.formCategorie,
      montantCible:  this.formMontantCible,
      montantActuel: this.formMontantActuel,
      dateDebut:     this.formDateDebut,
      dateEcheance:  this.formDateEcheance,
      couleur:       this.formCouleur,
      icone:         this.formIcone,
      statut:        'EN_COURS',
    };
    this.objectifService.create(dto).subscribe(created => {
      this.objectifs.update(list => [...list, created]);
      this.formOpen.set(false);
      this.alert.success('Objectif créé avec succès');
    });
  }

  togglePause(obj: Objectif): void {
    const newStatut: ObjectifStatut = obj.statut === 'EN_PAUSE' ? 'EN_COURS' : 'EN_PAUSE';
    this.objectifService.update(obj.id, { statut: newStatut }).subscribe(updated => {
      this.objectifs.update(list => list.map(o => o.id === updated.id ? updated : o));
      this.alert.success(newStatut === 'EN_PAUSE' ? 'Objectif mis en pause' : 'Objectif repris');
    });
  }

  deleteObj(obj: Objectif): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Supprimer l\'objectif', message: `Supprimer "${obj.nom}" définitivement ?` },
      panelClass: 'volako-dialog',
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.objectifService.delete(obj.id).subscribe(() => {
        this.objectifs.update(list => list.filter(o => o.id !== obj.id));
        this.alert.success('Objectif supprimé');
      });
    });
  }

  openVersement(obj: Objectif): void {
    this.versementObjId.set(obj.id);
    this.versementObjNom.set(obj.nom);
    this.versementMontant = 0;
  }
  cancelVersement(): void { this.versementObjId.set(null); }

  confirmVersement(): void {
    const id = this.versementObjId();
    if (!id || this.versementMontant <= 0) return;
    this.objectifService.versement(id, this.versementMontant).subscribe(updated => {
      this.objectifs.update(list => list.map(o => o.id === updated.id ? updated : o));
      this.versementObjId.set(null);
      this.alert.success(`Versement de ${this.versementMontant.toLocaleString('fr-FR')} Ar enregistré`);
    });
  }
}
