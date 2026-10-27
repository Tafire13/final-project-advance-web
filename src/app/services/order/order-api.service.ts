import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import type { ClearDemoOrderResponse, CreateOrderModel, OrderModel, RandomOrderResponse, UpdateOrderModel } from '../../models/order/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderApiService {
  private readonly http = inject(HttpClient);

  getOrder(): Observable<OrderModel[]> {
    return this.http.get<OrderModel[]>(`${API_BASE_URL}/order`);
  }

  getOrderByID(id: number | string): Observable<OrderModel> {
    return this.http.get<OrderModel>(`${API_BASE_URL}/order/${id}`);
  }

  createOrder(data: CreateOrderModel): Observable<unknown> {
    return this.http.post(`${API_BASE_URL}/order`, data);
  }

  updateOrderByID(id: number | string, data: UpdateOrderModel): Observable<unknown> {
    return this.http.put(`${API_BASE_URL}/order/${id}`, data);
  }

  deleteOrderByID(id: number | string): Observable<unknown> {
    return this.http.delete(`${API_BASE_URL}/order/${id}`);
  }

  randomOrder(amount = 20): Observable<RandomOrderResponse> {
    return this.http.post<RandomOrderResponse>(`${API_BASE_URL}/order/random`, { amount });
  }

  clearDemoOrder(): Observable<ClearDemoOrderResponse> {
    return this.http.delete<ClearDemoOrderResponse>(`${API_BASE_URL}/order/demo`);
  }
}
