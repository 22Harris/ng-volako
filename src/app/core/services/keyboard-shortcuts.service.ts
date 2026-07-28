import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

export interface ShortcutDef {
  keys: string;
  description: string;
  category: string;
}

const NAV_MAP: Record<string, string> = {
  d: '/dashboard',
  j: '/journal',
  o: '/operations',
  f: '/factures',
  t: '/tiers',
  r: '/rapports',
  b: '/budget',
  a: '/accounts',
  e: '/evenements',
  v: '/tva',
};

@Injectable({ providedIn: 'root' })
export class KeyboardShortcutsService {
  private readonly router = inject(Router);

  readonly helpVisible = signal(false);

  // Emits when the user presses Ctrl+K — AppShell listens and focuses the search box
  readonly focusSearch$ = new Subject<void>();

  readonly shortcuts: ShortcutDef[] = [
    { keys: 'G + D', description: 'Tableau de bord',    category: 'Navigation' },
    { keys: 'G + J', description: 'Journal comptable',  category: 'Navigation' },
    { keys: 'G + O', description: 'Opérations',         category: 'Navigation' },
    { keys: 'G + F', description: 'Factures',           category: 'Navigation' },
    { keys: 'G + T', description: 'Tiers',              category: 'Navigation' },
    { keys: 'G + R', description: 'Rapports',           category: 'Navigation' },
    { keys: 'G + B', description: 'Budget',             category: 'Navigation' },
    { keys: 'G + A', description: 'Plan comptable',     category: 'Navigation' },
    { keys: 'G + E', description: 'Événements',         category: 'Navigation' },
    { keys: 'G + V', description: 'Déclaration TVA',    category: 'Navigation' },
    { keys: 'Ctrl + K', description: 'Recherche rapide', category: 'Actions' },
    { keys: '?',        description: 'Aide raccourcis',   category: 'Aide' },
    { keys: 'Esc',      description: 'Fermer le panneau', category: 'Aide' },
  ];

  private gPressed = false;
  private gTimer: ReturnType<typeof setTimeout> | null = null;

  handleKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const isEditable = target != null && (
      ['input', 'textarea', 'select'].includes(target.tagName.toLowerCase()) ||
      target.isContentEditable
    );

    // Escape — always close help regardless of focus
    if (event.key === 'Escape') {
      this.helpVisible.set(false);
      this.clearGChord();
      return;
    }

    // Block G-chord and shortcuts while typing (except Escape above)
    if (isEditable) {
      this.clearGChord();
      return;
    }

    // ? — toggle help panel
    if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.helpVisible.set(!this.helpVisible());
      return;
    }

    // Ctrl/Cmd + K — focus search
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.focusSearch$.next();
      return;
    }

    // Resolve pending G-chord
    if (this.gPressed) {
      this.clearGChord();
      const dest = NAV_MAP[event.key.toLowerCase()];
      if (dest) this.router.navigate([dest]);
      return;
    }

    // Start G-chord (800 ms window)
    if (!event.ctrlKey && !event.metaKey && !event.altKey &&
        (event.key === 'g' || event.key === 'G')) {
      this.gPressed = true;
      this.gTimer = setTimeout(() => this.clearGChord(), 800);
    }
  }

  private clearGChord(): void {
    this.gPressed = false;
    if (this.gTimer !== null) {
      clearTimeout(this.gTimer);
      this.gTimer = null;
    }
  }
}
