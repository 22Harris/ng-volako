import { Routes } from '@angular/router';

export const tauxChangeRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./taux-change.component').then((m) => m.TauxChangeComponent),
  },
];
