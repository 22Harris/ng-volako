import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FactureService } from '../../../core/services/facture.service';
import { AlertService } from '../../../shared/components/alert/alert.service';
import { CurrencyInputComponent } from '../../../shared/components/currency-input/currency-input.component';
import { CentsPipe } from '../../../shared/pipes/cents.pipe';
import { Facture, FactureStatut, PaiementMode } from '../../../core/models/facture.model';

const STATUT_CONFIG: Record<FactureStatut, { label: string; color: string; bg: string; icon: string }> = {
  EN_ATTENTE:          { label: 'En attente',           color: '#e65100', bg: '#fff3e0', icon: 'schedule' },
  PARTIELLEMENT_PAYEE: { label: 'Partiellement payée',  color: '#1565c0', bg: '#e3f2fd', icon: 'payments' },
  PAYEE:               { label: 'Payée',                color: '#2e7d32', bg: '#e8f5e9', icon: 'check_circle' },
  ANNULEE:             { label: 'Annulée',              color: '#757575', bg: '#f5f5f5', icon: 'cancel' },
};

const MODE_LABELS: Record<PaiementMode, string> = {
  VIREMENT: 'Virement', CHEQUE: 'Chèque', ESPECES: 'Espèces', CARTE: 'Carte', PRELEVEMENT: 'Prélèvement',
};

