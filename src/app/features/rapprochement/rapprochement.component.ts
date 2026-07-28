import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RapprochementService } from '../../core/services/rapprochement.service';
import { AlertService } from '../../shared/components/alert/alert.service';
import { ReleveImport, LigneReleve, MatchCandidate } from '../../core/models/rapprochement.model';

type View = 'liste' | 'detail';

@Component({
  selector: 'app-rapprochement',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="page">

      <!-- ── En-tête ── -->
      <div class="page-header">
        <div class="page-title">
          <mat-icon class="title-icon">account_balance</mat-icon>
          <div>
            <h1>Rapprochement bancaire</h1>
            <p class="subtitle">Import de relevés · Rapprochement manuel · Solde théorique vs réel</p>
          </div>
        </div>

        @if (view() === 'liste') {
          <label class="import-btn" [class.loading]="importing()">
            @if (!importing()) {
              <mat-icon>upload_file</mat-icon>
              <span>Importer un relevé</span>
            } @else {
              <mat-spinner diameter="18"></mat-spinner>
              <span>Import en cours…</span>
            }
            <input type="file" accept=".csv,.ofx,.qfx" hidden (change)="onFileSelected($event)" />
          </label>
        } @else {
          <button mat-button class="back-btn" (click)="backToList()">
            <mat-icon>arrow_back</mat-icon> Retour aux relevés
          </button>
        }
      </div>

      <!-- ══════════════════════════════════════════
           VUE LISTE
      ══════════════════════════════════════════ -->
      @if (view() === 'liste') {

        <!-- KPIs solde -->
        <div class="kpi-row">
          <div class="kpi-card">
            <mat-icon class="kpi-icon kpi-blue">receipt_long</mat-icon>
            <div>
              <p class="kpi-val">{{ releves().length }}</p>
              <p class="kpi-lbl">Relevés importés</p>
            </div>
          </div>
          <div class="kpi-card">
            <mat-icon class="kpi-icon kpi-green">check_circle</mat-icon>
            <div>
              <p class="kpi-val">{{ totalLignesRaprochees() }}</p>
              <p class="kpi-lbl">Lignes rapprochées</p>
            </div>
          </div>
          <div class="kpi-card">
            <mat-icon class="kpi-icon kpi-orange">pending</mat-icon>
            <div>
              <p class="kpi-val">{{ totalLignesPendantes() }}</p>
              <p class="kpi-lbl">Lignes en attente</p>
            </div>
          </div>
          <div class="kpi-card">
            <mat-icon class="kpi-icon kpi-purple">percent</mat-icon>
            <div>
              <p class="kpi-val">{{ tauxRapprochement() }}%</p>
              <p class="kpi-lbl">Taux de rapprochement</p>
            </div>
          </div>
        </div>

        <!-- Liste des relevés -->
        @if (loading()) {
          <div class="loader"><mat-spinner diameter="40"></mat-spinner></div>
        } @else if (releves().length === 0) {
          <div class="empty-state">
            <mat-icon>cloud_upload</mat-icon>
            <h3>Aucun relevé importé</h3>
            <p>Importez un fichier CSV ou OFX de votre banque pour démarrer le rapprochement.</p>
            <label class="import-btn-lg">
              <mat-icon>upload_file</mat-icon> Importer un relevé
              <input type="file" accept=".csv,.ofx,.qfx" hidden (change)="onFileSelected($event)" />
            </label>
          </div>
        } @else {
          <div class="releves-grid">
            @for (r of releves(); track r.id) {
              <div class="releve-card" (click)="openReleve(r)">
                <div class="releve-header">
                  <div class="releve-nom">
                    <mat-icon class="releve-icon">description</mat-icon>
                    <span>{{ r.nom }}</span>
                  </div>
                  <button mat-icon-button class="releve-delete"
                    (click)="deleteReleve(r, $event)"
                    matTooltip="Supprimer">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </div>

                <div class="releve-meta">
                  <span class="meta-item">
                    <mat-icon>calendar_today</mat-icon>
                    {{ r.dateDebut ? formatDate(r.dateDebut) : '—' }}
                    @if (r.dateFin) { → {{ formatDate(r.dateFin) }} }
                  </span>
                  <span class="meta-item">
                    <mat-icon>format_list_numbered</mat-icon>
                    {{ r.lignes.length }} transaction{{ r.lignes.length !== 1 ? 's' : '' }}
                  </span>
                </div>

                <div class="releve-progress">
                  <div class="progress-labels">
                    <span>Rapprochement</span>
                    <span>{{ countRaprochees(r) }}/{{ r.lignes.length }}</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="progressPct(r)"></div>
                  </div>
                </div>

                @if (r.soldeFin !== null) {
                  <div class="releve-solde">
                    <span class="solde-lbl">Solde relevé</span>
                    <span class="solde-val">{{ r.soldeFin | number:'1.2-2' }} €</span>
                  </div>
                }
              </div>
            }
          </div>
        }
      }

      <!-- ══════════════════════════════════════════
           VUE DÉTAIL (rapprochement manuel)
      ══════════════════════════════════════════ -->
      @if (view() === 'detail' && activeReleve()) {
        <div class="detail-wrap">

          <!-- Bandeau solde théorique vs réel -->
          <div class="solde-banner">
            <div class="solde-item">
              <span class="solde-item-lbl">Solde d'ouverture relevé</span>
              <span class="solde-item-val">
                {{ activeReleve()!.soldeDebut !== null
                     ? formatCents(activeReleve()!.soldeDebut!) + ' €'
                     : '—' }}
              </span>
            </div>
            <div class="solde-arrow"><mat-icon>arrow_forward</mat-icon></div>
            <div class="solde-item">
              <span class="solde-item-lbl">Solde de clôture relevé</span>
              <span class="solde-item-val highlight">
                {{ activeReleve()!.soldeFin !== null
                     ? formatCents(activeReleve()!.soldeFin!) + ' €'
                     : '—' }}
              </span>
            </div>
            <div class="solde-sep"></div>
            <div class="solde-item">
              <span class="solde-item-lbl">Mouvement total</span>
              <span class="solde-item-val" [class.neg]="soldeMovement() < 0" [class.pos]="soldeMovement() > 0">
                {{ formatCents(soldeMovement()) }} €
              </span>
            </div>
            <div class="solde-item">
              <span class="solde-item-lbl">Rapproché</span>
              <span class="solde-item-val pos">{{ formatCents(soldeRaproche()) }} €</span>
            </div>
            <div class="solde-item">
              <span class="solde-item-lbl">À rapprocher</span>
              <span class="solde-item-val" [class.neg]="soldeEnAttente() !== 0">
                {{ formatCents(soldeEnAttente()) }} €
              </span>
            </div>
            @if (soldeTheorique() !== null) {
              <div class="solde-sep"></div>
              <div class="solde-item">
                <span class="solde-item-lbl">Solde théorique comptable</span>
                <span class="solde-item-val">{{ formatCents(soldeTheorique()!) }} €</span>
              </div>
              <div class="solde-item"
                [class.solde-item-ok]="ecartReconciliation() === 0"
                [class.solde-item-warn]="ecartReconciliation() !== 0">
                <span class="solde-item-lbl">Écart théorique / réel</span>
                <span class="solde-item-val"
                  [class.pos]="ecartReconciliation() === 0"
                  [class.neg]="ecartReconciliation() !== 0">
                  @if (ecartReconciliation() === 0) {
                    <mat-icon style="font-size:14px;width:14px;height:14px;vertical-align:middle">check_circle</mat-icon>
                    Équilibré
                  } @else {
                    {{ formatCents(ecartReconciliation()!) }} €
                  }
                </span>
              </div>
            }
          </div>

          <!-- Filtres + action matching auto -->
          <div class="filter-bar">
            <button class="filter-chip" [class.active]="filtre() === 'tous'"
              (click)="filtre.set('tous')">Toutes ({{ activeReleve()!.lignes.length }})</button>
            <button class="filter-chip" [class.active]="filtre() === 'en_attente'"
              (click)="filtre.set('en_attente')">En attente ({{ countPendantes() }})</button>
            <button class="filter-chip filter-chip-green" [class.active]="filtre() === 'rapprochees'"
              (click)="filtre.set('rapprochees')">Rapprochées ({{ countRaprochees(activeReleve()!) }})</button>
            <div class="filter-spacer"></div>
            @if (countPendantes() > 0) {
              <button class="btn-auto-match" (click)="autoMatch()" [disabled]="autoMatching()">
                @if (autoMatching()) {
                  <mat-spinner diameter="14"></mat-spinner> Matching…
                } @else {
                  <mat-icon>auto_fix_high</mat-icon> Rapprocher auto ({{ countPendantes() }})
                }
              </button>
            }
          </div>

          <!-- Tableau de rapprochement -->
          <div class="table-wrap">
            <table class="recon-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Libellé relevé</th>
                  <th>Référence</th>
                  <th class="text-right">Montant</th>
                  <th>Statut</th>
                  <th>Écriture liée</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (ligne of lignesFiltrees(); track ligne.id) {
                  <tr [class.row-rapprochee]="ligne.rapprochee" [class.row-pending]="!ligne.rapprochee">
                    <td class="cell-date">{{ formatDate(ligne.date) }}</td>
                    <td class="cell-libelle">{{ ligne.libelle }}</td>
                    <td class="cell-ref">{{ ligne.reference ?? '—' }}</td>
                    <td class="cell-montant" [class.neg]="ligne.montant < 0" [class.pos]="ligne.montant > 0">
                      {{ formatCents(ligne.montant) }} €
                    </td>
                    <td>
                      @if (ligne.rapprochee) {
                        <span class="badge badge-green">
                          <mat-icon>check_circle</mat-icon> Rapprochée
                        </span>
                      } @else {
                        <span class="badge badge-orange">
                          <mat-icon>schedule</mat-icon> En attente
                        </span>
                      }
                    </td>
                    <td class="cell-ecriture">
                      @if (ligne.journalLine) {
                        <span class="ecriture-ref">
                          {{ ligne.journalLine.account?.code }} — {{ ligne.journalLine.entry?.label }}
                          <br/>
                          <small>{{ formatDate(ligne.journalLine.entry?.date ?? '') }}</small>
                        </span>
                      } @else {
                        <span class="no-link">—</span>
                      }
                    </td>
                    <td class="cell-actions">
                      @if (!ligne.rapprochee) {
                        <div class="action-row">
                          <button mat-icon-button class="btn-suggest"
                            (click)="showCandidates(ligne)"
                            [disabled]="loadingCandidatesFor() === ligne.id"
                            [class.active]="candidatesByLigne()[ligne.id]"
                            matTooltip="Suggestions de rapprochement">
                            @if (loadingCandidatesFor() === ligne.id) {
                              <mat-spinner diameter="16"></mat-spinner>
                            } @else {
                              <mat-icon>manage_search</mat-icon>
                            }
                          </button>
                          <input class="jl-input" type="number" placeholder="ID ligne journal"
                            [(ngModel)]="journalLineInputs[ligne.id]"
                            (keydown.enter)="rapprocher(ligne)"
                            matTooltip="Saisir l'ID de la ligne du journal comptable" />
                          <button mat-icon-button class="btn-rapprocher"
                            (click)="rapprocher(ligne)"
                            [disabled]="!journalLineInputs[ligne.id]"
                            matTooltip="Rapprocher manuellement">
                            <mat-icon>link</mat-icon>
                          </button>
                        </div>
                      } @else {
                        <button mat-icon-button class="btn-derapprocher"
                          (click)="derapprocher(ligne)"
                          matTooltip="Annuler le rapprochement">
                          <mat-icon>link_off</mat-icon>
                        </button>
                      }
                    </td>
                  </tr>
                  @if (candidatesByLigne()[ligne.id]) {
                    <tr class="candidates-row">
                      <td colspan="7" class="candidates-cell">
                        @if (candidatesByLigne()[ligne.id].length === 0) {
                          <span class="no-candidates">Aucune suggestion trouvée pour cette ligne.</span>
                        } @else {
                          <div class="candidates-list">
                            <span class="candidates-title">
                              <mat-icon>auto_fix_high</mat-icon>
                              {{ candidatesByLigne()[ligne.id].length }} suggestion(s)
                            </span>
                            @for (c of candidatesByLigne()[ligne.id]; track c.journalLineId) {
                              <div class="candidate-item">
                                <div class="candidate-score" [class.score-high]="c.score >= 75" [class.score-med]="c.score >= 40 && c.score < 75">
                                  {{ c.score }}
                                </div>
                                <div class="candidate-info">
                                  <span class="candidate-account">{{ c.account.code }} — {{ c.account.name }}</span>
                                  <span class="candidate-entry">{{ c.entry.label }} · {{ formatDate(c.entry.date) }}</span>
                                  <span class="candidate-amounts">
                                    D : {{ formatCents(c.debit) }} € · C : {{ formatCents(c.credit) }} €
                                  </span>
                                  <span class="candidate-reasons">{{ c.reasons.join(' · ') }}</span>
                                </div>
                                <button class="btn-apply-candidate" (click)="applyCandidate(ligne, c)">
                                  <mat-icon>link</mat-icon> Rapprocher
                                </button>
                              </div>
                            }
                          </div>
                        }
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

        </div>
      }

    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 24px; }

    /* ── En-tête ── */
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
    }
    .page-title {
      display: flex; align-items: center; gap: 14px;
      h1 { margin: 0; font-size: 22px; font-weight: 700; color: #0d1b2a; }
      .subtitle { margin: 4px 0 0; font-size: 13px; color: #78909c; }
    }
    .title-icon { font-size: 32px; width: 32px; height: 32px; color: #1565c0; }

    .import-btn {
      display: inline-flex; align-items: center; gap: 8px;
      background: #1565c0; color: white; border-radius: 10px;
      padding: 10px 18px; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: background .15s; white-space: nowrap;
      &.loading { background: #1976d2; cursor: default; opacity: .8; }
      &:hover:not(.loading) { background: #0d47a1; }
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }

    .back-btn {
      display: flex; align-items: center; gap: 6px;
      color: #1565c0; font-weight: 600;
    }

    /* ── KPIs ── */
    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .kpi-card {
      background: white; border-radius: 14px; padding: 20px;
      display: flex; align-items: center; gap: 16px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
    }
    .kpi-icon { font-size: 32px; width: 32px; height: 32px; }
    .kpi-blue   { color: #1565c0; }
    .kpi-green  { color: #2e7d32; }
    .kpi-orange { color: #e65100; }
    .kpi-purple { color: #6a1b9a; }
    .kpi-val { margin: 0; font-size: 26px; font-weight: 800; color: #0d1b2a; line-height: 1; }
    .kpi-lbl { margin: 4px 0 0; font-size: 12px; color: #78909c; }

    /* ── Empty / Loader ── */
    .loader { display: flex; justify-content: center; padding: 60px; }
    .empty-state {
      background: white; border-radius: 16px; text-align: center;
      padding: 64px 32px; box-shadow: 0 2px 8px rgba(13,27,42,.07);
      mat-icon { font-size: 56px; width: 56px; height: 56px; color: #cfd8dc; margin-bottom: 16px; }
      h3 { margin: 0 0 8px; font-size: 18px; color: #37474f; }
      p  { margin: 0 0 24px; color: #90a4ae; font-size: 14px; }
    }
    .import-btn-lg {
      display: inline-flex; align-items: center; gap: 8px;
      background: #1565c0; color: white; border-radius: 10px;
      padding: 12px 24px; font-size: 14px; font-weight: 600; cursor: pointer;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
      &:hover { background: #0d47a1; }
    }

    /* ── Grille relevés ── */
    .releves-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .releve-card {
      background: white; border-radius: 14px; padding: 20px; cursor: pointer;
      box-shadow: 0 2px 8px rgba(13,27,42,.07); border: 1.5px solid transparent;
      transition: border-color .15s, box-shadow .15s;
      &:hover { border-color: #1565c0; box-shadow: 0 4px 16px rgba(21,101,192,.12); }
    }
    .releve-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
    }
    .releve-nom {
      display: flex; align-items: center; gap: 8px;
      font-weight: 600; color: #0d1b2a; font-size: 14px;
      mat-icon { color: #1565c0; font-size: 20px; width: 20px; height: 20px; }
    }
    .releve-delete { color: #ef9a9a !important; &:hover { color: #e53935 !important; } }

    .releve-meta {
      display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px;
    }
    .meta-item {
      display: flex; align-items: center; gap: 6px; font-size: 12px; color: #78909c;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    .progress-labels { display: flex; justify-content: space-between; font-size: 12px; color: #78909c; margin-bottom: 6px; }
    .progress-bar { height: 6px; background: #e8edf2; border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: #43a047; border-radius: 3px; transition: width .3s; }

    .releve-solde {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f4f8;
    }
    .solde-lbl { font-size: 12px; color: #78909c; }
    .solde-val { font-size: 15px; font-weight: 700; color: #0d1b2a; }

    /* ── Solde banner ── */
    .solde-banner {
      background: white; border-radius: 14px; padding: 20px 24px;
      display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
    }
    .solde-item { display: flex; flex-direction: column; gap: 4px; }
    .solde-item-lbl { font-size: 11px; color: #90a4ae; text-transform: uppercase; letter-spacing: .5px; }
    .solde-item-val { font-size: 18px; font-weight: 700; color: #0d1b2a; }
    .solde-item-val.highlight { color: #1565c0; }
    .solde-arrow mat-icon { color: #cfd8dc; font-size: 22px; }
    .solde-sep { width: 1px; height: 40px; background: #e8edf2; margin: 0 8px; }

    /* ── Filtres ── */
    .filter-bar { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-chip {
      padding: 6px 16px; border-radius: 20px; border: 1.5px solid #e0e0e0;
      background: white; font-size: 13px; font-weight: 500; color: #546e7a;
      cursor: pointer; transition: all .15s;
      &.active { background: #e3f2fd; border-color: #1565c0; color: #1565c0; font-weight: 700; }
      &:hover:not(.active) { background: #f5f9ff; border-color: #90caf9; }
    }
    .filter-chip-green.active { background: #e8f5e9; border-color: #43a047; color: #2e7d32; }

    /* ── Table ── */
    .table-wrap { background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 8px rgba(13,27,42,.07); }
    .recon-table {
      width: 100%; border-collapse: collapse;
      th {
        background: #f8fafc; padding: 12px 14px; text-align: left;
        font-size: 11px; font-weight: 700; text-transform: uppercase;
        letter-spacing: .5px; color: #78909c;
        border-bottom: 1px solid #e8edf2;
      }
      td {
        padding: 12px 14px; font-size: 13px; color: #37474f;
        border-bottom: 1px solid #f5f7fa; vertical-align: middle;
      }
      tr:last-child td { border-bottom: none; }
    }
    .row-rapprochee { background: #f1f8f1; }
    .row-pending:hover td { background: #fafcff; }

    .cell-date { white-space: nowrap; color: #78909c; font-size: 12px; }
    .cell-libelle { font-weight: 500; color: #0d1b2a; max-width: 200px; }
    .cell-ref { font-size: 12px; color: #90a4ae; }
    .cell-montant { font-weight: 700; white-space: nowrap; text-align: right; }
    .text-right { text-align: right; }

    .pos { color: #2e7d32; }
    .neg { color: #c62828; }

    .badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
      mat-icon { font-size: 13px; width: 13px; height: 13px; }
    }
    .badge-green  { background: #e8f5e9; color: #2e7d32; }
    .badge-orange { background: #fff3e0; color: #e65100; }

    .ecriture-ref { font-size: 12px; color: #1565c0; font-weight: 500; small { color: #90a4ae; font-weight: 400; } }
    .no-link { color: #cfd8dc; }

    .action-row { display: flex; align-items: center; gap: 6px; }
    .jl-input {
      width: 100px; padding: 5px 8px; border: 1.5px solid #e0e0e0;
      border-radius: 8px; font-size: 12px; outline: none;
      &:focus { border-color: #1565c0; }
    }
    .solde-item-ok   { border-left: 3px solid #2e7d32; border-radius: 4px; padding-left: 8px; }
    .solde-item-warn { border-left: 3px solid #f57f17; border-radius: 4px; padding-left: 8px; }
    .btn-rapprocher { color: #1565c0 !important; &:hover { color: #0d47a1 !important; } }
    .btn-derapprocher { color: #90a4ae !important; &:hover { color: #e53935 !important; } }

    .cell-ecriture { max-width: 180px; }
    .cell-actions { white-space: nowrap; }

    .detail-wrap { display: flex; flex-direction: column; gap: 20px; }

    /* ── Auto-match & Suggestions ── */
    .filter-spacer { flex: 1; }
    .btn-auto-match {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 16px; border-radius: 20px; border: none; cursor: pointer;
      background: #1565c0; color: white; font-size: 13px; font-weight: 600;
      transition: background .15s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover:not(:disabled) { background: #0d47a1; }
      &:disabled { opacity: .6; cursor: default; }
    }
    .btn-suggest {
      color: #78909c !important;
      &.active { color: #1565c0 !important; }
      &:hover:not(:disabled) { color: #1565c0 !important; }
    }
    .candidates-row { background: #f0f6ff; }
    .candidates-cell { padding: 0 !important; }
    .candidates-list {
      padding: 12px 20px; display: flex; flex-direction: column; gap: 8px;
    }
    .candidates-title {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 700; color: #1565c0; text-transform: uppercase;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .candidate-item {
      display: flex; align-items: center; gap: 12px;
      background: white; border-radius: 8px; padding: 10px 14px;
      border: 1px solid #e3f2fd; box-shadow: 0 1px 3px rgba(21,101,192,.06);
    }
    .candidate-score {
      min-width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 800; background: #e0e0e0; color: #546e7a;
      &.score-high { background: #e8f5e9; color: #2e7d32; }
      &.score-med  { background: #fff8e1; color: #f57f17; }
    }
    .candidate-info {
      flex: 1; display: flex; flex-direction: column; gap: 2px;
    }
    .candidate-account { font-size: 13px; font-weight: 600; color: #0d1b2a; }
    .candidate-entry   { font-size: 12px; color: #546e7a; }
    .candidate-amounts { font-size: 11px; color: #90a4ae; }
    .candidate-reasons { font-size: 11px; color: #1565c0; font-style: italic; }
    .btn-apply-candidate {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 5px 12px; border-radius: 6px; border: 1px solid #1565c0;
      background: white; color: #1565c0; font-size: 12px; font-weight: 600;
      cursor: pointer; white-space: nowrap;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
      &:hover { background: #e3f2fd; }
    }
    .no-candidates { display: block; padding: 12px 20px; font-size: 13px; color: #90a4ae; font-style: italic; }
  `],
})
export class RapprochementComponent implements OnInit {
  private readonly svc   = inject(RapprochementService);
  private readonly alert = inject(AlertService);

  loading   = signal(true);
  importing = signal(false);
  view      = signal<View>('liste');
  releves   = signal<ReleveImport[]>([]);
  activeReleve = signal<ReleveImport | null>(null);
  filtre    = signal<'tous' | 'en_attente' | 'rapprochees'>('tous');

  // Map: ligneId → journalLineId saisi dans le champ
  journalLineInputs: Record<number, number | null> = {};

  autoMatching         = signal(false);
  candidatesByLigne    = signal<Record<number, MatchCandidate[]>>({});
  loadingCandidatesFor = signal<number | null>(null);

  // ── Computed ────────────────────────────────────────────────────────────────

  totalLignesRaprochees = computed(() =>
    this.releves().reduce((s, r) => s + r.lignes.filter(l => l.rapprochee).length, 0),
  );

  totalLignesPendantes = computed(() =>
    this.releves().reduce((s, r) => s + r.lignes.filter(l => !l.rapprochee).length, 0),
  );

  tauxRapprochement = computed(() => {
    const total = this.releves().reduce((s, r) => s + r.lignes.length, 0);
    if (total === 0) return 0;
    return Math.round((this.totalLignesRaprochees() / total) * 100);
  });

  lignesFiltrees = computed(() => {
    const r = this.activeReleve();
    if (!r) return [];
    switch (this.filtre()) {
      case 'en_attente':  return r.lignes.filter(l => !l.rapprochee);
      case 'rapprochees': return r.lignes.filter(l =>  l.rapprochee);
      default:            return r.lignes;
    }
  });

  soldeMovement = computed(() => {
    const r = this.activeReleve();
    if (!r) return 0;
    return r.lignes.reduce((s, l) => s + l.montant, 0);
  });

  soldeRaproche = computed(() => {
    const r = this.activeReleve();
    if (!r) return 0;
    return r.lignes.filter(l => l.rapprochee).reduce((s, l) => s + l.montant, 0);
  });

  soldeEnAttente = computed(() => {
    const r = this.activeReleve();
    if (!r) return 0;
    return r.lignes.filter(l => !l.rapprochee).reduce((s, l) => s + l.montant, 0);
  });

  /**
   * Solde théorique = solde d'ouverture relevé + montant cumulé des lignes rapprochées.
   * Représente ce que la comptabilité confirme comme solde bancaire à date.
   * Doit être égal au soldeFin quand le rapprochement est complet.
   */
  soldeTheorique = computed(() => {
    const r = this.activeReleve();
    return r?.soldeDebut == null ? null : r.soldeDebut + this.soldeRaproche();
  });

  /**
   * Écart = soldeFin (relevé réel) − solde théorique (comptabilité confirmée).
   * 0 → rapprochement complet et correct.
   * ≠ 0 → lignes en attente ou écarts inexpliqués.
   */
  ecartReconciliation = computed(() => {
    const theo = this.soldeTheorique();
    return this.activeReleve()?.soldeFin != null && theo !== null
      ? this.activeReleve()!.soldeFin! - theo
      : null;
  });

  countPendantes = computed(() => this.activeReleve()?.lignes.filter(l => !l.rapprochee).length ?? 0);

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadReleves();
  }

  private loadReleves(): void {
    this.loading.set(true);
    this.svc.getReleves().subscribe({
      next: list => { this.releves.set(list); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    // Reset input pour permettre re-sélection même fichier
    (event.target as HTMLInputElement).value = '';

    this.importing.set(true);
    this.svc.importReleve(file).subscribe({
      next: releve => {
        this.releves.update(list => [releve, ...list]);
        this.importing.set(false);
        this.alert.success(`Relevé "${releve.nom}" importé — ${releve.lignes.length} transactions.`);
      },
      error: () => {
        this.importing.set(false);
        this.alert.error('Erreur lors de l\'import. Vérifiez le format du fichier (CSV ou OFX).');
      },
    });
  }

  openReleve(releve: ReleveImport): void {
    // Charge le détail complet (avec journalLine embedded)
    this.svc.getReleve(releve.id).subscribe({
      next: full => {
        this.activeReleve.set(full);
        this.filtre.set('tous');
        this.journalLineInputs = {};
        this.view.set('detail');
      },
      error: () => this.alert.error('Impossible de charger le relevé.'),
    });
  }

  backToList(): void {
    this.loadReleves();
    this.activeReleve.set(null);
    this.view.set('liste');
  }

  deleteReleve(releve: ReleveImport, event: MouseEvent): void {
    event.stopPropagation();
    if (!confirm(`Supprimer le relevé "${releve.nom}" et ses ${releve.lignes.length} lignes ?`)) return;
    this.svc.deleteReleve(releve.id).subscribe({
      next: () => {
        this.releves.update(list => list.filter(r => r.id !== releve.id));
        this.alert.success('Relevé supprimé.');
      },
      error: () => this.alert.error('Erreur lors de la suppression.'),
    });
  }

  rapprocher(ligne: LigneReleve): void {
    const jlId = this.journalLineInputs[ligne.id];
    if (!jlId) return;
    this.svc.rapprocher(ligne.id, jlId).subscribe({
      next: updated => {
        this.updateLigne(updated);
        this.alert.success('Ligne rapprochée.');
      },
      error: () => this.alert.error('Erreur lors du rapprochement.'),
    });
  }

  derapprocher(ligne: LigneReleve): void {
    this.svc.derapprocher(ligne.id).subscribe({
      next: updated => {
        // Recharge pour avoir les données journalLine à jour
        const r = this.activeReleve();
        if (!r) return;
        this.svc.getReleve(r.id).subscribe({ next: full => this.activeReleve.set(full) });
        this.alert.success('Rapprochement annulé.');
      },
      error: () => this.alert.error('Erreur lors de l\'annulation.'),
    });
  }

  autoMatch(): void {
    const r = this.activeReleve();
    if (!r) return;
    this.autoMatching.set(true);
    this.svc.autoMatch(r.id).subscribe({
      next: result => {
        this.autoMatching.set(false);
        this.alert.success(`Matching auto : ${result.matched} rapprochée(s), ${result.skipped} ignorée(s).`);
        this.svc.getReleve(r.id).subscribe({ next: full => this.activeReleve.set(full) });
      },
      error: () => { this.autoMatching.set(false); this.alert.error('Erreur lors du matching automatique.'); },
    });
  }

  showCandidates(ligne: LigneReleve): void {
    if (this.candidatesByLigne()[ligne.id]) {
      this.dismissCandidates(ligne.id);
      return;
    }
    this.loadingCandidatesFor.set(ligne.id);
    this.svc.getMatchCandidates(ligne.id).subscribe({
      next: list => {
        this.candidatesByLigne.update(m => ({ ...m, [ligne.id]: list }));
        this.loadingCandidatesFor.set(null);
      },
      error: () => { this.loadingCandidatesFor.set(null); this.alert.error('Impossible de charger les suggestions.'); },
    });
  }

  dismissCandidates(ligneId: number): void {
    this.candidatesByLigne.update(m => {
      const copy = { ...m };
      delete copy[ligneId];
      return copy;
    });
  }

  applyCandidate(ligne: LigneReleve, candidate: MatchCandidate): void {
    this.svc.rapprocher(ligne.id, candidate.journalLineId).subscribe({
      next: updated => {
        this.updateLigne(updated);
        this.dismissCandidates(ligne.id);
        this.alert.success('Ligne rapprochée via suggestion.');
      },
      error: () => this.alert.error('Erreur lors du rapprochement.'),
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private updateLigne(updated: LigneReleve): void {
    this.activeReleve.update(r => {
      if (!r) return r;
      return {
        ...r,
        lignes: r.lignes.map(l => l.id === updated.id ? { ...l, ...updated } : l),
      };
    });
  }

  countRaprochees(releve: ReleveImport): number {
    return releve.lignes.filter(l => l.rapprochee).length;
  }

  progressPct(releve: ReleveImport): number {
    if (releve.lignes.length === 0) return 0;
    return Math.round((this.countRaprochees(releve) / releve.lignes.length) * 100);
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatCents(centimes: number): string {
    return (centimes / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
