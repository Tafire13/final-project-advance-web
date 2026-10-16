import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { Dashboard } from './dashboard';
import { API_BASE_URL } from '../../config/api.config';
import type { DashboardModel } from '../../models/dashboard/dashboard.model';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let http: HttpTestingController;
  const summary: DashboardModel = {
    delivery_date: '2026-10-15', total_orders: 4, total_boxes: 5,
    pending_orders: 2, delivered_orders: 1, cancelled_orders: 1,
    rider_count: 2, plan_matches_orders: true,
    latest_plan: {
      plan_id: 9, total_orders: 3, total_boxes: 5, rider_count: 2,
      revenue: 325, food_cost: 200, delivery_cost: 50, total_cost: 250,
      profit: 75, last_arrival_time: '12:15:00', all_on_time: true
    }
  };
  const endpoint = (date = '2026-10-15') => `${API_BASE_URL}/dashboard?date=${date}`;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-14T18:30:00Z'));
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    http.verify({ ignoreCancelled: true });
    vi.useRealTimers();
  });

  it('loads the Bangkok day and renders status progress excluding cancelled orders', () => {
    expect(fixture.componentInstance.deliveryDate).toBe('2026-10-15');
    http.expectOne(endpoint()).flush(summary);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    expect(page.textContent).toContain('฿325.00');
    expect(page.textContent).toContain('฿250.00');
    expect(page.textContent).toContain('฿75.00');
    expect(page.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('33');
    expect(page.textContent).not.toContain('ออเดอร์ปัจจุบันไม่ตรงกับแผนล่าสุด');
  });

  it('cancels old date requests and clears previously displayed data', () => {
    const first = http.expectOne(endpoint());
    fixture.componentInstance.onDateChange('2026-10-14');
    expect(first.cancelled).toBe(true);
    expect(fixture.componentInstance.summary()).toBeNull();
    http.expectOne(endpoint('2026-10-14')).flush({ ...summary, delivery_date: '2026-10-14' });
    fixture.detectChanges();
    expect(fixture.componentInstance.summary()?.delivery_date).toBe('2026-10-14');
  });

  it('shows errors and retries the same selected date', () => {
    http.expectOne(endpoint()).flush({ error: 'Database error' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Database error');
    expect(fixture.componentInstance.summary()).toBeNull();
    fixture.componentInstance.loadDashboard();
    http.expectOne(endpoint()).flush(summary);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('shows no-order and no-plan states without inventing financial totals', () => {
    http.expectOne(endpoint()).flush({
      ...summary, total_orders: 0, total_boxes: 0, pending_orders: 0,
      delivered_orders: 0, cancelled_orders: 0, rider_count: 0,
      latest_plan: null, plan_matches_orders: false
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('ยังไม่มีออเดอร์ในวันที่เลือก');
    expect(fixture.nativeElement.textContent).toContain('ยังไม่มีแผนจัดส่งในวันที่เลือก');
    expect(fixture.nativeElement.textContent).not.toContain('฿0.00');
    expect(fixture.componentInstance.completionPercent()).toBe(0);
  });

  it('flags a stale plan and displays negative profit', () => {
    http.expectOne(endpoint()).flush({
      ...summary, plan_matches_orders: false,
      latest_plan: { ...summary.latest_plan!, profit: -12.5, all_on_time: false }
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('ออเดอร์ปัจจุบันไม่ตรงกับแผนล่าสุด');
    expect(fixture.nativeElement.textContent).toContain('฿-12.50');
    expect(fixture.nativeElement.textContent).toContain('มีจุดส่งเกินเวลา');
  });

  it('validates an empty date locally and restores today', () => {
    const first = http.expectOne(endpoint());
    fixture.componentInstance.onDateChange('');
    expect(first.cancelled).toBe(true);
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.errorMsg()).toContain('กรุณาเลือกวันที่');
    http.expectNone(request => request.url.startsWith(`${API_BASE_URL}/dashboard`));
    fixture.componentInstance.selectToday();
    http.expectOne(endpoint()).flush(summary);
  });

  it('cancels the pending request when leaving the page', () => {
    const request = http.expectOne(endpoint());
    fixture.destroy();
    expect(request.cancelled).toBe(true);
  });
});
