import { Routes } from '@angular/router';

export const tutorielsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./tutoriels.component').then((m) => m.TutorielsComponent),
  },
];
