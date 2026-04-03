import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SettingsService, CURRENCY_OPTIONS } from '../../core/services/settings.service';
import { AlertService } from '../../shared/components/alert/alert.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="page">

      <div class="page-header">
        <div>
          <h1 class="page-title">
            <span class="title-icon">⚙️</span>
            Paramètres
          </h1>
          <p class="page-sub">Configuration de l'affichage de l'application</p>
        </div>
      </div>

      <!-- Devise d'affichage -->
      <div class="card">
        <h3 class="section-title">
          <mat-icon>payments</mat-icon>
          Devise d'affichage
        </h3>
        <p class="section-sub">
          Choisissez l'unité monétaire affichée dans toute l'interface.
          Ce paramètre est enregistré localement sur cet appareil.
        </p>

        <div class="currency-grid">
          @for (opt of options; track opt.code) {
            <div class="currency-card"
              [class.active]="settings.currencyCode() === opt.code"
              (click)="select(opt.code)"
              role="button"
              [attr.aria-pressed]="settings.currencyCode() === opt.code">
              <div class="card-top">
                <span class="flag">{{ opt.flag }}</span>
                @if (settings.currencyCode() === opt.code) {
                  <mat-icon class="check">check_circle</mat-icon>
                }
              </div>
              <div class="card-body">
                <span class="code">{{ opt.code }}</span>
                <span class="symbol">{{ opt.symbol }}</span>
                <span class="name">{{ opt.name }}</span>
              </div>
              <div class="card-example">
                <span>ex : {{ opt.example }}</span>
              </div>
            </div>
          }
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 20px; }

    .page-header { display: flex; align-items: flex-start; }
    .page-title {
      display: flex; align-items: center; gap: 10px;
      font-size: 24px; font-weight: 800; color: var(--clr-text-primary); margin: 0 0 4px;
    }
    .title-icon { font-size: 22px; }
    .page-sub { font-size: 13px; color: var(--clr-text-secondary); margin: 0; }

    .card {
      background: var(--clr-card-bg);
      border-radius: 16px;
      padding: 24px 28px;
      box-shadow: 0 2px 12px rgba(13,27,42,.07);
    }

    .section-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 16px; font-weight: 700; color: var(--clr-text-primary); margin: 0 0 6px;
      mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--clr-primary); }
    }
    .section-sub {
      font-size: 13px; color: var(--clr-text-secondary); margin: 0 0 24px;
    }

    /* Grille de cartes devises */
    .currency-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
    }

    .currency-card {
      display: flex; flex-direction: column; gap: 8px;
      padding: 16px; border-radius: 12px;
      border: 2px solid var(--clr-border);
      background: var(--clr-page-bg);
      cursor: pointer;
      transition: border-color .15s, background .15s, transform .1s;

      &:hover { border-color: var(--clr-primary); background: var(--clr-primary-light); }
      &:active { transform: scale(.98); }

      &.active {
        border-color: var(--clr-primary);
        background: var(--clr-primary-light);
        box-shadow: 0 0 0 3px rgba(21,101,192,.12);
      }
    }

    .card-top {
      display: flex; align-items: center; justify-content: space-between;
    }
    .flag { font-size: 28px; line-height: 1; }
    .check { font-size: 18px; width: 18px; height: 18px; color: var(--clr-primary); }

    .card-body {
      display: flex; flex-direction: column; gap: 2px;
    }
    .code { font-size: 15px; font-weight: 800; color: var(--clr-text-primary); }
    .symbol {
      font-size: 13px; font-weight: 600; color: var(--clr-primary);
      background: var(--clr-primary-light); border-radius: 6px;
      padding: 1px 6px; display: inline-block; width: fit-content;
      .active & { background: white; }
    }
    .name { font-size: 11px; color: var(--clr-text-secondary); margin-top: 2px; }

    .card-example {
      font-size: 11px; color: var(--clr-text-secondary);
      border-top: 1px solid var(--clr-border); padding-top: 8px; margin-top: 2px;
      font-variant-numeric: tabular-nums;
    }
  `],
})
export class SettingsComponent {
  readonly settings = inject(SettingsService);
  readonly options = CURRENCY_OPTIONS;
  private readonly alert = inject(AlertService);

  select(code: string): void {
    if (this.settings.currencyCode() === code) return;
    this.settings.setCurrency(code);
    const opt = this.options.find((o) => o.code === code);
    if (opt) {
      this.alert.success(`Devise mise à jour : ${opt.name} (${opt.symbol})`);
    }
  }
}
