import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule],
  template: `
    @if (totalPages() > 0) {
      <div class="pagination">
        <span class="pag-info">
          {{ rangeStart() }}–{{ rangeEnd() }} sur {{ total() }}
        </span>
        <div class="pag-controls">
          <select class="pag-size-select" [value]="pageSize()" (change)="onSizeChange($event)">
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
          <button class="pag-btn" (click)="pageChange.emit(1)" [disabled]="page() === 1" matTooltip="Première page">
            <mat-icon>first_page</mat-icon>
          </button>
          <button class="pag-btn" (click)="pageChange.emit(page() - 1)" [disabled]="page() === 1" matTooltip="Précédent">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <span class="pag-page">{{ page() }} / {{ totalPages() }}</span>
          <button class="pag-btn" (click)="pageChange.emit(page() + 1)" [disabled]="page() >= totalPages()" matTooltip="Suivant">
            <mat-icon>chevron_right</mat-icon>
          </button>
          <button class="pag-btn" (click)="pageChange.emit(totalPages())" [disabled]="page() >= totalPages()" matTooltip="Dernière page">
            <mat-icon>last_page</mat-icon>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px 0;
    }
    .pag-info { font-size: 13px; color: var(--clr-text-secondary); }
    .pag-controls { display: flex; align-items: center; gap: 4px; }
    .pag-size-select {
      font-size: 12px;
      border: 1px solid var(--clr-border);
      border-radius: 6px;
      padding: 4px 8px;
      background: var(--clr-surface);
      color: var(--clr-text-primary);
      cursor: pointer;
      margin-right: 8px;
    }
    .pag-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 1px solid var(--clr-border);
      border-radius: 6px;
      background: var(--clr-surface);
      color: var(--clr-text-primary);
      cursor: pointer;
      transition: background 0.15s;
    }
    .pag-btn:hover:not(:disabled) { background: var(--clr-hover); }
    .pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .pag-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .pag-page { font-size: 12px; font-weight: 700; color: var(--clr-text-primary); padding: 0 10px; white-space: nowrap; }
  `],
})
export class PaginationComponent {
  page = input.required<number>();
  pageSize = input.required<number>();
  total = input.required<number>();
  totalPages = input.required<number>();

  pageChange = output<number>();
  pageSizeChange = output<number>();

  rangeStart() { return this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1; }
  rangeEnd()   { return Math.min(this.page() * this.pageSize(), this.total()); }

  onSizeChange(event: Event) {
    this.pageSizeChange.emit(Number((event.target as HTMLSelectElement).value));
  }
}
