import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AccountService } from '../../core/services/account.service';
import { Account } from '../../core/models/account.model';
import { CentsPipe } from '../../shared/pipes/cents.pipe';

type ReportTab = 'balance' | 'bilan' | 'resultat';

interface BalanceLine {
  id: number;
  code: string;
  name: string;
  class: number;
  totalDebit: number;
  totalCredit: number;
  solde: number;        // debit - credit
  isDebiteur: boolean;  // solde > 0
}

interface BilanActifLine  { label: string; code: string; montant: number; }
interface BilanPassifLine { label: string; code: string; montant: number; }
interface ResultatLine    { label: string; code: string; montant: number; }

const CLASS_NAMES: Record<number, string> = {
  1: 'Capitaux permanents',
  2: 'Immobilisations',
  3: 'Stocks',
  4: 'Tiers',
  5: 'Financiers',
  6: 'Charges',
  7: 'Produits',
  8: 'Résultats',
};

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, CentsPipe],
  template: `
    <div class="page">

      <!-- ── Header ── -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Rapports comptables</h1>
          <p class="page-sub">Balance · Bilan · Compte de résultat</p>
        </div>
        <button class="btn-print" (click)="print()" matTooltip="Imprimer ce rapport">
          <mat-icon>print</mat-icon>
          Imprimer
        </button>
      </div>

      <!-- ── Tab Bar ── -->
      <div class="tab-bar">
        <button class="tab-btn" [class.active]="activeTab() === 'balance'" (click)="setTab('balance')">
          <mat-icon>list_alt</mat-icon>
          Balance des comptes
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'bilan'" (click)="setTab('bilan')">
          <mat-icon>account_balance</mat-icon>
          Bilan comptable
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'resultat'" (click)="setTab('resultat')">
          <mat-icon>trending_up</mat-icon>
          Compte de résultat
        </button>
      </div>

      <!-- ══════════════════════════════════════════
           TAB 1 : BALANCE DES COMPTES
      ══════════════════════════════════════════ -->
      @if (activeTab() === 'balance') {
        <div class="report-card printable">

          <div class="report-header">
            <mat-icon>list_alt</mat-icon>
            <div>
              <h2>Balance générale des comptes</h2>
              <p>Tous les comptes du plan comptable — mouvements débit/crédit et soldes</p>
            </div>
          </div>

          <!-- Résumé balance -->
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
                        <span class="cls-badge-sm" [class]="'cls-' + line.class">{{ line.class }}</span>
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
                        @if (line.isDebiteur && line.solde > 0) { {{ line.solde | cents }} }
                        @else { <span class="dim">—</span> }
                      </td>
                      <td class="col-num right credit-col">
                        @if (!line.isDebiteur && line.solde < 0) { {{ -line.solde | cents }} }
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

        </div>
      }

      <!-- ══════════════════════════════════════════
           TAB 2 : BILAN COMPTABLE
      ══════════════════════════════════════════ -->
      @if (activeTab() === 'bilan') {
        <div class="report-card printable">

          <div class="report-header">
            <mat-icon>account_balance</mat-icon>
            <div>
              <h2>Bilan comptable</h2>
              <p>Situation patrimoniale — Actif et Passif</p>
            </div>
          </div>

          <!-- KPI Bilan -->
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
                Bilan déséquilibré (différence : {{ (totalActif() - totalPassif()) | cents }})
              </div>
            } @else {
              <div class="bk-balanced">
                <mat-icon>check_circle</mat-icon>
                Bilan équilibré
              </div>
            }
          </div>

          <!-- Table bilan 2 colonnes -->
          <div class="bilan-cols">

            <!-- ACTIF -->
            <div class="bilan-col">
              <div class="bilan-col-header bilan-actif-header">
                <mat-icon>north_east</mat-icon>
                ACTIF
              </div>
              <table class="report-table compact">
                <thead>
                  <tr>
                    <th>Rubrique</th>
                    <th class="right">Montant</th>
                  </tr>
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
                  <tr>
                    <th>Rubrique</th>
                    <th class="right">Montant</th>
                  </tr>
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
        </div>
      }

      <!-- ══════════════════════════════════════════
           TAB 3 : COMPTE DE RÉSULTAT
      ══════════════════════════════════════════ -->
      @if (activeTab() === 'resultat') {
        <div class="report-card printable">

          <div class="report-header">
            <mat-icon>trending_up</mat-icon>
            <div>
              <h2>Compte de résultat</h2>
              <p>Produits (Cl. 7) vs Charges (Cl. 6) — Résultat de l'exercice</p>
            </div>
          </div>

          <!-- KPI résultat -->
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

          <!-- Barre comparaison -->
          @if (totalProduits() + totalCharges() > 0) {
            <div class="cmp-bar-wrap">
              <div class="cmp-bar">
                <div class="cmp-seg cmp-prod" [style.flex]="totalProduits()"></div>
                <div class="cmp-seg cmp-chg"  [style.flex]="totalCharges()"></div>
              </div>
              <div class="cmp-labels">
                <span class="cmp-lbl cmp-lbl-prod">
                  Produits {{ produitsPct() }}%
                </span>
                <span class="cmp-lbl cmp-lbl-chg">
                  Charges {{ chargesPct() }}%
                </span>
              </div>
            </div>
          }

          <!-- Tables produits + charges côte à côte -->
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

          <!-- Résultat final -->
          <div class="resultat-final" [class.profit]="resultatNet() >= 0" [class.loss]="resultatNet() < 0">
            <div class="rf-label">
              <mat-icon>{{ resultatNet() >= 0 ? 'emoji_events' : 'sentiment_dissatisfied' }}</mat-icon>
              {{ resultatNet() >= 0 ? "Bénéfice net de l'exercice" : "Perte nette de l'exercice" }}
            </div>
            <div class="rf-value">{{ resultatNet() | cents }}</div>
          </div>

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

    /* ── Tab Bar ── */
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

    /* ── Report Card ── */
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
    }

    /* ── Balance Summary ── */
    .balance-summary {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
    }
    .bs-item {
      background: #f8fafc; border-radius: 10px; padding: 12px 16px;
    }
    .bs-label { font-size: 11px; color: #78909c; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; margin-bottom: 4px; display: block; }
    .bs-val   { font-size: 15px; font-weight: 800; color: #0d1b2a; }
    .bs-debit  { color: #1565c0; }
    .bs-credit { color: #2e7d32; }

    /* ── Tables ── */
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
    .total-row td {
      background: #0d1b2a; color: white;
      font-weight: 800; font-size: 13px;
    }
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

    code { font-family: 'Roboto Mono', monospace; font-size: 11px; color: #1565c0; }

    /* ── Class Badges ── */
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

    /* ── Bilan ── */
    .bilan-kpi {
      display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
    }
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
    .bk-balanced {
      display: flex; align-items: center; gap: 6px;
      color: #2e7d32; font-size: 13px; font-weight: 700;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .bk-warning {
      display: flex; align-items: center; gap: 6px;
      color: #f57f17; font-size: 13px; font-weight: 700;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .bilan-cols {
      display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
    }
    .bilan-col-header {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 800; padding: 10px 14px;
      border-radius: 8px 8px 0 0; letter-spacing: .5px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .bilan-actif-header  { background: #e3f2fd; color: #1565c0; }
    .bilan-passif-header { background: #e8f5e9; color: #2e7d32; }

    /* ── Compte de résultat ── */
    .resultat-kpi {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    }
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
    .cmp-bar {
      display: flex; height: 16px; border-radius: 8px; overflow: hidden; background: #f0f4f8;
    }
    .cmp-seg { min-width: 2px; transition: flex .4s; }
    .cmp-prod { background: linear-gradient(90deg, #43a047, #66bb6a); }
    .cmp-chg  { background: linear-gradient(90deg, #ef5350, #e53935); }
    .cmp-labels { display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; font-weight: 700; }
    .cmp-lbl-prod { color: #2e7d32; }
    .cmp-lbl-chg  { color: #c62828; }

    .resultat-cols {
      display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
    }
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
    }
    @media (max-width: 600px) {
      .tab-btn { font-size: 11px; padding: 9px 10px; gap: 5px; }
    }

    @media print {
      .tab-bar, .btn-print { display: none !important; }
      .report-card { box-shadow: none; border: 1px solid #dde; }
      .page { gap: 0; }
    }
  `],
})
export class RapportsComponent implements OnInit {
  private readonly accountService = inject(AccountService);
  accounts = signal<Account[]>([]);
  activeTab = signal<ReportTab>('balance');

