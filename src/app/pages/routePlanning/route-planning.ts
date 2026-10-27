import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { PlanningApiService } from '../../services/planning/planning-api.service';
import type { PlanResultModel, ShopModel } from '../../models/planning/planning.model';

@Component({
  selector: 'app-route-planning',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './route-planning.html'
})
export class RoutePlanning implements OnInit, AfterViewInit, OnDestroy {
  readonly routeColors = [
    '#dc2626', '#16a34a', '#2563eb', '#9333ea', '#ea580c',
    '#0891b2', '#c2410c', '#4f46e5', '#65a30d', '#db2777'
  ];
  readonly shop = signal<ShopModel | null>(null);
  readonly plan = signal<PlanResultModel | null>(null);
  readonly selectedRouteIndex = signal<number | null>(null);
  readonly mapLoading = signal(true);
  readonly mapError = signal('');
  readonly planLoading = signal(true);
  readonly planLoadError = signal('');
  readonly calculating = signal(false);
  readonly calculateError = signal('');

  private map: L.Map | null = null;
  private allRoutesBounds: L.LatLngBounds | null = null;
  private viewReady = false;

  constructor(private planningApi: PlanningApiService) {}

  ngOnInit(): void {
    this.loadShop();
    this.loadCurrentPlan();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.shop()) setTimeout(() => this.renderBaseMap(), 0);
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
        if (this.viewReady) setTimeout(() => this.renderBaseMap(), 0);
      },
      error: (error) => {
        console.error('load shop fail', error);
        this.mapLoading.set(false);
        this.mapError.set('โหลดข้อมูลร้านไม่สำเร็จ กรุณาลองเปิดหน้านี้ใหม่');
      }
    });
  }

  private loadCurrentPlan(): void {
    this.planLoading.set(true);
    this.planLoadError.set('');
    this.planningApi.getCurrentPlan().subscribe({
      next: (plan) => {
        this.plan.set(plan);
        this.planLoading.set(false);
        if (this.viewReady && this.shop()) setTimeout(() => this.renderBaseMap(), 0);
      },
      error: (error) => {
        this.planLoading.set(false);
        if (error?.status === 404) {
          this.plan.set(null);
          return;
        }
        console.error('load current plan failed', error);
        this.planLoadError.set('โหลดแผนจัดส่งปัจจุบันไม่สำเร็จ');
      }
    });
  }

  onCalculate(): void {
    this.calculateError.set('');
    this.calculating.set(true);

    this.planningApi.calculatePlan().subscribe({
      next: (result) => {
        this.plan.set(result);
        this.planLoadError.set('');
        this.calculating.set(false);
        if (this.viewReady) setTimeout(() => this.renderBaseMap(), 0);
      },
      error: (error) => {
        console.error('calculate plan failed', error);
        this.calculateError.set(
          error?.error?.error || 'คำนวณเส้นทางไม่สำเร็จ กรุณาลองอีกครั้ง'
        );
        this.calculating.set(false);
      }
    });
  }

  private renderBaseMap(): void {
    const shop = this.shop();
    const element = document.getElementById('route-map');
    if (!shop || !element) return;

    this.map?.remove();
    const latitude = Number(shop.latitude);
    const longitude = Number(shop.longitude);
    this.map = L.map(element).setView([latitude, longitude], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    const shopIcon = L.divIcon({
      className: 'shop-pin',
      html: '<div style="background:#fff;color:#1e293b;width:42px;height:30px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #1e293b;">ร้าน</div>',
      iconSize: [42, 30],
      iconAnchor: [21, 15]
    });
    L.marker([latitude, longitude], { icon: shopIcon })
      .bindPopup(`<b>${shop.name}</b><br>จุดเริ่มต้น`)
      .addTo(this.map);

    const plan = this.plan();
    const allPoints: L.LatLngExpression[] = [[latitude, longitude]];
    const routeLines = new Map<number, L.Polyline>();
    this.selectedRouteIndex.set(null);
    this.allRoutesBounds = null;

    plan?.routes.forEach((route, routeIndex) => {
      const color = this.getRouteColor(route.color, routeIndex);
      const geometry = route.geometry.map(
        ([pointLatitude, pointLongitude]) =>
          [pointLatitude, pointLongitude] as L.LatLngExpression
      );

      if (geometry.length > 1) {
        const line = L.polyline(geometry, { color, weight: 5, opacity: 0.85 }).addTo(this.map!);
        routeLines.set(routeIndex, line);
        allPoints.push(...geometry);
      }

      route.stops.forEach((stop) => {
        const point: L.LatLngExpression = [Number(stop.latitude), Number(stop.longitude)];
        allPoints.push(point);
        L.circleMarker(point, {
          radius: 9,
          color: '#fff',
          weight: 2,
          fillColor: color,
          fillOpacity: 1
        })
          .bindPopup(
            `ไรเดอร์ ${route.rider.name}<br>จุดที่ ${stop.stop_sequence}: ${stop.customer_name}<br>${stop.quantity} กล่อง`
          )
          .on('click', () => this.focusRoute(routeIndex, routeLines))
          .addTo(this.map!);
      });
    });

    if (allPoints.length > 1) {
      this.allRoutesBounds = L.latLngBounds(allPoints).pad(0.15);
      this.map.fitBounds(this.allRoutesBounds);
    }

    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  showAllRoutes(): void {
    this.selectedRouteIndex.set(null);
    this.map?.eachLayer((layer) => {
      if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
        layer.setStyle({ opacity: 0.85, weight: 5 });
      }
    });
    if (this.allRoutesBounds) {
      this.map?.fitBounds(this.allRoutesBounds);
    }
  }

  getRouteColor(routeColor: string | undefined, routeIndex: number): string {
    return routeColor || this.routeColors[routeIndex % this.routeColors.length]!;
  }

  private focusRoute(routeIndex: number, routeLines: Map<number, L.Polyline>): void {
    this.selectedRouteIndex.set(routeIndex);
    routeLines.forEach((line, index) => {
      if (index === routeIndex) {
        line.setStyle({ opacity: 1, weight: 7 });
        line.bringToFront();
      } else {
        line.setStyle({ opacity: 0.12, weight: 3 });
      }
    });

    const selectedLine = routeLines.get(routeIndex);
    if (selectedLine) {
      this.map?.fitBounds(selectedLine.getBounds().pad(0.2));
    }
  }
}
