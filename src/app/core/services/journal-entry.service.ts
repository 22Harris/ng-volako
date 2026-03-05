import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JournalEntry, CreateJournalEntryDto, UpdateJournalEntryDto } from '../models/journal-entry.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class JournalEntryService {
  private readonly api = `${environment.apiUrl}/journal-entry`;

  constructor(private readonly http: HttpClient) {}

  getAll(operationId?: number): Observable<JournalEntry[]> {
    const params = operationId !== undefined ? `?operationId=${operationId}` : '';
    return this.http.get<JournalEntry[]>(`${this.api}${params}`);
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
}
