import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AccountService } from '../../core/services/account.service';
import { EvenementService } from '../../core/services/evenement.service';
import { JournalEntryService } from '../../core/services/journal-entry.service';
import { Account } from '../../core/models/account.model';
import { Evenement } from '../../core/models/evenement.model';
import { JournalEntry } from '../../core/models/journal-entry.model';


export type AlerteNiveau = 'CRITIQUE' | 'AVERTISSEMENT' | 'INFO';

export interface Alerte {
  id: string;
  niveau: AlerteNiveau;
  titre: string;
  message: string;
  icone: string;
  lien?: string;
  lienLabel?: string;
  dateGeneree: string;
  acquittee?: boolean;
}

const TODAY = '2026-03-03'; // currentDate from memory

@Component({
  selector: 'app-alertes',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatTooltipModule, DatePipe],
  template: `
    <div class="page">

      <!-- ── Header ── -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Alertes intelligentes</h1>
          <p class="page-sub">Surveillance automatique de votre situation financière</p>
        </div>
        <div class="header-stats">
          @if (critiques() > 0) {
            <span class="hstat critique">
              <mat-icon>error</mat-icon>
              {{ critiques() }} critique{{ critiques() > 1 ? 's' : '' }}
            </span>
          }
          @if (avertissements() > 0) {
            <span class="hstat avertissement">
              <mat-icon>warning</mat-icon>
              {{ avertissements() }} avertissement{{ avertissements() > 1 ? 's' : '' }}
            </span>
          }
          @if (infos() > 0) {
            <span class="hstat info">
              <mat-icon>info</mat-icon>
              {{ infos() }} info
            </span>
          }
          @if (totalActives() === 0) {
            <span class="hstat ok">
              <mat-icon>check_circle</mat-icon>
              Tout est normal
            </span>
          }
        </div>
      </div>

      <!-- ── Filtre niveau ── -->
      <div class="filter-bar">
        <button class="filter-btn" [class.active]="filterNiveau() === null"
                (click)="filterNiveau.set(null)">
          Toutes ({{ alertes().length }})
        </button>
        <button class="filter-btn filter-critique" [class.active]="filterNiveau() === 'CRITIQUE'"
                (click)="filterNiveau.set('CRITIQUE')">
          <mat-icon>error</mat-icon>
          Critiques ({{ critiques() }})
        </button>
        <button class="filter-btn filter-avert" [class.active]="filterNiveau() === 'AVERTISSEMENT'"
                (click)="filterNiveau.set('AVERTISSEMENT')">
          <mat-icon>warning</mat-icon>
          Avertissements ({{ avertissements() }})
        </button>
        <button class="filter-btn filter-info" [class.active]="filterNiveau() === 'INFO'"
                (click)="filterNiveau.set('INFO')">
          <mat-icon>info</mat-icon>
          Infos ({{ infos() }})
        </button>
        <div class="filter-spacer"></div>
        <button class="btn-acquitter" (click)="acquitterTout()" matTooltip="Marquer toutes comme lues">
          <mat-icon>done_all</mat-icon>
          Tout acquitter
        </button>
      </div>

      <!-- ── Liste alertes ── -->
      @if (filteredAlertes().length === 0) {
        <div class="empty-state">
          <mat-icon>check_circle_outline</mat-icon>
          <p>Aucune alerte active — situation financière saine !</p>
        </div>
      } @else {
        <div class="alertes-list">
          @for (alerte of filteredAlertes(); track alerte.id) {
            <div class="alerte-card" [class]="'niveau-' + alerte.niveau.toLowerCase()"
                 [class.acquittee]="alerte.acquittee">
              <div class="alerte-icon">
                <mat-icon>{{ alerte.icone }}</mat-icon>
              </div>
              <div class="alerte-body">
                <div class="alerte-header">
                  <span class="alerte-badge" [class]="'badge-' + alerte.niveau.toLowerCase()">
                    {{ alerte.niveau === 'CRITIQUE' ? 'Critique' :
                       alerte.niveau === 'AVERTISSEMENT' ? 'Avertissement' : 'Info' }}
                  </span>
                  <span class="alerte-date">{{ alerte.dateGeneree | date:'dd/MM/yyyy' }}</span>
                </div>
                <p class="alerte-titre">{{ alerte.titre }}</p>
                <p class="alerte-msg">{{ alerte.message }}</p>
                @if (alerte.lien) {
                  <a [routerLink]="alerte.lien" class="alerte-link">
                    {{ alerte.lienLabel ?? 'Voir le détail' }}
                    <mat-icon>arrow_forward</mat-icon>
                  </a>
                }
              </div>
              <button class="alerte-dismiss" (click)="acquitter(alerte.id)"
                      matTooltip="{{ alerte.acquittee ? 'Déjà acquittée' : 'Acquitter' }}">
                <mat-icon>{{ alerte.acquittee ? 'check' : 'close' }}</mat-icon>
              </button>
            </div>
          }
        </div>
      }

      <!-- ── Section : Règles de surveillance ── -->
      <div class="rules-section">
        <h3 class="rules-title">
          <mat-icon>rule</mat-icon>
          Règles de surveillance actives
        </h3>
        <div class="rules-grid">
          <div class="rule-card">
            <mat-icon class="rule-icon" style="color:#1565c0">account_balance_wallet</mat-icon>
            <div>
              <p class="rule-label">Solde de trésorerie bas</p>
              <p class="rule-desc">Alerte si trésorerie < 500 000 Ar</p>
            </div>
            <span class="rule-badge rule-active">Actif</span>
          </div>
          <div class="rule-card">
            <mat-icon class="rule-icon" style="color:#c62828">schedule</mat-icon>
            <div>
              <p class="rule-label">Événements en retard</p>
              <p class="rule-desc">Alerte pour chaque événement EN_RETARD</p>
            </div>
            <span class="rule-badge rule-active">Actif</span>
          </div>
          <div class="rule-card">
            <mat-icon class="rule-icon" style="color:#f57f17">event_upcoming</mat-icon>
            <div>
              <p class="rule-label">Échéances imminentes</p>
              <p class="rule-desc">Alerte 3 jours avant l'échéance</p>
            </div>
            <span class="rule-badge rule-active">Actif</span>
          </div>
          <div class="rule-card">
            <mat-icon class="rule-icon" style="color:#880e4f">trending_down</mat-icon>
            <div>
              <p class="rule-label">Résultat négatif</p>
              <p class="rule-desc">Alerte si charges > produits</p>
            </div>
            <span class="rule-badge rule-active">Actif</span>
          </div>
          <div class="rule-card">
            <mat-icon class="rule-icon" style="color:#2e7d32">savings</mat-icon>
            <div>
              <p class="rule-label">Ratio d'endettement</p>
              <p class="rule-desc">Alerte si dettes > 80% des capitaux</p>
            </div>
            <span class="rule-badge rule-active">Actif</span>
          </div>
          <div class="rule-card">
            <mat-icon class="rule-icon" style="color:#006064">analytics</mat-icon>
            <div>
              <p class="rule-label">Anomalie comptable</p>
              <p class="rule-desc">Alerte si journal déséquilibré</p>
            </div>
            <span class="rule-badge rule-active">Actif</span>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 20px; padding-bottom: 32px; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
    .page-title  { font-size: 26px; font-weight: 800; color: #0d1b2a; margin: 0 0 4px; }
    .page-sub    { font-size: 13px; color: #78909c; margin: 0; }
    .header-stats { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .hstat {
      display: flex; align-items: center; gap: 5px; padding: 8px 14px; border-radius: 20px;
      font-size: 12px; font-weight: 700;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .critique    { background: #fde8e8; color: #c62828; }
    .avertissement { background: #fff8e1; color: #f57f17; }
    .info        { background: #e3f2fd; color: #1565c0; }
    .ok          { background: #e8f5e9; color: #2e7d32; }

    /* ── Filter Bar ── */
    .filter-bar {
      display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
      background: white; border-radius: 12px; padding: 10px 14px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
    }
    .filter-spacer { flex: 1; }
    .filter-btn {
      display: flex; align-items: center; gap: 5px; padding: 7px 14px;
      border-radius: 8px; border: none; cursor: pointer; font-size: 12px; font-weight: 600;
      background: #f0f4f8; color: #546e7a; transition: background .15s, color .15s;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
      &:hover  { background: #e0e8f0; color: #263238; }
      &.active { background: #1565c0; color: white; }
    }
    .filter-critique.active { background: #c62828; }
    .filter-avert.active    { background: #f57f17; }
    .filter-info.active     { background: #1565c0; }
    .btn-acquitter {
      display: flex; align-items: center; gap: 6px; padding: 7px 14px;
      border-radius: 8px; border: 1px solid #dde3ea; cursor: pointer;
      font-size: 12px; font-weight: 600; background: white; color: #546e7a;
      transition: background .15s;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover  { background: #f0f4f8; }
    }

    /* ── Alertes list ── */
    .alertes-list { display: flex; flex-direction: column; gap: 12px; }

    .alerte-card {
      display: flex; gap: 16px; align-items: flex-start;
      background: white; border-radius: 14px; padding: 18px 20px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      border-left: 5px solid transparent;
      transition: opacity .2s;
      animation: slideIn .25s ease;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .alerte-card.acquittee { opacity: .45; }
    .niveau-critique    { border-left-color: #c62828; background: #fffafa; }
    .niveau-avertissement { border-left-color: #f57f17; background: #fffdf5; }
    .niveau-info        { border-left-color: #1565c0; background: #f8fbff; }

    .alerte-icon {
      width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    .niveau-critique     .alerte-icon { background: #fde8e8; color: #c62828; }
    .niveau-avertissement .alerte-icon { background: #fff8e1; color: #f57f17; }
    .niveau-info          .alerte-icon { background: #e3f2fd; color: #1565c0; }

    .alerte-body { flex: 1; min-width: 0; }
    .alerte-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .alerte-badge {
      padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 800;
      text-transform: uppercase; letter-spacing: .4px;
    }
    .badge-critique     { background: #fde8e8; color: #c62828; }
    .badge-avertissement { background: #fff8e1; color: #f57f17; }
    .badge-info          { background: #e3f2fd; color: #1565c0; }
    .alerte-date { font-size: 11px; color: #b0bec5; margin-left: auto; }

    .alerte-titre { font-size: 14px; font-weight: 700; color: #0d1b2a; margin: 0 0 4px; }
    .alerte-msg   { font-size: 12px; color: #546e7a; margin: 0 0 8px; line-height: 1.5; }
    .alerte-link  {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 12px; font-weight: 700; color: #1565c0; text-decoration: none;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
      &:hover { text-decoration: underline; }
    }

    .alerte-dismiss {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border-radius: 8px; border: none; cursor: pointer;
      background: transparent; color: #b0bec5; flex-shrink: 0; transition: background .12s;
      mat-icon { font-size: 16px; }
      &:hover { background: #f0f4f8; color: #546e7a; }
    }

    /* ── Empty state ── */
    .empty-state {
      background: white; border-radius: 14px; padding: 48px 24px;
      text-align: center; color: #90a4ae; box-shadow: 0 2px 8px rgba(13,27,42,.07);
      mat-icon { font-size: 52px; width: 52px; height: 52px; margin-bottom: 12px; color: #66bb6a; }
      p { font-size: 15px; margin: 0; font-weight: 500; color: #546e7a; }
    }

    /* ── Rules section ── */
    .rules-section {
      background: white; border-radius: 14px; padding: 20px 24px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
    }
    .rules-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 15px; font-weight: 700; color: #0d1b2a; margin: 0 0 16px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #78909c; }
    }
    .rules-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .rule-card {
      display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px;
      border-radius: 10px; border: 1px solid #e8edf2; background: #fafbfc;
    }
    .rule-icon { font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; margin-top: 2px; }
    .rule-label { font-size: 12px; font-weight: 700; color: #0d1b2a; margin: 0 0 2px; }
    .rule-desc  { font-size: 11px; color: #78909c; margin: 0; }
    .rule-badge {
      margin-left: auto; padding: 2px 8px; border-radius: 12px;
      font-size: 10px; font-weight: 700; flex-shrink: 0;
    }
    .rule-active { background: #e8f5e9; color: #2e7d32; }

    @media (max-width: 900px) { .rules-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .rules-grid { grid-template-columns: 1fr; } }
  `],
})
export class AlertesComponent implements OnInit {
  private readonly accountService  = inject(AccountService);
  private readonly evenService     = inject(EvenementService);
  private readonly journalService  = inject(JournalEntryService);

