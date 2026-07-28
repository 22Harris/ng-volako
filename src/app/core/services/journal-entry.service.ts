import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JournalEntry, CreateJournalEntryDto, UpdateJournalEntryDto } from '../models/journal-entry.model';
import { PaginatedResponse } from '../models/paginated.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class JournalEntryService {
  private readonly api = `${environment.apiUrl}/journal-entry`;

  constructor(private readonly http: HttpClient) {}

  getAll(operationId?: number, page?: number, pageSize?: number): Observable<PaginatedResponse<JournalEntry>> {
    let params = new HttpParams();
    if (operationId !== undefined) params = params.set('operationId', operationId);
    if (page !== undefined)        params = params.set('page', page);
    if (pageSize !== undefined)    params = params.set('pageSize', pageSize);
    return this.http.get<PaginatedResponse<JournalEntry>>(this.api, { params });
  }

  getById(id: number): Observable<JournalEntry> {
    return this.http.get<JournalEntry>(`${this.api}/${id}`);
  }

  create(dto: CreateJournalEntryDto): Observable<JournalEntry> {
    return this.http.post<JournalEntry>(this.api, dto);
  }

  update(id: number, dto: UpdateJournalEntryDto): Observable<JournalEntry> {
    return this.http.patch<JournalEntry>(`${this.api}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  valider(id: number): Observable<JournalEntry> {
    return this.http.patch<JournalEntry>(`${this.api}/${id}/valider`, {});
  }

  rejeter(id: number, note?: string): Observable<JournalEntry> {
    return this.http.patch<JournalEntry>(`${this.api}/${id}/rejeter`, { note });
  }

  verrouiller(id: number): Observable<JournalEntry> {
    return this.http.patch<JournalEntry>(`${this.api}/${id}/verrouiller`, {});
  }

  lettrer(lineIds: number[]): Observable<{ lettre: string }> {
    return this.http.post<{ lettre: string }>(`${this.api}/lettrage`, { lineIds });
  }

  delettrer(lineIds: number[]): Observable<void> {
    return this.http.delete<void>(`${this.api}/lettrage`, { body: { lineIds } });
  }
}