@Component({
  selector: 'app-facture-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, CurrencyInputComponent, CentsPipe,
  ],
  template: `
    <div class="page">

      <!-- Back -->
      <a routerLink="/factures" class="back-link">
        <mat-icon>arrow_back</mat-icon> Retour aux factures
      </a>

      @if (loading()) {
        <div class="loading"><mat-icon class="spin">sync</mat-icon> Chargement…</div>
      } @else if (facture()) {
        <div class="detail-layout">

          <!-- Left: info facture -->
          <div class="card detail-card">
            <div class="card-header">
              <div>
                <h2>Facture {{ facture()!.numero }}</h2>
                <span class="statut-badge"
                  [style.color]="cfg(facture()!.statut).color"
                  [style.background]="cfg(facture()!.statut).bg">
                  <mat-icon>{{ cfg(facture()!.statut).icon }}</mat-icon>
                  {{ cfg(facture()!.statut).label }}
                </span>
              </div>
              @if (facture()!.statut !== 'PAYEE' && facture()!.statut !== 'ANNULEE') {
                <button mat-stroked-button (click)="lettrer()">
                  <mat-icon>done_all</mat-icon> Lettrer (soldé)
                </button>
              }
            </div>

            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Tiers</span>
                <span class="info-value">
                  <span class="tiers-type" [class.type-client]="facture()!.tiersType === 'CLIENT'" [class.type-fournisseur]="facture()!.tiersType === 'FOURNISSEUR'">
                    {{ facture()!.tiersType === 'CLIENT' ? 'C' : 'F' }}
                  </span>
                  {{ facture()!.tiersNom }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Date</span>
                <span class="info-value">{{ facture()!.date | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Échéance</span>
                <span class="info-value" [class.retard]="isRetard()">
                  {{ facture()!.dateEcheance ? (facture()!.dateEcheance | date:'dd/MM/yyyy') : '—' }}
                  @if (isRetard()) { <mat-icon class="warn-icon">warning</mat-icon> }
                </span>
              </div>
              @if (facture()!.notes) {
                <div class="info-item full-span">
                  <span class="info-label">Notes</span>
                  <span class="info-value">{{ facture()!.notes }}</span>
                </div>
              }
            </div>

            <div class="amounts">
              <div class="amount-row">
                <span>Montant total</span>
                <span class="amount-val">{{ facture()!.montant | cents }}</span>
              </div>
              <div class="amount-row">
                <span>Déjà payé</span>
                <span class="amount-val paye">{{ facture()!.montantPaye | cents }}</span>
              </div>
              <div class="amount-row total-row">
                <span>Reste à payer</span>
                <span class="amount-val reste" [class.reste-zero]="facture()!.resteAPayer === 0">
                  {{ facture()!.resteAPayer | cents }}
                </span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="progressPercent()"></div>
              </div>
              <p class="progress-label">{{ progressPercent() | number:'1.0-0' }}% réglé</p>
            </div>
          </div>

          <!-- Right: paiements + formulaire -->
          <div class="right-col">

            <!-- Historique paiements -->
            <div class="card">
              <h3><mat-icon>payments</mat-icon> Paiements enregistrés</h3>
              @if (facture()!.paiements.length === 0) {
                <p class="no-paiement">Aucun paiement enregistré</p>
              } @else {
                <div class="paiements-list">
                  @for (p of facture()!.paiements; track p.id) {
                    <div class="paiement-item">
                      <div class="paiement-left">
                        <span class="paiement-date">{{ p.date | date:'dd/MM/yyyy' }}</span>
                        <span class="paiement-mode mode-badge">{{ modeLabel(p.mode) }}</span>
                        @if (p.reference) { <span class="paiement-ref">Réf: {{ p.reference }}</span> }
                      </div>
                      <span class="paiement-amount">{{ p.montant | cents }}</span>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Formulaire nouveau paiement -->
            @if (facture()!.statut !== 'PAYEE' && facture()!.statut !== 'ANNULEE') {
              <div class="card">
                <h3><mat-icon>add_circle</mat-icon> Enregistrer un paiement</h3>
                <form [formGroup]="paiementForm" (ngSubmit)="addPaiement()" class="paiement-form">
                  <div class="row-2">
                    <mat-form-field appearance="outline">
                      <mat-label>Date *</mat-label>
                      <input matInput formControlName="date" type="date" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Mode *</mat-label>
                      <mat-select formControlName="mode">
                        @for (m of modes; track m) {
                          <mat-option [value]="m">{{ modeLabel(m) }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="field-label">Montant *</div>
                  <app-currency-input formControlName="montant" />

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Référence</mat-label>
                    <input matInput formControlName="reference" placeholder="N° de chèque, virement…" />
                  </mat-form-field>

                  <button mat-flat-button color="primary" type="submit"
                    [disabled]="paiementForm.invalid || savingPaiement">
                    <mat-icon>save</mat-icon>
                    {{ savingPaiement ? 'Enregistrement…' : 'Enregistrer le paiement' }}
                  </button>
                </form>
              </div>
            }

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 20px; }

    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      color: #1565c0; text-decoration: none; font-size: 13px; font-weight: 500;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { text-decoration: underline; }
    }

    .loading {
      display: flex; align-items: center; gap: 8px;
      color: #78909c; font-size: 14px; padding: 32px;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
      .spin { animation: spin 1s linear infinite; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .detail-layout { display: grid; grid-template-columns: 1fr 380px; gap: 20px; align-items: start; }

    .card {
      background: white; border-radius: 14px; padding: 20px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
    }
    .right-col { display: flex; flex-direction: column; gap: 16px; }

    .card-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
      h2 { margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #0d1b2a; }
    }

    .statut-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 10px; border-radius: 10px; font-size: 12px; font-weight: 700;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; }
    .info-item { display: flex; flex-direction: column; gap: 3px; }
    .full-span { grid-column: 1 / -1; }
    .info-label { font-size: 11px; color: #90a4ae; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
    .info-value { font-size: 14px; font-weight: 600; color: #0d1b2a; display: flex; align-items: center; gap: 6px; }
    .retard { color: #c62828; }
    .warn-icon { font-size: 16px; width: 16px; height: 16px; color: #e53935; }

    .tiers-type {
      width: 22px; height: 22px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 800; flex-shrink: 0;
    }
    .type-client { background: #e3f2fd; color: #1565c0; }
    .type-fournisseur { background: #ffebee; color: #c62828; }

    .amounts {
      background: #f8fbff; border-radius: 12px; padding: 16px; border: 1px solid #e3f2fd;
    }
    .amount-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 4px 0; font-size: 14px; color: #546e7a;
    }
    .amount-val { font-weight: 700; color: #0d1b2a; }
    .paye { color: #2e7d32; }
    .total-row { border-top: 1px solid #e3f2fd; margin-top: 8px; padding-top: 8px; font-weight: 700; font-size: 15px; color: #0d1b2a; }
    .total-row .amount-val { font-size: 16px; }
    .reste { color: #c62828; }
    .reste-zero { color: #2e7d32; }
    .progress-bar {
      background: #e3f2fd; border-radius: 6px; height: 8px; margin-top: 12px; overflow: hidden;
    }
    .progress-fill { height: 100%; background: #1565c0; border-radius: 6px; transition: width .3s ease; }
    .progress-label { margin: 6px 0 0; font-size: 11px; color: #78909c; text-align: right; }

    h3 {
      display: flex; align-items: center; gap: 8px;
      margin: 0 0 16px; font-size: 15px; font-weight: 700; color: #0d1b2a;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #1565c0; }
    }

    .no-paiement { color: #90a4ae; font-size: 13px; margin: 0; text-align: center; padding: 12px 0; }

    .paiements-list { display: flex; flex-direction: column; gap: 8px; }
    .paiement-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 12px; background: #f8fbff; border-radius: 10px; border: 1px solid #e3f2fd;
    }
    .paiement-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .paiement-date { font-size: 13px; font-weight: 600; color: #0d1b2a; }
    .mode-badge {
      padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;
      background: #e3f2fd; color: #1565c0;
    }
    .paiement-ref { font-size: 11px; color: #90a4ae; }
    .paiement-amount { font-size: 14px; font-weight: 700; color: #2e7d32; }

    .paiement-form { display: flex; flex-direction: column; gap: 12px; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .full-width { width: 100%; }
    .field-label { font-size: 12px; font-weight: 600; color: #546e7a; margin-bottom: -6px; }

    @media (max-width: 900px) {
      .detail-layout { grid-template-columns: 1fr; }
    }
  `],
})
export class FactureDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly factureService = inject(FactureService);
  private readonly alert = inject(AlertService);
  private readonly fb = inject(FormBuilder);

  facture = signal<Facture | null>(null);
  loading = signal(true);
  savingPaiement = false;

  readonly modes: PaiementMode[] = ['VIREMENT', 'CHEQUE', 'ESPECES', 'CARTE', 'PRELEVEMENT'];

  paiementForm = this.fb.group({
    date:      ['', Validators.required],
    montant:   [0, [Validators.required, Validators.min(1)]],
    mode:      ['VIREMENT' as PaiementMode, Validators.required],
    reference: [''],
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const today = new Date().toISOString().substring(0, 10);
    this.paiementForm.patchValue({ date: today });
    this.loadFacture(id);
  }

  loadFacture(id: number): void {
    this.loading.set(true);
    this.factureService.getById(id).subscribe({
      next: f => { this.facture.set(f); this.loading.set(false); },
      error: () => { this.alert.error('Facture introuvable'); this.loading.set(false); },
    });
  }

  cfg(s: FactureStatut) { return STATUT_CONFIG[s]; }
  modeLabel(m: PaiementMode): string { return MODE_LABELS[m]; }

  progressPercent(): number {
    const f = this.facture();
    if (!f || f.montant === 0) return 0;
    return Math.min(100, (f.montantPaye / f.montant) * 100);
  }

  isRetard(): boolean {
    const f = this.facture();
    if (!f?.dateEcheance || f.statut === 'PAYEE' || f.statut === 'ANNULEE') return false;
    return new Date(f.dateEcheance) < new Date();
  }

  addPaiement(): void {
    if (this.paiementForm.invalid || this.savingPaiement) return;
    this.savingPaiement = true;
    const v = this.paiementForm.value;
    this.factureService.addPaiement(this.facture()!.id, {
      date:      v.date!,
      montant:   v.montant!,
      mode:      v.mode! as PaiementMode,
      reference: v.reference || undefined,
    }).subscribe({
      next: updated => {
        this.facture.set(updated);
        this.alert.success('Paiement enregistré');
        this.paiementForm.patchValue({ montant: 0, reference: '' });
        this.savingPaiement = false;
      },
      error: () => { this.alert.error('Erreur'); this.savingPaiement = false; },
    });
  }

  lettrer(): void {
    const f = this.facture();
    if (!f) return;
    this.factureService.lettrer(f.id, 'A').subscribe({
      next: () => { this.alert.success('Facture lettrée (soldée)'); this.loadFacture(f.id); },
      error: () => this.alert.error('Erreur lors du lettrage'),
    });
  }
}
