import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BudgetService } from '../../core/services/budget.service';
import { AccountService } from '../../core/services/account.service';
import { JournalEntryService } from '../../core/services/journal-entry.service';
import { Budget, BudgetLigne } from '../../core/models/budget.model';
import { Account } from '../../core/models/account.model';
import { JournalEntry } from '../../core/models/journal-entry.model';
import { CentsPipe } from '../../shared/pipes/cents.pipe';
import { AlertService } from '../../shared/components/alert/alert.service';

const MONTHS_FR = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

interface EnrichedLigne extends BudgetLigne {
  montantReel: number;
  ecart: number;        // reel - prevu (négatif = sous le budget = bien pour charges)
  ecartPct: number;
  isOverBudget: boolean;
}

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule, CentsPipe],
  template: `
    <div class="page">

      <!-- ── Header ── -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Budget prévisionnel</h1>
          <p class="page-sub">Prévu vs réel · Suivi mensuel</p>
        </div>
        <div class="header-actions">
          <button class="btn-add" (click)="addLigne()">
            <mat-icon>add</mat-icon>
            Ajouter une ligne
          </button>
        </div>
      </div>

      <!-- ── Sélecteur de mois ── -->
      <div class="month-nav">
        <button class="mnav-btn" (click)="prevMois()">
          <mat-icon>chevron_left</mat-icon>
        </button>
        <div class="mnav-label">
          <mat-icon>calendar_month</mat-icon>
          {{ monthLabel() }}
        </div>
        <button class="mnav-btn" (click)="nextMois()">
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>

      <!-- ── KPI résumé ── -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-green">
          <div class="kpi-icon"><mat-icon>trending_up</mat-icon></div>
          <div class="kpi-body">
            <p class="kpi-label">Produits prévus</p>
            <p class="kpi-val">{{ totalPrevuProduits() | cents }}</p>
            <p class="kpi-sub">Réel : {{ totalReelProduits() | cents }}</p>
          </div>
        </div>
        <div class="kpi-card kpi-red">
          <div class="kpi-icon"><mat-icon>trending_down</mat-icon></div>
          <div class="kpi-body">
            <p class="kpi-label">Charges prévues</p>
            <p class="kpi-val">{{ totalPrevuCharges() | cents }}</p>
            <p class="kpi-sub">Réel : {{ totalReelCharges() | cents }}</p>
          </div>
        </div>
        <div class="kpi-card" [class.kpi-profit]="resultatPrevu() >= 0" [class.kpi-loss]="resultatPrevu() < 0">
          <div class="kpi-icon">
            <mat-icon>{{ resultatPrevu() >= 0 ? 'thumb_up' : 'thumb_down' }}</mat-icon>
          </div>
          <div class="kpi-body">
            <p class="kpi-label">Résultat prévu</p>
            <p class="kpi-val">{{ resultatPrevu() | cents }}</p>
            <p class="kpi-sub">Réel : {{ resultatReel() | cents }}</p>
          </div>
        </div>
        <div class="kpi-card" [class.kpi-warn]="tauxRealisationProduits() < 80" [class.kpi-ok]="tauxRealisationProduits() >= 80">
          <div class="kpi-icon"><mat-icon>percent</mat-icon></div>
          <div class="kpi-body">
            <p class="kpi-label">Taux de réalisation</p>
            <p class="kpi-val">{{ tauxRealisationProduits() }}%</p>
            <p class="kpi-sub">Produits réels / prévus</p>
          </div>
        </div>
      </div>

      <!-- ── Barre budget global ── -->
      @if (totalPrevuProduits() > 0) {
        <div class="budget-bar-card">
          <div class="bb-header">
            <span class="bb-title">Réalisation mensuelle</span>
            <span class="bb-pct" [class.good]="tauxRealisationProduits() >= 80"
                                  [class.warn]="tauxRealisationProduits() < 80">
              {{ tauxRealisationProduits() }}% des produits réalisés
            </span>
          </div>
          <div class="bb-track">
            <div class="bb-fill" [style.width.%]="tauxRealisationProduits()"></div>
          </div>
        </div>
      }

      @if (budgetLines().length === 0) {
        <div class="empty-state">
          <mat-icon>bar_chart</mat-icon>
          <p>Aucun budget défini pour {{ monthLabel() }}</p>
          <button class="btn-add" (click)="addLigne()">
            <mat-icon>add</mat-icon>Créer un budget
          </button>
        </div>
      } @else {

        <!-- ── Tableau PRODUITS ── -->
        <div class="section-card">
          <div class="section-title produits-title">
            <mat-icon>add_circle_outline</mat-icon>
            Produits prévus vs réels
          </div>
          <table class="budget-table">
            <thead>
              <tr>
                <th>Libellé</th>
                <th class="right">Prévu</th>
                <th class="right">Réel</th>
                <th class="right">Écart</th>
                <th class="right">Réalisation</th>
                <th class="actions-col"></th>
              </tr>
            </thead>
            <tbody>
              @for (line of produitLines(); track line.id) {
                @if (!editingId() || editingId() !== line.id) {
                  <tr class="data-row" [class.over-budget]="line.isOverBudget">
                    <td>
                      <span class="cat-badge">{{ line.categorie }}</span>
                      {{ line.libelle }}
                    </td>
                    <td class="right prevu-col">{{ line.montantPrevu | cents }}</td>
                    <td class="right reel-col">{{ line.montantReel | cents }}</td>
                    <td class="right" [class.ecart-pos]="line.ecart >= 0" [class.ecart-neg]="line.ecart < 0">
                      {{ line.ecart >= 0 ? '+' : '' }}{{ line.ecart | cents }}
                    </td>
                    <td class="right">
                      <div class="mini-bar-wrap">
                        <div class="mini-bar">
                          <div class="mini-fill"
                            [style.width.%]="line.montantPrevu > 0 ? (line.montantReel / line.montantPrevu * 100) : 0"
                            [class.over]="line.isOverBudget"></div>
                        </div>
                        <span class="mini-pct">
                          {{ line.montantPrevu > 0 ? (line.montantReel / line.montantPrevu * 100 | number:'1.0-0') : '0' }}%
                        </span>
                      </div>
                    </td>
                    <td class="actions-col">
                      <button class="icon-btn" (click)="startEdit(line)" matTooltip="Modifier">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button class="icon-btn danger" (click)="deleteLigne(line.id)" matTooltip="Supprimer">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </tr>
                } @else {
                  <tr class="edit-row">
                    <td><input class="edit-input" [(ngModel)]="editLibelle" placeholder="Libellé"/></td>
                    <td><input class="edit-input right" type="number" [(ngModel)]="editMontant" placeholder="0"/></td>
                    <td class="right dim">—</td>
                    <td class="right dim">—</td>
                    <td></td>
                    <td class="actions-col">
                      <button class="icon-btn save" (click)="saveEdit(line)" matTooltip="Enregistrer">
                        <mat-icon>check</mat-icon>
                      </button>
                      <button class="icon-btn" (click)="cancelEdit()" matTooltip="Annuler">
                        <mat-icon>close</mat-icon>
                      </button>
                    </td>
                  </tr>
                }
              }
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td>TOTAL PRODUITS</td>
                <td class="right">{{ totalPrevuProduits() | cents }}</td>
                <td class="right">{{ totalReelProduits() | cents }}</td>
                <td class="right" [class.ecart-pos]="totalReelProduits() >= totalPrevuProduits()"
                                   [class.ecart-neg]="totalReelProduits() < totalPrevuProduits()">
                  {{ (totalReelProduits() - totalPrevuProduits()) | cents }}
                </td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- ── Tableau CHARGES ── -->
        <div class="section-card">
          <div class="section-title charges-title">
            <mat-icon>remove_circle_outline</mat-icon>
            Charges prévues vs réelles
          </div>
          <table class="budget-table">
            <thead>
              <tr>
                <th>Libellé</th>
                <th class="right">Prévu</th>
                <th class="right">Réel</th>
                <th class="right">Écart</th>
                <th class="right">Consommation</th>
                <th class="actions-col"></th>
              </tr>
            </thead>
            <tbody>
              @for (line of chargeLines(); track line.id) {
                @if (!editingId() || editingId() !== line.id) {
                  <tr class="data-row" [class.over-budget]="line.isOverBudget">
                    <td>
                      <span class="cat-badge">{{ line.categorie }}</span>
                      {{ line.libelle }}
                    </td>
                    <td class="right prevu-col">{{ line.montantPrevu | cents }}</td>
                    <td class="right reel-col">{{ line.montantReel | cents }}</td>
                    <td class="right" [class.ecart-pos]="line.ecart <= 0" [class.ecart-neg]="line.ecart > 0">
                      {{ line.ecart > 0 ? '+' : '' }}{{ line.ecart | cents }}
                    </td>
                    <td class="right">
                      <div class="mini-bar-wrap">
                        <div class="mini-bar">
                          <div class="mini-fill"
                            [style.width.%]="line.montantPrevu > 0 ? (line.montantReel / line.montantPrevu * 100) : 0"
                            [class.over]="line.isOverBudget"></div>
                        </div>
                        <span class="mini-pct" [class.over-text]="line.isOverBudget">
                          {{ line.montantPrevu > 0 ? (line.montantReel / line.montantPrevu * 100 | number:'1.0-0') : '0' }}%
                        </span>
                      </div>
                    </td>
                    <td class="actions-col">
                      <button class="icon-btn" (click)="startEdit(line)" matTooltip="Modifier">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button class="icon-btn danger" (click)="deleteLigne(line.id)" matTooltip="Supprimer">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </tr>
                } @else {
                  <tr class="edit-row">
                    <td><input class="edit-input" [(ngModel)]="editLibelle" placeholder="Libellé"/></td>
                    <td><input class="edit-input right" type="number" [(ngModel)]="editMontant" placeholder="0"/></td>
                    <td class="right dim">—</td>
                    <td class="right dim">—</td>
                    <td></td>
                    <td class="actions-col">
                      <button class="icon-btn save" (click)="saveEdit(line)" matTooltip="Enregistrer">
                        <mat-icon>check</mat-icon>
                      </button>
                      <button class="icon-btn" (click)="cancelEdit()" matTooltip="Annuler">
                        <mat-icon>close</mat-icon>
                      </button>
                    </td>
                  </tr>
                }
              }
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td>TOTAL CHARGES</td>
                <td class="right">{{ totalPrevuCharges() | cents }}</td>
                <td class="right">{{ totalReelCharges() | cents }}</td>
                <td class="right" [class.ecart-pos]="totalReelCharges() <= totalPrevuCharges()"
                                   [class.ecart-neg]="totalReelCharges() > totalPrevuCharges()">
                  {{ (totalReelCharges() - totalPrevuCharges()) | cents }}
                </td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>

      }

      <!-- ── Résultat final ── -->
      @if (budgetLines().length > 0) {
        <div class="resultat-card" [class.profit]="resultatPrevu() >= 0" [class.loss]="resultatPrevu() < 0">
          <div class="rc-col">
            <span class="rc-label">Résultat prévu</span>
            <span class="rc-val">{{ resultatPrevu() | cents }}</span>
          </div>
          <div class="rc-sep"></div>
          <div class="rc-col">
            <span class="rc-label">Résultat réel</span>
            <span class="rc-val" [class.profit-val]="resultatReel() >= 0" [class.loss-val]="resultatReel() < 0">
              {{ resultatReel() | cents }}
            </span>
          </div>
          <div class="rc-sep"></div>
          <div class="rc-col">
            <span class="rc-label">Écart</span>
            <span class="rc-val" [class.profit-val]="resultatReel() >= resultatPrevu()" [class.loss-val]="resultatReel() < resultatPrevu()">
              {{ (resultatReel() - resultatPrevu()) | cents }}
            </span>
          </div>
        </div>
      }

      <!-- ── Formulaire ajout ligne ── -->
      @if (addFormOpen()) {
        <div class="versement-overlay" (click)="cancelAdd()">
          <div class="versement-modal add-modal" (click)="$event.stopPropagation()">
            <h3>Ajouter une ligne au budget</h3>
            <p>{{ monthLabel() }}</p>

            <div class="form-row">
              <div class="form-group half">
                <label class="v-label">Type</label>
                <div class="type-toggle">
                  <button class="type-btn" [class.active-charge]="addFormType === 'CHARGE'"
                          (click)="addFormType = 'CHARGE'">Charge</button>
                  <button class="type-btn" [class.active-produit]="addFormType === 'PRODUIT'"
                          (click)="addFormType = 'PRODUIT'">Produit</button>
                </div>
              </div>
              <div class="form-group half">
                <label class="v-label">Catégorie</label>
                <input class="v-input" [(ngModel)]="addFormCategorie" placeholder="ex: Loyer, Salaires…"/>
              </div>
            </div>

            <label class="v-label">Libellé</label>
            <input class="v-input" [(ngModel)]="addFormLibelle" placeholder="Description de la ligne"
                   (keyup.enter)="confirmAdd()"/>

            <label class="v-label">Montant prévu (Ar)</label>
            <input class="v-input" type="number" min="0" [(ngModel)]="addFormMontant" placeholder="0"
                   (keyup.enter)="confirmAdd()"/>

            <div class="v-actions">
              <button class="v-btn-cancel" (click)="cancelAdd()">Annuler</button>
              <button class="v-btn-save" (click)="confirmAdd()"
                      [disabled]="!addFormLibelle || addFormMontant <= 0">
                <mat-icon>add</mat-icon>Ajouter
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
    .header-actions { display: flex; gap: 10px; align-items: center; }

    .btn-add {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer;
      background: #1565c0; color: white; font-size: 13px; font-weight: 600;
      transition: background .15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { background: #0d47a1; }
    }

    /* ── Month nav ── */
    .month-nav {
      display: flex; align-items: center; gap: 0;
      background: white; border-radius: 12px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      padding: 8px; align-self: flex-start;
    }
    .mnav-btn {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 8px; border: none; cursor: pointer;
      background: transparent; color: #546e7a; transition: background .15s;
      mat-icon { font-size: 20px; }
      &:hover { background: #f0f4f8; color: #0d1b2a; }
    }
    .mnav-label {
      display: flex; align-items: center; gap: 8px; padding: 0 16px;
      font-size: 15px; font-weight: 700; color: #0d1b2a; min-width: 180px; justify-content: center;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #1565c0; }
    }

    /* ── KPI ── */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .kpi-card {
      background: white; border-radius: 14px; padding: 16px 18px;
      display: flex; align-items: center; gap: 14px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07); border-left: 4px solid transparent;
    }
    .kpi-green  { border-color: #2e7d32; .kpi-icon { background: #e8f5e9; color: #2e7d32; } }
    .kpi-red    { border-color: #c62828; .kpi-icon { background: #fde8e8; color: #c62828; } }
    .kpi-profit { border-color: #2e7d32; .kpi-icon { background: #e8f5e9; color: #2e7d32; } }
    .kpi-loss   { border-color: #c62828; .kpi-icon { background: #fde8e8; color: #c62828; } }
    .kpi-warn   { border-color: #f57f17; .kpi-icon { background: #fff8e1; color: #f57f17; } }
    .kpi-ok     { border-color: #2e7d32; .kpi-icon { background: #e8f5e9; color: #2e7d32; } }
    .kpi-icon {
      width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    .kpi-label { font-size: 11px; color: #78909c; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; margin: 0 0 4px; }
    .kpi-val   { font-size: 17px; font-weight: 800; color: #0d1b2a; margin: 0 0 2px; }
    .kpi-sub   { font-size: 11px; color: #90a4ae; margin: 0; }

    /* ── Budget Bar ── */
    .budget-bar-card {
      background: white; border-radius: 14px; padding: 18px 22px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
    }
    .bb-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .bb-title  { font-size: 13px; font-weight: 600; color: #263238; }
    .bb-pct    { font-size: 13px; font-weight: 700; }
    .bb-pct.good { color: #2e7d32; }
    .bb-pct.warn { color: #f57f17; }
    .bb-track  { height: 12px; background: #f0f4f8; border-radius: 6px; overflow: hidden; }
    .bb-fill   { height: 100%; background: linear-gradient(90deg, #43a047, #66bb6a); border-radius: 6px; transition: width .6s cubic-bezier(.4,0,.2,1); }

    /* ── Section card ── */
    .section-card {
      background: white; border-radius: 14px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07); overflow: hidden;
    }
    .section-title {
      display: flex; align-items: center; gap: 8px; padding: 16px 20px;
      font-size: 14px; font-weight: 700;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .produits-title { background: #f1f8e9; color: #2e7d32; }
    .charges-title  { background: #fde8e8; color: #b71c1c; }

    /* ── Budget table ── */
    .budget-table {
      width: 100%; border-collapse: collapse; font-size: 13px;
      th {
        background: #f8fafc; color: #546e7a;
        font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px;
        padding: 10px 14px; border-bottom: 1px solid #e8edf2; white-space: nowrap;
      }
      td { padding: 10px 14px; border-bottom: 1px solid #f5f7fa; }
    }
    .data-row td:first-child { padding-left: 20px; }
    .over-budget { background: #fff8f8; }
    .right { text-align: right; }
    .dim   { color: #b0bec5; }

    .cat-badge {
      background: #e3f2fd; color: #1565c0; font-size: 10px; font-weight: 700;
      padding: 2px 7px; border-radius: 12px; margin-right: 6px; white-space: nowrap;
    }
    .prevu-col { color: #546e7a; }
    .reel-col  { color: #0d1b2a; font-weight: 600; }
    .ecart-pos { color: #2e7d32; font-weight: 700; }
    .ecart-neg { color: #c62828; font-weight: 700; }
    .over-text { color: #c62828; font-weight: 700; }

    .mini-bar-wrap {
      display: flex; align-items: center; gap: 6px; justify-content: flex-end;
    }
    .mini-bar { width: 60px; height: 6px; background: #f0f4f8; border-radius: 3px; overflow: hidden; }
    .mini-fill { height: 100%; background: #43a047; border-radius: 3px; transition: width .4s; }
    .mini-fill.over { background: #ef5350; }
    .mini-pct { font-size: 11px; color: #78909c; min-width: 30px; text-align: right; }

    .actions-col { width: 80px; text-align: right; }
    .icon-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border: none; border-radius: 6px;
      background: transparent; cursor: pointer; color: #78909c; transition: background .12s, color .12s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover  { background: #f0f4f8; color: #0d1b2a; }
      &.danger:hover { background: #fde8e8; color: #c62828; }
      &.save:hover   { background: #e8f5e9; color: #2e7d32; }
    }

    .edit-row td { background: #f0f7ff; }
    .edit-input {
      width: 100%; border: 1px solid #90caf9; border-radius: 6px;
      padding: 6px 8px; font-size: 13px; background: white;
      &:focus { outline: none; border-color: #1565c0; }
      &.right { text-align: right; }
    }

    .total-row td {
      background: #263238; color: white; font-weight: 800; font-size: 13px;
    }

    /* ── Résultat card ── */
    .resultat-card {
      display: flex; align-items: center; justify-content: space-around;
      padding: 20px 28px; border-radius: 14px;
    }
    .profit { background: linear-gradient(135deg, #e8f5e9, #f1f8e9); border: 2px solid #a5d6a7; }
    .loss   { background: linear-gradient(135deg, #fde8e8, #fff3e0); border: 2px solid #ef9a9a; }
    .rc-col   { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .rc-label { font-size: 11px; color: #78909c; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; }
    .rc-val   { font-size: 18px; font-weight: 800; color: #0d1b2a; }
    .profit-val { color: #2e7d32; }
    .loss-val   { color: #c62828; }
    .rc-sep { width: 1px; height: 40px; background: rgba(0,0,0,.1); }

    /* ── Empty state ── */
    .empty-state {
      background: white; border-radius: 14px; padding: 56px 24px;
      text-align: center; color: #90a4ae;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      mat-icon {
        font-size: 64px; width: 64px; height: 64px; margin-bottom: 16px;
        color: #bbdefb; display: block; margin-left: auto; margin-right: auto;
      }
      p { font-size: 15px; margin: 0 0 28px; }
      .btn-add {
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

    /* ── Overlay / modal ── */
    .versement-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn .15s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .versement-modal {
      background: white; border-radius: 16px; padding: 28px 32px; width: 420px;
      box-shadow: 0 8px 32px rgba(0,0,0,.25);
      h3 { font-size: 18px; font-weight: 800; color: #0d1b2a; margin: 0 0 4px; }
      p  { font-size: 13px; color: #78909c; margin: 0 0 20px; }
    }
    .form-row { display: flex; gap: 16px; margin-bottom: 0; }
    .form-group { display: flex; flex-direction: column; }
    .form-group.half { flex: 1; }
    .type-toggle {
      display: flex; gap: 4px; margin-bottom: 16px;
    }
    .type-btn {
      flex: 1; padding: 8px; border-radius: 8px; border: 1px solid #dde3ea;
      font-size: 13px; font-weight: 600; cursor: pointer; background: #f0f4f8; color: #546e7a;
      transition: background .15s, color .15s;
      &.active-charge  { background: #fde8e8; color: #b71c1c; border-color: #ef9a9a; }
      &.active-produit { background: #e8f5e9; color: #2e7d32; border-color: #a5d6a7; }
    }
    .v-label { font-size: 12px; font-weight: 700; color: #546e7a; display: block; margin-bottom: 6px; }
    .v-input {
      width: 100%; padding: 10px 14px; border: 1px solid #dde3ea; border-radius: 8px;
      font-size: 15px; color: #0d1b2a; margin-bottom: 16px; box-sizing: border-box;
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
      &:hover { background: #0d47a1; }
      &:disabled { background: #b0bec5; cursor: default; }
    }

    @media (max-width: 1000px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px)  { .kpi-grid { grid-template-columns: 1fr; } }
  `],
})
export class BudgetComponent implements OnInit {
  private readonly budgetService  = inject(BudgetService);
  private readonly accountService = inject(AccountService);
  private readonly journalService = inject(JournalEntryService);
  private readonly alert          = inject(AlertService);

