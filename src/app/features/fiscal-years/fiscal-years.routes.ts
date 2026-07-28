import { Routes } from '@angular/router';

export const fiscalYearsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./fiscal-years.component').then(m => m.FiscalYearsComponent),
  },
];
