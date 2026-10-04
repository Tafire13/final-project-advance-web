import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustomerModel, OrderModel, CreateOrderModel, UpdateOrderModel, RiderModel, ShopModel, PlanResultModel, DeliveryJobModel, DeliveryJobDetailModel } from '../models/app.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private api_url = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  //Customer 
  getCustomers(): Observable<CustomerModel[]> {
    return this.http.get<CustomerModel[]>(`${this.api_url}/customer`);
  }

  getCustomersByID(id: string): Observable<CustomerModel> {
    return this.http.get<CustomerModel>(`${this.api_url}/customer/${id}`);
  }

  createCustomer(data: any): Observable<any> {
    return this.http.post(`${this.api_url}/customer`, data);
  }

  updateCustomerByID(id: string, data: any): Observable<any> {
    return this.http.put(`${this.api_url}/customer/${id}`, data);
  }

  deleteCustomerByID(id: string): Observable<any> {
    return this.http.delete(`${this.api_url}/customer/${id}`);
  }

  //Order
  getOrder(): Observable<OrderModel[]> {
    return this.http.get<OrderModel[]>(`${this.api_url}/order`);
  }

  getOrderByID(id: number | string): Observable<OrderModel> {
    return this.http.get<OrderModel>(`${this.api_url}/order/${id}`);
  }

  createOrder(data: CreateOrderModel): Observable<any> {
    return this.http.post(`${this.api_url}/order`, data);
  }

  updateOrderByID(id: number | string, data: UpdateOrderModel): Observable<any> {
    return this.http.put(`${this.api_url}/order/${id}`, data);
  }

  deleteOrderByID(id: number | string): Observable<any> {
    return this.http.delete(`${this.api_url}/order/${id}`);
  }

  randomOrder(amount: number = 10): Observable<any> {
    return this.http.post(`${this.api_url}/order/random`, { amount });
  }

  // ===== ข้อ 4 Route Planning =====
  getShop(): Observable<ShopModel> {
    return this.http.get<ShopModel>(`${this.api_url}/route/shop`);
  }

  getRiders(): Observable<RiderModel[]> {
    return this.http.get<RiderModel[]>(`${this.api_url}/route/riders`);
  }

  getPendingOrders(date?: string): Observable<any[]> {
    const q = date ? `?date=${date}` : '';
    return this.http.get<any[]>(`${this.api_url}/route/pending${q}`);
  }

  calculateRoute(data: { delivery_date: string; rider_count: number }): Observable<PlanResultModel> {
    return this.http.post<PlanResultModel>(`${this.api_url}/route/calculate`, data);
  }

  getPlans(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api_url}/route/plans`);
  }

  getPlanById(id: number): Observable<PlanResultModel> {
    return this.http.get<PlanResultModel>(`${this.api_url}/route/plans/${id}`);
  }

  // ===== ข้อ 5 Delivery Jobs =====
  getJobs(search = ''): Observable<DeliveryJobModel[]> {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get<DeliveryJobModel[]>(`${this.api_url}/jobs${q}`);
  }

  getJobByCode(code: string): Observable<DeliveryJobDetailModel> {
    return this.http.get<DeliveryJobDetailModel>(`${this.api_url}/jobs/${code}`);
  }
}