  budgets  = signal<Budget[]>([]);
  accounts = signal<Account[]>([]);
  entries  = signal<JournalEntry[]>([]);

  selectedExercice = signal(2026);
  selectedMois     = signal(3); // mars

  // Inline edit state
  editingId   = signal<number | null>(null);
  editLibelle = '';
  editMontant = 0;
  addMode     = signal(false);

  // Add ligne form state
  addFormOpen      = signal(false);
  addFormType: 'CHARGE' | 'PRODUIT' = 'CHARGE';
  addFormCategorie = '';
  addFormLibelle   = '';
  addFormMontant   = 0;

  ngOnInit(): void {
    this.budgetService.getAll().subscribe(list => this.budgets.set(list));
    this.accountService.getAll().subscribe(list => this.accounts.set(list));
    this.journalService.getAll().subscribe(list => this.entries.set(list));
  }

  monthLabel = computed(() => `${MONTHS_FR[this.selectedMois()]} ${this.selectedExercice()}`);

  prevMois(): void {
    if (this.selectedMois() === 1) {
      this.selectedMois.set(12);
      this.selectedExercice.update(y => y - 1);
    } else {
      this.selectedMois.update(m => m - 1);
    }
    this.cancelEdit();
  }
  nextMois(): void {
    if (this.selectedMois() === 12) {
      this.selectedMois.set(1);
      this.selectedExercice.update(y => y + 1);
    } else {
      this.selectedMois.update(m => m + 1);
    }
    this.cancelEdit();
  }

