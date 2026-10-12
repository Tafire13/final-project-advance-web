import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import type { DeliveryJobDetailModel, DeliveryJobModel } from '../../models/app.model';

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

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.loading.set(true);
    this.api.getJobs(this.search.trim()).subscribe({
      next: (res) => {
        this.jobs.set(res || []);
        this.loading.set(false);
      },
      error: (e) => {
        console.error('load jobs fail', e);
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    this.loadJobs();
  }

  openDetail(code: string): void {
    if (!code) return;
    this.detailLoading.set(true);
    this.api.getJobByCode(code).subscribe({
      next: (res) => {
        this.selected.set(res);
        this.detailLoading.set(false);
      },
      error: (e) => {
        console.error(e);
        alert(e?.error?.error || 'ไม่พบใบงาน เช่น JOB001');
        this.detailLoading.set(false);
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
