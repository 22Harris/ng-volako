import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Budget, BudgetLigne, CreateBudgetDto } from '../models/budget.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly api = `${environment.apiUrl}/budget`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Budget[]> {
    return this.http.get<Budget[]>(this.api);
  }

  getByMois(exercice: number, mois: number): Observable<Budget | null> {
    return this.http.get<Budget | null>(`${this.api}?exercice=${exercice}&mois=${mois}`);
  }

  create(dto: CreateBudgetDto): Observable<Budget> {
    return this.http.post<Budget>(this.api, { exercice: dto.exercice, mois: dto.mois });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  saveLigne(budgetId: number, ligne: BudgetLigne): Observable<Budget> {
    return this.http.post<Budget>(`${this.api}/${budgetId}/ligne`, ligne);
  }

  deleteLigne(budgetId: number, ligneId: number): Observable<Budget> {
    return this.http.delete<Budget>(`${this.api}/${budgetId}/ligne/${ligneId}`);
  }
}
