import { Component, forwardRef, Output, EventEmitter } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-date-input',
  standalone: true,
  imports: [MatDatepickerModule, MatNativeDateModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppDateInputComponent),
      multi: true,
    },
  ],
  template: `
    <input
      [matDatepicker]="picker"
      [(ngModel)]="internalDate"
      (dateChange)="onDateChange($event)"
      (click)="picker.open()"
      (blur)="onTouched()"
      [disabled]="isDisabled"
      class="date-native"
      placeholder="jj/mm/aaaa"
      readonly
    />
    <mat-datepicker #picker panelClass="volako-datepicker"></mat-datepicker>
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      .date-native {
        flex: 1;
        border: none;
        background: transparent;
        outline: none;
        font-size: 14px;
        color: #0d1b2a;
        min-width: 0;
        cursor: pointer;
        &::placeholder {
          color: #b0bec5;
        }
        &:disabled {
          color: #90a4ae;
          cursor: not-allowed;
        }
      }

      /* Compact context: inside filter date-slot */
      :host-context(.date-slot) .date-native {
        font-size: 12px;
        font-weight: 500;
        padding: 0;
      }
    `,
  ],
})
export class AppDateInputComponent implements ControlValueAccessor {
  @Output() dateSelect = new EventEmitter<string | null>();

  internalDate: Date | null = null;
  isDisabled = false;

  private onChange: (v: string | null) => void = () => {};
  onTouched: () => void = () => {};

  onDateChange(event: MatDatepickerInputEvent<Date>): void {
    const date = event.value;
    this.internalDate = date;
    const iso = date ? this.toIso(date) : null;
    this.onChange(iso);
    this.dateSelect.emit(iso);
  }

  writeValue(value: string | null): void {
    this.internalDate = value ? new Date(value + 'T12:00:00') : null;
  }

  registerOnChange(fn: (v: string | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  private toIso(date: Date): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }
}
