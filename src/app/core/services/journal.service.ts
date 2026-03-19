import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Journal, JournalType } from '../models/journal.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class JournalService {
  private readonly api = `${environment.apiUrl}/journals`;
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Journal[]> {
    return this.http.get<Journal[]>(this.api);
  }

  getOrCreate(type: JournalType): Observable<Journal> {
    return this.http.post<Journal>(this.api, { type });
  }
}
