import { Routes } from '@angular/router';

export const operationRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./operation-list/operation-list.component').then(m => m.OperationListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./operation-detail/operation-detail.component').then(m => m.OperationDetailComponent)
  },
];
