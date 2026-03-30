import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CentsPipe } from '../../shared/pipes/cents.pipe';
import { AccountService } from '../../core/services/account.service';
import {
  RapportsService, BalanceLine, GrandLivreResponse, BilanReport, CompteResultatReport,
} from '../../core/services/rapports.service';
import { ExportService } from '../../core/services/export.service';
import { Account } from '../../core/models/account.model';

type ReportTab = 'balance' | 'grand-livre' | 'bilan' | 'resultat';

interface BalanceGroup {
  cls: number;
  name: string;
  lines: BalanceLine[];
  totalDebit: number;
  totalCredit: number;
  soldeDebiteur: number;
  soldeCrediteur: number;
}

interface BilanLine { label: string; code: string; montant: number; }
interface ResultatLine { label: string; code: string; montant: number; }

const CLASS_NAMES: Record<number, string> = {
  1: 'Capitaux permanents', 2: 'Immobilisations', 3: 'Stocks',
  4: 'Tiers', 5: 'Financiers', 6: 'Charges', 7: 'Produits', 8: 'Résultats',
};

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatSelectModule, MatFormFieldModule, MatInputModule,
    CentsPipe,
  ],
  template: `
    <div class="page">

      <!-- Print-only header -->
      <div class="print-header-fixed">
        <div class="phf-left">
          <span class="phf-brand">Volako</span>
          <span class="phf-sep">·</span>
          <span class="phf-title">
            @if (activeTab() === 'balance')    { Balance générale des comptes }
            @if (activeTab() === 'grand-livre') { Grand livre par compte }
            @if (activeTab() === 'bilan')      { Bilan comptable }
            @if (activeTab() === 'resultat')   { Compte de résultat }
          </span>
        </div>
        <span class="phf-date">Édité le {{ today }}</span>
      </div>

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">États financiers</h1>
          <p class="page-sub">Balance · Grand livre · Bilan · Compte de résultat</p>
        </div>
        <div class="header-actions">
          <button class="btn-fec" (click)="exportFec()" matTooltip="Fichier des Écritures Comptables (obligation légale)">
            <mat-icon>gavel</mat-icon>
            FEC
          </button>
          <button class="btn-print" (click)="print()" matTooltip="Imprimer ce rapport">
            <mat-icon>print</mat-icon>
            Imprimer
          </button>
        </div>
      </div>

      <!-- Tab Bar -->
      <div class="tab-bar">
        <button class="tab-btn" [class.active]="activeTab() === 'balance'" (click)="setTab('balance')">
          <mat-icon>list_alt</mat-icon>
          Balance
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'grand-livre'" (click)="setTab('grand-livre')">
          <mat-icon>menu_book</mat-icon>
          Grand livre
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'bilan'" (click)="setTab('bilan')">
          <mat-icon>account_balance</mat-icon>
          Bilan
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'resultat'" (click)="setTab('resultat')">
          <mat-icon>trending_up</mat-icon>
          Résultat
        </button>
      </div>

      <!-- ══ TAB 1 : BALANCE GÉNÉRALE ══ -->
      @if (activeTab() === 'balance') {
        <div class="report-card printable">
          <div class="report-header">
            <mat-icon>list_alt</mat-icon>
            <div>
              <h2>Balance générale des comptes</h2>
              <p>Mouvements débit/crédit et soldes par compte</p>
            </div>
            <div class="export-actions">
              <button class="btn-export" (click)="exportBalancePdf()" matTooltip="Exporter en PDF">
                <mat-icon>picture_as_pdf</mat-icon> PDF
              </button>
              <button class="btn-export" (click)="exportBalanceExcel()" matTooltip="Exporter en Excel">
                <mat-icon>table_view</mat-icon> Excel
              </button>
              <button class="btn-export" (click)="exportBalanceCsv()" matTooltip="Exporter en CSV">
                <mat-icon>download</mat-icon> CSV
              </button>
            </div>
          </div>

          @if (loadingBalance()) {
            <div class="loading">Chargement…</div>
          } @else {
            <div class="balance-summary">
              <div class="bs-item">
                <span class="bs-label">Total Débit</span>
                <span class="bs-val bs-debit">{{ totalMouvDebit() | cents }}</span>
              </div>
              <div class="bs-item">
                <span class="bs-label">Total Crédit</span>
                <span class="bs-val bs-credit">{{ totalMouvCredit() | cents }}</span>
              </div>
              <div class="bs-item">
                <span class="bs-label">Soldes débiteurs</span>
                <span class="bs-val">{{ totalSoldesDebiteurs() | cents }}</span>
              </div>
              <div class="bs-item">
                <span class="bs-label">Soldes créditeurs</span>
                <span class="bs-val">{{ totalSoldesCrediteurs() | cents }}</span>
              </div>
            </div>

            <div class="table-wrap">
              <table class="report-table">
                <thead>
                  <tr>
                    <th class="col-code">Code</th>
                    <th class="col-name">Intitulé du compte</th>
                    <th class="col-cls">Cl.</th>
                    <th class="col-num right">Mouvements Débit</th>
                    <th class="col-num right">Mouvements Crédit</th>
                    <th class="col-num right">Solde Débiteur</th>
                    <th class="col-num right">Solde Créditeur</th>
                  </tr>
                </thead>
                <tbody>
                  @for (group of balanceByClass(); track group.cls) {
                    <tr class="cls-header-row">
                      <td colspan="7">
                        <span class="cls-badge" [class]="'cls-' + group.cls">{{ group.cls }}</span>
                        {{ group.name }}
                      </td>
                    </tr>
                    @for (line of group.lines; track line.id) {
                      <tr class="data-row" [class.zero-row]="line.totalDebit === 0 && line.totalCredit === 0">
                        <td class="col-code"><code>{{ line.code }}</code></td>
                        <td class="col-name">{{ line.name }}</td>
                        <td class="col-cls">
                          <span class="cls-badge-sm" [class]="'cls-' + line.account_class">{{ line.account_class }}</span>
                        </td>
                        <td class="col-num right">
                          @if (line.totalDebit > 0) { {{ line.totalDebit | cents }} }
                          @else { <span class="dim">—</span> }
                        </td>
                        <td class="col-num right">
                          @if (line.totalCredit > 0) { {{ line.totalCredit | cents }} }
                          @else { <span class="dim">—</span> }
                        </td>
                        <td class="col-num right debit-col">
                          @if (solde(line) > 0) { {{ solde(line) | cents }} }
                          @else { <span class="dim">—</span> }
                        </td>
                        <td class="col-num right credit-col">
                          @if (solde(line) < 0) { {{ -solde(line) | cents }} }
                          @else { <span class="dim">—</span> }
                        </td>
                      </tr>
                    }
                    <tr class="subtotal-row">
                      <td colspan="3" class="subtotal-label">Sous-total Cl. {{ group.cls }}</td>
                      <td class="right">{{ group.totalDebit | cents }}</td>
                      <td class="right">{{ group.totalCredit | cents }}</td>
                      <td class="right debit-col">{{ group.soldeDebiteur | cents }}</td>
                      <td class="right credit-col">{{ group.soldeCrediteur | cents }}</td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td colspan="3">TOTAL GÉNÉRAL</td>
                    <td class="right">{{ totalMouvDebit() | cents }}</td>
                    <td class="right">{{ totalMouvCredit() | cents }}</td>
                    <td class="right debit-col">{{ totalSoldesDebiteurs() | cents }}</td>
                    <td class="right credit-col">{{ totalSoldesCrediteurs() | cents }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          }
        </div>
      }

      <!-- ══ TAB 2 : GRAND LIVRE ══ -->
      @if (activeTab() === 'grand-livre') {
        <div class="report-card printable">
          <div class="report-header">
            <mat-icon>menu_book</mat-icon>
            <div>
              <h2>Grand livre par compte</h2>
              <p>Détail de toutes les écritures d'un compte avec solde cumulé</p>
            </div>
            @if (grandLivre()) {
              <div class="export-actions">
                <button class="btn-export" (click)="exportGlPdf()" matTooltip="Exporter en PDF">
                  <mat-icon>picture_as_pdf</mat-icon> PDF
                </button>
                <button class="btn-export" (click)="exportGlExcel()" matTooltip="Exporter en Excel">
                  <mat-icon>table_view</mat-icon> Excel
                </button>
                <button class="btn-export" (click)="exportGlCsv()" matTooltip="Exporter en CSV">
                  <mat-icon>download</mat-icon> CSV
                </button>
              </div>
            }
          </div>

          <!-- Filtres -->
          <div class="gl-filters">
            <mat-form-field appearance="outline" class="gl-select">
              <mat-label>Compte</mat-label>
              <mat-select [(ngModel)]="selectedAccountId" (ngModelChange)="loadGrandLivre()">
                @for (acc of accounts(); track acc.id) {
                  <mat-option [value]="acc.id">{{ acc.code }} – {{ acc.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="gl-date">
              <mat-label>Du</mat-label>
              <input matInput type="date" [(ngModel)]="glDateFrom" (change)="loadGrandLivre()" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="gl-date">
              <mat-label>Au</mat-label>
              <input matInput type="date" [(ngModel)]="glDateTo" (change)="loadGrandLivre()" />
            </mat-form-field>
          </div>

          @if (!selectedAccountId) {
            <div class="empty-state">
              <mat-icon>menu_book</mat-icon>
              <p>Sélectionnez un compte pour afficher son grand livre</p>
            </div>
          } @else if (loadingGl()) {
            <div class="loading">Chargement…</div>
          } @else if (grandLivre()) {
            <!-- En-tête compte -->
            <div class="gl-account-header">
              <code class="gl-code">{{ grandLivre()!.account.code }}</code>
              <span class="gl-name">{{ grandLivre()!.account.name }}</span>
              <span class="cls-badge" [class]="'cls-' + grandLivre()!.account.account_class">
                {{ grandLivre()!.account.account_class }}
              </span>
            </div>

            <!-- KPI -->
            <div class="balance-summary">
              <div class="bs-item">
                <span class="bs-label">Total Débit</span>
                <span class="bs-val bs-debit">{{ grandLivre()!.totalDebit | cents }}</span>
              </div>
              <div class="bs-item">
                <span class="bs-label">Total Crédit</span>
                <span class="bs-val bs-credit">{{ grandLivre()!.totalCredit | cents }}</span>
              </div>
              <div class="bs-item">
                <span class="bs-label">Solde final</span>
                <span class="bs-val" [class.bs-debit]="grandLivre()!.solde >= 0" [class.bs-credit]="grandLivre()!.solde < 0">
                  {{ (grandLivre()!.solde < 0 ? -grandLivre()!.solde : grandLivre()!.solde) | cents }}
                  {{ grandLivre()!.solde >= 0 ? 'D' : 'C' }}
                </span>
              </div>
              <div class="bs-item">
                <span class="bs-label">Nombre d'écritures</span>
                <span class="bs-val">{{ grandLivre()!.lines.length }}</span>
              </div>
            </div>

            @if (grandLivre()!.lines.length === 0) {
              <div class="empty-state">
                <mat-icon>inbox</mat-icon>
                <p>Aucune écriture pour ce compte sur la période</p>
              </div>
            } @else {
              <div class="table-wrap">
                <table class="report-table">
                  <thead>
                    <tr>
                      <th class="col-date">Date</th>
                      <th class="col-piece">Pièce</th>
                      <th class="col-name">Libellé</th>
                      <th class="col-num right">Débit</th>
                      <th class="col-num right">Crédit</th>
                      <th class="col-num right">Solde cumulé</th>
                      <th class="col-lettre">Lettrage</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (line of grandLivre()!.lines; track line.id) {
                      <tr class="data-row">
                        <td class="col-date">{{ line.date | date:'dd/MM/yyyy' }}</td>
                        <td class="col-piece dim">{{ line.pieceNumber || '—' }}</td>
                        <td class="col-name">{{ line.label }}</td>
                        <td class="col-num right">
                          @if (line.debit > 0) { {{ line.debit | cents }} }
                          @else { <span class="dim">—</span> }
                        </td>
                        <td class="col-num right">
                          @if (line.credit > 0) { {{ line.credit | cents }} }
                          @else { <span class="dim">—</span> }
                        </td>
                        <td class="col-num right" [class.debit-col]="line.soldeCumul >= 0" [class.credit-col]="line.soldeCumul < 0">
                          {{ (line.soldeCumul < 0 ? -line.soldeCumul : line.soldeCumul) | cents }}
                          <span class="solde-sign">{{ line.soldeCumul >= 0 ? 'D' : 'C' }}</span>
                        </td>
                        <td class="col-lettre">
                          @if (line.lettre) { <span class="lettre-badge">{{ line.lettre }}</span> }
                          @else { <span class="dim">—</span> }
                        </td>
                      </tr>
                    }
                  </tbody>
                  <tfoot>
                    <tr class="total-row">
                      <td colspan="3">TOTAL</td>
                      <td class="right">{{ grandLivre()!.totalDebit | cents }}</td>
                      <td class="right">{{ grandLivre()!.totalCredit | cents }}</td>
                      <td class="right">
                        {{ (grandLivre()!.solde < 0 ? -grandLivre()!.solde : grandLivre()!.solde) | cents }}
                        {{ grandLivre()!.solde >= 0 ? 'D' : 'C' }}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            }
          }
        </div>
      }

      <!-- ══ TAB 3 : BILAN ══ -->
      @if (activeTab() === 'bilan') {
        <div class="report-card printable">
          <div class="report-header">
            <mat-icon>account_balance</mat-icon>
            <div>
              <h2>Bilan comptable</h2>
              <p>Situation patrimoniale — Actif et Passif</p>
            </div>
            <mat-form-field appearance="outline" class="exercice-select">
              <mat-label>Exercice</mat-label>
              <mat-select [ngModel]="exercice()" (ngModelChange)="onExerciceChange($event)">
                @for (y of exerciceYears; track y) {
                  <mat-option [value]="y">{{ y }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          @if (loadingBilan()) {
            <div class="loading">Chargement…</div>
          } @else {
            <div class="bilan-kpi">
              <div class="bk-item bk-actif">
                <mat-icon>north_east</mat-icon>
                <div>
                  <p class="bk-label">Total Actif</p>
                  <p class="bk-val">{{ totalActif() | cents }}</p>
                </div>
              </div>
              <div class="bk-equals">=</div>
              <div class="bk-item bk-passif">
                <mat-icon>south_west</mat-icon>
                <div>
                  <p class="bk-label">Total Passif</p>
                  <p class="bk-val">{{ totalPassif() | cents }}</p>
                </div>
              </div>
              @if (totalActif() !== totalPassif()) {
                <div class="bk-warning">
                  <mat-icon>warning</mat-icon>
                  Bilan déséquilibré (Δ : {{ (totalActif() - totalPassif()) | cents }})
                </div>
              } @else {
                <div class="bk-balanced">
                  <mat-icon>check_circle</mat-icon>
                  Bilan équilibré
                </div>
              }
            </div>

            <div class="bilan-cols">
              <!-- ACTIF -->
              <div class="bilan-col">
                <div class="bilan-col-header bilan-actif-header">
                  <mat-icon>north_east</mat-icon>
                  ACTIF
                </div>
                <table class="report-table compact">
                  <thead>
                    <tr><th>Rubrique</th><th class="right">Montant</th></tr>
                  </thead>
                  <tbody>
                    <tr class="section-row"><td colspan="2">Actif immobilisé</td></tr>
                    @for (line of bilanActifImmobilise(); track line.code) {
                      <tr class="data-row">
                        <td><code>{{ line.code }}</code> {{ line.label }}</td>
                        <td class="right">{{ line.montant | cents }}</td>
                      </tr>
                    }
                    <tr class="subtotal-row">
                      <td>Sous-total actif immobilisé</td>
                      <td class="right">{{ totalActifImmobilise() | cents }}</td>
                    </tr>

                    <tr class="section-row"><td colspan="2">Actif circulant</td></tr>
                    @for (line of bilanActifCirculant(); track line.code) {
                      <tr class="data-row">
                        <td><code>{{ line.code }}</code> {{ line.label }}</td>
                        <td class="right">{{ line.montant | cents }}</td>
                      </tr>
                    }
                    <tr class="subtotal-row">
                      <td>Sous-total actif circulant</td>
                      <td class="right">{{ totalActifCirculant() | cents }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="total-row">
                      <td>TOTAL ACTIF</td>
                      <td class="right">{{ totalActif() | cents }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <!-- PASSIF -->
              <div class="bilan-col">
                <div class="bilan-col-header bilan-passif-header">
                  <mat-icon>south_west</mat-icon>
                  PASSIF
                </div>
                <table class="report-table compact">
                  <thead>
                    <tr><th>Rubrique</th><th class="right">Montant</th></tr>
                  </thead>
                  <tbody>
                    <tr class="section-row"><td colspan="2">Capitaux propres</td></tr>
                    @for (line of bilanPassifCapitaux(); track line.code) {
                      <tr class="data-row">
                        <td><code>{{ line.code }}</code> {{ line.label }}</td>
                        <td class="right">{{ line.montant | cents }}</td>
                      </tr>
                    }
                    <tr class="data-row result-row">
                      <td>Résultat de l'exercice</td>
                      <td class="right" [class.result-profit]="resultatNet() >= 0" [class.result-loss]="resultatNet() < 0">
                        {{ resultatNet() | cents }}
                      </td>
                    </tr>
                    <tr class="subtotal-row">
                      <td>Sous-total capitaux propres</td>
                      <td class="right">{{ totalCapitauxPropres() | cents }}</td>
                    </tr>

                    <tr class="section-row"><td colspan="2">Dettes</td></tr>
                    @for (line of bilanPassifDettes(); track line.code) {
                      <tr class="data-row">
                        <td><code>{{ line.code }}</code> {{ line.label }}</td>
                        <td class="right">{{ line.montant | cents }}</td>
                      </tr>
                    }
                    <tr class="subtotal-row">
                      <td>Sous-total dettes</td>
                      <td class="right">{{ totalDettes() | cents }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="total-row">
                      <td>TOTAL PASSIF</td>
                      <td class="right">{{ totalPassif() | cents }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          }
        </div>
      }

      <!-- ══ TAB 4 : COMPTE DE RÉSULTAT ══ -->
      @if (activeTab() === 'resultat') {
        <div class="report-card printable">
          <div class="report-header">
            <mat-icon>trending_up</mat-icon>
            <div>
              <h2>Compte de résultat</h2>
              <p>Produits (Cl. 7) vs Charges (Cl. 6) — Résultat de l'exercice</p>
            </div>
            <mat-form-field appearance="outline" class="exercice-select">
              <mat-label>Exercice</mat-label>
              <mat-select [ngModel]="exercice()" (ngModelChange)="onExerciceChange($event)">
                @for (y of exerciceYears; track y) {
                  <mat-option [value]="y">{{ y }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          @if (loadingResultat()) {
            <div class="loading">Chargement…</div>
          } @else {
            <div class="resultat-kpi">
              <div class="rk-item rk-produits">
                <mat-icon>add_circle_outline</mat-icon>
                <div>
                  <p class="rk-label">Total Produits</p>
                  <p class="rk-val">{{ totalProduits() | cents }}</p>
                </div>
              </div>
              <div class="rk-minus">−</div>
              <div class="rk-item rk-charges">
                <mat-icon>remove_circle_outline</mat-icon>
                <div>
                  <p class="rk-label">Total Charges</p>
                  <p class="rk-val">{{ totalCharges() | cents }}</p>
                </div>
              </div>
              <div class="rk-equals">=</div>
              <div class="rk-item" [class.rk-profit]="resultatNet() >= 0" [class.rk-loss]="resultatNet() < 0">
                <mat-icon>{{ resultatNet() >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
                <div>
                  <p class="rk-label">Résultat Net</p>
                  <p class="rk-val">{{ resultatNet() | cents }}</p>
                </div>
              </div>
            </div>

            @if (totalProduits() + totalCharges() > 0) {
              <div class="cmp-bar-wrap">
                <div class="cmp-bar">
                  <div class="cmp-seg cmp-prod" [style.flex]="totalProduits()"></div>
                  <div class="cmp-seg cmp-chg"  [style.flex]="totalCharges()"></div>
                </div>
                <div class="cmp-labels">
                  <span class="cmp-lbl cmp-lbl-prod">Produits {{ produitsPct() }}%</span>
                  <span class="cmp-lbl cmp-lbl-chg">Charges {{ chargesPct() }}%</span>
                </div>
              </div>
            }

            <div class="resultat-cols">
              <!-- Produits -->
              <div>
                <div class="rcol-header rcol-produits">
                  <mat-icon>add_circle_outline</mat-icon>
                  PRODUITS — Classe 7
                </div>
                <table class="report-table compact">
                  <thead>
                    <tr>
                      <th>Compte</th>
                      <th class="right">Montant</th>
                      <th class="right pct-col">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (line of produitsLines(); track line.code) {
                      <tr class="data-row">
                        <td><code>{{ line.code }}</code> {{ line.label }}</td>
                        <td class="right">{{ line.montant | cents }}</td>
                        <td class="right pct-col dim">
                          {{ totalProduits() > 0 ? (line.montant / totalProduits() * 100 | number:'1.1-1') : '0' }}%
                        </td>
                      </tr>
                    }
                  </tbody>
                  <tfoot>
                    <tr class="total-row">
                      <td>TOTAL PRODUITS</td>
                      <td class="right">{{ totalProduits() | cents }}</td>
                      <td class="right pct-col">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <!-- Charges -->
              <div>
                <div class="rcol-header rcol-charges">
                  <mat-icon>remove_circle_outline</mat-icon>
                  CHARGES — Classe 6
                </div>
                <table class="report-table compact">
                  <thead>
                    <tr>
                      <th>Compte</th>
                      <th class="right">Montant</th>
                      <th class="right pct-col">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (line of chargesLines(); track line.code) {
                      <tr class="data-row">
                        <td><code>{{ line.code }}</code> {{ line.label }}</td>
                        <td class="right">{{ line.montant | cents }}</td>
                        <td class="right pct-col dim">
                          {{ totalCharges() > 0 ? (line.montant / totalCharges() * 100 | number:'1.1-1') : '0' }}%
                        </td>
                      </tr>
                    }
                  </tbody>
                  <tfoot>
                    <tr class="total-row">
                      <td>TOTAL CHARGES</td>
                      <td class="right">{{ totalCharges() | cents }}</td>
                      <td class="right pct-col">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div class="resultat-final" [class.profit]="resultatNet() >= 0" [class.loss]="resultatNet() < 0">
              <div class="rf-label">
                <mat-icon>{{ resultatNet() >= 0 ? 'emoji_events' : 'sentiment_dissatisfied' }}</mat-icon>
                {{ resultatNet() >= 0 ? "Bénéfice net de l'exercice" : "Perte nette de l'exercice" }}
              </div>
              <div class="rf-value">{{ resultatNet() | cents }}</div>
            </div>
          }
        </div>
      }

    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 20px; padding-bottom: 32px; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-shrink: 0; }
    .page-title  { font-size: 26px; font-weight: 800; color: #0d1b2a; margin: 0 0 4px; }
    .page-sub    { font-size: 13px; color: #78909c; margin: 0; }

    .btn-print {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer;
      background: #0d1b2a; color: white; font-size: 13px; font-weight: 600;
      transition: background .15s;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { background: #0f3460; }
    }

    /* Tab Bar */
    .tab-bar {
      display: flex; gap: 4px;
      background: white; border-radius: 14px; padding: 6px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
    }
    .tab-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 18px; border-radius: 10px;
      border: none; cursor: pointer; background: transparent;
      font-size: 13px; font-weight: 500; color: #78909c;
      transition: background .15s, color .15s; flex: 1; justify-content: center;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover  { background: #f0f4f8; color: #263238; }
      &.active { background: #1565c0; color: white; font-weight: 700; }
    }

    /* Report Card */
    .report-card {
      background: white; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      padding: 24px; display: flex; flex-direction: column; gap: 20px;
    }
    .report-header {
      display: flex; align-items: flex-start; gap: 14px;
      mat-icon { font-size: 28px; width: 28px; height: 28px; color: #1565c0; margin-top: 2px; }
      h2 { font-size: 18px; font-weight: 800; color: #0d1b2a; margin: 0 0 4px; }
      p  { font-size: 12px; color: #78909c; margin: 0; }
      div:nth-child(2) { flex: 1; }
    }
    .export-actions {
      display: flex; align-items: center; gap: 6px; flex-shrink: 0;
    }
    .btn-export {
      display: flex; align-items: center; gap: 5px;
      padding: 7px 13px; border-radius: 8px; border: 1px solid #cfd8e3;
      background: white; color: #455a64; font-size: 12px; font-weight: 600;
      cursor: pointer; transition: background .15s, color .15s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { background: #f0f4f8; color: #0d1b2a; }
    }
    .header-actions { display: flex; align-items: center; gap: 8px; }
    .btn-fec {
      display: flex; align-items: center; gap: 6px;
      padding: 9px 16px; border-radius: 10px; border: 1.5px solid #7b1fa2;
      background: #f3e5f5; color: #7b1fa2; font-size: 13px; font-weight: 700;
      cursor: pointer; transition: background .15s;
      mat-icon { font-size: 17px; width: 17px; height: 17px; }
      &:hover { background: #e1bee7; }
    }

    /* Loading & empty */
    .loading, .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 12px; padding: 48px; color: #78909c; font-size: 14px;
      mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: .4; }
    }

    /* Balance Summary */
    .balance-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .bs-item { background: #f8fafc; border-radius: 10px; padding: 12px 16px; }
    .bs-label { font-size: 11px; color: #78909c; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; margin-bottom: 4px; display: block; }
    .bs-val   { font-size: 15px; font-weight: 800; color: #0d1b2a; }
    .bs-debit  { color: #1565c0; }
    .bs-credit { color: #2e7d32; }

    /* Grand livre filters */
    .gl-filters { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .gl-select  { flex: 1; min-width: 260px; }
    .gl-date    { width: 160px; }

    .gl-account-header {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; background: #f0f4f8; border-radius: 10px;
    }
    .gl-code { font-family: 'Roboto Mono', monospace; font-size: 15px; font-weight: 700; color: #1565c0; }
    .gl-name { font-size: 14px; font-weight: 600; color: #0d1b2a; flex: 1; }

    /* Tables */
    .table-wrap { overflow-x: auto; }
    .report-table {
      width: 100%; border-collapse: collapse; font-size: 13px;
      th {
        background: #f0f4f8; color: #546e7a;
        font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px;
        padding: 10px 12px; border-bottom: 2px solid #dde3ea; white-space: nowrap;
      }
      td { padding: 9px 12px; border-bottom: 1px solid #f0f4f8; color: #263238; }
      &.compact th { padding: 8px 10px; font-size: 10px; }
      &.compact td { padding: 8px 10px; }
    }

    .cls-header-row td {
      background: #f8fafc; font-weight: 700; font-size: 12px; color: #546e7a;
      padding: 8px 12px; letter-spacing: .3px;
    }
    .subtotal-row td {
      background: #fafbfc; font-weight: 700; font-size: 12px; color: #263238;
      border-top: 1px solid #e0e0e0; border-bottom: 2px solid #dde3ea;
    }
    .subtotal-label { padding-left: 24px !important; }
    .total-row td   { background: #0d1b2a; color: white; font-weight: 800; font-size: 13px; }
    .section-row td {
      background: #f0f4f8; font-weight: 700; font-size: 11px; color: #546e7a;
      text-transform: uppercase; letter-spacing: .4px; padding: 7px 10px;
    }
    .data-row td { padding-left: 20px !important; }
    .result-row td { font-style: italic; }
    .result-profit { color: #2e7d32; font-weight: 800; }
    .result-loss   { color: #c62828; font-weight: 800; }
    .zero-row { opacity: .45; }
    .dim   { color: #b0bec5; }
    .right { text-align: right; }
    .debit-col  { color: #1565c0; }
    .credit-col { color: #2e7d32; }

    .col-date   { width: 90px; white-space: nowrap; }
    .col-piece  { width: 90px; }
    .col-lettre { width: 70px; text-align: center; }
    .solde-sign { font-size: 10px; font-weight: 700; margin-left: 3px; opacity: .7; }
    .lettre-badge {
      display: inline-flex; align-items: center; justify-content: center;
      background: #e3f2fd; color: #1565c0;
      border-radius: 4px; padding: 1px 6px; font-size: 11px; font-weight: 700;
    }

    code { font-family: 'Roboto Mono', monospace; font-size: 11px; color: #1565c0; }

    /* Class Badges */
    .cls-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px; border-radius: 6px;
      font-size: 11px; font-weight: 800; margin-right: 8px;
    }
    .cls-badge-sm { @extend .cls-badge; width: 18px; height: 18px; font-size: 10px; }
    .cls-1 { background: #e3f2fd; color: #1565c0; }
    .cls-2 { background: #e8f5e9; color: #2e7d32; }
    .cls-3 { background: #fff3e0; color: #bf360c; }
    .cls-4 { background: #fce4ec; color: #880e4f; }
    .cls-5 { background: #e0f7fa; color: #006064; }
    .cls-6 { background: #fde8e8; color: #b71c1c; }
    .cls-7 { background: #e8f5e9; color: #1b5e20; }
    .cls-8 { background: #f3e5f5; color: #4a148c; }

    /* Exercice selector */
    .exercice-select { width: 110px; margin-left: auto; }

    /* Bilan */
    .bilan-kpi { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .bk-item {
      display: flex; align-items: center; gap: 12px;
      background: #f8fafc; border-radius: 12px; padding: 16px 20px; flex: 1;
      mat-icon { font-size: 28px; width: 28px; height: 28px; }
    }
    .bk-actif  { border-left: 4px solid #1565c0; mat-icon { color: #1565c0; } }
    .bk-passif { border-left: 4px solid #2e7d32; mat-icon { color: #2e7d32; } }
    .bk-label  { font-size: 11px; color: #78909c; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; margin: 0 0 4px; }
    .bk-val    { font-size: 18px; font-weight: 800; color: #0d1b2a; margin: 0; }
    .bk-equals { font-size: 28px; font-weight: 800; color: #b0bec5; }
    .bk-balanced { display: flex; align-items: center; gap: 6px; color: #2e7d32; font-size: 13px; font-weight: 700; mat-icon { font-size: 18px; width: 18px; height: 18px; } }
    .bk-warning  { display: flex; align-items: center; gap: 6px; color: #f57f17; font-size: 13px; font-weight: 700; mat-icon { font-size: 18px; width: 18px; height: 18px; } }
    .bilan-cols  { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .bilan-col-header {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 800; padding: 10px 14px;
      border-radius: 8px 8px 0 0; letter-spacing: .5px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .bilan-actif-header  { background: #e3f2fd; color: #1565c0; }
    .bilan-passif-header { background: #e8f5e9; color: #2e7d32; }

    /* Compte de résultat */
    .resultat-kpi { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .rk-item {
      display: flex; align-items: center; gap: 12px;
      background: #f8fafc; border-radius: 12px; padding: 14px 18px; flex: 1;
      mat-icon { font-size: 26px; width: 26px; height: 26px; }
    }
    .rk-produits { border-left: 4px solid #2e7d32; mat-icon { color: #2e7d32; } }
    .rk-charges  { border-left: 4px solid #c62828; mat-icon { color: #c62828; } }
    .rk-profit   { border-left: 4px solid #2e7d32; mat-icon { color: #2e7d32; } }
    .rk-loss     { border-left: 4px solid #c62828; mat-icon { color: #c62828; } }
    .rk-label    { font-size: 11px; color: #78909c; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; margin: 0 0 4px; }
    .rk-val      { font-size: 17px; font-weight: 800; color: #0d1b2a; margin: 0; }
    .rk-minus, .rk-equals { font-size: 24px; font-weight: 800; color: #b0bec5; }

    .cmp-bar-wrap { }
    .cmp-bar { display: flex; height: 16px; border-radius: 8px; overflow: hidden; background: #f0f4f8; }
    .cmp-seg { min-width: 2px; transition: flex .4s; }
    .cmp-prod { background: linear-gradient(90deg, #43a047, #66bb6a); }
    .cmp-chg  { background: linear-gradient(90deg, #ef5350, #e53935); }
    .cmp-labels { display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; font-weight: 700; }
    .cmp-lbl-prod { color: #2e7d32; }
    .cmp-lbl-chg  { color: #c62828; }

    .resultat-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .rcol-header {
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; font-weight: 800; padding: 10px 14px;
      border-radius: 8px 8px 0 0; letter-spacing: .5px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .rcol-produits { background: #e8f5e9; color: #2e7d32; }
    .rcol-charges  { background: #fde8e8; color: #b71c1c; }
    .pct-col { min-width: 48px; }

    .resultat-final {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; border-radius: 14px;
    }
    .profit { background: linear-gradient(135deg, #e8f5e9, #f1f8e9); border: 2px solid #a5d6a7; }
    .loss   { background: linear-gradient(135deg, #fde8e8, #fce4ec); border: 2px solid #ef9a9a; }
    .rf-label {
      display: flex; align-items: center; gap: 10px;
      font-size: 16px; font-weight: 700; color: #0d1b2a;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    .profit .rf-label mat-icon { color: #2e7d32; }
    .loss   .rf-label mat-icon { color: #c62828; }
    .rf-value { font-size: 22px; font-weight: 900; }
    .profit .rf-value { color: #2e7d32; }
    .loss   .rf-value { color: #c62828; }

    @media (max-width: 900px) {
      .bilan-cols, .resultat-cols { grid-template-columns: 1fr; }
      .balance-summary { grid-template-columns: 1fr 1fr; }
      .resultat-kpi, .bilan-kpi { flex-direction: column; }
      .rk-equals, .rk-minus, .bk-equals { transform: rotate(90deg); align-self: center; }
      .gl-filters { flex-direction: column; }
      .gl-date, .gl-select { width: 100%; }
    }

    /* Print header */
    .print-header-fixed { display: none; }

    @media print {
      .print-header-fixed {
        display: flex !important;
        justify-content: space-between; align-items: baseline;
        position: fixed; top: 0; left: 0; right: 0;
        padding: 4mm 12mm 3mm;
        border-bottom: 2px solid #0d1b2a;
        background: white; z-index: 9999;
      }
      .phf-brand { font-size: 13pt; font-weight: 900; color: #0d1b2a; }
      .phf-sep   { margin: 0 8px; color: #b0bec5; }
      .phf-title { font-size: 10pt; font-weight: 700; color: #1565c0; }
      .phf-date  { font-size: 8pt; color: #78909c; }

      .page { padding-top: 0 !important; gap: 0; }
      .tab-bar, .btn-print, .page-header, .gl-filters { display: none !important; }
      .report-card { box-shadow: none !important; border: none !important; padding: 0 !important; gap: 12px !important; }
      .report-header mat-icon { display: none !important; }
      .table-wrap { overflow: visible !important; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
      .report-table    { font-size: 10pt; }
      .report-table th { font-size: 8pt; padding: 5px 8px; }
      .report-table td { padding: 5px 8px; font-size: 10pt; }
      .report-table tr      { page-break-inside: avoid; break-inside: avoid; }
      .cls-header-row        { page-break-after:  avoid; break-after:  avoid; }
      .subtotal-row          { page-break-before: avoid; break-before: avoid; }
      tfoot .total-row        { page-break-before: avoid; break-before: avoid; }
      .balance-summary { grid-template-columns: repeat(4, 1fr) !important; gap: 8px !important; }
      .bs-item { padding: 8px 12px; }
      .bilan-cols { grid-template-columns: 1fr !important; gap: 8px !important; }
      .bilan-col  { page-break-inside: avoid; break-inside: avoid; }
      .bilan-kpi  { flex-wrap: nowrap; }
      .bk-equals  { font-size: 20pt; }
      .resultat-cols  { grid-template-columns: 1fr !important; gap: 8px !important; }
      .cmp-bar-wrap   { display: none !important; }
      .resultat-kpi   { flex-wrap: nowrap; }
      .rk-minus, .rk-equals { font-size: 20pt; }
      .resultat-final { page-break-inside: avoid; break-inside: avoid; margin-top: 10px; }
    }
  `],
})
export class RapportsComponent implements OnInit {
  private readonly rapportsService = inject(RapportsService);
  private readonly accountService  = inject(AccountService);
  private readonly exportSvc       = inject(ExportService);

