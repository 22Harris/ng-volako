import { Component, forwardRef, Input, OnInit, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { AccountService } from '../../../core/services/account.service';
import { Account } from '../../../core/models/account.model';

@Component({
  selector: 'app-account-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AccountSelectComponent),
      multi: true,
    },
  ],
  template: `
    <mat-form-field [appearance]="appearance" class="account-select-field">
      <mat-label>{{ label }}</mat-label>
      <mat-select [formControl]="ctrl" (selectionChange)="onChange($event.value)" (blur)="onTouched()">
        <mat-option [value]="null">— Aucun compte —</mat-option>
        @for (account of accounts; track account.id) {
          <mat-option [value]="account.id">
            {{ account.code }} – {{ account.name }}
          </mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  styles: [`:host { display: block; } .account-select-field { width: 100%; }`],
})
export class AccountSelectComponent implements ControlValueAccessor, OnInit {
  @Input() label = 'Compte';
  @Input() appearance: 'outline' | 'fill' = 'outline';

  private accountService = inject(AccountService);
  accounts: Account[] = [];
  ctrl = new FormControl<number | null>(null);

  onChange: (value: number | null) => void = () => {};
  onTouched: () => void = () => {};

  ngOnInit(): void {
    this.accountService.getAll().subscribe((list) => (this.accounts = list));
  }

  writeValue(value: number | null): void {
    this.ctrl.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: (v: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.ctrl.disable() : this.ctrl.enable();
  }
}
