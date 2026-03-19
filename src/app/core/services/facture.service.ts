import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Facture, CreateFactureDto, UpdateFactureDto, AddPaiementDto } from '../models/facture.model';

@Injectable({ providedIn: 'root' })
export class FactureService {
  private readonly api = `${environment.apiUrl}/factures`;

  constructor(private readonly http: HttpClient) {}

  getAll(tiersId?: number): Observable<Facture[]> {
    const params: Record<string, string> = {};
    if (tiersId !== undefined) params['tiersId'] = String(tiersId);
    return this.http.get<Facture[]>(this.api, { params });
  }

  getById(id: number): Observable<Facture> {
    return this.http.get<Facture>(`${this.api}/${id}`);
  }

  create(dto: CreateFactureDto): Observable<Facture> {
    return this.http.post<Facture>(this.api, dto);
  }

  update(id: number, dto: UpdateFactureDto): Observable<Facture> {
    return this.http.patch<Facture>(`${this.api}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  addPaiement(factureId: number, dto: AddPaiementDto): Observable<Facture> {
    return this.http.post<Facture>(`${this.api}/${factureId}/paiement`, dto);
  }

  lettrer(factureId: number, lettre: string): Observable<void> {
    return this.http.post<void>(`${this.api}/${factureId}/lettrer`, { lettre });
  }
}
