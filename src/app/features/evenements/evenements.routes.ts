import { Routes } from '@angular/router';

export const evenementRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./evenement-list/evenement-list.component').then(m => m.EvenementListComponent),
  },
];