  currentBudget = computed(() =>
    this.budgets().find(b => b.exercice === this.selectedExercice() && b.mois === this.selectedMois()) ?? null
  );

  /* Montant réel par classe (since account journalLines are cumulative, we approximate by month) */
  private reelProduits = computed(() => {
    const month = `${this.selectedExercice()}-${String(this.selectedMois()).padStart(2, '0')}`;
    const accMap = new Map(this.accounts().map(a => [a.id, a]));
    return this.entries()
      .filter(e => e.date.startsWith(month))
      .reduce((sum, entry) => {
        return sum + entry.lines.reduce((s, l) => {
          const acc = accMap.get(l.accountId);
          return acc?.class === 7 ? s + l.credit : s;
        }, 0);
      }, 0);
  });

  private reelCharges = computed(() => {
    const month = `${this.selectedExercice()}-${String(this.selectedMois()).padStart(2, '0')}`;
    const accMap = new Map(this.accounts().map(a => [a.id, a]));
    return this.entries()
      .filter(e => e.date.startsWith(month))
      .reduce((sum, entry) => {
        return sum + entry.lines.reduce((s, l) => {
          const acc = accMap.get(l.accountId);
          return acc?.class === 6 ? s + l.debit : s;
        }, 0);
      }, 0);
  });

