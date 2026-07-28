import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tiers, TiersSolde, CreateTiersDto, UpdateTiersDto } from '../models/tiers.model';
import { PaginatedResponse } from '../models/paginated.model';

@Injectable({ providedIn: 'root' })
export class TiersService {
  private readonly api = `${environment.apiUrl}/tiers`;

  constructor(private readonly http: HttpClient) {}

  getAll(page?: number, pageSize?: number): Observable<PaginatedResponse<Tiers>> {
    let params = new HttpParams();
    if (page !== undefined)     params = params.set('page', page);
    if (pageSize !== undefined) params = params.set('pageSize', pageSize);
    return this.http.get<PaginatedResponse<Tiers>>(this.api, { params });
  }

  getById(id: number): Observable<Tiers> {
    return this.http.get<Tiers>(`${this.api}/${id}`);
  }

  search(term: string): Observable<Tiers[]> {
    return this.http.get<Tiers[]>(`${this.api}/search`, { params: { term } });
  }

  getSoldes(): Observable<TiersSolde[]> {
    return this.http.get<TiersSolde[]>(`${this.api}/soldes`);
  }

  create(dto: CreateTiersDto): Observable<Tiers> {
    return this.http.post<Tiers>(this.api, dto);
  }

  update(id: number, dto: UpdateTiersDto): Observable<Tiers> {
    return this.http.patch<Tiers>(`${this.api}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
