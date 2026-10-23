import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import type { DeliveryJobDetailModel, DeliveryJobModel } from '../../models/job/job.model';

@Injectable({
  providedIn: 'root'
})
export class JobApiService {
  private readonly http = inject(HttpClient);

  getJobs(search = ''): Observable<DeliveryJobModel[]> {
    const query = search ? `?search=${search}` : '';
    return this.http.get<DeliveryJobModel[]>(`${API_BASE_URL}/jobs${query}`);
  }

  getJobByCode(code: string): Observable<DeliveryJobDetailModel> {
    return this.http.get<DeliveryJobDetailModel>(
      `${API_BASE_URL}/jobs/${(code)}`
    );
  }
}
