import { Routes } from '@angular/router';

export const budgetRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./budget.component').then((m) => m.BudgetComponent),
  },
];
