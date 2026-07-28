import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BalanceLine {
  id: number;
  code: string;
  name: string;
  account_class: number;
  totalDebit: number;
  totalCredit: number;
}

export interface GrandLivreLigne {
  id: number;
  date: string;
  label: string;
  pieceNumber: string | null;
  entryId: number;
  debit: number;
  credit: number;
  soldeCumul: number;
  lettre: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GrandLivreResponse {
  account: { id: number; code: string; name: string; account_class: number };
  lines: GrandLivreLigne[];
  totalDebit: number;
  totalCredit: number;
  solde: number;
  pagination: { total: number; page: number; pageSize: number; totalPages: number };
}

export interface BilanPoste {
  code: string;
  name: string;
  solde: number;
}

export interface BilanReport {
  exercice: number;
  actif: {
    immobilisations: BilanPoste[];
    stocks: BilanPoste[];
    creances: BilanPoste[];
    disponibilites: BilanPoste[];
    autresActif: BilanPoste[];
    total: number;
  };
  passif: {
    capitauxPropres: BilanPoste[];
    dettesFinancieres: BilanPoste[];
    dettesFournisseurs: BilanPoste[];
    autresDettes: BilanPoste[];
    total: number;
  };
  resultatExercice: number;
  equilibre: boolean;
}

export interface CompteResultatPoste {
  code: string;
  name: string;
  montant: number;
}

export interface CompteResultatReport {
  exercice: number;
  charges: CompteResultatPoste[];
  produits: CompteResultatPoste[];
  totalCharges: number;
  totalProduits: number;
  resultat: number;
}

@Injectable({ providedIn: 'root' })
export class RapportsService {
  private readonly api = `${environment.apiUrl}/rapports`;

  constructor(private readonly http: HttpClient) {}

  downloadFec(exerciceId: number, format: 'txt' | 'excel' = 'txt'): Observable<Blob> {
    const endpoint = format === 'excel' ? 'fec/excel' : 'fec';
    return this.http.get(`${this.api}/${endpoint}`, {
      params: { exerciceId: String(exerciceId) },
      responseType: 'blob',
    });
  }

  getBalance(page = 1, pageSize = 50): Observable<PaginatedResponse<BalanceLine>> {
    return this.http.get<PaginatedResponse<BalanceLine>>(`${this.api}/balance`, {
      params: { page: String(page), pageSize: String(pageSize) },
    });
  }

  getGrandLivre(accountId: number, dateFrom?: string, dateTo?: string, page = 1, pageSize = 50): Observable<GrandLivreResponse> {
    const params: Record<string, string> = { page: String(page), pageSize: String(pageSize) };
    if (dateFrom) params['dateFrom'] = dateFrom;
    if (dateTo)   params['dateTo']   = dateTo;
    return this.http.get<GrandLivreResponse>(`${this.api}/grand-livre/${accountId}`, { params });
  }

  getBilan(exercice: number): Observable<BilanReport> {
    return this.http.get<BilanReport>(`${this.api}/bilan`, { params: { exercice: String(exercice) } });
  }

  getCompteDeResultat(exercice: number): Observable<CompteResultatReport> {
    return this.http.get<CompteResultatReport>(`${this.api}/compte-de-resultat`, { params: { exercice: String(exercice) } });
  }
}
