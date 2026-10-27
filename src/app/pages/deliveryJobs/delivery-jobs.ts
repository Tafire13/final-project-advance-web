import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import * as L from 'leaflet';
import { JobApiService } from '../../services/job/job-api.service';
import type { DeliveryJobDetailModel, DeliveryJobModel } from '../../models/job/job.model';

@Component({
  selector: 'app-delivery-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery-jobs.html',
})
export class DeliveryJobs implements OnInit, OnDestroy {
  private readonly jobApi = inject(JobApiService);

  readonly jobs = signal<DeliveryJobModel[]>([]);
  readonly loading = signal(false);
  readonly selected = signal<DeliveryJobDetailModel | null>(null);
  readonly detailLoading = signal(false);
  readonly loadError = signal('');
  readonly detailError = signal('');

  search = '';
  private detailMap: L.Map | null = null;

  ngOnInit(): void {
    this.loadJobs();
  }

  ngOnDestroy(): void {
    this.removeDetailMap();
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
      setTimeout(() => this.renderDetailMap(job), 0);
    } catch (error: any) {
      console.error('Failed to load job details:', error);
      this.detailError.set(error?.error?.error || 'เปิดรายละเอียดไม่ได้ กรุณาลองใหม่');
    } finally {
      this.detailLoading.set(false);
    }
  }

  closeDetail(): void {
    this.selected.set(null);
    this.removeDetailMap();
  }

  private removeDetailMap(): void {
    this.detailMap?.remove();
    this.detailMap = null;
  }

  private renderDetailMap(job: DeliveryJobDetailModel): void {
    const element = document.getElementById('job-detail-map');
    if (!element) return;

    this.removeDetailMap();
    let geometry: number[][] = [];

    try {
      geometry =
        typeof job.geometry === 'string' ? (JSON.parse(job.geometry) as number[][]) : job.geometry;
    } catch {
      geometry = [];
    }

    const routePoints: [number, number][] = [];
    if (Array.isArray(geometry)) {
      for (const point of geometry) {
        if (!Array.isArray(point) || point.length < 2) continue;

        const latitude = Number(point[0]);
        const longitude = Number(point[1]);
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          routePoints.push([latitude, longitude]);
        }
      }
    }

    const stops = [...job.stops].sort(
      (first, second) => first.stop_sequence - second.stop_sequence,
    );
    const stopPoints: [number, number][] = [];
    for (const stop of stops) {
      const latitude = Number(stop.latitude);
      const longitude = Number(stop.longitude);
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        stopPoints.push([latitude, longitude]);
      }
    }

    const points = routePoints.length > 0 ? routePoints : stopPoints;
    if (points.length === 0) return;

    const routeColor = /^#[\da-f]{6}$/i.test(job.color) ? job.color : '#db2777';
    this.detailMap = L.map(element).setView(points[0]!, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.detailMap);

    if (routePoints.length > 1) {
      L.polyline(routePoints, { color: routeColor, weight: 5, opacity: 0.9 }).addTo(this.detailMap);
      L.circleMarker(routePoints[0]!, {
        radius: 8,
        color: '#fff',
        weight: 2,
        fillColor: '#0f172a',
        fillOpacity: 1,
      })
        .bindPopup('จุดเริ่มต้น: ร้าน')
        .addTo(this.detailMap);
    }

    stops.forEach((stop) => {
      const latitude = Number(stop.latitude);
      const longitude = Number(stop.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      const icon = L.divIcon({
        className: 'delivery-job-stop-marker',
        html: `<span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border:2px solid white;border-radius:50%;background:${routeColor};color:white;font-weight:700;box-shadow:0 1px 4px #555">${stop.stop_sequence}</span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      const popup = document.createElement('div');
      popup.textContent = `จุดที่ ${stop.stop_sequence} — ${stop.customer_name} (${stop.quantity} กล่อง)`;
      L.marker([latitude, longitude], { icon }).bindPopup(popup).addTo(this.detailMap!);
    });

    this.detailMap.fitBounds(L.latLngBounds(points).pad(0.15));
    setTimeout(() => this.detailMap?.invalidateSize(), 0);
  }

  stopRouteText(): string {
    const job = this.selected();
    if (!job) return '';

    const stops = [...job.stops].sort(
      (first, second) => first.stop_sequence - second.stop_sequence,
    );
    const stopNames: string[] = [];

    for (const stop of stops) {
      stopNames.push(`จุดที่ ${stop.stop_sequence}`);
    }

    return stopNames.join(' → ');
  }
}
