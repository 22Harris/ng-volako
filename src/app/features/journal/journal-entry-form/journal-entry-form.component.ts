import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AppDateInputComponent } from '../../../shared/components/date-input/date-input.component';
import { JournalEntryService } from '../../../core/services/journal-entry.service';
import { OperationService } from '../../../core/services/operation.service';
import { AlertService } from '../../../shared/components/alert/alert.service';
import { AccountSelectComponent } from '../../../shared/components/account-select/account-select.component';
import { BalanceIndicatorComponent } from '../../../shared/components/balance-indicator/balance-indicator.component';
import { balancedEntryValidator, singleSideValidator } from '../../operations/operation-form/operation-form.service';
import { Operation } from '../../../core/models/operation.model';

@Component({
  selector: 'app-journal-entry-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSelectModule,
    MatTooltipModule, MatProgressSpinnerModule,
    AccountSelectComponent, BalanceIndicatorComponent,
    AppDateInputComponent,
  ],
  template: `
    <div class="page-header">
      <h1>{{ isEditMode() ? 'Modifier l\'écriture' : 'Nouvelle écriture' }}</h1>
    </div>

    <mat-card>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="row-3">
            <div class="date-outline-field"
              [class.has-error]="form.get('date')?.invalid && form.get('date')?.touched">
              <label class="date-outline-label">Date</label>
              <mat-icon class="date-outline-icon">calendar_today</mat-icon>
              <app-date-input formControlName="date"></app-date-input>
            </div>
            <mat-form-field appearance="outline">
              <mat-label>Libellé</mat-label>
              <input matInput formControlName="label" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Opération associée (optionnel)</mat-label>
              <mat-select formControlName="operationId">
                <mat-option [value]="null">Aucune</mat-option>
                @for (op of operations(); track op.id) {
                  <mat-option [value]="op.id">{{ op.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          @for (lineCtrl of lines.controls; track lineCtrl; let li = $index) {
            <div class="line-row" [formGroup]="asFormGroup(lineCtrl)">
              <mat-form-field appearance="outline" class="account-field">
                <mat-label>Compte</mat-label>
                <app-account-select formControlName="accountId"></app-account-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Débit (Ar)</mat-label>
                <input matInput type="number" min="0" step="0.01" formControlName="debit" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Crédit (Ar)</mat-label>
                <input matInput type="number" min="0" step="0.01" formControlName="credit" />
              </mat-form-field>
              <button mat-icon-button color="warn" type="button"
                (click)="removeLine(li)" [disabled]="lines.length <= 2">
                <mat-icon>remove_circle_outline</mat-icon>
              </button>
            </div>
          }

          <app-balance-indicator [totalDebit]="totalDebit()" [totalCredit]="totalCredit()">
          </app-balance-indicator>

          <button mat-stroked-button type="button" (click)="addLine()" class="add-line-btn">
            <mat-icon>add</mat-icon> Ajouter une ligne
          </button>

          <div class="form-actions">
            <button mat-button type="button" routerLink="/journal">Annuler</button>
            <button mat-flat-button color="primary" type="submit"
              [disabled]="form.invalid || saving()">
              @if (saving()) { <mat-spinner diameter="18"></mat-spinner> }
              @else { Enregistrer }
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { margin-bottom: 16px; }
    .row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .line-row { display: grid; grid-template-columns: 2fr 1fr 1fr 48px; gap: 8px; align-items: flex-start; margin-bottom: 8px; }
    .add-line-btn { margin: 8px 0 16px; }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; }

    /* ── Date field (mimics mat-form-field outline) ── */
    .date-outline-field {
      position: relative;
      display: flex; align-items: center; gap: 8px;
      height: 56px; padding: 0 12px;
      border: 1px solid rgba(0,0,0,.38); border-radius: 4px;
      background: white; cursor: pointer;
      transition: border-color .2s, border-width .1s;
      &:focus-within {
        border-color: #1565c0; border-width: 2px;
        .date-outline-label { color: #1565c0; }
      }
      &.has-error { border-color: #f44336; border-width: 2px;
        .date-outline-label { color: #f44336; }
      }
    }
    .date-outline-label {
      position: absolute; top: -9px; left: 8px;
      padding: 0 4px; background: white;
      font-size: 12px; color: rgba(0,0,0,.6);
      font-family: Roboto, sans-serif; line-height: 1;
      transition: color .2s;
    }
    .date-outline-icon {
      font-size: 18px; width: 18px; height: 18px;
      color: rgba(0,0,0,.54); flex-shrink: 0;
    }
  `]
})
export class JournalEntryFormComponent implements OnInit {
  private fb             = inject(FormBuilder);
  private journalService = inject(JournalEntryService);
  private opService      = inject(OperationService);
  private alertSvc       = inject(AlertService);
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);

  isEditMode = signal(false);
  saving     = signal(false);
  editId     = signal<number | null>(null);
  operations = signal<Operation[]>([]);

  form = this.fb.group({
    date:        ['', Validators.required],
    label:       ['', Validators.required],
    operationId: [null as number | null],
    lines:       this.fb.array([this.buildLine(), this.buildLine()]),
  }, { validators: balancedEntryValidator });

  get lines(): FormArray { return this.form.get('lines') as FormArray; }

  totalDebit  = () => this.lines.controls.reduce((s, l) => s + (+l.get('debit')?.value || 0), 0);
  totalCredit = () => this.lines.controls.reduce((s, l) => s + (+l.get('credit')?.value || 0), 0);

  ngOnInit(): void {
    this.opService.getAll().subscribe(ops => this.operations.set(ops));
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.editId.set(+id);
      this.journalService.getById(+id).subscribe(entry => {
        this.form.patchValue({ date: entry.date, label: entry.label, operationId: entry.operationId ?? null });
        while (this.lines.length) this.lines.removeAt(0);
        entry.lines.forEach(l => {
          const lg = this.buildLine();
          lg.patchValue({ accountId: l.accountId, debit: l.debit / 100, credit: l.credit / 100 });
          this.lines.push(lg);
        });
      });
    }
  }

  buildLine(): FormGroup {
    return this.fb.group({
      accountId: [null, Validators.required],
      debit:     [0],
      credit:    [0],
    }, { validators: singleSideValidator });
  }

  asFormGroup(ctrl: any): FormGroup { return ctrl as FormGroup; }
  addLine(): void { this.lines.push(this.buildLine()); }
  removeLine(i: number): void { this.lines.removeAt(i); }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const dto = {
      ...raw,
      operationId: raw.operationId ?? undefined,
      lines: raw.lines.map((l: any) => ({
        accountId: l.accountId,
        debit:     Math.round((+l.debit || 0) * 100),
        credit:    Math.round((+l.credit || 0) * 100),
      }))
    };

    const req$ = this.isEditMode()
      ? this.journalService.update(this.editId()!, dto as any)
      : this.journalService.create(dto as any);

    req$.subscribe({
      next: () => {
        this.alertSvc.success(this.isEditMode() ? 'Écriture modifiée' : 'Écriture créée');
        this.router.navigate(['/journal']);
      },
      error: () => {
        this.alertSvc.error('Erreur lors de l\'enregistrement');
        this.saving.set(false);
      }
    });
  }
}
