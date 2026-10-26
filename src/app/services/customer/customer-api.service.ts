import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import type { CustomerModel } from '../../models/customer/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerApiService {
  private readonly http = inject(HttpClient);

  getCustomers(): Observable<CustomerModel[]> {
    return this.http.get<CustomerModel[]>(`${API_BASE_URL}/customer`);
  }

  getCustomersByID(id: string): Observable<CustomerModel> {
    return this.http.get<CustomerModel>(`${API_BASE_URL}/customer/${id}`);
  }

  createCustomer(data: Partial<CustomerModel>): Observable<unknown> {
    return this.http.post(`${API_BASE_URL}/customer`, data);
  }

  updateCustomerByID(id: string, data: Partial<CustomerModel>): Observable<unknown> {
    return this.http.put(`${API_BASE_URL}/customer/${id}`, data);
  }

  deleteCustomerByID(id: string): Observable<unknown> {
    return this.http.delete(`${API_BASE_URL}/customer/${id}`);
  }

  searchCustomerByName(name: string): Observable<CustomerModel[]> {
    return this.http.get<CustomerModel[]>(`${API_BASE_URL}/customer/search/fields?name=${name}`);
  }
}
