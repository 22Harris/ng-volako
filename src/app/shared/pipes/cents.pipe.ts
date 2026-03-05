import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'cents', standalone: true })
export class CentsPipe implements PipeTransform {
  transform(value: number, currency = 'Ar'): string {
    const rounded = Math.round(value / 100);
    const abs = Math.abs(rounded);
    const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${rounded < 0 ? '-' : ''}${formatted} ${currency}`;
  }
}
