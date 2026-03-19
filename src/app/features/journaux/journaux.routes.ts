import { Routes } from '@angular/router';

export const JOURNAUX_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./journaux.component').then((m) => m.JournauxComponent),
  },
];
