import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReleveImport, LigneReleve } from '../models/rapprochement.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RapprochementService {
  private readonly api = `${environment.apiUrl}/rapprochement`;

  constructor(private readonly http: HttpClient) {}

  importReleve(file: File): Observable<ReleveImport> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ReleveImport>(`${this.api}/import`, form);
  }

  getReleves(): Observable<ReleveImport[]> {
    return this.http.get<ReleveImport[]>(`${this.api}/releves`);
  }

  getReleve(id: number): Observable<ReleveImport> {
    return this.http.get<ReleveImport>(`${this.api}/releves/${id}`);
  }

  deleteReleve(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/releves/${id}`);
  }

  rapprocher(ligneId: number, journalLineId: number): Observable<LigneReleve> {
    return this.http.patch<LigneReleve>(`${this.api}/lignes/${ligneId}/rapprocher`, { journalLineId });
  }

  derapprocher(ligneId: number): Observable<LigneReleve> {
    return this.http.patch<LigneReleve>(`${this.api}/lignes/${ligneId}/derapprocher`, {});
  }
}
