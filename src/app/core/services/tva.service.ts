import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LigneTvaCollectee {
  codeTva: string;
  taux: number;
  label: string;
  baseHt: number;
  tvaBrute: number;
}

export interface Ca3Report {
  dateFrom: string;
  dateTo: string;
  tvaCollectee: {
    lignes: LigneTvaCollectee[];
    totalBaseHt: number;
    totalTva: number;
  };
  tvaDeductible: {
    surImmobilisations: number;
    surAutresBiensServices: number;
    total: number;
  };
  soldeTva: number;
  tvaAPayer: number;
  creditTva: number;
}

@Injectable({ providedIn: 'root' })
export class TvaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tva`;

  getCa3(dateFrom: string, dateTo: string): Observable<Ca3Report> {
    const params = new HttpParams().set('dateFrom', dateFrom).set('dateTo', dateTo);
    return this.http.get<Ca3Report>(`${this.base}/ca3`, { params });
  }
}
