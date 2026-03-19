import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PeriodeLock } from '../models/periode-lock.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PeriodeLockService {
  private readonly api = `${environment.apiUrl}/periode-locks`;
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<PeriodeLock[]> {
    return this.http.get<PeriodeLock[]>(this.api);
  }

  lock(annee: number, mois: number): Observable<PeriodeLock> {
    return this.http.post<PeriodeLock>(this.api, { annee, mois });
  }

  unlock(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
