import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustomerModel, OrderModel, CreateOrderModel, UpdateOrderModel } from '../models/app.model';

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
}