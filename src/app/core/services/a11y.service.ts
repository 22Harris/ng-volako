import { inject, Injectable } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class A11yService {
  private readonly announcer = inject(LiveAnnouncer);
  private readonly doc       = inject(DOCUMENT);

  announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): Promise<void> {
    return this.announcer.announce(message, politeness);
  }

  announceSuccess(message: string): Promise<void> {
    return this.announcer.announce(message, 'polite');
  }

  announceError(message: string): Promise<void> {
    return this.announcer.announce(message, 'assertive');
  }

  announceNavigation(pageName: string): Promise<void> {
    return this.announcer.announce(`Navigation vers ${pageName}`, 'polite');
  }

  announceCount(count: number, label: string): Promise<void> {
    return this.announcer.announce(`${count} ${label}`, 'polite');
  }

  moveFocus(selector: string): boolean {
    if (!selector) return false;
    try {
      const el = this.doc.querySelector<HTMLElement>(selector);
      if (el != null) {
        el.focus();
        return true;
      }
    } catch {
      // invalid selector syntax
    }
    return false;
  }

  clearAnnouncement(): void {
    this.announcer.clear();
  }
}
