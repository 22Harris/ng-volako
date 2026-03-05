import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-currency-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyInputComponent),
      multi: true
    }
  ],
  template: `
    <input matInput type="number" min="0" step="0.01"
      [formControl]="displayCtrl"
      (blur)="onBlur()"
      (change)="onDisplayChange()" />
  `
})
export class CurrencyInputComponent implements ControlValueAccessor {
  @Input() placeholder = '0.00';

  displayCtrl = new FormControl<number | null>(null);

  onChange: (value: number) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(cents: number): void {
    this.displayCtrl.setValue(cents ? cents / 100 : null, { emitEvent: false });
  }

  registerOnChange(fn: (v: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.displayCtrl.disable() : this.displayCtrl.enable();
  }

  onDisplayChange(): void {
    const val = this.displayCtrl.value;
    this.onChange(val != null ? Math.round(val * 100) : 0);
  }

  onBlur(): void {
    this.onTouched();
  }
}
