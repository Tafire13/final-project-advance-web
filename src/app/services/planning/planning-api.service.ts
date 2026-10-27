import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import type {
  PlanResultModel,
  ShopModel
} from '../../models/planning/planning.model';

@Injectable({
  providedIn: 'root'
})
export class PlanningApiService {
  private readonly http = inject(HttpClient);

  getShop(): Observable<ShopModel> {
    return this.http.get<ShopModel>(`${API_BASE_URL}/plans/shop`);
  }

  calculatePlan(): Observable<PlanResultModel> {
    return this.http.post<PlanResultModel>(
      `${API_BASE_URL}/plans/calculate`,
      {}
    );
  }
}
