import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AppShellComponent } from './shared/components/app-shell/app-shell.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((r) => r.authRoutes),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((r) => r.dashboardRoutes),
      },
      {
        path: 'accounts',
        loadChildren: () =>
          import('./features/accounts/accounts.routes').then((r) => r.accountRoutes),
      },
      {
        path: 'journal',
        loadChildren: () =>
          import('./features/journal/journal.routes').then((r) => r.journalRoutes),
      },
      {
        path: 'operations',
        loadChildren: () =>
          import('./features/operations/operations.routes').then((r) => r.operationRoutes),
      },
      {
        path: 'evenements',
        loadChildren: () =>
          import('./features/evenements/evenements.routes').then((r) => r.evenementRoutes),
      },
      {
        path: 'stats',
        loadComponent: () =>
          import('./features/stats/stats.component').then((m) => m.StatsComponent),
      },
      {
        path: 'rapports',
        loadChildren: () =>
          import('./features/rapports/rapports.routes').then((r) => r.rapportsRoutes),
      },
      {
        path: 'budget',
        loadChildren: () => import('./features/budget/budget.routes').then((r) => r.budgetRoutes),
      },
      {
        path: 'alertes',
        loadChildren: () =>
          import('./features/alertes/alertes.routes').then((r) => r.alertesRoutes),
      },
      {
        path: 'objectifs',
        loadChildren: () =>
          import('./features/objectifs/objectifs.routes').then((r) => r.objectifsRoutes),
      },
      {
        path: 'tutoriels',
        loadChildren: () =>
          import('./features/tutoriels/tutoriels.routes').then((r) => r.tutorielsRoutes),
      },
      {
        path: 'tiers',
        loadChildren: () =>
          import('./features/tiers/tiers.routes').then((r) => r.tiersRoutes),
      },
      {
        path: 'factures',
        loadChildren: () =>
          import('./features/factures/factures.routes').then((r) => r.facturesRoutes),
      },
      {
        path: 'journaux',
        loadComponent: () =>
          import('./features/journaux/journaux.component').then((m) => m.JournauxComponent),
      },
      {
        path: 'periode-locks',
        loadComponent: () =>
          import('./features/periode-locks/periode-locks.component').then((m) => m.PeriodeLocksComponent),
      },
      {
        path: 'tva',
        loadComponent: () =>
          import('./features/tva/tva-declaration/tva-declaration.component').then((m) => m.TvaDeclarationComponent),
      },
      {
        path: 'rapprochement',
        loadChildren: () =>
          import('./features/rapprochement/rapprochement.routes').then((r) => r.rapprochementRoutes),
      },
      {
        path: 'taux-change',
        loadChildren: () =>
          import('./features/taux-change/taux-change.routes').then((r) => r.tauxChangeRoutes),
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./features/users/users.routes').then((r) => r.usersRoutes),
      },
      {
        path: 'fiscal-years',
        loadChildren: () =>
          import('./features/fiscal-years/fiscal-years.routes').then((r) => r.fiscalYearsRoutes),
      },
      {
        path: 'audit-log',
        loadChildren: () =>
          import('./features/audit-log/audit-log.routes').then((r) => r.auditLogRoutes),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./features/profile/profile.routes').then((r) => r.profileRoutes),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./features/settings/settings.routes').then((r) => r.settingsRoutes),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
