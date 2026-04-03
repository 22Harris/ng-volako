import { Pipe, PipeTransform, inject } from '@angular/core';
import { SettingsService } from '../../core/services/settings.service';

@Pipe({ name: 'cents', standalone: true, pure: false })
export class CentsPipe implements PipeTransform {
  private readonly settings = inject(SettingsService);

  transform(value: number, currency?: string): string {
    const sym = currency ?? this.settings.currencySymbol();
    const abs = Math.abs(value);
    const formatted = abs.toString().replaceAll(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${value < 0 ? '-' : ''}${formatted} ${sym}`;
  }
}