  budgetLines = computed<EnrichedLigne[]>(() => {
    const budget = this.currentBudget();
    if (!budget) return [];
    return budget.lignes.map(l => {
      const reel = l.type === 'PRODUIT' ? this.reelProduits() : this.reelCharges();
      // Approximate: distribute evenly. In practice real data per line would come from backend.
      const montantReel = reel;
      const ecart = montantReel - l.montantPrevu;
      const isOverBudget = l.type === 'CHARGE' ? ecart > 0 : ecart < 0;
      const ecartPct = l.montantPrevu > 0 ? Math.round(ecart / l.montantPrevu * 100) : 0;
      return { ...l, montantReel, ecart, ecartPct, isOverBudget };
    });
  });

  produitLines = computed(() => this.budgetLines().filter(l => l.type === 'PRODUIT'));
  chargeLines  = computed(() => this.budgetLines().filter(l => l.type === 'CHARGE'));

  totalPrevuProduits = computed(() => this.produitLines().reduce((s, l) => s + l.montantPrevu, 0));
  totalPrevuCharges  = computed(() => this.chargeLines().reduce((s, l) => s + l.montantPrevu, 0));
  totalReelProduits  = computed(() => this.reelProduits());
  totalReelCharges   = computed(() => this.reelCharges());
  resultatPrevu      = computed(() => this.totalPrevuProduits() - this.totalPrevuCharges());
  resultatReel       = computed(() => this.totalReelProduits() - this.totalReelCharges());
  tauxRealisationProduits = computed(() =>
    this.totalPrevuProduits() > 0
      ? Math.min(Math.round(this.totalReelProduits() / this.totalPrevuProduits() * 100), 100)
      : 0
  );

