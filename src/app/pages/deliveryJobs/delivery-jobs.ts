import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobApiService } from '../../services/job/job-api.service';
import type { DeliveryJobDetailModel, DeliveryJobModel } from '../../models/job/job.model';

@Component({
  selector: 'app-delivery-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery-jobs.html'
})
export class DeliveryJobs implements OnInit {
  readonly jobs = signal<DeliveryJobModel[]>([]);
  search = '';
  readonly loading = signal(false);
  readonly selected = signal<DeliveryJobDetailModel | null>(null);
  readonly detailLoading = signal(false);
  readonly loadError = signal('');
  readonly detailError = signal('');

  constructor(private jobApi: JobApiService) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.loadError.set('');
    this.detailError.set('');
    this.loading.set(true);
    this.jobApi.getJobs(this.search.trim()).subscribe({
      next: (res) => {
        this.jobs.set(res || []);
        this.loading.set(false);
      },
      error: (e) => {
        console.error('load jobs fail', e);
        this.loading.set(false);
        this.loadError.set('โหลดใบงานไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
      }
    });
  }

  onSearch(): void {
    this.loadJobs();
  }

  openDetail(code: string): void {
    if (!code) return;
    this.detailError.set('');
    this.detailLoading.set(true);
    this.jobApi.getJobByCode(code).subscribe({
      next: (res) => {
        this.selected.set(res);
        this.detailLoading.set(false);
      },
      error: (e) => {
        console.error(e);
        this.detailLoading.set(false);
        this.detailError.set(e?.error?.error || 'เปิดรายละเอียดไม่ได้ กรุณาลองใหม่');
      }
    });
  }

  closeDetail(): void {
    this.selected.set(null);
  }

  openNav(url: string): void {
    if (url) window.open(url, '_blank');
  }

  stopRouteText(): string {
    const selected = this.selected();
    if (!selected?.stops) return '';
    return selected.stops
      .slice()
      .sort((a, b) => a.stop_sequence - b.stop_sequence)
      .map((s) => `จุดที่ ${s.stop_sequence}`)
      .join(' → ');
  }
}
