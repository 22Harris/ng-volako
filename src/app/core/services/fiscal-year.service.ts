import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FiscalYear {
  id: number;
  annee: number;
  statut: 'OUVERT' | 'CLOTURE';
  userId: number;
  createdAt: string;
  closedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class FiscalYearService {
  private readonly api = `${environment.apiUrl}/fiscal-years`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<FiscalYear[]> {
    return this.http.get<FiscalYear[]>(this.api);
  }

  create(annee: number): Observable<FiscalYear> {
    return this.http.post<FiscalYear>(this.api, { annee });
  }

  close(annee: number): Observable<FiscalYear> {
    return this.http.post<FiscalYear>(`${this.api}/${annee}/cloturer`, {});
  }
}
