import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface TutorielSection {
  id: string;
  titre: string;
  icon: string;
  couleur: string;
  couleurBg: string;
  route: string;
  description: string;
  etapes: string[];
  astuces: string[];
}

@Component({
  selector: 'app-tutoriels',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  template: `
    <div class="tuto-page">
      <div class="page-main">

      <!-- ── En-tête ── -->
      <div class="tuto-header">
        <div class="tuto-header-left">
          <div class="tuto-header-icon">
            <mat-icon>school</mat-icon>
          </div>
          <div>
            <h1 class="tuto-title">Tutoriels</h1>
            <p class="tuto-subtitle">Guide complet pour utiliser Volako</p>
          </div>
        </div>
        <div class="tuto-badge">
          <mat-icon>flag</mat-icon>
          {{ sections.length }} modules disponibles
        </div>
      </div>

      <!-- ── Introduction ── -->
      <div class="intro-card">
        <div class="intro-icon">
          <mat-icon>info</mat-icon>
        </div>
        <div class="intro-body">
          <h2>Bienvenue dans Volako</h2>
          <p>
            Volako est une application de <strong>gestion comptable et financière</strong> conçue pour
            vous aider à suivre vos opérations, gérer votre plan comptable, planifier votre budget et
            atteindre vos objectifs financiers. Ce guide vous explique chaque module pas à pas.
          </p>
          <div class="intro-chips">
            <span class="chip chip-blue"><mat-icon>lock</mat-icon> Connexion sécurisée</span>
            <span class="chip chip-green"><mat-icon>sync</mat-icon> Données en temps réel</span>
            <span class="chip chip-amber"><mat-icon>devices</mat-icon> Interface responsive</span>
          </div>
        </div>
      </div>

      <!-- ── Accès rapide aux modules ── -->
      <div class="toc-section">
        <h3 class="toc-title">
          <mat-icon>grid_view</mat-icon>
          Accès rapide aux modules
        </h3>
        <div class="toc-grid">
          @for (s of sections; track s.id) {
            <a class="toc-item" [routerLink]="s.route" [style.--accent]="s.couleur" [style.--accentBg]="s.couleurBg">
              <div class="toc-icon" [style.background]="s.couleurBg" [style.color]="s.couleur">
                <mat-icon>{{ s.icon }}</mat-icon>
              </div>
              <span class="toc-label">{{ s.titre }}</span>
            </a>
          }
        </div>
      </div>

      <!-- ── Sections tutoriels ── -->
      @for (section of sections; track section.id) {
        <div class="tuto-section" [id]="section.id">

          <!-- En-tête section -->
          <div class="section-header">
            <div class="section-icon-wrap" [style.background]="section.couleurBg" [style.color]="section.couleur">
              <mat-icon>{{ section.icon }}</mat-icon>
            </div>
            <div class="section-title-wrap">
              <h2 class="section-title">{{ section.titre }}</h2>
              <p class="section-desc">{{ section.description }}</p>
            </div>
            <a [routerLink]="section.route" mat-stroked-button class="section-goto-btn"
               [style.border-color]="section.couleur" [style.color]="section.couleur">
              <mat-icon>open_in_new</mat-icon>
              Ouvrir
            </a>
          </div>

          <!-- Corps de la section -->
          <div class="section-body">

            <!-- Mockup visuel (capture simulée) -->
            <div class="mockup-wrap">
              <div class="mockup-chrome">
                <div class="mockup-dots">
                  <span class="dot dot-red"></span>
                  <span class="dot dot-yellow"></span>
                  <span class="dot dot-green"></span>
                </div>
                <div class="mockup-url">
                  <mat-icon>lock</mat-icon>
                  localhost:4200{{ section.route }}
                </div>
              </div>
              <div class="mockup-screen" [style.border-top-color]="section.couleur">
                <ng-container [ngSwitch]="section.id">

                  <!-- Dashboard mockup -->
                  <ng-container *ngSwitchCase="'dashboard'">
                    <div class="mk-dash">
                      <div class="mk-topbar"><span class="mk-dot-nav"></span><span class="mk-dot-nav"></span><span class="mk-dot-nav"></span><span class="mk-dot-nav mk-active"></span></div>
                      <div class="mk-kpi-row">
                        <div class="mk-kpi mk-blue"><div class="mk-kpi-val">124 500 €</div><div class="mk-kpi-lbl">Total Actif</div></div>
                        <div class="mk-kpi mk-amber"><div class="mk-kpi-val">87 200 €</div><div class="mk-kpi-lbl">Total Passif</div></div>
                        <div class="mk-kpi mk-green"><div class="mk-kpi-val">+37 300 €</div><div class="mk-kpi-lbl">Résultat net</div></div>
                        <div class="mk-kpi mk-teal"><div class="mk-kpi-val">42</div><div class="mk-kpi-lbl">Comptes actifs</div></div>
                      </div>
                      <div class="mk-grid-3">
                        <div class="mk-card"><div class="mk-card-hdr mk-blue-txt">Soldes par classe</div><div class="mk-bars"><div class="mk-bar" style="width:80%;background:#1565c0"></div><div class="mk-bar" style="width:55%;background:#2e7d32"></div><div class="mk-bar" style="width:40%;background:#f57f17"></div><div class="mk-bar" style="width:65%;background:#880e4f"></div></div></div>
                        <div class="mk-card"><div class="mk-card-hdr mk-blue-txt">Dernières opérations</div><div class="mk-op-list"><div class="mk-op-row"><div class="mk-op-dot mk-blue"></div><span>Vente marchandises</span></div><div class="mk-op-row"><div class="mk-op-dot mk-green"></div><span>Règlement fournisseur</span></div><div class="mk-op-row"><div class="mk-op-dot mk-amber"></div><span>Charges locatives</span></div></div></div>
                        <div class="mk-card"><div class="mk-card-hdr mk-blue-txt">Actions rapides</div><div class="mk-quick-row"><div class="mk-quick-btn mk-blue-bg">+ Opération</div><div class="mk-quick-btn mk-green-bg">+ Compte</div><div class="mk-quick-btn mk-teal-bg">Journal</div></div></div>
                      </div>
                    </div>
                  </ng-container>

                  <!-- Opérations mockup -->
                  <ng-container *ngSwitchCase="'operations'">
                    <div class="mk-dash">
                      <div class="mk-list-header"><div class="mk-title-bar">Opérations comptables</div><div class="mk-btn-add mk-blue-bg">+ Nouvelle</div></div>
                      <div class="mk-filters"><div class="mk-filter-chip">Toutes</div><div class="mk-filter-chip mk-active-chip">Ventes</div><div class="mk-filter-chip">Charges</div><div class="mk-filter-chip">Banque</div></div>
                      <div class="mk-table">
                        <div class="mk-th-row"><span>Date</span><span>Libellé</span><span>Type</span><span>Montant</span></div>
                        <div class="mk-tr"><span class="mk-date">05/03/2026</span><span class="mk-op-name">Vente produits finis</span><span class="mk-badge mk-green-bg">Vente</span><span class="mk-amount">1 250,00 €</span></div>
                        <div class="mk-tr"><span class="mk-date">04/03/2026</span><span class="mk-op-name">Achat fournitures</span><span class="mk-badge mk-amber-bg">Achat</span><span class="mk-amount">340,00 €</span></div>
                        <div class="mk-tr"><span class="mk-date">03/03/2026</span><span class="mk-op-name">Salaires mars</span><span class="mk-badge mk-red-bg">Charges</span><span class="mk-amount">3 200,00 €</span></div>
                      </div>
                    </div>
                  </ng-container>

                  <!-- Journal mockup -->
                  <ng-container *ngSwitchCase="'journal'">
                    <div class="mk-dash">
                      <div class="mk-list-header"><div class="mk-title-bar">Journal comptable</div></div>
                      <div class="mk-journal">
                        <div class="mk-je-row">
                          <div class="mk-je-date">05/03/2026</div>
                          <div class="mk-je-lines">
                            <div class="mk-je-line"><span class="mk-je-compte mk-blue-txt">401000</span><span class="mk-je-lib">Fournisseur ABC</span><span class="mk-je-debit">1 200,00</span><span class="mk-je-credit"></span></div>
                            <div class="mk-je-line"><span class="mk-je-compte mk-blue-txt">512000</span><span class="mk-je-lib">Banque</span><span class="mk-je-debit"></span><span class="mk-je-credit">1 200,00</span></div>
                          </div>
                        </div>
                        <div class="mk-je-row">
                          <div class="mk-je-date">04/03/2026</div>
                          <div class="mk-je-lines">
                            <div class="mk-je-line"><span class="mk-je-compte mk-blue-txt">607000</span><span class="mk-je-lib">Achat marchandises</span><span class="mk-je-debit">450,00</span><span class="mk-je-credit"></span></div>
                            <div class="mk-je-line"><span class="mk-je-compte mk-blue-txt">401000</span><span class="mk-je-lib">Fournisseur XYZ</span><span class="mk-je-debit"></span><span class="mk-je-credit">450,00</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ng-container>

                  <!-- Comptes mockup -->
                  <ng-container *ngSwitchCase="'accounts'">
                    <div class="mk-dash">
                      <div class="mk-list-header"><div class="mk-title-bar">Plan comptable</div><div class="mk-btn-add mk-blue-bg">+ Compte</div></div>
                      <div class="mk-class-grid">
                        <div class="mk-class-card" style="border-left-color:#1565c0"><div class="mk-class-badge" style="background:#e3f2fd;color:#1565c0">1</div><div class="mk-class-info"><div class="mk-class-name">Capitaux</div><div class="mk-class-n">12 comptes</div></div></div>
                        <div class="mk-class-card" style="border-left-color:#2e7d32"><div class="mk-class-badge" style="background:#e8f5e9;color:#2e7d32">2</div><div class="mk-class-info"><div class="mk-class-name">Immobilisations</div><div class="mk-class-n">8 comptes</div></div></div>
                        <div class="mk-class-card" style="border-left-color:#f57f17"><div class="mk-class-badge" style="background:#fff8e1;color:#f57f17">4</div><div class="mk-class-info"><div class="mk-class-name">Tiers</div><div class="mk-class-n">15 comptes</div></div></div>
                        <div class="mk-class-card" style="border-left-color:#006064"><div class="mk-class-badge" style="background:#e0f7fa;color:#006064">5</div><div class="mk-class-info"><div class="mk-class-name">Financiers</div><div class="mk-class-n">7 comptes</div></div></div>
                      </div>
                      <div class="mk-search-bar"><mat-icon style="font-size:14px;color:#90a4ae">search</mat-icon><span style="color:#90a4ae;font-size:12px">Rechercher un compte…</span></div>
                    </div>
                  </ng-container>

                  <!-- Evenements mockup -->
                  <ng-container *ngSwitchCase="'evenements'">
                    <div class="mk-dash">
                      <div class="mk-list-header"><div class="mk-title-bar">Événements & Échéances</div><div class="mk-btn-add mk-amber-bg">+ Événement</div></div>
                      <div class="mk-event-list">
                        <div class="mk-event-row mk-event-urgent"><div class="mk-event-dot" style="background:#ef5350"></div><div class="mk-event-info"><div class="mk-event-name">Déclaration TVA</div><div class="mk-event-date">Échéance : 15/03/2026</div></div><div class="mk-event-badge" style="background:#fde8e8;color:#c62828">Urgent</div></div>
                        <div class="mk-event-row"><div class="mk-event-dot" style="background:#f9a825"></div><div class="mk-event-info"><div class="mk-event-name">Loyer bureau</div><div class="mk-event-date">Échéance : 01/04/2026</div></div><div class="mk-event-badge" style="background:#fff8e1;color:#f57f17">À venir</div></div>
                        <div class="mk-event-row mk-event-paid"><div class="mk-event-dot" style="background:#43a047"></div><div class="mk-event-info"><div class="mk-event-name">Assurance pro</div><div class="mk-event-date">Payé le : 01/03/2026</div></div><div class="mk-event-badge" style="background:#e8f5e9;color:#2e7d32">Payé</div></div>
                      </div>
                    </div>
                  </ng-container>

                  <!-- Stats mockup -->
                  <ng-container *ngSwitchCase="'stats'">
                    <div class="mk-dash">
                      <div class="mk-list-header"><div class="mk-title-bar">Statistiques financières</div></div>
                      <div class="mk-stats-grid">
                        <div class="mk-chart-card">
                          <div class="mk-chart-title">Évolution mensuelle</div>
                          <div class="mk-chart-bars">
                            <div class="mk-chart-col"><div class="mk-chart-bar-v" style="height:60%;background:#1565c0"></div><span>Jan</span></div>
                            <div class="mk-chart-col"><div class="mk-chart-bar-v" style="height:75%;background:#1565c0"></div><span>Fév</span></div>
                            <div class="mk-chart-col"><div class="mk-chart-bar-v" style="height:85%;background:#42a5f5"></div><span>Mar</span></div>
                            <div class="mk-chart-col"><div class="mk-chart-bar-v" style="height:50%;background:#1565c0"></div><span>Avr</span></div>
                            <div class="mk-chart-col"><div class="mk-chart-bar-v" style="height:90%;background:#1565c0"></div><span>Mai</span></div>
                            <div class="mk-chart-col"><div class="mk-chart-bar-v" style="height:70%;background:#1565c0"></div><span>Juin</span></div>
                          </div>
                        </div>
                        <div class="mk-chart-card">
                          <div class="mk-chart-title">Charges vs Produits</div>
                          <div class="mk-donut-wrap">
                            <div class="mk-donut"></div>
                            <div class="mk-donut-legend"><div class="mk-leg-item"><span class="mk-leg-dot" style="background:#ef5350"></span>Charges 42%</div><div class="mk-leg-item"><span class="mk-leg-dot" style="background:#43a047"></span>Produits 58%</div></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ng-container>

                  <!-- Rapports mockup -->
                  <ng-container *ngSwitchCase="'rapports'">
                    <div class="mk-dash">
                      <div class="mk-list-header"><div class="mk-title-bar">Rapports comptables</div></div>
                      <div class="mk-rapport-grid">
                        <div class="mk-rapport-card" style="border-left-color:#1565c0"><mat-icon style="color:#1565c0;font-size:28px">balance</mat-icon><div class="mk-rapport-name">Balance générale</div><div class="mk-rapport-sub">Soldes débit/crédit</div></div>
                        <div class="mk-rapport-card" style="border-left-color:#2e7d32"><mat-icon style="color:#2e7d32;font-size:28px">receipt</mat-icon><div class="mk-rapport-name">Grand livre</div><div class="mk-rapport-sub">Mouvements par compte</div></div>
                        <div class="mk-rapport-card" style="border-left-color:#f57f17"><mat-icon style="color:#f57f17;font-size:28px">summarize</mat-icon><div class="mk-rapport-name">Compte de résultat</div><div class="mk-rapport-sub">Produits − Charges</div></div>
                        <div class="mk-rapport-card" style="border-left-color:#880e4f"><mat-icon style="color:#880e4f;font-size:28px">account_balance</mat-icon><div class="mk-rapport-name">Bilan</div><div class="mk-rapport-sub">Actif / Passif</div></div>
                      </div>
                    </div>
                  </ng-container>

                  <!-- Budget mockup -->
                  <ng-container *ngSwitchCase="'budget'">
                    <div class="mk-dash">
                      <div class="mk-list-header"><div class="mk-title-bar">Budget — Mars 2026</div><div class="mk-btn-add mk-teal-bg">+ Budget</div></div>
                      <div class="mk-budget-list">
                        <div class="mk-budget-row">
                          <div class="mk-budget-cat">Charges de personnel</div>
                          <div class="mk-budget-progress-wrap"><div class="mk-budget-progress-track"><div class="mk-budget-progress-bar" style="width:78%;background:#1565c0"></div></div><span class="mk-budget-pct">78%</span></div>
                          <div class="mk-budget-amounts"><span class="mk-budget-used">7 800 €</span><span class="mk-budget-total">/ 10 000 €</span></div>
                        </div>
                        <div class="mk-budget-row">
                          <div class="mk-budget-cat">Frais généraux</div>
                          <div class="mk-budget-progress-wrap"><div class="mk-budget-progress-track"><div class="mk-budget-progress-bar" style="width:45%;background:#43a047"></div></div><span class="mk-budget-pct">45%</span></div>
                          <div class="mk-budget-amounts"><span class="mk-budget-used">2 250 €</span><span class="mk-budget-total">/ 5 000 €</span></div>
                        </div>
                        <div class="mk-budget-row">
                          <div class="mk-budget-cat">Marketing</div>
                          <div class="mk-budget-progress-wrap"><div class="mk-budget-progress-track"><div class="mk-budget-progress-bar" style="width:95%;background:#ef5350"></div></div><span class="mk-budget-pct" style="color:#ef5350">95%</span></div>
                          <div class="mk-budget-amounts"><span class="mk-budget-used" style="color:#ef5350">1 900 €</span><span class="mk-budget-total">/ 2 000 €</span></div>
                        </div>
                      </div>
                    </div>
                  </ng-container>

                  <!-- Objectifs mockup -->
                  <ng-container *ngSwitchCase="'objectifs'">
                    <div class="mk-dash">
                      <div class="mk-list-header"><div class="mk-title-bar">Objectifs financiers</div><div class="mk-btn-add mk-purple-bg">+ Objectif</div></div>
                      <div class="mk-obj-list">
                        <div class="mk-obj-card">
                          <div class="mk-obj-icon" style="background:#e3f2fd;color:#1565c0"><mat-icon style="font-size:20px">home</mat-icon></div>
                          <div class="mk-obj-body">
                            <div class="mk-obj-name">Achat immobilier</div>
                            <div class="mk-obj-progress-track"><div class="mk-obj-progress-bar" style="width:62%;background:#1565c0"></div></div>
                            <div class="mk-obj-amounts">31 000 € / 50 000 €</div>
                          </div>
                          <div class="mk-obj-pct" style="color:#1565c0">62%</div>
                        </div>
                        <div class="mk-obj-card">
                          <div class="mk-obj-icon" style="background:#e8f5e9;color:#2e7d32"><mat-icon style="font-size:20px">directions_car</mat-icon></div>
                          <div class="mk-obj-body">
                            <div class="mk-obj-name">Voiture de service</div>
                            <div class="mk-obj-progress-track"><div class="mk-obj-progress-bar" style="width:30%;background:#2e7d32"></div></div>
                            <div class="mk-obj-amounts">6 000 € / 20 000 €</div>
                          </div>
                          <div class="mk-obj-pct" style="color:#2e7d32">30%</div>
                        </div>
                      </div>
                    </div>
                  </ng-container>

                  <!-- Alertes mockup -->
                  <ng-container *ngSwitchCase="'alertes'">
                    <div class="mk-dash">
                      <div class="mk-list-header"><div class="mk-title-bar">Centre d'alertes</div></div>
                      <div class="mk-alert-list">
                        <div class="mk-alert-row mk-alert-critical"><mat-icon style="color:#c62828;font-size:18px">error</mat-icon><div class="mk-alert-body"><div class="mk-alert-title">Solde compte 512000 négatif</div><div class="mk-alert-sub">Solde : −450,00 €</div></div><span class="mk-alert-badge" style="background:#fde8e8;color:#c62828">Critique</span></div>
                        <div class="mk-alert-row mk-alert-warn"><mat-icon style="color:#f57f17;font-size:18px">warning</mat-icon><div class="mk-alert-body"><div class="mk-alert-title">Déclaration TVA dans 10 jours</div><div class="mk-alert-sub">Échéance : 15/03/2026</div></div><span class="mk-alert-badge" style="background:#fff8e1;color:#f57f17">Avertissement</span></div>
                        <div class="mk-alert-row mk-alert-info"><mat-icon style="color:#1565c0;font-size:18px">info</mat-icon><div class="mk-alert-body"><div class="mk-alert-title">Budget marketing à 95%</div><div class="mk-alert-sub">Limite : 2 000 €</div></div><span class="mk-alert-badge" style="background:#e3f2fd;color:#1565c0">Info</span></div>
                      </div>
                    </div>
                  </ng-container>

                  <!-- Fallback -->
                  <ng-container *ngSwitchDefault>
                    <div class="mk-placeholder">
                      <mat-icon [style.color]="section.couleur" style="font-size:40px;width:40px;height:40px">{{ section.icon }}</mat-icon>
                      <p style="color:#90a4ae">Interface {{ section.titre }}</p>
                    </div>
                  </ng-container>

                </ng-container>
              </div>
            </div>

            <!-- Étapes et astuces -->
            <div class="steps-panel">

              <div class="steps-block">
                <h3 class="steps-title">
                  <mat-icon [style.color]="section.couleur">checklist</mat-icon>
                  Comment utiliser
                </h3>
                <ol class="steps-list">
                  @for (etape of section.etapes; track $index) {
                    <li class="step-item">
                      <div class="step-num" [style.background]="section.couleurBg" [style.color]="section.couleur">
                        {{ $index + 1 }}
                      </div>
                      <span class="step-text">{{ etape }}</span>
                    </li>
                  }
                </ol>
              </div>

              <div class="tips-block">
                <h3 class="tips-title">
                  <mat-icon style="color:#f57f17">lightbulb</mat-icon>
                  Astuces
                </h3>
                <ul class="tips-list">
                  @for (astuce of section.astuces; track $index) {
                    <li class="tip-item">
                      <mat-icon style="color:#f9a825;font-size:16px;width:16px;height:16px">star</mat-icon>
                      <span>{{ astuce }}</span>
                    </li>
                  }
                </ul>
              </div>

            </div>

          </div>
        </div>
      }

      <!-- ── Prise en main rapide ── -->
      <div class="quickstart-card">
        <mat-icon class="qs-icon">rocket_launch</mat-icon>
        <div class="qs-body">
          <h2>Prise en main rapide</h2>
          <p>Pour démarrer efficacement, voici l'ordre recommandé de configuration :</p>
          <div class="qs-steps">
            <div class="qs-step">
              <div class="qs-step-num">1</div>
              <div class="qs-step-content">
                <strong>Créez vos comptes</strong>
                <span>Définissez votre plan comptable dans le module <a routerLink="/accounts">Comptes</a></span>
              </div>
            </div>
            <div class="qs-arrow"><mat-icon>arrow_forward</mat-icon></div>
            <div class="qs-step">
              <div class="qs-step-num">2</div>
              <div class="qs-step-content">
                <strong>Saisissez des opérations</strong>
                <span>Enregistrez vos premières transactions dans <a routerLink="/operations">Opérations</a></span>
              </div>
            </div>
            <div class="qs-arrow"><mat-icon>arrow_forward</mat-icon></div>
            <div class="qs-step">
              <div class="qs-step-num">3</div>
              <div class="qs-step-content">
                <strong>Planifiez votre budget</strong>
                <span>Créez des lignes budgétaires dans <a routerLink="/budget">Budget</a></span>
              </div>
            </div>
            <div class="qs-arrow"><mat-icon>arrow_forward</mat-icon></div>
            <div class="qs-step">
              <div class="qs-step-num">4</div>
              <div class="qs-step-content">
                <strong>Suivez vos performances</strong>
                <span>Analysez vos données dans <a routerLink="/stats">Statistiques</a> et <a routerLink="/rapports">Rapports</a></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div><!-- end page-main -->

      <!-- ── Panneau droit : Glossaire / Règles / Navigation ── -->
      <div class="side-unified-card">

        <!-- Onglets -->
        <div class="side-tabs">
          <button class="side-tab" [class.active]="activeTab() === 0" (click)="activeTab.set(0)">
            <mat-icon>auto_stories</mat-icon>
            Glossaire
          </button>
          <button class="side-tab" [class.active]="activeTab() === 1" (click)="activeTab.set(1)">
            <mat-icon>workspace_premium</mat-icon>
            Règles
          </button>
          <button class="side-tab" [class.active]="activeTab() === 2" (click)="activeTab.set(2)">
            <mat-icon>touch_app</mat-icon>
            Navigation
          </button>
        </div>

        <!-- Contenu onglet 0 : Glossaire -->
        @if (activeTab() === 0) {
          <div class="side-tab-content">
            @for (term of glossaire; track term.mot) {
              <div class="glossary-item">
                <span class="glossary-mot">{{ term.mot }}</span>
                <span class="glossary-def">{{ term.def }}</span>
              </div>
            }
          </div>
        }

        <!-- Contenu onglet 1 : Règles d'or -->
        @if (activeTab() === 1) {
          <div class="side-tab-content">
            @for (rule of regles; track rule.label) {
              <div class="rule-item">
                <div class="rule-icon-wrap" [style.color]="rule.couleur">
                  <mat-icon>{{ rule.icon }}</mat-icon>
                </div>
                <div>
                  <div class="rule-label">{{ rule.label }}</div>
                  <div class="rule-desc">{{ rule.desc }}</div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Contenu onglet 2 : Navigation -->
        @if (activeTab() === 2) {
          <div class="side-tab-content">
            @for (tip of navTips; track tip.label) {
              <div class="nav-tip-item">
                <mat-icon class="nav-tip-ico">{{ tip.icon }}</mat-icon>
                <div>
                  <div class="rule-label">{{ tip.label }}</div>
                  <div class="rule-desc">{{ tip.desc }}</div>
                </div>
              </div>
            }
          </div>
        }

      </div><!-- end side-unified-card -->

    </div>
  `,
  styles: [`
    :host { display: block; }
    .tuto-page {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 24px;
      align-items: start;
    }
    .page-main { min-width: 0; }

    /* ── En-tête ── */
    .tuto-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 28px; flex-wrap: wrap; gap: 12px;
    }
    .tuto-header-left { display: flex; align-items: center; gap: 16px; }
    .tuto-header-icon {
      width: 56px; height: 56px; border-radius: 16px;
      background: linear-gradient(135deg, #1565c0, #42a5f5);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(21,101,192,.35);
      mat-icon { color: white; font-size: 28px; width: 28px; height: 28px; }
    }
    .tuto-title { font-size: 28px; font-weight: 800; color: #0d1b2a; margin: 0 0 2px; }
    .tuto-subtitle { color: #78909c; margin: 0; font-size: 14px; }
    .tuto-badge {
      display: flex; align-items: center; gap: 6px;
      background: #e3f2fd; color: #1565c0; padding: 8px 16px;
      border-radius: 20px; font-size: 13px; font-weight: 600;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    /* ── Intro ── */
    .intro-card {
      display: flex; gap: 20px; align-items: flex-start;
      background: white; border-radius: 16px; padding: 24px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      border-left: 4px solid #42a5f5;
      margin-bottom: 24px;
    }
    .intro-icon {
      width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
      background: #e3f2fd; color: #1565c0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    .intro-body { flex: 1; }
    .intro-body h2 { font-size: 16px; font-weight: 700; color: #0d1b2a; margin: 0 0 8px; }
    .intro-body p { font-size: 14px; color: #546e7a; margin: 0 0 14px; line-height: 1.6; }
    .intro-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip {
      display: flex; align-items: center; gap: 5px;
      padding: 5px 12px; border-radius: 20px;
      font-size: 12px; font-weight: 600;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .chip-blue  { background: #e3f2fd; color: #1565c0; }
    .chip-green { background: #e8f5e9; color: #2e7d32; }
    .chip-amber { background: #fff8e1; color: #f57f17; }

    /* ── Sommaire ── */
    .toc-section { margin-bottom: 32px; }

    .toc-title {
      display: flex; align-items: center; gap: 7px;
      font-size: 12px; font-weight: 800; text-transform: uppercase;
      letter-spacing: .8px; color: #90a4ae; margin: 0 0 12px;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
    }

    .toc-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
    }

    .toc-item {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 14px 6px; background: white; border-radius: 12px;
      border: 1px solid #e8edf2; text-decoration: none; color: #546e7a;
      font-size: 11px; font-weight: 600; text-align: center;
      transition: box-shadow .18s, transform .18s, border-color .18s, color .18s;
      position: relative; overflow: hidden;
      &::after {
        content: ''; position: absolute; bottom: 0; left: 0; right: 0;
        height: 2px; background: var(--accent, #1565c0);
        transform: scaleX(0); transition: transform .2s;
        transform-origin: center;
      }
      &:hover {
        box-shadow: 0 4px 16px rgba(13,27,42,.10);
        transform: translateY(-2px);
        border-color: rgba(0,0,0,.12);
        color: #0d1b2a;
        &::after { transform: scaleX(1); }
      }
    }
    .toc-icon {
      width: 38px; height: 38px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      transition: transform .18s;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
    .toc-item:hover .toc-icon { transform: scale(1.1); }
    .toc-label { line-height: 1.3; }

    /* ── Carte unifiée droite (sticky) ── */
    .side-unified-card {
      background: white; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      border: 1px solid #e8edf2;
      overflow: hidden;
      position: sticky;
      top: 24px;
      max-height: calc(100vh - 48px);
      overflow-y: auto;
    }

    .side-tabs {
      display: flex; border-bottom: 1px solid #f0f4f8;
      background: #f8fafc;
    }
    .side-tab {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
      padding: 10px 4px; border: none; background: transparent; cursor: pointer;
      font-size: 10px; font-weight: 700; color: #90a4ae;
      text-transform: uppercase; letter-spacing: .4px;
      transition: color .15s, background .15s;
      border-bottom: 2px solid transparent; margin-bottom: -1px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { color: #546e7a; background: #f0f4f8; }
      &.active { color: #1565c0; border-bottom-color: #1565c0; background: white; }
    }

    .side-tab-content {
      padding: 16px; display: flex; flex-direction: column; gap: 8px;
      min-height: 200px;
    }

    /* Glossaire */
    .glossary-item {
      padding: 7px 10px; border-radius: 8px; background: #f8fafc;
      border-left: 3px solid #43a047;
    }
    .glossary-mot { display: block; font-size: 12px; font-weight: 700; color: #0d1b2a; margin-bottom: 2px; }
    .glossary-def { display: block; font-size: 11px; color: #78909c; line-height: 1.35; }

    /* Règles d'or */
    .rule-item { display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; border-bottom: 1px solid #f5f7fa; &:last-child { border: none; } }
    .rule-icon-wrap {
      flex-shrink: 0; margin-top: 1px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .rule-label { font-size: 12px; font-weight: 700; color: #0d1b2a; margin-bottom: 2px; }
    .rule-desc  { font-size: 11px; color: #78909c; line-height: 1.35; }

    /* Navigation tips */
    .nav-tip-item { display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; border-bottom: 1px solid #f5f7fa; &:last-child { border: none; } }
    .nav-tip-ico {
      font-size: 18px; width: 18px; height: 18px; flex-shrink: 0;
      color: #1565c0; margin-top: 1px;
    }

    /* ── Section tutoriel ── */
    .tuto-section {
      background: white; border-radius: 20px;
      padding: 28px; margin-bottom: 28px;
      box-shadow: 0 2px 8px rgba(13,27,42,.07);
      scroll-margin-top: 24px;
    }

    .section-header {
      display: flex; align-items: flex-start; gap: 16px;
      padding-bottom: 20px;
      border-bottom: 1px solid #f0f4f8;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .section-icon-wrap {
      width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 26px; width: 26px; height: 26px; }
    }
    .section-title-wrap { flex: 1; min-width: 0; }
    .section-title { font-size: 20px; font-weight: 800; color: #0d1b2a; margin: 0 0 4px; }
    .section-desc  { font-size: 13px; color: #78909c; margin: 0; }
    .section-goto-btn {
      flex-shrink: 0; border-radius: 10px !important; font-weight: 600 !important;
      display: flex !important; align-items: center !important; gap: 6px !important;
      mat-icon { font-size: 16px !important; width: 16px !important; height: 16px !important; }
    }

    /* ── Corps section ── */
    .section-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      align-items: start;
    }

    /* ── Mockup ── */
    .mockup-wrap {
      border-radius: 12px; overflow: hidden;
      box-shadow: 0 4px 20px rgba(13,27,42,.12);
      border: 1px solid #e8edf2;
    }
    .mockup-chrome {
      background: #f0f4f8; padding: 8px 12px;
      display: flex; align-items: center; gap: 10px;
      border-bottom: 1px solid #e0e7ef;
    }
    .mockup-dots { display: flex; gap: 5px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot-red    { background: #ef5350; }
    .dot-yellow { background: #ffc107; }
    .dot-green  { background: #43a047; }
    .mockup-url {
      flex: 1; background: white; border-radius: 6px; padding: 3px 8px;
      font-size: 11px; color: #78909c; display: flex; align-items: center; gap: 4px;
      mat-icon { font-size: 12px; width: 12px; height: 12px; color: #43a047; }
    }
    .mockup-screen {
      background: #f8fafc; min-height: 240px;
      border-top: 3px solid #1565c0;
      overflow: hidden;
    }

    /* ── Mockup interne (mini UI) ── */
    .mk-dash { padding: 12px; font-size: 11px; }
    .mk-topbar { display: flex; gap: 6px; padding: 6px 0 10px; }
    .mk-dot-nav { width: 32px; height: 6px; border-radius: 3px; background: #e0e7ef; }
    .mk-dot-nav.mk-active { background: #1565c0; width: 40px; }

    .mk-kpi-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 6px; margin-bottom: 10px; }
    .mk-kpi { padding: 6px 8px; border-radius: 8px; border-left: 3px solid; }
    .mk-blue  { border-left-color:#1565c0; background:#e3f2fd; }
    .mk-amber { border-left-color:#f9a825; background:#fff8e1; }
    .mk-green { border-left-color:#2e7d32; background:#e8f5e9; }
    .mk-teal  { border-left-color:#00897b; background:#e0f7f4; }
    .mk-red   { border-left-color:#c62828; background:#fde8e8; }
    .mk-kpi-val { font-weight: 700; font-size: 10px; color: #0d1b2a; }
    .mk-kpi-lbl { font-size: 9px; color: #78909c; }

    .mk-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; }
    .mk-card { background: white; border-radius: 8px; padding: 8px; border: 1px solid #e8edf2; }
    .mk-card-hdr { font-weight: 700; font-size: 10px; margin-bottom: 6px; }
    .mk-blue-txt { color: #1565c0; }
    .mk-bars { display: flex; flex-direction: column; gap: 4px; }
    .mk-bar { height: 6px; border-radius: 3px; }
    .mk-op-list { display: flex; flex-direction: column; gap: 4px; }
    .mk-op-row { display: flex; align-items: center; gap: 5px; }
    .mk-op-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .mk-quick-row { display: flex; flex-direction: column; gap: 4px; }
    .mk-quick-btn { padding: 4px 8px; border-radius: 6px; font-size: 9px; font-weight: 600; color: white; text-align: center; }
    .mk-blue-bg   { background: #1565c0; }
    .mk-green-bg  { background: #2e7d32; }
    .mk-teal-bg   { background: #00897b; }
    .mk-amber-bg  { background: #f57f17; }
    .mk-red-bg    { background: #c62828; }
    .mk-purple-bg { background: #7b1fa2; }

    .mk-list-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .mk-title-bar { font-weight: 700; font-size: 12px; color: #0d1b2a; }
    .mk-btn-add { padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 700; color: white; }
    .mk-filters { display: flex; gap: 4px; margin-bottom: 8px; flex-wrap: wrap; }
    .mk-filter-chip { padding: 3px 8px; border-radius: 10px; background: #f0f4f8; font-size: 9px; color: #546e7a; border: 1px solid #e0e7ef; }
    .mk-active-chip { background: #e3f2fd; color: #1565c0; border-color: #90caf9; font-weight: 700; }
    .mk-search-bar { display: flex; align-items: center; gap: 6px; background: #f0f4f8; border-radius: 8px; padding: 6px 10px; margin-top: 8px; }

    .mk-table { border: 1px solid #e8edf2; border-radius: 8px; overflow: hidden; }
    .mk-th-row { display: grid; grid-template-columns: 70px 1fr 60px 70px; padding: 6px 8px; background: #f8fafc; font-size: 9px; font-weight: 700; color: #90a4ae; gap: 4px; }
    .mk-tr { display: grid; grid-template-columns: 70px 1fr 60px 70px; padding: 6px 8px; font-size: 9px; gap: 4px; border-top: 1px solid #f0f4f8; align-items: center; }
    .mk-date { color: #78909c; }
    .mk-op-name { color: #0d1b2a; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .mk-badge { padding: 2px 6px; border-radius: 6px; font-size: 8px; font-weight: 700; color: white; text-align: center; }
    .mk-amount { color: #0d1b2a; font-weight: 600; text-align: right; }

    .mk-journal { display: flex; flex-direction: column; gap: 8px; }
    .mk-je-row { border: 1px solid #e8edf2; border-radius: 8px; overflow: hidden; }
    .mk-je-date { background: #f8fafc; padding: 4px 8px; font-weight: 700; font-size: 9px; color: #546e7a; border-bottom: 1px solid #f0f4f8; }
    .mk-je-lines { padding: 4px; }
    .mk-je-line { display: grid; grid-template-columns: 55px 1fr 50px 50px; gap: 4px; padding: 3px 4px; font-size: 9px; align-items: center; }
    .mk-je-compte { font-weight: 700; }
    .mk-je-lib { color: #546e7a; }
    .mk-je-debit,.mk-je-credit { text-align: right; font-weight: 600; color: #0d1b2a; }

    .mk-class-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .mk-class-card { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 8px; background: #f8fafc; border: 1px solid #e8edf2; border-left: 3px solid; }
    .mk-class-badge { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0; }
    .mk-class-info { min-width: 0; }
    .mk-class-name { font-size: 10px; font-weight: 600; color: #0d1b2a; }
    .mk-class-n { font-size: 9px; color: #90a4ae; }

    .mk-event-list { display: flex; flex-direction: column; gap: 6px; }
    .mk-event-row { display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 8px; background: #f8fafc; border: 1px solid #e8edf2; }
    .mk-event-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .mk-event-info { flex: 1; }
    .mk-event-name { font-size: 10px; font-weight: 600; color: #0d1b2a; }
    .mk-event-date { font-size: 9px; color: #78909c; }
    .mk-event-badge { padding: 2px 8px; border-radius: 8px; font-size: 9px; font-weight: 700; white-space: nowrap; }

    .mk-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .mk-chart-card { background: white; border-radius: 8px; padding: 8px; border: 1px solid #e8edf2; }
    .mk-chart-title { font-size: 10px; font-weight: 700; color: #0d1b2a; margin-bottom: 8px; }
    .mk-chart-bars { display: flex; align-items: flex-end; gap: 5px; height: 60px; }
    .mk-chart-col { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; height: 100%; justify-content: flex-end; span { font-size: 8px; color: #90a4ae; } }
    .mk-chart-bar-v { width: 100%; border-radius: 3px 3px 0 0; min-height: 4px; }
    .mk-donut-wrap { display: flex; align-items: center; gap: 10px; }
    .mk-donut { width: 50px; height: 50px; border-radius: 50%; background: conic-gradient(#ef5350 0% 42%, #43a047 42% 100%); flex-shrink: 0; }
    .mk-donut-legend { display: flex; flex-direction: column; gap: 4px; }
    .mk-leg-item { display: flex; align-items: center; gap: 5px; font-size: 9px; color: #546e7a; }
    .mk-leg-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

    .mk-rapport-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .mk-rapport-card { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 8px; background: white; border-radius: 10px; border: 1px solid #e8edf2; border-left: 3px solid; text-align: center; }
    .mk-rapport-name { font-size: 10px; font-weight: 700; color: #0d1b2a; }
    .mk-rapport-sub  { font-size: 9px; color: #90a4ae; }

    .mk-budget-list { display: flex; flex-direction: column; gap: 8px; }
    .mk-budget-row { display: grid; grid-template-columns: 100px 1fr 90px; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f0f4f8; }
    .mk-budget-cat { font-size: 9px; font-weight: 600; color: #0d1b2a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .mk-budget-progress-wrap { display: flex; align-items: center; gap: 6px; }
    .mk-budget-progress-track { flex: 1; height: 6px; background: #f0f4f8; border-radius: 3px; overflow: hidden; }
    .mk-budget-progress-bar { height: 100%; border-radius: 3px; }
    .mk-budget-pct { font-size: 9px; font-weight: 700; color: #0d1b2a; flex-shrink: 0; width: 24px; }
    .mk-budget-amounts { text-align: right; }
    .mk-budget-used { font-size: 9px; font-weight: 700; color: #0d1b2a; display: block; }
    .mk-budget-total { font-size: 8px; color: #90a4ae; }

    .mk-obj-list { display: flex; flex-direction: column; gap: 8px; }
    .mk-obj-card { display: flex; align-items: center; gap: 8px; padding: 8px; background: white; border-radius: 10px; border: 1px solid #e8edf2; }
    .mk-obj-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .mk-obj-body { flex: 1; min-width: 0; }
    .mk-obj-name { font-size: 10px; font-weight: 600; color: #0d1b2a; margin-bottom: 4px; }
    .mk-obj-progress-track { height: 5px; background: #f0f4f8; border-radius: 3px; overflow: hidden; margin-bottom: 3px; }
    .mk-obj-progress-bar { height: 100%; border-radius: 3px; }
    .mk-obj-amounts { font-size: 8px; color: #90a4ae; }
    .mk-obj-pct { font-size: 12px; font-weight: 800; flex-shrink: 0; }

    .mk-alert-list { display: flex; flex-direction: column; gap: 6px; }
    .mk-alert-row { display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 8px; border: 1px solid #e8edf2; }
    .mk-alert-critical { background: #fff5f5; border-color: #ffcdd2; }
    .mk-alert-warn { background: #fffbf0; border-color: #ffe082; }
    .mk-alert-info { background: #f3f8ff; border-color: #bbdefb; }
    .mk-alert-body { flex: 1; }
    .mk-alert-title { font-size: 10px; font-weight: 600; color: #0d1b2a; }
    .mk-alert-sub   { font-size: 9px; color: #78909c; }
    .mk-alert-badge { padding: 2px 8px; border-radius: 8px; font-size: 9px; font-weight: 700; white-space: nowrap; }

    .mk-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; gap: 10px; }

    /* ── Étapes & Astuces ── */
    .steps-panel { display: flex; flex-direction: column; gap: 20px; }

    .steps-title, .tips-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 700; color: #0d1b2a;
      margin: 0 0 14px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .steps-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .step-item {
      display: flex; align-items: flex-start; gap: 10px;
    }
    .step-num {
      width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 800;
    }
    .step-text { font-size: 13px; color: #37474f; line-height: 1.5; padding-top: 3px; }

    .tips-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .tip-item {
      display: flex; align-items: flex-start; gap: 8px;
      font-size: 13px; color: #546e7a; line-height: 1.5;
      background: #fffde7; padding: 8px 12px; border-radius: 8px;
      border-left: 3px solid #ffc107;
      span { flex: 1; }
    }

    /* ── Quick Start ── */
    .quickstart-card {
      display: flex; align-items: flex-start; gap: 20px;
      background: linear-gradient(135deg, #0d47a1 0%, #1565c0 100%);
      border-radius: 20px; padding: 28px; color: white;
      box-shadow: 0 6px 24px rgba(21,101,192,.35);
      margin-bottom: 8px;
    }
    .qs-icon { font-size: 40px; width: 40px; height: 40px; opacity: .9; flex-shrink: 0; margin-top: 4px; }
    .qs-body { flex: 1; }
    .qs-body h2 { font-size: 18px; font-weight: 800; margin: 0 0 6px; }
    .qs-body > p { font-size: 13px; opacity: .8; margin: 0 0 20px; }
    .qs-steps {
      display: flex; align-items: flex-start; gap: 8px;
      flex-wrap: wrap;
    }
    .qs-step {
      display: flex; align-items: flex-start; gap: 10px;
      background: rgba(255,255,255,.1); border-radius: 12px;
      padding: 12px 14px; flex: 1; min-width: 180px;
    }
    .qs-step-num {
      width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
      background: rgba(255,255,255,.2); display: flex; align-items: center;
      justify-content: center; font-size: 14px; font-weight: 800;
    }
    .qs-step-content {
      strong { display: block; font-size: 13px; margin-bottom: 3px; }
      span { font-size: 11px; opacity: .75; }
      a { color: #90caf9; text-decoration: underline; }
    }
    .qs-arrow {
      display: flex; align-items: center; padding-top: 20px;
      mat-icon { color: rgba(255,255,255,.4); font-size: 20px; }
    }

    @media (max-width: 1000px) {
      .tuto-page { grid-template-columns: 1fr; }
      .side-unified-card { position: static; max-height: none; order: -1; }
    }
    @media (max-width: 900px) {
      .section-body { grid-template-columns: 1fr; }
      .qs-steps { flex-direction: column; }
      .qs-arrow { display: none; }
    }
    @media (max-width: 680px) {
      .toc-grid { grid-template-columns: repeat(5, 1fr); }
    }
    @media (max-width: 500px) {
      .toc-grid { grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); }
      .mk-kpi-row { grid-template-columns: 1fr 1fr; }
      .mk-grid-3 { grid-template-columns: 1fr; }
    }
  `]
})
export class TutorielsComponent {

