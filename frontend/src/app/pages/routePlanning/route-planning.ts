import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { ApiService } from '../../services/api';
import type { PlanResultModel, RiderModel } from '../../models/app.model';

@Component({
  selector: 'app-route-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './route-planning.html'
})
export class RoutePlanning implements OnInit {
  riders: RiderModel[] = [];
  deliveryDate = new Date().toISOString().split('T')[0] as string;
  riderCount = 3;
  pendingCount: number | null = null;
  loading = false;
  calculating = false;
  errorMsg = '';
  plan: PlanResultModel | null = null;

  private map: L.Map | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getRiders().subscribe({
      next: (r) => (this.riders = r || []),
      error: (e) => console.error('load riders fail', e)
    });
    this.refreshPending();
  }

  refreshPending(): void {
    this.pendingCount = null;
    if (!this.deliveryDate) return;
    this.loading = true;
    this.api.getPendingOrders(this.deliveryDate).subscribe({
      next: (rows) => {
        this.pendingCount = rows?.length ?? 0;
        this.loading = false;
      },
      error: () => {
        this.pendingCount = null;
        this.loading = false;
      }
    });
  }

  onCalculate(): void {
    this.errorMsg = '';
    if (!this.deliveryDate) {
      this.errorMsg = 'กรุณาเลือกวันที่จัดส่ง';
      return;
    }
    if (this.riderCount < 1 || this.riderCount > 10) {
      this.errorMsg = 'จำนวนไรเดอร์ต้องอยู่ระหว่าง 1-10';
      return;
    }
    this.calculating = true;
    this.api.calculateRoute({ delivery_date: this.deliveryDate, rider_count: Number(this.riderCount) }).subscribe({
      next: (res) => {
        this.plan = res;
        this.calculating = false;
        this.refreshPending();
        setTimeout(() => this.renderMap(), 50);
      },
      error: (err) => {
        this.calculating = false;
        this.errorMsg = err?.error?.error || 'คำนวณเส้นทางไม่สำเร็จ ลองเปลี่ยนวันที่หรือเพิ่มไรเดอร์';
      }
    });
  }

  private renderMap(): void {
    if (!this.plan || this.plan.routes.length === 0) return;
    const el = document.getElementById('route-map');
    if (!el) return;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const shopLat = Number(this.plan.shop.latitude);
    const shopLng = Number(this.plan.shop.longitude);
    this.map = L.map('route-map').setView([shopLat, shopLng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // หมุดร้าน (สีดำ)
    const shopIcon = L.divIcon({
      className: 'shop-pin',
      html: `<div style="background:#111827;color:#fbbf24;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #fbbf24;">🏠</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
    L.marker([shopLat, shopLng], { icon: shopIcon })
      .bindPopup(`<b>${this.plan.shop.name}</b><br>จุดเริ่มต้น`)
      .addTo(this.map!);

    const allPoints: [number, number][] = [[shopLat, shopLng]];

    for (const r of this.plan.routes) {
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