  readonly today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  readonly exerciceYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  activeTab       = signal<ReportTab>('balance');
  loadingBalance  = signal(false);
  loadingGl       = signal(false);
  loadingBilan    = signal(false);
  loadingResultat = signal(false);

  balanceLines = signal<BalanceLine[]>([]);
  accounts     = signal<Account[]>([]);
  grandLivre   = signal<GrandLivreResponse | null>(null);
  bilanData    = signal<BilanReport | null>(null);
  resultatData = signal<CompteResultatReport | null>(null);
  exercice     = signal(new Date().getFullYear());

  // Grand livre filters
  selectedAccountId: number | null = null;
  glDateFrom = '';
  glDateTo   = '';

  ngOnInit(): void {
    this.fetchBalance();
    this.accountService.getAll().subscribe(list => this.accounts.set(list));
    this.fetchBilan();
    this.fetchResultat();
  }

  setTab(tab: ReportTab): void {
    this.activeTab.set(tab);
    if (tab === 'balance' && this.balanceLines().length === 0) this.fetchBalance();
    if (tab === 'bilan'   && !this.bilanData())    this.fetchBilan();
    if (tab === 'resultat' && !this.resultatData()) this.fetchResultat();
  }

  onExerciceChange(year: number): void {
    this.exercice.set(year);
    this.fetchBilan();
    this.fetchResultat();
  }

