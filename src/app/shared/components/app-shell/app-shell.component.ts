import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AlertComponent } from '../alert/alert.component';
import { AuthService } from '../../../core/services/auth.service';
import { AccountService } from '../../../core/services/account.service';
import { OperationService } from '../../../core/services/operation.service';
import { EvenementService } from '../../../core/services/evenement.service';
import { Account } from '../../../core/models/account.model';
import { Operation } from '../../../core/models/operation.model';
import { Evenement } from '../../../core/models/evenement.model';

interface SearchResult {
  type: 'compte' | 'operation' | 'evenement';
  label: string;
  sub: string;
  icon: string;
  link: string[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    AlertComponent,
  ],
  template: `
    <div class="shell">

      <!-- ── Sidebar ── -->
      <aside class="sidebar" [class.collapsed]="collapsed()">

        <!-- Logo -->
        <div class="sidebar-logo">
          <div class="logo-icon">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="rgba(255,255,255,0.15)"/>
              <circle cx="20" cy="20" r="10" fill="none" stroke="white" stroke-width="2"/>
              <path d="M20 13v2M20 25v2M13 20h-2M29 20h-2" stroke="white" stroke-width="2" stroke-linecap="round"/>
              <circle cx="20" cy="20" r="3" fill="white"/>
            </svg>
          </div>
          @if (!collapsed()) {
            <span class="logo-text">Volako</span>
          }
        </div>

        <!-- Collapse Toggle -->
        <button mat-icon-button class="sidebar-toggle"
          (click)="collapsed.set(!collapsed())"
          [matTooltip]="collapsed() ? 'Développer' : 'Réduire'"
          matTooltipPosition="right">
          <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
        </button>

        <div class="sidebar-divider"></div>

        <!-- Navigation -->
        <nav class="sidebar-nav">
          <a class="nav-item" routerLink="/dashboard" routerLinkActive="active"
            [matTooltip]="collapsed() ? 'Dashboard' : ''" matTooltipPosition="right">
            <mat-icon class="nav-icon">dashboard</mat-icon>
            @if (!collapsed()) { <span class="nav-label">Dashboard</span> }
          </a>
          <a class="nav-item" routerLink="/operations" routerLinkActive="active"
            [matTooltip]="collapsed() ? 'Opérations' : ''" matTooltipPosition="right">
            <mat-icon class="nav-icon">swap_vert</mat-icon>
            @if (!collapsed()) { <span class="nav-label">Opérations</span> }
          </a>
          <a class="nav-item" routerLink="/journal" routerLinkActive="active"
            [matTooltip]="collapsed() ? 'Journal' : ''" matTooltipPosition="right">
            <mat-icon class="nav-icon">menu_book</mat-icon>
            @if (!collapsed()) { <span class="nav-label">Journal</span> }
          </a>
          <a class="nav-item" routerLink="/accounts" routerLinkActive="active"
            [matTooltip]="collapsed() ? 'Comptes' : ''" matTooltipPosition="right">
            <mat-icon class="nav-icon">account_balance_wallet</mat-icon>
            @if (!collapsed()) { <span class="nav-label">Comptes</span> }
          </a>
          <a class="nav-item" routerLink="/evenements" routerLinkActive="active"
            [matTooltip]="collapsed() ? 'Événements' : ''" matTooltipPosition="right">
            <mat-icon class="nav-icon">calendar_month</mat-icon>
            @if (!collapsed()) { <span class="nav-label">Événements</span> }
          </a>
          <a class="nav-item" routerLink="/stats" routerLinkActive="active"
            [matTooltip]="collapsed() ? 'Statistiques' : ''" matTooltipPosition="right">
            <mat-icon class="nav-icon">bar_chart</mat-icon>
            @if (!collapsed()) { <span class="nav-label">Statistiques</span> }
          </a>
          <a class="nav-item" routerLink="/rapports" routerLinkActive="active"
            [matTooltip]="collapsed() ? 'Rapports' : ''" matTooltipPosition="right">
            <mat-icon class="nav-icon">description</mat-icon>
            @if (!collapsed()) { <span class="nav-label">Rapports</span> }
          </a>

          @if (!collapsed()) { <div class="nav-section-label">Planification</div> }
          @else { <div class="nav-divider"></div> }

          <a class="nav-item" routerLink="/budget" routerLinkActive="active"
            [matTooltip]="collapsed() ? 'Budget' : ''" matTooltipPosition="right">
            <mat-icon class="nav-icon">account_balance</mat-icon>
            @if (!collapsed()) { <span class="nav-label">Budget</span> }
          </a>
          <a class="nav-item" routerLink="/objectifs" routerLinkActive="active"
            [matTooltip]="collapsed() ? 'Objectifs' : ''" matTooltipPosition="right">
            <mat-icon class="nav-icon">flag</mat-icon>
            @if (!collapsed()) { <span class="nav-label">Objectifs</span> }
          </a>
          <a class="nav-item nav-item-alert" routerLink="/alertes" routerLinkActive="active"
            [matTooltip]="collapsed() ? 'Alertes' : ''" matTooltipPosition="right">
            <mat-icon class="nav-icon">notifications_active</mat-icon>
            @if (!collapsed()) { <span class="nav-label">Alertes</span> }
          </a>
        </nav>

        <div class="sidebar-spacer"></div>

        <!-- Lien Tutoriels -->
        <div class="sidebar-tuto-wrap">
          <a class="nav-item nav-item-tuto" routerLink="/tutoriels" routerLinkActive="active"
            [matTooltip]="collapsed() ? 'Tutoriels' : ''" matTooltipPosition="right">
            <mat-icon class="nav-icon">school</mat-icon>
            @if (!collapsed()) { <span class="nav-label">Tutoriels</span> }
          </a>
        </div>

        <!-- User Footer -->
        <div class="sidebar-footer">
          <div class="user-avatar"
            [matTooltip]="collapsed() ? (auth.currentUser()?.name ?? '') : ''"
            matTooltipPosition="right">
            {{ initials() }}
          </div>
          @if (!collapsed()) {
            <div class="user-info">
              <span class="user-name">{{ auth.currentUser()?.name }}</span>
              <span class="user-role">Comptable</span>
            </div>
            <button mat-icon-button class="logout-btn" (click)="logout()"
              matTooltip="Déconnexion" matTooltipPosition="right">
              <mat-icon>logout</mat-icon>
            </button>
          }
        </div>
      </aside>

      <!-- ── Content ── -->
      <div class="content-wrap">

        <!-- ── Top Bar (search) ── -->
        <header class="top-bar">
          <div class="search-wrap" (clickOutside)="closeSearch()">
            <div class="search-box" [class.focused]="searchFocused()">
              <mat-icon class="search-ico">search</mat-icon>
              <input
                class="search-input"
                placeholder="Rechercher un compte, une opération, un événement…"
                [(ngModel)]="searchQuery"
                (input)="onSearch()"
                (focus)="searchFocused.set(true)"
                (keydown.escape)="closeSearch()"
              />
              @if (searchQuery) {
                <button class="search-clear" (click)="clearSearch()">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </div>

            <!-- Résultats dropdown -->
            @if (searchFocused() && searchResults().length > 0) {
              <div class="search-dropdown">
                @for (result of searchResults(); track result.label + result.type) {
                  <a class="search-result-item" [routerLink]="result.link"
                     (click)="clearSearch()">
                    <div class="sri-icon" [class]="'sri-' + result.type">
                      <mat-icon>{{ result.icon }}</mat-icon>
                    </div>
                    <div class="sri-body">
                      <p class="sri-label">{{ result.label }}</p>
                      <p class="sri-sub">{{ result.sub }}</p>
                    </div>
                    <span class="sri-type">{{ typeLabel(result.type) }}</span>
                  </a>
                }
              </div>
            }
            @if (searchFocused() && searchQuery && searchResults().length === 0) {
              <div class="search-dropdown search-empty">
                <mat-icon>search_off</mat-icon>
                <p>Aucun résultat pour "{{ searchQuery }}"</p>
              </div>
            }
          </div>
        </header>

        <main class="content">
          <app-alert></app-alert>
          <router-outlet></router-outlet>
        </main>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 240px;
      min-width: 240px;
      background: linear-gradient(180deg, #0d1b2a 0%, #0d2644 55%, #0f3460 100%);
      display: flex;
      flex-direction: column;
      transition: width .22s ease, min-width .22s ease;
      overflow: hidden;
      flex-shrink: 0;
      position: relative;
      z-index: 10;
      box-shadow: 2px 0 12px rgba(0,0,0,.25);

      &.collapsed {
        width: 64px;
        min-width: 64px;
      }
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 24px 14px 12px;
      overflow: hidden;
    }
    .logo-icon {
      width: 36px; height: 36px; flex-shrink: 0;
      svg { width: 100%; height: 100%; }
    }
    .logo-text {
      font-size: 20px; font-weight: 800;
      color: white; letter-spacing: -.5px;
      white-space: nowrap;
    }

    .sidebar-toggle {
      color: rgba(255,255,255,.45) !important;
      margin: 0 10px 4px;
      align-self: flex-start;
      transition: color .15s;
      &:hover { color: white !important; }
    }

    .sidebar-divider {
      height: 1px;
      background: rgba(255,255,255,.08);
      margin: 4px 14px 8px;
    }

    /* ── Navigation ── */
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 4px 8px;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 10px;
      color: rgba(255,255,255,.55);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: background .15s, color .15s, border-left .15s;
      white-space: nowrap;
      border-left: 3px solid transparent;
      overflow: hidden;

      &:hover {
        background: rgba(255,255,255,.08);
        color: rgba(255,255,255,.88);
      }

      &.active {
        background: rgba(21,101,192,.38);
        color: #90caf9;
        border-left-color: #42a5f5;
      }
    }
    .nav-icon  { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    .nav-label { flex: 1; }

    .nav-section-label {
      font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .8px;
      color: rgba(255,255,255,.25); padding: 10px 14px 4px; white-space: nowrap;
    }
    .nav-divider {
      height: 1px; background: rgba(255,255,255,.08); margin: 8px 14px;
    }
    .nav-item-alert.active {
      background: rgba(193,62,62,.38) !important;
      color: #ffcdd2 !important;
      border-left-color: #ef5350 !important;
    }

    /* ── Spacer ── */
    .sidebar-spacer { flex: 1; }

    /* ── Tutoriels ── */
    .sidebar-tuto-wrap {
      padding: 0 8px 8px;
      border-bottom: 1px solid rgba(255,255,255,.08);
    }
    .nav-item-tuto {
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.1);
      &:hover {
        background: rgba(255,255,255,.13);
      }
      &.active {
        background: rgba(103,58,183,.35) !important;
        color: #ce93d8 !important;
        border-left-color: #ab47bc !important;
        border-color: rgba(171,71,188,.3) !important;
      }
    }

    /* ── User Footer ── */
    .sidebar-footer {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 12px;
      border-top: 1px solid rgba(255,255,255,.08);
      overflow: hidden;
    }

    .user-avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: rgba(255,255,255,.16);
      border: 1px solid rgba(255,255,255,.2);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 12px; font-weight: 700;
      flex-shrink: 0;
      cursor: default;
    }

    .user-info {
      flex: 1; min-width: 0;
      .user-name {
        display: block; color: rgba(255,255,255,.88);
        font-size: 13px; font-weight: 600;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .user-role {
        display: block; color: rgba(255,255,255,.38);
        font-size: 11px;
      }
    }

    .logout-btn {
      flex-shrink: 0;
      color: rgba(255,255,255,.45) !important;
      &:hover { color: #ef9a9a !important; }
    }

    /* ── Content Wrap ── */
    .content-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
    }

    /* ── Top Bar ── */
    .top-bar {
      background: white;
      border-bottom: 1px solid #e8edf2;
      padding: 10px 24px;
      flex-shrink: 0;
      z-index: 5;
      box-shadow: 0 1px 4px rgba(13,27,42,.06);
    }

    /* ── Search ── */
    .search-wrap { position: relative; max-width: 560px; }

    .search-box {
      display: flex; align-items: center; gap: 8px;
      background: #f0f4f8; border-radius: 12px; padding: 8px 14px;
      border: 1.5px solid transparent; transition: border-color .15s, background .15s;
      &.focused { background: white; border-color: #1565c0; box-shadow: 0 0 0 3px rgba(21,101,192,.12); }
    }
    .search-ico { font-size: 18px; width: 18px; height: 18px; color: #90a4ae; flex-shrink: 0; }
    .search-input {
      flex: 1; border: none; background: transparent; outline: none;
      font-size: 13px; color: #0d1b2a;
      &::placeholder { color: #90a4ae; }
    }
    .search-clear {
      display: flex; align-items: center; justify-content: center;
      width: 20px; height: 20px; border: none; border-radius: 50%;
      background: #b0bec5; cursor: pointer; flex-shrink: 0;
      mat-icon { font-size: 13px; width: 13px; height: 13px; color: white; }
      &:hover { background: #78909c; }
    }

    .search-dropdown {
      position: absolute; top: calc(100% + 6px); left: 0; right: 0;
      background: white; border-radius: 14px; box-shadow: 0 8px 32px rgba(13,27,42,.18);
      border: 1px solid #e8edf2; z-index: 100;
      max-height: 360px; overflow-y: auto;
      animation: dropIn .15s ease;
    }
    @keyframes dropIn {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .search-result-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; text-decoration: none; color: inherit;
      transition: background .12s; cursor: pointer;
      &:not(:last-child) { border-bottom: 1px solid #f5f7fa; }
      &:first-child { border-radius: 14px 14px 0 0; }
      &:last-child  { border-radius: 0 0 14px 14px; }
      &:only-child  { border-radius: 14px; }
      &:hover { background: #f5f9ff; }
    }

    .sri-icon {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .sri-compte    { background: #e3f2fd; color: #1565c0; }
    .sri-operation { background: #e8f5e9; color: #2e7d32; }
    .sri-evenement { background: #fff8e1; color: #f57f17; }

    .sri-body { flex: 1; min-width: 0; }
    .sri-label { font-size: 13px; font-weight: 600; color: #0d1b2a; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sri-sub   { font-size: 11px; color: #78909c; margin: 0; }
    .sri-type  { font-size: 10px; font-weight: 700; color: #90a4ae; background: #f0f4f8; padding: 2px 8px; border-radius: 10px; white-space: nowrap; }

    .search-empty {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      padding: 24px; color: #90a4ae; font-size: 13px;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
      p { margin: 0; }
    }

    /* ── Content ── */
    .content {
      flex: 1;
      background: #f0f4f8;
      overflow-y: auto;
      padding: 32px;
      min-width: 0;
    }

    @media (max-width: 768px) {
      .sidebar { width: 64px; min-width: 64px; }
      .sidebar.collapsed { width: 0; min-width: 0; }
      .content { padding: 16px; }
      .top-bar { padding: 8px 16px; }
    }
  `]
})
export class AppShellComponent implements OnInit {
  readonly auth   = inject(AuthService);
  private readonly router          = inject(Router);
  private readonly accountService  = inject(AccountService);
  private readonly operationService = inject(OperationService);
  private readonly evenementService = inject(EvenementService);