  ngOnInit(): void {
    this.accountService.getAll().subscribe(list => this.accounts.set(list));
  }

  setTab(tab: ReportTab): void { this.activeTab.set(tab); }
  print(): void { window.print(); }

  /* ── Generic helpers ── */
  private accountDebit(a: Account)  { return (a.journalLines ?? []).reduce((s, l) => s + l.debit,  0); }
  private accountCredit(a: Account) { return (a.journalLines ?? []).reduce((s, l) => s + l.credit, 0); }
  private classDebit(cls: number)   { return this.accounts().filter(a => a.class === cls).reduce((s, a) => s + this.accountDebit(a),  0); }
  private classCredit(cls: number)  { return this.accounts().filter(a => a.class === cls).reduce((s, a) => s + this.accountCredit(a), 0); }

  /* ── BALANCE ── */
  balanceLines = computed<BalanceLine[]>(() =>
    this.accounts().map(a => {
      const td = this.accountDebit(a);
      const tc = this.accountCredit(a);
      const solde = td - tc;
      return { id: a.id, code: a.code, name: a.name, class: a.class,
               totalDebit: td, totalCredit: tc, solde, isDebiteur: solde >= 0 };
    }).sort((a, b) => a.code.localeCompare(b.code))
  );

  balanceByClass = computed(() => {
    const groups = new Map<number, { cls: number; name: string; lines: BalanceLine[]; totalDebit: number; totalCredit: number; soldeDebiteur: number; soldeCrediteur: number; }>();
    for (const line of this.balanceLines()) {
      if (!groups.has(line.class)) {
        groups.set(line.class, { cls: line.class, name: CLASS_NAMES[line.class] ?? `Classe ${line.class}`,
          lines: [], totalDebit: 0, totalCredit: 0, soldeDebiteur: 0, soldeCrediteur: 0 });
      }
      const g = groups.get(line.class)!;
      g.lines.push(line);
      g.totalDebit  += line.totalDebit;
      g.totalCredit += line.totalCredit;
      if (line.isDebiteur && line.solde > 0) g.soldeDebiteur  += line.solde;
      else if (!line.isDebiteur && line.solde < 0) g.soldeCrediteur += -line.solde;
    }
    return Array.from(groups.values()).sort((a, b) => a.cls - b.cls);
  });

