import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { DashboardApiService } from '../../services/dashboard/dashboard-api.service';
import type { DashboardModel } from '../../models/dashboard/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit, OnDestroy {
  readonly summary = signal<DashboardModel | null>(null);
  readonly loading = signal(false);
  readonly errorMsg = signal('');
  readonly completionPercent = computed(() => {
    const summary = this.summary();
    if (!summary) return 0;
    const activeOrders = summary.pending_orders + summary.delivered_orders;
    return activeOrders > 0 ? Math.round(summary.delivered_orders / activeOrders * 100) : 0;
  });

  deliveryDate = this.todayDate();
  private request?: Subscription;

  constructor(private dashboardApi: DashboardApiService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.request?.unsubscribe();
  }

  onDateChange(date: string): void {
    this.deliveryDate = date;
    this.loadDashboard();
  }

  selectToday(): void {
    this.deliveryDate = this.todayDate();
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.request?.unsubscribe();
    this.summary.set(null);
    this.errorMsg.set('');

    if (!this.deliveryDate) {
      this.loading.set(false);
      this.errorMsg.set('กรุณาเลือกวันที่จัดส่ง');
      return;
    }

    this.loading.set(true);
    this.request = this.dashboardApi.getDashboard(this.deliveryDate).subscribe({
      next: (res) => {
        this.summary.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.error || 'ไม่สามารถโหลดข้อมูล Dashboard ได้ กรุณาลองใหม่อีกครั้ง');
        this.loading.set(false);
      }
    });
  }

  private todayDate(): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());
    const part = (type: string) => parts.find((item) => item.type === type)?.value || '';
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
}
