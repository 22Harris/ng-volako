import { Routes } from '@angular/router';

export const facturesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./facture-list/facture-list.component').then(m => m.FactureListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./facture-detail/facture-detail.component').then(m => m.FactureDetailComponent),
  },
];