  activeTab = signal(0);

  readonly glossaire = [
    { mot: 'Débit', def: 'Augmentation d\'un actif ou d\'une charge ; diminution d\'un passif.' },
    { mot: 'Crédit', def: 'Augmentation d\'un passif ou d\'un produit ; diminution d\'un actif.' },
    { mot: 'Solde', def: 'Différence entre le total des débits et le total des crédits d\'un compte.' },
    { mot: 'Journal', def: 'Livre comptable recensant toutes les écritures dans l\'ordre chronologique.' },
    { mot: 'Grand livre', def: 'Regroupement de toutes les écritures par compte comptable.' },
    { mot: 'Balance', def: 'Tableau récapitulatif des soldes débit et crédit de tous les comptes.' },
    { mot: 'PCG', def: 'Plan Comptable Général — nomenclature officielle des comptes en France.' },
  ];

  readonly regles = [
    { icon: 'balance', couleur: '#1565c0', label: 'Partie double', desc: 'Tout débit doit être compensé par un crédit de même montant.' },
    { icon: 'calendar_today', couleur: '#2e7d32', label: 'Chronologie', desc: 'Les opérations s\'enregistrent dans l\'ordre chronologique sans exception.' },
    { icon: 'lock', couleur: '#e65100', label: 'Immuabilité', desc: 'Une écriture validée ne peut être supprimée, seulement contre-passée.' },
    { icon: 'check_circle', couleur: '#6a1b9a', label: 'Équilibre', desc: 'La balance doit toujours être équilibrée : ∑ débits = ∑ crédits.' },
  ];

