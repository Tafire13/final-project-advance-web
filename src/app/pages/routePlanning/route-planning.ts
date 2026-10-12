import { AfterViewInit, Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { PlanningApiService } from '../../services/planning/planning-api.service';
import type { PlanResultModel, RiderModel, ShopModel } from '../../models/planning/planning.model';

@Component({
  selector: 'app-route-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './route-planning.html'
})
export class RoutePlanning implements OnInit, AfterViewInit, OnDestroy {
  readonly riders = signal<RiderModel[]>([]);
  readonly shop = signal<ShopModel | null>(null);
  deliveryDate = new Date().toISOString().split('T')[0] as string;
  riderCount = 3;
  readonly pendingCount = signal<number | null>(null);
  readonly loading = signal(false);
  readonly ridersLoading = signal(true);
  readonly calculating = signal(false);
  readonly errorMsg = signal('');
  readonly mapLoading = signal(true);
  readonly mapError = signal('');
  readonly plan = signal<PlanResultModel | null>(null);
  readonly minimumRiders = computed(() => {
    const orderCount = this.pendingCount();
    return orderCount && orderCount > 0 ? Math.ceil(orderCount / 3) : 1;
  });
  readonly maximumRiders = computed(() => {
    const orderCount = this.pendingCount();
    if (orderCount === null || orderCount <= 0) return 0;
    return Math.min(10, this.riders().length, orderCount);
  });

  private map: L.Map | null = null;
  private viewReady = false;

  constructor(private planningApi: PlanningApiService) {}

  ngOnInit(): void {
    this.loadShop();
    this.planningApi.getRiders().subscribe({
      next: (r) => {
        this.riders.set(r || []);
        this.ridersLoading.set(false);
      },
      error: (e) => {
        console.error('load riders fail', e);
        this.ridersLoading.set(false);
      }
    });
    this.refreshPending();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.shop()) {
      setTimeout(() => this.renderBaseMap(), 0);
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  private loadShop(): void {
    this.mapLoading.set(true);
    this.mapError.set('');
    this.planningApi.getShop().subscribe({
      next: (shop) => {
        this.shop.set(shop);
        this.mapLoading.set(false);
        if (this.viewReady) {
          setTimeout(() => this.renderBaseMap(), 0);
        }
      },
      error: (error) => {
        console.error('load shop fail', error);
        this.mapLoading.set(false);
        this.mapError.set('โหลดแผนที่ไม่สำเร็จ กรุณาลองเปิดหน้านี้ใหม่');
      }
    });
  }

  refreshPending(setMinimumRiderCount = true): void {
    this.pendingCount.set(null);
    if (!this.deliveryDate) return;
    this.loading.set(true);
    this.planningApi.getPendingOrders(this.deliveryDate).subscribe({
      next: (rows) => {
        const orderCount = rows?.length ?? 0;
        this.pendingCount.set(orderCount);
        if (setMinimumRiderCount && orderCount > 0) {
          this.riderCount = Math.ceil(orderCount / 3);
        }
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
    if (this.loading() || this.ridersLoading() || this.pendingCount() === null) {
      this.errorMsg.set('กรุณารอให้ระบบตรวจสอบออเดอร์และข้อมูลไรเดอร์ให้เสร็จก่อน');
      return;
    }
    const validationMessage = this.riderCountValidationMessage();
    if (validationMessage) {
      this.errorMsg.set(validationMessage);
      return;
    }
    this.calculating.set(true);
    this.planningApi.calculateRoute({ delivery_date: this.deliveryDate, rider_count: Number(this.riderCount) }).subscribe({
      next: (res) => {
        this.plan.set(res);
        this.calculating.set(false);
        this.refreshPending(false);
        setTimeout(() => this.renderMap(), 50);
      },
      error: (err) => {
        this.calculating.set(false);
        this.errorMsg.set(err?.error?.error || 'คำนวณเส้นทางไม่สำเร็จ ลองเปลี่ยนวันที่หรือเพิ่มไรเดอร์');
      }
    });
  }

  riderCountValidationMessage(): string {
    if (this.loading() || this.ridersLoading()) return '';

    const orderCount = this.pendingCount();
    if (orderCount === null) return '';
    if (orderCount === 0) return 'ไม่มีออเดอร์รอจัดส่งในวันที่เลือก';

    const minimum = this.minimumRiders();
    const maximum = this.maximumRiders();
    const riderCount = Number(this.riderCount);

    if (this.riders().length < minimum) {
      return `ไรเดอร์ในระบบไม่เพียงพอ ต้องใช้ขั้นต่ำ ${minimum} คน แต่มี ${this.riders().length} คน`;
    }
    if (!Number.isInteger(riderCount)) {
      return 'จำนวนไรเดอร์ต้องเป็นจำนวนเต็ม';
    }
    if (riderCount < minimum) {
      return `ออเดอร์ ${orderCount} รายการ ต้องใช้ไรเดอร์อย่างน้อย ${minimum} คน เพราะรับได้ไม่เกินคนละ 3 จุด`;
    }
    if (riderCount > maximum) {
      return `เลือกไรเดอร์ได้ไม่เกิน ${maximum} คน สำหรับออเดอร์และไรเดอร์ที่มีอยู่`;
    }

    return '';
  }

  canCalculate(): boolean {
    const orderCount = this.pendingCount();
    return (
      !this.loading() &&
      !this.ridersLoading() &&
      !this.calculating() &&
      orderCount !== null &&
      orderCount > 0 &&
      this.riderCountValidationMessage() === ''
    );
  }

  private createMap(shop: { name: string; latitude: string | number; longitude: string | number }): L.Map | null {
    const el = document.getElementById('route-map');
    if (!el) return null;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const shopLat = Number(shop.latitude);
    const shopLng = Number(shop.longitude);
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
      .bindPopup(`<b>${shop.name}</b><br>จุดเริ่มต้น`)
      .addTo(this.map!);

    setTimeout(() => this.map?.invalidateSize(), 0);
    return this.map;
  }

  private renderBaseMap(): void {
    const shop = this.shop();
    if (!shop) return;
    this.createMap(shop);
  }

  private renderMap(): void {
    const plan = this.plan();
    if (!plan || plan.routes.length === 0) {
      this.renderBaseMap();
      return;
    }

    const map = this.createMap(plan.shop);
    if (!map) return;

    const shopLat = Number(plan.shop.latitude);
    const shopLng = Number(plan.shop.longitude);

    const allPoints: [number, number][] = [[shopLat, shopLng]];

    for (const r of plan.routes) {
      const line = (r.geometry || []) as [number, number][];
      if (line.length > 1) {
        L.polyline(line, { color: r.color, weight: 4, opacity: 0.85 }).addTo(map);
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
          .addTo(map);
      });
    }

    if (allPoints.length > 1) {
      map.fitBounds(L.latLngBounds(allPoints.map((p) => L.latLng(p[0], p[1]))).pad(0.15));
    }
  }

  openNav(url: string): void {
    if (url) window.open(url, '_blank');
  }
}
