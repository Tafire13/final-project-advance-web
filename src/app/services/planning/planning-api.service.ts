import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import type { PlanResultModel, RiderModel, ShopModel } from '../../models/planning/planning.model';

@Injectable({
  providedIn: 'root'
})
export class PlanningApiService {
  private readonly http = inject(HttpClient);

  getShop(): Observable<ShopModel> {
    return this.http.get<ShopModel>(`${API_BASE_URL}/plans/shop`);
  }

  getRiders(): Observable<RiderModel[]> {
    return this.http.get<RiderModel[]>(`${API_BASE_URL}/plans/riders`);
  }

  getPendingOrders(date?: string): Observable<unknown[]> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.http.get<unknown[]>(`${API_BASE_URL}/plans/pending${query}`);
  }

  calculatePlans(data: { delivery_date: string; rider_count: number }): Observable<PlanResultModel> {
    return this.http.post<PlanResultModel>(`${API_BASE_URL}/plans/calculate`, data);
  }

  getPlans(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${API_BASE_URL}/plans/`);
  }

  getPlanById(id: number): Observable<PlanResultModel> {
    return this.http.get<PlanResultModel>(`${API_BASE_URL}/plans${id}`);
  }
}