  print(): void { globalThis.print(); }

  /* ── Exports Balance ── */
  exportBalancePdf(): void {
    this.exportSvc.pdfBalance(this.balanceLines(), {
      totalDebit:  this.totalMouvDebit(),
      totalCredit: this.totalMouvCredit(),
      soldesD:     this.totalSoldesDebiteurs(),
      soldesC:     this.totalSoldesCrediteurs(),
    });
  }
  exportBalanceExcel(): void { this.exportSvc.excelBalance(this.balanceLines()); }
  exportBalanceCsv():   void { this.exportSvc.csvBalance(this.balanceLines()); }

  /* ── Exports Grand Livre ── */
  exportGlPdf():   void { if (this.grandLivre()) this.exportSvc.pdfGrandLivre(this.grandLivre()!); }
  exportGlExcel(): void { if (this.grandLivre()) this.exportSvc.excelGrandLivre(this.grandLivre()!); }
  exportGlCsv():   void { if (this.grandLivre()) this.exportSvc.csvGrandLivre(this.grandLivre()!); }

  /* ── Export FEC ── */
  exportFec(): void { this.exportSvc.downloadFec(); }

  private fetchBalance(): void {
    this.loadingBalance.set(true);
    this.rapportsService.getBalance().subscribe({
      next: (lines) => { this.balanceLines.set(lines); this.loadingBalance.set(false); },
      error: ()      => { this.loadingBalance.set(false); },
    });
  }

