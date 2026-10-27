import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { inject } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import * as L from 'leaflet';
import type { DeliveryJobDetailModel } from '../../models/job/job.model';
import type { RouteStopModel } from '../../models/planning/planning.model';
import { JobApiService } from '../../services/job/job-api.service';

@Component({
  selector: 'app-rider-job-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './rider-job-search.html'
})
export class RiderJobSearch implements OnInit, OnDestroy {
  private readonly jobApi = inject(JobApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  code = '';
  readonly loading = signal(false);
  readonly error = signal('');
  readonly job = signal<DeliveryJobDetailModel | null>(null);
  readonly completingOrderId = signal<number | null>(null);
  readonly stopActionError = signal<{ orderId: number; message: string } | null>(null);
  private map: L.Map | null = null;

  ngOnInit(): void {
    // อ่านเลขใบงานจาก URL เช่น /rider/JOB000001-01
    this.route.paramMap.subscribe((params) => {
      this.code = params.get('code') || '';
      this.error.set('');
      this.job.set(null);
      this.removeMap();

      if (this.code) {
        this.loadJob(this.code);
      }
    });
  }

  ngOnDestroy(): void {
    this.removeMap();
  }

  onSearch(): void {
    if (this.loading()) return;
    const code = this.code.trim().toUpperCase();
    if (!code) {
      this.error.set('กรุณากรอกเลขใบงานที่ได้รับจากร้าน');
      return;
    }
    if (code.length > 32) {
      this.error.set('เลขใบงานต้องไม่เกิน 32 ตัวอักษร');
      return;
    }

    this.code = code;
    if (this.route.snapshot.paramMap.get('code') === code) {
      this.loadJob(code);
    } else {
      void this.router.navigate(['/rider', code]);
    }
  }

  async loadJob(code: string): Promise<void> {
    if (code.length > 32) {
      this.error.set('เลขใบงานต้องไม่เกิน 32 ตัวอักษร');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.job.set(null);

    try {
      const data = await lastValueFrom(this.jobApi.getJobByCode(code));
      data.stops.sort((first, second) => first.stop_sequence - second.stop_sequence);
      this.job.set(data);
      setTimeout(() => this.renderMap(data), 0);
    } catch (error: any) {
      if (error.status === 404) {
        this.error.set('ไม่พบใบงานนี้ กรุณาตรวจสอบเลขใบงานกับร้านแล้วลองอีกครั้ง');
      } else {
        this.error.set('ค้นหาใบงานไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง');
      }
    } finally {
      this.loading.set(false);
    }
  }

  async markOrderDelivered(stop: RouteStopModel): Promise<void> {
    if (stop.status !== 'pending' || this.completingOrderId() !== null) return;

    this.completingOrderId.set(stop.order_id);
    this.stopActionError.set(null);

    try {
      await lastValueFrom(this.jobApi.completeStop(this.code, stop.order_id));
      this.job.update((currentJob) => {
        if (!currentJob) return currentJob;
        return {
          ...currentJob,
          stops: currentJob.stops.map((currentStop) =>
            currentStop.order_id === stop.order_id
              ? { ...currentStop, status: 'delivered' }
              : currentStop
          )
        };
      });
    } catch (error: any) {
      this.stopActionError.set({
        orderId: stop.order_id,
        message: error?.error?.error || 'บันทึกสถานะไม่สำเร็จ กรุณาลองอีกครั้ง'
      });
    } finally {
      this.completingOrderId.set(null);
    }
  }

  private removeMap(): void {
    this.map?.remove();
    this.map = null;
  }

  private renderMap(job: DeliveryJobDetailModel): void {
    const element = document.getElementById('rider-route-map');
    if (!element) return;

    this.removeMap();
    let geometry: number[][] = [];

    try {
      geometry = typeof job.geometry === 'string'
        ? JSON.parse(job.geometry) as number[][]
        : job.geometry;
    } catch {
      geometry = [];
    }

    const validGeometry = Array.isArray(geometry)
      ? geometry.filter((point) =>
          Array.isArray(point) && point.length >= 2 &&
          Number.isFinite(Number(point[0])) && Number.isFinite(Number(point[1]))
        ).map((point) => [Number(point[0]), Number(point[1])] as [number, number])
      : [];

    const stopPoints = job.stops.map((stop) =>
      [Number(stop.latitude), Number(stop.longitude)] as [number, number]
    ).filter(([latitude, longitude]) =>
      Number.isFinite(latitude) && Number.isFinite(longitude)
    );
    const points = validGeometry.length > 0 ? validGeometry : stopPoints;
    if (points.length === 0) return;

    this.map = L.map(element).setView(points[0]!, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    if (validGeometry.length > 1) {
      L.polyline(validGeometry, {
        color: job.color || '#dc2626',
        weight: 5,
        opacity: 0.85
      }).addTo(this.map);
    }

    if (validGeometry.length > 0) {
      const shopPopup = document.createElement('span');
      shopPopup.textContent = 'จุดเริ่มต้น: ร้าน';
      L.circleMarker(validGeometry[0]!, {
        radius: 8,
        color: '#fff',
        weight: 2,
        fillColor: '#1e293b',
        fillOpacity: 1
      }).bindPopup(shopPopup).addTo(this.map);
    }

    job.stops.forEach((stop) => {
      const latitude = Number(stop.latitude);
      const longitude = Number(stop.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      const markerIcon = L.divIcon({
        className: 'rider-stop-marker',
        html: `<span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border:2px solid white;border-radius:50%;background:${job.color || '#dc2626'};color:white;font-weight:700;box-shadow:0 1px 4px #555">${stop.stop_sequence}</span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
      const popup = document.createElement('div');
      popup.textContent = `จุดที่ ${stop.stop_sequence} — ${stop.customer_name} (${stop.quantity} กล่อง)`;
      L.marker([latitude, longitude], { icon: markerIcon })
        .bindPopup(popup)
        .addTo(this.map!);
    });

    this.map.fitBounds(L.latLngBounds(points).pad(0.15));
    setTimeout(() => this.map?.invalidateSize(), 0);
  }
}
