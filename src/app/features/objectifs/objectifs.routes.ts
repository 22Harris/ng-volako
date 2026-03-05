import { Routes } from '@angular/router';

export const objectifsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./objectifs.component').then((m) => m.ObjectifsComponent),
  },
];