  private fetchBilan(): void {
    this.loadingBilan.set(true);
    this.bilanData.set(null);
    this.rapportsService.getBilan(this.exercice()).subscribe({
      next: (d) => { this.bilanData.set(d); this.loadingBilan.set(false); },
      error: ()  => { this.loadingBilan.set(false); },
    });
  }

  private fetchResultat(): void {
    this.loadingResultat.set(true);
    this.resultatData.set(null);
    this.rapportsService.getCompteDeResultat(this.exercice()).subscribe({
      next: (d) => { this.resultatData.set(d); this.loadingResultat.set(false); },
      error: ()  => { this.loadingResultat.set(false); },
    });
  }

  loadGrandLivre(): void {
    if (!this.selectedAccountId) return;
    this.loadingGl.set(true);
    this.grandLivre.set(null);
    this.rapportsService.getGrandLivre(
      this.selectedAccountId,
      this.glDateFrom || undefined,
      this.glDateTo   || undefined,
    ).subscribe({
      next: (data) => { this.grandLivre.set(data); this.loadingGl.set(false); },
      error: ()     => { this.loadingGl.set(false); },
    });
  }

  /* ── helpers ── */
  solde(line: BalanceLine): number { return line.totalDebit - line.totalCredit; }

  /* ── BALANCE computed ── */
  balanceByClass = computed<BalanceGroup[]>(() => {
    const groups = new Map<number, BalanceGroup>();
    for (const line of this.balanceLines()) {
      if (!groups.has(line.account_class)) {
        groups.set(line.account_class, {
          cls: line.account_class, name: CLASS_NAMES[line.account_class] ?? `Classe ${line.account_class}`,
          lines: [], totalDebit: 0, totalCredit: 0, soldeDebiteur: 0, soldeCrediteur: 0,
        });
      }
      const g = groups.get(line.account_class)!;
      const s = this.solde(line);
      g.lines.push(line);
      g.totalDebit  += line.totalDebit;
      g.totalCredit += line.totalCredit;
      if (s > 0) g.soldeDebiteur  += s;
      else if (s < 0) g.soldeCrediteur += -s;
    }
    return Array.from(groups.values()).sort((a, b) => a.cls - b.cls);
  });

