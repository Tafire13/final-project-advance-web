import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { JobApiService } from '../../services/job/job-api.service';
import type { DeliveryJobDetailModel, DeliveryJobModel } from '../../models/job/job.model';

@Component({
  selector: 'app-delivery-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery-jobs.html'
})
export class DeliveryJobs implements OnInit {
  private readonly jobApi = inject(JobApiService);

  readonly jobs = signal<DeliveryJobModel[]>([]);
  readonly loading = signal(false);
  readonly selected = signal<DeliveryJobDetailModel | null>(null);
  readonly detailLoading = signal(false);
  readonly loadError = signal('');
  readonly detailError = signal('');

  search = '';

  ngOnInit(): void {
    this.loadJobs();
  }

  async loadJobs(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    this.detailError.set('');

    try {
      const jobs = await lastValueFrom(this.jobApi.getJobs(this.search.trim()));
      this.jobs.set(jobs || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      this.loadError.set('โหลดใบงานไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(): void {
    this.loadJobs();
  }

  async openDetail(code: string): Promise<void> {
    if (!code) return;

    this.detailLoading.set(true);
    this.detailError.set('');

    try {
      const job = await lastValueFrom(this.jobApi.getJobByCode(code));
      this.selected.set(job);
    } catch (error: any) {
      console.error('Failed to load job details:', error);
      this.detailError.set(error?.error?.error || 'เปิดรายละเอียดไม่ได้ กรุณาลองใหม่');
    } finally {
      this.detailLoading.set(false);
    }
  }

  closeDetail(): void {
    this.selected.set(null);
  }

  stopRouteText(): string {
    const job = this.selected();
    if (!job) return '';

    const stops = [...job.stops].sort(
      (first, second) => first.stop_sequence - second.stop_sequence
    );
    const stopNames: string[] = [];

    for (const stop of stops) {
      stopNames.push(`จุดที่ ${stop.stop_sequence}`);
    }

    return stopNames.join(' → ');
  }
}
