import { Routes } from '@angular/router';

export const rapportsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./rapports.component').then((m) => m.RapportsComponent),
  },
];
