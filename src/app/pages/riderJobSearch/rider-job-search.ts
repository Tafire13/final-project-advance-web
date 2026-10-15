import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { DeliveryJobDetailModel } from '../../models/job/job.model';
import { JobApiService } from '../../services/job/job-api.service';

@Component({
  selector: 'app-rider-job-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './rider-job-search.html'
})
export class RiderJobSearch implements OnInit {
  code = '';
  readonly loading = signal(false);
  readonly error = signal('');
  readonly job = signal<DeliveryJobDetailModel | null>(null);

  constructor(
    private jobApi: JobApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // อ่านเลขใบงานจาก URL เช่น /rider/JOB000001-01
    this.route.paramMap.subscribe((params) => {
      this.code = params.get('code') || '';
      this.error.set('');
      this.job.set(null);

      if (this.code) {
        this.loadJob(this.code);
      }
    });
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

  loadJob(code: string): void {
    if (code.length > 32) {
      this.error.set('เลขใบงานต้องไม่เกิน 32 ตัวอักษร');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.job.set(null);

    this.jobApi.getJobByCode(code).subscribe({
      next: (data) => {
        data.stops.sort((a, b) => a.stop_sequence - b.stop_sequence);
        this.job.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.error.set('ไม่พบใบงานนี้ กรุณาตรวจสอบเลขใบงานกับร้านแล้วลองอีกครั้ง');
        } else {
          this.error.set('ค้นหาใบงานไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง');
        }
      }
    });
  }
}