  totalMouvDebit       = computed(() => this.balanceLines().reduce((s, l) => s + l.totalDebit,  0));
  totalMouvCredit      = computed(() => this.balanceLines().reduce((s, l) => s + l.totalCredit, 0));
  totalSoldesDebiteurs = computed(() => this.balanceLines().filter(l => l.isDebiteur && l.solde > 0).reduce((s, l) => s + l.solde, 0));
  totalSoldesCrediteurs = computed(() => this.balanceLines().filter(l => !l.isDebiteur && l.solde < 0).reduce((s, l) => s - l.solde, 0));

  /* ── BILAN ── */
  // Actif immobilisé : Cl. 2 (net = debit - credit)
  bilanActifImmobilise = computed<BilanActifLine[]>(() =>
    this.accounts()
      .filter(a => a.class === 2)
      .map(a => ({ code: a.code, label: a.name, montant: this.accountDebit(a) - this.accountCredit(a) }))
      .filter(l => l.montant > 0)
  );
  totalActifImmobilise = computed(() => this.bilanActifImmobilise().reduce((s, l) => s + l.montant, 0));

  // Actif circulant : Cl. 3 (stocks), Cl. 4 débiteurs, Cl. 5 (trésorerie)
  bilanActifCirculant = computed<BilanActifLine[]>(() => {
    const lines: BilanActifLine[] = [];
    // Stocks (Cl.3)
    this.accounts().filter(a => a.class === 3).forEach(a => {
      const m = this.accountDebit(a) - this.accountCredit(a);
      if (m > 0) lines.push({ code: a.code, label: a.name, montant: m });
    });
    // Créances (Cl.4 solde débiteur)
    this.accounts().filter(a => a.class === 4).forEach(a => {
      const m = this.accountDebit(a) - this.accountCredit(a);
      if (m > 0) lines.push({ code: a.code, label: a.name, montant: m });
    });
    // Trésorerie (Cl.5)
    this.accounts().filter(a => a.class === 5).forEach(a => {
      const m = this.accountDebit(a) - this.accountCredit(a);
      if (m > 0) lines.push({ code: a.code, label: a.name, montant: m });
    });
    return lines;
  });
  totalActifCirculant = computed(() => this.bilanActifCirculant().reduce((s, l) => s + l.montant, 0));
  totalActif          = computed(() => this.totalActifImmobilise() + this.totalActifCirculant());