  collapsed = signal(false);

  // Search state
  searchQuery   = '';
  searchFocused = signal(false);
  private allAccounts:   Account[]   = [];
  private allOperations: Operation[] = [];
  private allEvenements: Evenement[] = [];

  searchResults = signal<SearchResult[]>([]);

  ngOnInit(): void {
    this.accountService.getAll().subscribe(list => this.allAccounts = list);
    this.operationService.getAll().subscribe(list => this.allOperations = list);
    this.evenementService.getAll().subscribe(list => this.allEvenements = list);
  }

  initials = computed(() => {
    const name = this.auth.currentUser()?.name ?? '';
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U';
  });

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

  onSearch(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) { this.searchResults.set([]); return; }

    const results: SearchResult[] = [];

    // Comptes
    this.allAccounts
      .filter(a => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach(a => results.push({
        type: 'compte',
        label: `${a.code} — ${a.name}`,
        sub: `Classe ${a.class}`,
        icon: 'account_balance_wallet',
        link: ['/accounts', String(a.id)],
      }));

    // Opérations
    this.allOperations
      .filter(o => o.label.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach(o => results.push({
        type: 'operation',
        label: o.label,
        sub: o.date,
        icon: 'swap_vert',
        link: ['/operations', String(o.id)],
      }));

    // Événements
    this.allEvenements
      .filter(e => e.titre.toLowerCase().includes(q) || e.categorie.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach(e => results.push({
        type: 'evenement',
        label: e.titre,
        sub: `${e.categorie} — ${e.dateEcheance}`,
        icon: 'calendar_month',
        link: ['/evenements'],
      }));

    this.searchResults.set(results.slice(0, 10));
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults.set([]);
    this.searchFocused.set(false);
  }

  closeSearch(): void {
    if (!this.searchQuery) this.searchFocused.set(false);
  }

  typeLabel(type: SearchResult['type']): string {
    return { compte: 'Compte', operation: 'Opération', evenement: 'Événement' }[type];
  }
}
