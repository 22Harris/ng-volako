import { Routes } from '@angular/router';

export const journalRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./journal-list/journal-list.component').then(m => m.JournalListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./journal-entry-form/journal-entry-form.component').then(m => m.JournalEntryFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./journal-entry-detail/journal-entry-detail.component').then(m => m.JournalEntryDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./journal-entry-form/journal-entry-form.component').then(m => m.JournalEntryFormComponent)
  },
];
