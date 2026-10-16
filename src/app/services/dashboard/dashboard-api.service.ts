import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import type { DashboardModel } from '../../models/dashboard/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardApiService {
  private readonly http = inject(HttpClient);

  getDashboard(date: string): Observable<DashboardModel> {
    return this.http.get<DashboardModel>(`${API_BASE_URL}/dashboard?date=${encodeURIComponent(date)}`);
  }
}
