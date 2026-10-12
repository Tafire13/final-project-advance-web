import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { PlanningApiService } from '../../services/planning/planning-api.service';
import type { PlanResultModel, RiderModel } from '../../models/planning/planning.model';

@Component({
  selector: 'app-route-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './route-planning.html'
})
export class RoutePlanning implements OnInit {
  readonly riders = signal<RiderModel[]>([]);
  deliveryDate = new Date().toISOString().split('T')[0] as string;
  riderCount = 3;
  readonly pendingCount = signal<number | null>(null);
  readonly loading = signal(false);
  readonly calculating = signal(false);
  readonly errorMsg = signal('');
  readonly plan = signal<PlanResultModel | null>(null);

  private map: L.Map | null = null;

  constructor(private planningApi: PlanningApiService) {}

  ngOnInit(): void {
    this.planningApi.getRiders().subscribe({
      next: (r) => this.riders.set(r || []),
      error: (e) => console.error('load riders fail', e)
    });
    this.refreshPending();
  }

  refreshPending(): void {
    this.pendingCount.set(null);
    if (!this.deliveryDate) return;
    this.loading.set(true);
    this.planningApi.getPendingOrders(this.deliveryDate).subscribe({
      next: (rows) => {
        this.pendingCount.set(rows?.length ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.pendingCount.set(null);
        this.loading.set(false);
      }
    });
  }

  onCalculate(): void {
    this.errorMsg.set('');
    if (!this.deliveryDate) {
      this.errorMsg.set('กรุณาเลือกวันที่จัดส่ง');
      return;
    }
    if (this.riderCount < 1 || this.riderCount > 10) {
      this.errorMsg.set('จำนวนไรเดอร์ต้องอยู่ระหว่าง 1-10');
      return;
    }
    this.calculating.set(true);
    this.planningApi.calculateRoute({ delivery_date: this.deliveryDate, rider_count: Number(this.riderCount) }).subscribe({
      next: (res) => {
        this.plan.set(res);
        this.calculating.set(false);
        this.refreshPending();
        setTimeout(() => this.renderMap(), 50);
      },
      error: (err) => {
        this.calculating.set(false);
        this.errorMsg.set(err?.error?.error || 'คำนวณเส้นทางไม่สำเร็จ ลองเปลี่ยนวันที่หรือเพิ่มไรเดอร์');
      }
    });
  }

  private renderMap(): void {
    const plan = this.plan();
    if (!plan || plan.routes.length === 0) return;
    const el = document.getElementById('route-map');
    if (!el) return;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const shopLat = Number(plan.shop.latitude);
    const shopLng = Number(plan.shop.longitude);
    this.map = L.map('route-map').setView([shopLat, shopLng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // หมุดร้าน
    const shopIcon = L.divIcon({
      className: 'shop-pin',
      html: `<div style="background:#ffffff;color:#1e293b;width:42px;height:30px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #1e293b;">ร้าน</div>`,
      iconSize: [42, 30],
      iconAnchor: [21, 15]
    });
    L.marker([shopLat, shopLng], { icon: shopIcon })
      .bindPopup(`<b>${plan.shop.name}</b><br>จุดเริ่มต้น`)
      .addTo(this.map!);

    const allPoints: [number, number][] = [[shopLat, shopLng]];

    for (const r of plan.routes) {
      const line = (r.geometry || []) as [number, number][];
      if (line.length > 1) {
        L.polyline(line, { color: r.color, weight: 4, opacity: 0.85 }).addTo(this.map);
      }
      line.forEach((p) => allPoints.push(p));

      (r.stops || []).forEach((s) => {
        const lat = Number(s.latitude);
        const lng = Number(s.longitude);
        L.circleMarker([lat, lng], {
          radius: 9,
          color: '#fff',
          weight: 2,
          fillColor: r.color,
          fillOpacity: 1
        })
          .bindPopup(
            `<b style="color:${r.color}">ไรเดอร์ ${r.rider_number}: ${r.rider_name}</b><br>` +
              `จุดที่ ${s.stop_sequence}: ${s.customer_name} (${s.quantity} กล่อง)<br>` +
              `ถึง ${s.arrival_time} • ${s.order_id ? 'Order #' + s.order_id : ''}`
          )
          .addTo(this.map!);
      });
    }

    if (allPoints.length > 1) {
      this.map.fitBounds(L.latLngBounds(allPoints.map((p) => L.latLng(p[0], p[1]))).pad(0.15));
    }
  }

  openNav(url: string): void {
    if (url) window.open(url, '_blank');
  }
}
