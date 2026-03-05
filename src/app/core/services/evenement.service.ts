import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evenement, CreateEvenementDto, UpdateEvenementDto } from '../models/evenement.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EvenementService {
  private readonly api = `${environment.apiUrl}/evenements`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Evenement[]> {
    return this.http.get<Evenement[]>(this.api);
  }

  getById(id: number): Observable<Evenement> {
    return this.http.get<Evenement>(`${this.api}/${id}`);
  }

  create(dto: CreateEvenementDto): Observable<Evenement> {
    return this.http.post<Evenement>(this.api, dto);
  }

  update(id: number, dto: UpdateEvenementDto): Observable<Evenement> {
    return this.http.patch<Evenement>(`${this.api}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  marquerPaye(id: number): Observable<{ updated: Evenement; next: Evenement | null }> {
    return this.http.patch<{ updated: Evenement; next: Evenement | null }>(`${this.api}/${id}/payer`, {});
  }
}
