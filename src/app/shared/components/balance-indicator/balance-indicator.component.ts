import { Component, Input, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CentsPipe } from '../../pipes/cents.pipe';

@Component({
  selector: 'app-balance-indicator',
  standalone: true,
  imports: [CommonModule, CentsPipe],
  template: `
    <div class="balance-indicator" [class.balance-ok]="isBalanced()" [class.balance-error]="!isBalanced()">
      <span>Débit : {{ totalDebit | cents }}</span>
      <span>|</span>
      <span>Crédit : {{ totalCredit | cents }}</span>
      <span>|</span>
      <span>Δ : {{ delta() | cents }}</span>
      <span class="badge" [class.badge-green]="isBalanced()" [class.badge-red]="!isBalanced()">
        {{ isBalanced() ? 'Équilibré' : 'Déséquilibré' }}
      </span>
    </div>
  `,
  styles: [`
    .balance-indicator {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
    }
    .balance-ok    { background: #e8f5e9; color: #2e7d32; }
    .balance-error { background: #ffebee; color: #c62828; }
  `]
})
export class BalanceIndicatorComponent {
  @Input() totalDebit  = 0;
  @Input() totalCredit = 0;

  isBalanced = computed(() => this.totalDebit === this.totalCredit);
  delta      = computed(() => Math.abs(this.totalDebit - this.totalCredit));
}
