import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/paginated.model';

export interface AuditLogEntry {
  id: number;
  userId?: number;
  action: string;
  entity?: string;
  entityId?: number;
  details?: string;
  ip?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly api = `${environment.apiUrl}/audit-log`;

  constructor(private readonly http: HttpClient) {}

  getAll(page = 1, pageSize = 50): Observable<PaginatedResponse<AuditLogEntry>> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<PaginatedResponse<AuditLogEntry>>(this.api, { params });
  }
}