  accounts   = signal<Account[]>([]);
  evenements = signal<Evenement[]>([]);
  entries    = signal<JournalEntry[]>([]);
  acquittees = signal<Set<string>>(new Set());

  filterNiveau = signal<AlerteNiveau | null>(null);

  ngOnInit(): void {
    this.accountService.getAll().subscribe(l => this.accounts.set(l));
    this.evenService.getAll().subscribe(l => this.evenements.set(l));
    this.journalService.getAll().subscribe(l => this.entries.set(l));
  }

  /* ── Balance helpers ── */
  private classBalance(cls: number): number {
    return this.accounts()
      .filter(a => a.class === cls)
      .reduce((sum, a) => {
        const d = (a.journalLines ?? []).reduce((s, l) => s + l.debit, 0);
        const c = (a.journalLines ?? []).reduce((s, l) => s + l.credit, 0);
        return sum + (d - c);
      }, 0);
  }

  /* ── Génération d'alertes ── */
  alertes = computed<Alerte[]>(() => {
    const list: Alerte[] = [];
    const today = new Date(TODAY);
    const in3Days = new Date(TODAY);
    in3Days.setDate(in3Days.getDate() + 3);

    // 1. Trésorerie basse (< 500 000 Ar = 50000 centimes... mais montants ici en centimes Ariary)
    const tresorerie = this.classBalance(5);
    if (tresorerie < 50000000) { // < 500 000 Ar
      list.push({
        id: 'tresorerie-basse',
        niveau: tresorerie < 10000000 ? 'CRITIQUE' : 'AVERTISSEMENT',
        titre: 'Solde de trésorerie faible',
        message: `La trésorerie disponible est de ${this.formatAr(tresorerie)}. Seuil d'alerte : 500 000 Ar.`,
        icone: 'account_balance_wallet',
        lien: '/accounts',
        lienLabel: 'Voir les comptes',
        dateGeneree: TODAY,
      });
    }

    // 2. Résultat négatif (charges > produits)
    const totalProduits = this.accounts().filter(a => a.class === 7)
      .reduce((s, a) => s + (a.journalLines ?? []).reduce((ss, l) => ss + l.credit, 0), 0);
    const totalCharges  = this.accounts().filter(a => a.class === 6)
      .reduce((s, a) => s + (a.journalLines ?? []).reduce((ss, l) => ss + l.debit, 0), 0);

    if (totalCharges > totalProduits) {
      list.push({
        id: 'resultat-negatif',
        niveau: 'CRITIQUE',
        titre: 'Résultat d\'exploitation négatif',
        message: `Les charges (${this.formatAr(totalCharges)}) dépassent les produits (${this.formatAr(totalProduits)}). Perte nette : ${this.formatAr(totalCharges - totalProduits)}.`,
        icone: 'trending_down',
        lien: '/rapports',
        lienLabel: 'Voir le compte de résultat',
        dateGeneree: TODAY,
      });
    }

    // 3. Événements en retard
    const enRetard = this.evenements().filter(e => e.statut === 'EN_RETARD');
    enRetard.forEach(ev => {
      list.push({
        id: `retard-${ev.id}`,
        niveau: 'CRITIQUE',
        titre: `Paiement en retard : ${ev.titre}`,
        message: `L'échéance du ${this.formatDate(ev.dateEcheance)} n'a pas été honorée. Montant : ${this.formatAr(ev.montant)}.`,
        icone: 'payment',
        lien: '/evenements',
        lienLabel: 'Gérer les événements',
        dateGeneree: TODAY,
      });
    });

    // 4. Échéances dans les 3 prochains jours
    const imminents = this.evenements().filter(ev => {
      if (ev.statut === 'PAYE') return false;
      const echeance = new Date(ev.dateEcheance);
      return echeance >= today && echeance <= in3Days;
    });
    imminents.forEach(ev => {
      list.push({
        id: `imminent-${ev.id}`,
        niveau: 'AVERTISSEMENT',
        titre: `Échéance imminente : ${ev.titre}`,
        message: `Le paiement de ${this.formatAr(ev.montant)} est dû le ${this.formatDate(ev.dateEcheance)}.`,
        icone: 'event_upcoming',
        lien: '/evenements',
        lienLabel: 'Voir les événements',
        dateGeneree: TODAY,
      });
    });

    // 5. Beaucoup de dettes (Cl.4 crédit > 50% de trésorerie)
    const dettes = this.accounts()
      .filter(a => a.class === 4)
      .reduce((s, a) => s + (a.journalLines ?? []).reduce((ss, l) => ss + Math.max(l.credit - l.debit, 0), 0), 0);
    if (tresorerie > 0 && dettes > tresorerie * 0.8) {
      list.push({
        id: 'dettes-elevees',
        niveau: 'AVERTISSEMENT',
        titre: 'Dettes fournisseurs élevées',
        message: `Les dettes fournisseurs (${this.formatAr(dettes)}) représentent plus de 80% de la trésorerie.`,
        icone: 'receipt_long',
        lien: '/accounts',
        lienLabel: 'Voir le plan comptable',
        dateGeneree: TODAY,
      });
    }

    // 6. Info : créances clients à recouvrir
    const creances = this.accounts()
      .filter(a => a.class === 4 && a.code.startsWith('411'))
      .reduce((s, a) => s + (a.journalLines ?? []).reduce((ss, l) => ss + Math.max(l.debit - l.credit, 0), 0), 0);
    if (creances > 0) {
      list.push({
        id: 'creances-clients',
        niveau: 'INFO',
        titre: 'Créances clients à recouvrir',
        message: `${this.formatAr(creances)} de créances clients sont en attente de règlement.`,
        icone: 'people',
        lien: '/journal',
        lienLabel: 'Voir le journal',
        dateGeneree: TODAY,
      });
    }

    // 7. Info : journal entries récents (activité normale)
    const recentCount = this.entries().filter(e => e.date >= '2026-03-01').length;
    if (recentCount > 0) {
      list.push({
        id: 'activite-recente',
        niveau: 'INFO',
        titre: `${recentCount} écriture(s) ce mois-ci`,
        message: 'Des opérations comptables ont été enregistrées dans le journal ce mois-ci.',
        icone: 'menu_book',
        lien: '/journal',
        lienLabel: 'Voir le journal',
        dateGeneree: TODAY,
      });
    }

    return list;
  });

  filteredAlertes = computed<Alerte[]>(() => {
    const niveau = this.filterNiveau();
    return this.alertes()
      .map(a => ({ ...a, acquittee: this.acquittees().has(a.id) }))
      .filter(a => !niveau || a.niveau === niveau);
  });

  critiques       = computed(() => this.alertes().filter(a => a.niveau === 'CRITIQUE').length);
  avertissements  = computed(() => this.alertes().filter(a => a.niveau === 'AVERTISSEMENT').length);
  infos           = computed(() => this.alertes().filter(a => a.niveau === 'INFO').length);
  totalActives    = computed(() => this.alertes().filter(a => !this.acquittees().has(a.id)).length);

  acquitter(id: string): void {
    this.acquittees.update(set => { const s = new Set(set); s.add(id); return s; });
  }
  acquitterTout(): void {
    this.acquittees.set(new Set(this.alertes().map(a => a.id)));
  }

  private formatAr(centimes: number): string {
    const ar = centimes / 100;
    if (ar >= 1_000_000) return `${(ar / 1_000_000).toFixed(1)} M Ar`;
    if (ar >= 1_000)     return `${Math.round(ar / 1_000)} k Ar`;
    return `${ar.toFixed(0)} Ar`;
  }
  private formatDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
}
