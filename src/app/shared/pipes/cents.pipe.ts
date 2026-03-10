import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'cents', standalone: true })
export class CentsPipe implements PipeTransform {
  transform(value: number, currency = 'Ar'): string {
    const abs = Math.abs(value);
    const formatted = abs.toString().replaceAll(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${value < 0 ? '-' : ''}${formatted} ${currency}`;
  }
}
