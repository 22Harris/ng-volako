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
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