  // Capitaux propres (Cl.1 solde créditeur)
  bilanPassifCapitaux = computed<BilanPassifLine[]>(() =>
    this.accounts()
      .filter(a => a.class === 1)
      .map(a => ({ code: a.code, label: a.name, montant: this.accountCredit(a) - this.accountDebit(a) }))
      .filter(l => l.montant > 0)
  );
  resultatNet          = computed(() => this.classCredit(7) - this.classDebit(6));
  totalCapitauxPropres = computed(() =>
    this.bilanPassifCapitaux().reduce((s, l) => s + l.montant, 0) + this.resultatNet()
  );

  // Dettes (Cl.4 solde créditeur + Cl.5 solde créditeur)
  bilanPassifDettes = computed<BilanPassifLine[]>(() => {
    const lines: BilanPassifLine[] = [];
    this.accounts()
      .filter(a => a.class === 4 || a.class === 5)
      .forEach(a => {
        const m = this.accountCredit(a) - this.accountDebit(a);
        if (m > 0) lines.push({ code: a.code, label: a.name, montant: m });
      });
    return lines;
  });
  totalDettes  = computed(() => this.bilanPassifDettes().reduce((s, l) => s + l.montant, 0));
  totalPassif  = computed(() => this.totalCapitauxPropres() + this.totalDettes());

  /* ── COMPTE DE RÉSULTAT ── */
  produitsLines = computed<ResultatLine[]>(() =>
    this.accounts()
      .filter(a => a.class === 7)
      .map(a => ({ code: a.code, label: a.name, montant: this.accountCredit(a) }))
      .filter(l => l.montant > 0)
      .sort((a, b) => a.code.localeCompare(b.code))
  );
  chargesLines = computed<ResultatLine[]>(() =>
    this.accounts()
      .filter(a => a.class === 6)
      .map(a => ({ code: a.code, label: a.name, montant: this.accountDebit(a) }))
      .filter(l => l.montant > 0)
      .sort((a, b) => a.code.localeCompare(b.code))
  );
  totalProduits = computed(() => this.produitsLines().reduce((s, l) => s + l.montant, 0));
  totalCharges  = computed(() => this.chargesLines().reduce((s, l) => s + l.montant, 0));
  produitsPct   = computed(() => {
    const t = this.totalProduits() + this.totalCharges();
    return t > 0 ? Math.round(this.totalProduits() / t * 100) : 50;
  });
  chargesPct    = computed(() => 100 - this.produitsPct());
}
