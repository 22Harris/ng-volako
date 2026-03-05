import { Routes } from '@angular/router';

export const alertesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./alertes.component').then((m) => m.AlertesComponent),
  },
];
