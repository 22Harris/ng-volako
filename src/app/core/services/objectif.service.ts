import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Objectif, CreateObjectifDto, UpdateObjectifDto } from '../models/objectif.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ObjectifService {
  private readonly api = `${environment.apiUrl}/objectifs`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Objectif[]> {
    return this.http.get<Objectif[]>(this.api);
  }

  getById(id: number): Observable<Objectif> {
    return this.http.get<Objectif>(`${this.api}/${id}`);
  }

  create(dto: CreateObjectifDto): Observable<Objectif> {
    return this.http.post<Objectif>(this.api, dto);
  }

  update(id: number, dto: UpdateObjectifDto): Observable<Objectif> {
    return this.http.patch<Objectif>(`${this.api}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  versement(id: number, montant: number): Observable<Objectif> {
    return this.http.patch<Objectif>(`${this.api}/${id}/versement`, { montant });
  }
}
