import { Component, OnInit } from '@angular/core';
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
  jobs: DeliveryJobModel[] = [];
  search = '';
  loading = false;
  selected: DeliveryJobDetailModel | null = null;
  detailLoading = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.loading = true;
    this.api.getJobs(this.search.trim()).subscribe({
      next: (res) => {
        this.jobs = res || [];
        this.loading = false;
      },
      error: (e) => {
        console.error('load jobs fail', e);
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.loadJobs();
  }

  openDetail(code: string): void {
    if (!code) return;
    this.detailLoading = true;
    this.api.getJobByCode(code).subscribe({
      next: (res) => {
        this.selected = res;
        this.detailLoading = false;
      },
      error: (e) => {
        console.error(e);
        alert(e?.error?.error || 'ไม่พบใบงาน เช่น JOB001');
        this.detailLoading = false;
      }
    });
  }

  closeDetail(): void {
    this.selected = null;
  }

  openNav(url: string): void {
    if (url) window.open(url, '_blank');
  }

  stopRouteText(): string {
    if (!this.selected?.stops) return '';
    return this.selected.stops
      .slice()
      .sort((a, b) => a.stop_sequence - b.stop_sequence)
      .map((s) => `จุดที่ ${s.stop_sequence}`)
      .join(' → ');
  }
}