  startEdit(line: BudgetLigne): void {
    this.editingId.set(line.id);
    this.editLibelle = line.libelle;
    this.editMontant = line.montantPrevu;
  }
  cancelEdit(): void { this.editingId.set(null); }

  saveEdit(line: EnrichedLigne): void {
    const budget = this.currentBudget();
    if (!budget) return;
    const updated: BudgetLigne = {
      ...line, libelle: this.editLibelle, montantPrevu: this.editMontant,
    };
    this.budgetService.saveLigne(budget.id, updated).subscribe(b => {
      this.budgets.update(list => list.map(bgt => bgt.id === b.id ? b : bgt));
      this.editingId.set(null);
      this.alert.success('Ligne budget mise à jour');
    });
  }

  deleteLigne(ligneId: number): void {
    const budget = this.currentBudget();
    if (!budget) return;
    this.budgetService.deleteLigne(budget.id, ligneId).subscribe(b => {
      this.budgets.update(list => list.map(bgt => bgt.id === b.id ? b : bgt));
      this.alert.success('Ligne supprimée');
    });
  }

  addLigne(): void {
    this.addFormOpen.set(true);
    this.addFormType      = 'CHARGE';
    this.addFormCategorie = '';
    this.addFormLibelle   = '';
    this.addFormMontant   = 0;
  }

  cancelAdd(): void { this.addFormOpen.set(false); }

  confirmAdd(): void {
    if (!this.addFormLibelle || this.addFormMontant <= 0) return;
    const ligne = {
      categorie:    this.addFormCategorie || this.addFormType,
      libelle:      this.addFormLibelle,
      montantPrevu: this.addFormMontant,
      type:         this.addFormType,
    };
    const budget = this.currentBudget();
    if (budget) {
      this.budgetService.saveLigne(budget.id, ligne as any).subscribe(b => {
        this.budgets.update(list => list.map(bgt => bgt.id === b.id ? b : bgt));
        this.addFormOpen.set(false);
        this.alert.success('Ligne ajoutée');
      });
    } else {
      this.budgetService.create({ exercice: this.selectedExercice(), mois: this.selectedMois(), lignes: [] }).subscribe(b => {
        this.budgets.update(list => [...list, b]);
        this.budgetService.saveLigne(b.id, ligne as any).subscribe(updated => {
          this.budgets.update(list => list.map(bgt => bgt.id === updated.id ? updated : bgt));
          this.addFormOpen.set(false);
          this.alert.success('Budget créé et ligne ajoutée');
        });
      });
    }
  }
}