  totalMouvDebit        = computed(() => this.balanceLines().reduce((s, l) => s + l.totalDebit,  0));
  totalMouvCredit       = computed(() => this.balanceLines().reduce((s, l) => s + l.totalCredit, 0));
  totalSoldesDebiteurs  = computed(() => this.balanceLines().filter(l => this.solde(l) > 0).reduce((s, l) => s + this.solde(l), 0));
  totalSoldesCrediteurs = computed(() => this.balanceLines().filter(l => this.solde(l) < 0).reduce((s, l) => s - this.solde(l), 0));

  /* ── BILAN computed (depuis l'API, filtrée par exercice) ── */
  bilanActifImmobilise = computed<BilanLine[]>(() =>
    (this.bilanData()?.actif.immobilisations ?? []).map(p => ({ code: p.code, label: p.name, montant: p.solde }))
  );
  totalActifImmobilise = computed(() =>
    (this.bilanData()?.actif.immobilisations ?? []).reduce((s, p) => s + p.solde, 0)
  );

  bilanActifCirculant = computed<BilanLine[]>(() => {
    const a = this.bilanData()?.actif;
    if (!a) return [];
    return [...a.stocks, ...a.creances, ...a.disponibilites, ...a.autresActif]
      .map(p => ({ code: p.code, label: p.name, montant: p.solde }));
  });
  totalActifCirculant = computed(() => {
    const a = this.bilanData()?.actif;
    if (!a) return 0;
    return [...a.stocks, ...a.creances, ...a.disponibilites, ...a.autresActif].reduce((s, p) => s + p.solde, 0);
  });
  totalActif = computed(() => this.bilanData()?.actif.total ?? 0);

