import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';

export const auditLogRoutes: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./audit-log.component').then(m => m.AuditLogComponent),
  },
];
