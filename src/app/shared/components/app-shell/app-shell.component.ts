import { Component, inject, computed, signal, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule, Router } from '@angular/router';
import { KeyboardShortcutsService } from '../../../core/services/keyboard-shortcuts.service';
import { KeyboardShortcutsHelpComponent } from '../keyboard-shortcuts-help/keyboard-shortcuts-help.component';
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
import { Role } from '../../../core/models/auth.model';

const ROLE_LABELS: Record<Role, string> = {
  ADMIN:          'Administrateur',
  DAF:            'DAF',
  CHEF_COMPTABLE: 'Chef comptable',
  COMPTABLE:      'Comptable',
  ASSISTANT:      'Assistant',
  AUDITEUR:       'Auditeur',
};

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
    KeyboardShortcutsHelpComponent,
  ],
  template: `
    <a href="#main-content" class="skip-link">Aller au contenu principal</a>

    <div class="shell">

      <!-- ── Sidebar ── -->
      <aside class="sidebar" [class.collapsed]="collapsed()" aria-label="Barre latérale de navigation">

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
          [attr.aria-label]="collapsed() ? 'Développer la barre latérale' : 'Réduire la barre latérale'"
          [attr.aria-expanded]="!collapsed()"
          [matTooltip]="collapsed() ? 'Développer' : 'Réduire'"
          matTooltipPosition="right">
          <mat-icon aria-hidden="true">{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
        </button>

        <div class="sidebar-divider"></div>

        <!-- Navigation -->
        <nav class="sidebar-nav" aria-label="Navigation principale">

          <!-- Dashboard -->
          <a class="nav-item" routerLink="/dashboard" routerLinkActive="active"
            [matTooltip]="collapsed() ? 'Dashboard' : ''" matTooltipPosition="right">
            <mat-icon class="nav-icon">dashboard</mat-icon>
            @if (!collapsed()) { <span class="nav-label">Dashboard</span> }
          </a>

          @if (!collapsed()) {

            <!-- ── Groupe Comptabilité ── -->
            <button class="nav-group-header" (click)="toggleGroup('compta')"
              [class.open]="openGroups()['compta']">
              <mat-icon class="nav-icon">menu_book</mat-icon>
              <span class="nav-label">Comptabilité</span>
              <mat-icon class="nav-chevron">{{ openGroups()['compta'] ? 'expand_less' : 'expand_more' }}</mat-icon>
            </button>
            <div class="nav-group-items" [class.open]="openGroups()['compta']"><div>
              <a class="nav-item nav-sub-item" routerLink="/operations" routerLinkActive="active">
                <mat-icon class="nav-icon">swap_vert</mat-icon>
                <span class="nav-label">Opérations</span>
              </a>
              <a class="nav-item nav-sub-item" routerLink="/journal" routerLinkActive="active">
                <mat-icon class="nav-icon">receipt_long</mat-icon>
                <span class="nav-label">Journal</span>
              </a>
              <a class="nav-item nav-sub-item" routerLink="/journaux" routerLinkActive="active">
                <mat-icon class="nav-icon">import_contacts</mat-icon>
                <span class="nav-label">Journaux</span>
              </a>
              <a class="nav-item nav-sub-item" routerLink="/periode-locks" routerLinkActive="active">
                <mat-icon class="nav-icon">lock_clock</mat-icon>
                <span class="nav-label">Verrouillage</span>
              </a>
              @if (canSeeFiscalYears()) {
              <a class="nav-item nav-sub-item" routerLink="/fiscal-years" routerLinkActive="active">
                <mat-icon class="nav-icon">calendar_today</mat-icon>
                <span class="nav-label">Exercices fiscaux</span>
              </a>
              }
            </div></div>

            <!-- ── Groupe Tiers & Facturation ── -->
            <button class="nav-group-header" (click)="toggleGroup('tiers')"
              [class.open]="openGroups()['tiers']">
              <mat-icon class="nav-icon">people</mat-icon>
              <span class="nav-label">Tiers & Facturation</span>
              <mat-icon class="nav-chevron">{{ openGroups()['tiers'] ? 'expand_less' : 'expand_more' }}</mat-icon>
            </button>
            <div class="nav-group-items" [class.open]="openGroups()['tiers']"><div>
              <a class="nav-item nav-sub-item" routerLink="/accounts" routerLinkActive="active">
                <mat-icon class="nav-icon">account_balance_wallet</mat-icon>
                <span class="nav-label">Comptes</span>
              </a>
              <a class="nav-item nav-sub-item" routerLink="/tiers" routerLinkActive="active">
                <mat-icon class="nav-icon">contacts</mat-icon>
                <span class="nav-label">Tiers</span>
              </a>
              <a class="nav-item nav-sub-item" routerLink="/factures" routerLinkActive="active">
                <mat-icon class="nav-icon">description</mat-icon>
                <span class="nav-label">Factures</span>
              </a>
              <a class="nav-item nav-sub-item" routerLink="/rapprochement" routerLinkActive="active">
                <mat-icon class="nav-icon">account_balance</mat-icon>
                <span class="nav-label">Rapprochement</span>
              </a>
            </div></div>

            <!-- ── Groupe Analyse ── -->
            @if (canSeeRapports()) {
            <button class="nav-group-header" (click)="toggleGroup('analyse')"
              [class.open]="openGroups()['analyse']">
              <mat-icon class="nav-icon">analytics</mat-icon>
              <span class="nav-label">Analyse</span>
              <mat-icon class="nav-chevron">{{ openGroups()['analyse'] ? 'expand_less' : 'expand_more' }}</mat-icon>
            </button>
            <div class="nav-group-items" [class.open]="openGroups()['analyse']"><div>
              <a class="nav-item nav-sub-item" routerLink="/stats" routerLinkActive="active">
                <mat-icon class="nav-icon">bar_chart</mat-icon>
                <span class="nav-label">Statistiques</span>
              </a>
              <a class="nav-item nav-sub-item" routerLink="/rapports" routerLinkActive="active">
                <mat-icon class="nav-icon">summarize</mat-icon>
                <span class="nav-label">Rapports</span>
              </a>
              <a class="nav-item nav-sub-item" routerLink="/tva" routerLinkActive="active">
                <mat-icon class="nav-icon">receipt</mat-icon>
                <span class="nav-label">TVA / CA3</span>
              </a>
              <a class="nav-item nav-sub-item" routerLink="/taux-change" routerLinkActive="active">
                <mat-icon class="nav-icon">currency_exchange</mat-icon>
                <span class="nav-label">Taux de change</span>
              </a>
            </div></div>
            }

            <!-- ── Groupe Planification ── -->
            <button class="nav-group-header" (click)="toggleGroup('planif')"
              [class.open]="openGroups()['planif']">
              <mat-icon class="nav-icon">event_note</mat-icon>
              <span class="nav-label">Planification</span>
              <mat-icon class="nav-chevron">{{ openGroups()['planif'] ? 'expand_less' : 'expand_more' }}</mat-icon>
            </button>
            <div class="nav-group-items" [class.open]="openGroups()['planif']"><div>
              <a class="nav-item nav-sub-item" routerLink="/evenements" routerLinkActive="active">
                <mat-icon class="nav-icon">calendar_month</mat-icon>
                <span class="nav-label">Événements</span>
              </a>
              <a class="nav-item nav-sub-item" routerLink="/budget" routerLinkActive="active">
                <mat-icon class="nav-icon">savings</mat-icon>
                <span class="nav-label">Budget</span>
              </a>
              <a class="nav-item nav-sub-item" routerLink="/objectifs" routerLinkActive="active">
                <mat-icon class="nav-icon">flag</mat-icon>
                <span class="nav-label">Objectifs</span>
              </a>
              <a class="nav-item nav-sub-item nav-item-alert" routerLink="/alertes" routerLinkActive="active">
                <mat-icon class="nav-icon">notifications_active</mat-icon>
                <span class="nav-label">Alertes</span>
              </a>
            </div></div>

            <!-- ── Admin : Audit uniquement ── -->
            @if (isAdmin()) {
              <a class="nav-item nav-item-admin" routerLink="/audit-log" routerLinkActive="active">
                <mat-icon class="nav-icon">history</mat-icon>
                <span class="nav-label">Journal d'audit</span>
              </a>
            }

          } @else {

            <!-- ── Mode réduit : icônes plates ── -->
            <a class="nav-item" routerLink="/operations" routerLinkActive="active" matTooltip="Opérations" matTooltipPosition="right"><mat-icon class="nav-icon">swap_vert</mat-icon></a>
            <a class="nav-item" routerLink="/journal" routerLinkActive="active" matTooltip="Journal" matTooltipPosition="right"><mat-icon class="nav-icon">receipt_long</mat-icon></a>
            <a class="nav-item" routerLink="/journaux" routerLinkActive="active" matTooltip="Journaux" matTooltipPosition="right"><mat-icon class="nav-icon">import_contacts</mat-icon></a>
            <a class="nav-item" routerLink="/periode-locks" routerLinkActive="active" matTooltip="Verrouillage" matTooltipPosition="right"><mat-icon class="nav-icon">lock_clock</mat-icon></a>
            @if (canSeeFiscalYears()) {
            <a class="nav-item" routerLink="/fiscal-years" routerLinkActive="active" matTooltip="Exercices fiscaux" matTooltipPosition="right"><mat-icon class="nav-icon">calendar_today</mat-icon></a>
            }
            <div class="nav-divider"></div>
            <a class="nav-item" routerLink="/accounts" routerLinkActive="active" matTooltip="Comptes" matTooltipPosition="right"><mat-icon class="nav-icon">account_balance_wallet</mat-icon></a>
            <a class="nav-item" routerLink="/tiers" routerLinkActive="active" matTooltip="Tiers" matTooltipPosition="right"><mat-icon class="nav-icon">contacts</mat-icon></a>
            <a class="nav-item" routerLink="/factures" routerLinkActive="active" matTooltip="Factures" matTooltipPosition="right"><mat-icon class="nav-icon">description</mat-icon></a>
            <a class="nav-item" routerLink="/rapprochement" routerLinkActive="active" matTooltip="Rapprochement" matTooltipPosition="right"><mat-icon class="nav-icon">account_balance</mat-icon></a>
            @if (canSeeRapports()) {
            <div class="nav-divider"></div>
            <a class="nav-item" routerLink="/stats" routerLinkActive="active" matTooltip="Statistiques" matTooltipPosition="right"><mat-icon class="nav-icon">bar_chart</mat-icon></a>
            <a class="nav-item" routerLink="/rapports" routerLinkActive="active" matTooltip="Rapports" matTooltipPosition="right"><mat-icon class="nav-icon">summarize</mat-icon></a>
            <a class="nav-item" routerLink="/tva" routerLinkActive="active" matTooltip="TVA / CA3" matTooltipPosition="right"><mat-icon class="nav-icon">receipt</mat-icon></a>
            <a class="nav-item" routerLink="/taux-change" routerLinkActive="active" matTooltip="Taux de change" matTooltipPosition="right"><mat-icon class="nav-icon">currency_exchange</mat-icon></a>
            }
            <div class="nav-divider"></div>
            <a class="nav-item" routerLink="/evenements" routerLinkActive="active" matTooltip="Événements" matTooltipPosition="right"><mat-icon class="nav-icon">calendar_month</mat-icon></a>
            <a class="nav-item" routerLink="/budget" routerLinkActive="active" matTooltip="Budget" matTooltipPosition="right"><mat-icon class="nav-icon">savings</mat-icon></a>
            <a class="nav-item" routerLink="/objectifs" routerLinkActive="active" matTooltip="Objectifs" matTooltipPosition="right"><mat-icon class="nav-icon">flag</mat-icon></a>
            <a class="nav-item nav-item-alert" routerLink="/alertes" routerLinkActive="active" matTooltip="Alertes" matTooltipPosition="right"><mat-icon class="nav-icon">notifications_active</mat-icon></a>
            @if (isAdmin()) {
            <div class="nav-divider"></div>
            <a class="nav-item nav-item-admin" routerLink="/audit-log" routerLinkActive="active" matTooltip="Journal d'audit" matTooltipPosition="right"><mat-icon class="nav-icon">history</mat-icon></a>
            }

          }

        </nav>

        <div class="sidebar-spacer"></div>

        <!-- Lien Profil + Utilisateurs (admin) + Paramètres + Tutoriels -->
        <div class="sidebar-tuto-wrap">
          <a class="nav-item nav-item-tuto" routerLink="/profile" routerLinkActive="active"
            [matTooltip]="collapsed() ? 'Mon profil' : ''" matTooltipPosition="right">
            <mat-icon class="nav-icon">account_circle</mat-icon>
            @if (!collapsed()) { <span class="nav-label">Mon profil</span> }
          </a>
          @if (isAdmin()) {
            <a class="nav-item nav-item-tuto" routerLink="/users" routerLinkActive="active"
              [matTooltip]="collapsed() ? 'Utilisateurs' : ''" matTooltipPosition="right">
              <mat-icon class="nav-icon">manage_accounts</mat-icon>
              @if (!collapsed()) { <span class="nav-label">Utilisateurs</span> }
            </a>
          }
          <a class="nav-item nav-item-tuto" routerLink="/settings" routerLinkActive="active"
            [matTooltip]="collapsed() ? 'Paramètres' : ''" matTooltipPosition="right">
            <mat-icon class="nav-icon">settings</mat-icon>
            @if (!collapsed()) { <span class="nav-label">Paramètres</span> }
          </a>
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
              <span class="user-role">{{ roleLabel() }}</span>
            </div>
            <button mat-icon-button class="logout-btn" (click)="logout()"
              aria-label="Se déconnecter"
              matTooltip="Déconnexion" matTooltipPosition="right">
              <mat-icon aria-hidden="true">logout</mat-icon>
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
                #searchInput
                class="search-input"
                type="search"
                placeholder="Rechercher un compte, une opération, un événement…"
                aria-label="Rechercher dans l'application"
                [attr.aria-expanded]="searchFocused() && searchResults().length > 0"
                aria-autocomplete="list"
                aria-haspopup="listbox"
                [(ngModel)]="searchQuery"
                (input)="onSearch()"
                (focus)="searchFocused.set(true)"
                (keydown.escape)="closeSearch()"
              />
              @if (searchQuery) {
                <button class="search-clear" aria-label="Effacer la recherche" (click)="clearSearch()">
                  <mat-icon aria-hidden="true">close</mat-icon>
                </button>
              }
            </div>

            <!-- Résultats dropdown -->
            @if (searchFocused() && searchResults().length > 0) {
              <div class="search-dropdown" role="listbox" aria-label="Résultats de recherche">
                @for (result of searchResults(); track result.label + result.type) {
                  <a class="search-result-item" [routerLink]="result.link"
                     role="option" [attr.aria-label]="result.label + ' — ' + result.sub"
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

        <main id="main-content" class="content" tabindex="-1">
          <app-alert></app-alert>
          <router-outlet></router-outlet>
        </main>
      </div>

    </div>

    @if (shortcuts.helpVisible()) {
      <app-keyboard-shortcuts-help (close)="shortcuts.helpVisible.set(false)" />
    }
  `,
  styles: [`
    /* ── Skip link (RGAA 12.6) ── */
    .skip-link {
      position: absolute; left: -10000px; top: 0;
      width: 1px; height: 1px; overflow: hidden;
      background: #0d47a1; color: white; font-weight: 700; font-size: 14px;
      padding: 8px 20px; border-radius: 6px; text-decoration: none; z-index: 10000;
    }
    .skip-link:focus-visible {
      position: fixed; left: 8px; top: 8px;
      width: auto; height: auto;
      outline: 3px solid white; outline-offset: 2px;
    }

    /* ── Global focus indicator (RGAA 10.7) ── */
    :focus-visible { outline: 2px solid #1565c0; outline-offset: 2px; }

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
    .nav-item-admin.active {
      background: rgba(251,191,36,.15) !important;
      color: #fbbf24 !important;
      border-left-color: #f59e0b !important;
    }

    /* ── Groups ── */
    .nav-group-header {
      display: flex; align-items: center; gap: 12px;
      width: 100%; padding: 9px 12px;
      border: none; border-radius: 10px; background: transparent;
      color: rgba(255,255,255,.55); font-size: 14px; font-weight: 600;
      cursor: pointer; text-align: left; white-space: nowrap;
      border-left: 3px solid transparent;
      transition: background .15s, color .15s;
      &:hover { background: rgba(255,255,255,.08); color: rgba(255,255,255,.88); }
      &.open { color: rgba(255,255,255,.88); }
    }
    .nav-chevron {
      font-size: 18px; width: 18px; height: 18px;
      margin-left: auto; flex-shrink: 0; opacity: .55;
      transition: transform .2s;
    }
    .nav-group-header.open .nav-chevron { opacity: .88; }

    .nav-group-items {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows .22s ease;
      overflow: hidden;
      &.open { grid-template-rows: 1fr; }
    }
    .nav-group-items > div { min-height: 0; }

    .nav-sub-item {
      padding-left: 28px !important;
      font-size: 13px !important;
      font-weight: 400 !important;
      color: rgba(255,255,255,.45) !important;
      &:hover { color: rgba(255,255,255,.82) !important; }
      &.active {
        color: #90caf9 !important;
        background: rgba(21,101,192,.32) !important;
        border-left-color: #42a5f5 !important;
      }
    }

    /* ── Spacer ── */
    .sidebar-spacer { flex: 1; }

    /* ── Tutoriels ── */
    .sidebar-tuto-wrap {
      padding: 0 8px 8px;
      border-bottom: 1px solid rgba(255,255,255,.08);
      display: flex;
      flex-direction: column;
      gap: 6px;
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
      min-height: 0;
      background: #f0f4f8;
      overflow-y: auto;
      padding: 32px;
      min-width: 0;
      display: flex;
      flex-direction: column;
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
  readonly auth      = inject(AuthService);
  readonly shortcuts = inject(KeyboardShortcutsService);
  private readonly router           = inject(Router);
  private readonly accountService   = inject(AccountService);
  private readonly operationService = inject(OperationService);
  private readonly evenementService = inject(EvenementService);

  @ViewChild('searchInput') private readonly searchInputRef!: ElementRef<HTMLInputElement>;

  constructor() {
    this.shortcuts.focusSearch$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.searchFocused.set(true);
      setTimeout(() => this.searchInputRef?.nativeElement.focus());
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    this.shortcuts.handleKeyDown(event);
  }

  collapsed = signal(false);

  isAdmin            = computed(() => this.auth.currentUser()?.role === 'ADMIN');
  canSeeRapports     = computed(() => this.auth.currentUser()?.role !== 'ASSISTANT');
  canSeeFiscalYears  = computed(() => ['ADMIN', 'DAF', 'CHEF_COMPTABLE'].includes(this.auth.currentUser()?.role ?? ''));
  roleLabel     = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role ? (ROLE_LABELS[role] ?? role) : 'Utilisateur';
  });

  openGroups = signal<Record<string, boolean>>({
    compta: true,
    tiers: false,
    analyse: false,
    planif: false,
  });

  toggleGroup(group: string): void {
    this.openGroups.update(g => {
      const isOpen = g[group];
      const allClosed = Object.fromEntries(Object.keys(g).map(k => [k, false]));
      return { ...allClosed, [group]: !isOpen };
    });
  }

  // Search state
  searchQuery   = '';
  searchFocused = signal(false);
  private allAccounts:   Account[]   = [];
  private allOperations: Operation[] = [];
  private allEvenements: Evenement[] = [];

  searchResults = signal<SearchResult[]>([]);

  ngOnInit(): void {
    if (!this.auth.currentUser()) return;
    this.accountService.getAll().subscribe({ next: list => this.allAccounts = list, error: () => {} });
    this.operationService.getAll().subscribe({ next: list => this.allOperations = list, error: () => {} });
    this.evenementService.getAll().subscribe({ next: list => this.allEvenements = list, error: () => {} });
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