  bilanPassifCapitaux = computed<BilanLine[]>(() =>
    (this.bilanData()?.passif.capitauxPropres ?? []).map(p => ({ code: p.code, label: p.name, montant: p.solde }))
  );
  resultatNet = computed(() =>
    this.bilanData()?.resultatExercice ?? this.resultatData()?.resultat ?? 0
  );
  totalCapitauxPropres = computed(() =>
    (this.bilanData()?.passif.capitauxPropres ?? []).reduce((s, p) => s + p.solde, 0) + this.resultatNet()
  );
  bilanPassifDettes = computed<BilanLine[]>(() => {
    const p = this.bilanData()?.passif;
    if (!p) return [];
    return [...p.dettesFinancieres, ...p.dettesFournisseurs, ...p.autresDettes]
      .map(pp => ({ code: pp.code, label: pp.name, montant: pp.solde }));
  });
  totalDettes = computed(() => {
    const p = this.bilanData()?.passif;
    if (!p) return 0;
    return [...p.dettesFinancieres, ...p.dettesFournisseurs, ...p.autresDettes].reduce((s, pp) => s + pp.solde, 0);
  });
  totalPassif = computed(() => {
    const b = this.bilanData();
    return b ? b.passif.total + b.resultatExercice : 0;
  });

  /* ── COMPTE DE RÉSULTAT computed (depuis l'API, filtrée par exercice) ── */
  produitsLines = computed<ResultatLine[]>(() =>
    (this.resultatData()?.produits ?? []).map(p => ({ code: p.code, label: p.name, montant: p.montant }))
  );
  chargesLines = computed<ResultatLine[]>(() =>
    (this.resultatData()?.charges ?? []).map(p => ({ code: p.code, label: p.name, montant: p.montant }))
  );
  totalProduits = computed(() => this.resultatData()?.totalProduits ?? 0);
  totalCharges  = computed(() => this.resultatData()?.totalCharges  ?? 0);
  produitsPct = computed(() => {
    const t = this.totalProduits() + this.totalCharges();
    return t > 0 ? Math.round(this.totalProduits() / t * 100) : 50;
  });
  chargesPct = computed(() => 100 - this.produitsPct());
}
