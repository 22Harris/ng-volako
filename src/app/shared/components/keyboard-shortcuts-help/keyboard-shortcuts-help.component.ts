import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { KeyboardShortcutsService, ShortcutDef } from '../../../core/services/keyboard-shortcuts.service';

@Component({
  selector: 'app-keyboard-shortcuts-help',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="ks-backdrop" (click)="close.emit()">
      <div class="ks-panel" (click)="$event.stopPropagation()" role="dialog" aria-modal="true"
           aria-label="Raccourcis clavier">

        <div class="ks-header">
          <mat-icon class="ks-header-icon">keyboard</mat-icon>
          <span class="ks-title">Raccourcis clavier</span>
          <button mat-icon-button class="ks-close" (click)="close.emit()" aria-label="Fermer">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        @for (cat of categories; track cat) {
          <div class="ks-category">
            <p class="ks-cat-label">{{ cat }}</p>
            @for (s of byCategory(cat); track s.keys) {
              <div class="ks-row">
                <span class="ks-desc">{{ s.description }}</span>
                <span class="ks-keys">
                  @for (part of s.keys.split(' + '); track part; let last = $last) {
                    <kbd class="ks-kbd">{{ part }}</kbd>
                    @if (!last) { <span class="ks-plus">+</span> }
                  }
                </span>
              </div>
            }
          </div>
        }

        <p class="ks-hint">Appuyez sur <kbd class="ks-kbd">?</kbd> pour ouvrir / fermer ce panneau.</p>
      </div>
    </div>
  `,
  styles: [`
    .ks-backdrop {
      position: fixed; inset: 0;
      background: rgba(0, 0, 0, .55);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
      animation: ks-fade-in .15s ease;
    }
    @keyframes ks-fade-in { from { opacity: 0 } to { opacity: 1 } }

    .ks-panel {
      background: var(--clr-surface, #1e2230);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 12px;
      padding: 24px 28px 20px;
      width: min(520px, 92vw);
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,.5);
    }

    .ks-header {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 20px;
    }
    .ks-header-icon { color: var(--clr-primary, #90caf9); }
    .ks-title { font-size: 16px; font-weight: 600; color: #fff; flex: 1; }
    .ks-close { margin-left: auto; color: rgba(255,255,255,.5); }

    .ks-category { margin-bottom: 18px; }
    .ks-cat-label {
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: .08em; color: rgba(255,255,255,.4);
      margin: 0 0 8px;
    }

    .ks-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,.05);
    }
    .ks-row:last-child { border-bottom: none; }

    .ks-desc { font-size: 14px; color: rgba(255,255,255,.8); }

    .ks-keys { display: flex; align-items: center; gap: 4px; }
    .ks-kbd {
      display: inline-block;
      background: rgba(255,255,255,.1);
      border: 1px solid rgba(255,255,255,.2);
      border-radius: 5px;
      padding: 2px 7px;
      font-size: 12px; font-family: monospace;
      color: rgba(255,255,255,.85);
      line-height: 1.5;
    }
    .ks-plus { font-size: 12px; color: rgba(255,255,255,.4); }

    .ks-hint {
      margin-top: 16px; font-size: 12px; color: rgba(255,255,255,.35);
      text-align: center;
    }
  `],
})
export class KeyboardShortcutsHelpComponent {
  private readonly svc = inject(KeyboardShortcutsService);
  readonly close = output<void>();

  get categories(): string[] {
    return [...new Set(this.svc.shortcuts.map(s => s.category))];
  }

  byCategory(cat: string): ShortcutDef[] {
    return this.svc.shortcuts.filter(s => s.category === cat);
  }
}