  readonly navTips = [
    { icon: 'search', label: 'Recherche globale', desc: 'La barre en haut permet de chercher comptes, opérations et événements.' },
    { icon: 'chevron_left', label: 'Réduire la sidebar', desc: 'Cliquez sur la flèche pour gagner de l\'espace sur petit écran.' },
    { icon: 'open_in_new', label: 'Bouton "Ouvrir"', desc: 'Chaque section de ce guide contient un lien direct vers le module.' },
    { icon: 'anchor', label: 'Ancres rapides', desc: 'Cliquez sur une icône en haut pour scroller directement vers la section.' },
  ];

  readonly sections: TutorielSection[] = [
    {
      id: 'dashboard',
      titre: 'Dashboard',
      icon: 'dashboard',
      couleur: '#1565c0',
      couleurBg: '#e3f2fd',
      route: '/dashboard',
      description: 'Vue d\'ensemble de votre situation financière avec indicateurs clés et graphiques.',
      etapes: [
        'Accédez au Dashboard depuis le menu latéral (icône tableau de bord).',
        'Consultez les 4 indicateurs en haut : Actif total, Passif, Résultat net et nombre de comptes.',
        'Le bloc "Soldes par classe" affiche les soldes agrégés par classe comptable (1 à 8).',
        'Les "Dernières opérations" vous donnent un aperçu des 5 derniers mouvements.',
        'Utilisez les "Actions rapides" pour créer une opération ou un compte directement.',
      ],
      astuces: [
        'Le résultat net passe au rouge quand les charges dépassent les produits.',
        'Cliquez sur "Voir tout →" dans la liste des opérations pour accéder au détail complet.',
        'Le graphique de répartition des soldes s\'actualise automatiquement à chaque nouvelle opération.',
      ],
    },
    {
      id: 'operations',
      titre: 'Opérations',
      icon: 'swap_vert',
      couleur: '#2e7d32',
      couleurBg: '#e8f5e9',
      route: '/operations',
      description: 'Enregistrez et gérez toutes vos opérations comptables (achats, ventes, charges, etc.).',
      etapes: [
        'Cliquez sur "+ Nouvelle opération" pour ouvrir le formulaire de saisie.',
        'Choisissez le type d\'opération parmi les 30 types disponibles (vente, achat, charge, banque, etc.).',
        'Saisissez la date, le libellé et ajoutez les lignes de journal (débit / crédit).',
        'Chaque entrée doit être équilibrée : total débits = total crédits.',
        'Filtrez la liste par type ou période grâce aux filtres en haut de la page.',
        'Cliquez sur une opération pour voir son détail ou la modifier.',
      ],
      astuces: [
        'Le formulaire vérifie automatiquement l\'équilibre débit/crédit avant l\'enregistrement.',
        'Vous pouvez ajouter plusieurs lignes à une même opération.',
        'La barre de recherche globale (en haut) permet de retrouver une opération par son libellé.',
      ],
    },
    {
      id: 'journal',
      titre: 'Journal',
      icon: 'menu_book',
      couleur: '#6a1b9a',
      couleurBg: '#f3e5f5',
      route: '/journal',
      description: 'Consultez le grand livre comptable avec toutes les écritures débit/crédit.',
      etapes: [
        'Accédez au Journal depuis le menu latéral.',
        'Chaque entrée de journal affiche sa date, son libellé et ses lignes débit/crédit.',
        'Cliquez sur une entrée pour voir le détail complet de l\'écriture.',
        'Filtrez par opération parente via le paramètre d\'URL (?operationId=...).',
        'Naviguez vers les comptes associés en cliquant sur les numéros de compte.',
      ],
      astuces: [
        'Le journal est la traçabilité comptable complète de chaque mouvement.',
        'Chaque ligne montre le compte débité ou crédité avec son montant.',
        'Exportez les données via le module Rapports pour une analyse approfondie.',
      ],
    },
    {
      id: 'accounts',
      titre: 'Comptes',
      icon: 'account_balance_wallet',
      couleur: '#00695c',
      couleurBg: '#e0f2f1',
      route: '/accounts',
      description: 'Gérez votre plan comptable : créez, modifiez et consultez vos comptes par classe.',
      etapes: [
        'Cliquez sur "+ Nouveau compte" pour créer un compte dans le plan comptable.',
        'Renseignez le code du compte (ex : 512000), son nom et sa classe (1 à 8).',
        'Consultez le solde de chaque compte (débit − crédit cumulés).',
        'Utilisez la recherche pour trouver un compte par code ou libellé.',
        'Cliquez sur un compte pour voir tout le détail de ses mouvements.',
        'Modifiez ou supprimez un compte depuis sa page de détail.',
      ],
      astuces: [
        'Respectez la numérotation du Plan Comptable Général (PCG) pour une comptabilité conforme.',
        'Classe 5 = comptes financiers (banque, caisse) — les plus utilisés au quotidien.',
        'Un compte ne peut être supprimé s\'il possède des lignes de journal associées.',
      ],
    },
    {
      id: 'evenements',
      titre: 'Événements',
      icon: 'calendar_month',
      couleur: '#e65100',
      couleurBg: '#fff3e0',
      route: '/evenements',
      description: 'Suivez vos échéances, paiements et événements financiers importants.',
      etapes: [
        'Créez un événement en cliquant sur "+ Nouvel événement".',
        'Renseignez le titre, la catégorie, le montant et la date d\'échéance.',
        'L\'indicateur de couleur signale les événements urgents (rouge), à venir (orange) ou payés (vert).',
        'Marquez un événement comme payé avec le bouton "Payer" depuis la liste.',
        'Filtrez par statut (tous, en attente, payés) pour une meilleure visibilité.',
      ],
      astuces: [
        'Configurez des rappels via le module Alertes pour ne jamais manquer une échéance.',
        'Les événements passés non payés apparaissent en rouge — traitement prioritaire recommandé.',
        'Catégorisez vos événements (loyer, TVA, salaires...) pour un suivi organisé.',
      ],
    },
    {
      id: 'stats',
      titre: 'Statistiques',
      icon: 'bar_chart',
      couleur: '#0277bd',
      couleurBg: '#e1f5fe',
      route: '/stats',
      description: 'Analysez l\'évolution de vos finances avec des graphiques interactifs.',
      etapes: [
        'Accédez aux Statistiques depuis le menu latéral.',
        'Consultez l\'évolution mensuelle de vos entrées et sorties.',
        'Le graphique Charges vs Produits vous montre la répartition en pourcentage.',
        'Sélectionnez une période pour affiner l\'analyse.',
        'Comparez les exercices annuels pour identifier les tendances.',
      ],
      astuces: [
        'Un résultat positif (produits > charges) indique une activité bénéficiaire.',
        'Combinez les statistiques avec les rapports pour une analyse comptable complète.',
        'Les données se basent en temps réel sur vos opérations enregistrées.',
      ],
    },
    {
      id: 'rapports',
      titre: 'Rapports',
      icon: 'description',
      couleur: '#4527a0',
      couleurBg: '#ede7f6',
      route: '/rapports',
      description: 'Générez vos documents comptables officiels : balance, grand livre, bilan, résultat.',
      etapes: [
        'Sélectionnez le type de rapport souhaité (balance, grand livre, etc.).',
        'Choisissez la période d\'analyse (mois, trimestre, exercice).',
        'Consultez le rapport à l\'écran avec les totaux calculés automatiquement.',
        'Imprimez ou exportez le rapport pour vos obligations comptables.',
        'Le bilan affiche l\'actif et le passif à une date donnée.',
      ],
      astuces: [
        'La balance générale doit être équilibrée : total débits = total crédits.',
        'Le compte de résultat = Produits (classe 7) − Charges (classe 6).',
        'Générez vos rapports trimestriellement pour anticiper les déclarations fiscales.',
      ],
    },
    {
      id: 'budget',
      titre: 'Budget',
      icon: 'account_balance',
      couleur: '#00695c',
      couleurBg: '#e0f2f1',
      route: '/budget',
      description: 'Planifiez et suivez vos budgets mensuels par catégorie.',
      etapes: [
        'Créez un budget en cliquant sur "+ Nouveau budget" et sélectionnez le mois/exercice.',
        'Ajoutez des lignes budgétaires (ex : charges de personnel, frais généraux).',
        'Renseignez le montant prévu pour chaque ligne.',
        'La barre de progression indique le taux de consommation en temps réel.',
        'Une ligne passe au rouge lorsqu\'elle dépasse 90% du budget alloué.',
        'Supprimez des lignes ou ajustez les montants à tout moment.',
      ],
      astuces: [
        'Créez un budget par mois pour un suivi précis de la saisonnalité.',
        'Comparez le réalisé vs prévu chaque fin de mois pour ajuster votre stratégie.',
        'Les lignes en rouge nécessitent une action corrective immédiate.',
      ],
    },
    {
      id: 'objectifs',
      titre: 'Objectifs',
      icon: 'flag',
      couleur: '#1565c0',
      couleurBg: '#e3f2fd',
      route: '/objectifs',
      description: 'Définissez et suivez vos objectifs d\'épargne et d\'investissement.',
      etapes: [
        'Créez un objectif en cliquant sur "+ Nouvel objectif".',
        'Donnez un titre, un montant cible et une date limite à votre objectif.',
        'Enregistrez des versements progressifs pour faire avancer la barre de progression.',
        'Consultez le montant restant à atteindre et le pourcentage d\'avancement.',
        'Modifiez ou supprimez un objectif depuis sa fiche.',
      ],
      astuces: [
        'Décomposez un grand objectif en plusieurs petits objectifs intermédiaires.',
        'Effectuez des versements réguliers plutôt qu\'un seul versement annuel.',
        'Un objectif atteint (100%) peut être archivé pour garder un historique propre.',
      ],
    },
    {
      id: 'alertes',
      titre: 'Alertes',
      icon: 'notifications_active',
      couleur: '#c62828',
      couleurBg: '#ffebee',
      route: '/alertes',
      description: 'Recevez des notifications sur les situations critiques et les échéances à venir.',
      etapes: [
        'Accédez au Centre d\'alertes depuis le menu latéral (icône cloche).',
        'Les alertes critiques (rouge) signalent des soldes négatifs ou des dépassements.',
        'Les avertissements (orange) indiquent des seuils approchant leur limite.',
        'Les informations (bleu) vous tiennent au courant des événements à venir.',
        'Traitez les alertes critiques en priorité pour éviter les problèmes comptables.',
      ],
      astuces: [
        'Consultez les alertes chaque matin pour démarrer la journée sans surprise.',
        'Une alerte solde négatif sur un compte 512 (banque) demande une action immédiate.',
        'Les alertes budget se déclenchent automatiquement au-delà de 90% de consommation.',
      ],
    },
  ];
}
