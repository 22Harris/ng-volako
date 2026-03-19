import { Routes } from '@angular/router';

export const rapprochementRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./rapprochement.component').then((m) => m.RapprochementComponent),
  },
];
