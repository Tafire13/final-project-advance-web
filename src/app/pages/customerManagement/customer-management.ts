import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../services/api';
import type { CustomerModel } from '../../models/app.model';

@Component({
                selector: 'app-customer',
                standalone: true,
                imports: [CommonModule, FormsModule],
                templateUrl: './customer-management.html'
})
export class CustomerManagement implements OnInit {
                customers: CustomerModel[] = [];
                selectedCustomerForMap: CustomerModel | null = null;
                mapUrl: SafeResourceUrl | null = null;

                isEdit = false;
                currentId: number | string = '';

                form = {
                                name: '',
                                phone: '',
                                address: '',
                                latitude: '16.2462',
                                longitude: '103.2519'
                };

                constructor(
                                private api: ApiService,
                                private sanitizer: DomSanitizer
                ) { }

                ngOnInit(): void {
                                this.loadCustomers();
                }

                loadCustomers(): void {
                                this.api.getCustomers().subscribe({
                                                next: (data) => (this.customers = data),
                                                error: (err) => console.error('Failed to load customers', err)
                                });
                }

                onEdit(cust: CustomerModel): void {
                                this.isEdit = true;
                                this.currentId = cust.id;
                                this.form = {
                                                name: cust.name,
                                                phone: cust.phone,
                                                address: cust.address,
                                                latitude: cust.latitude,
                                                longitude: cust.longitude
                                };
                }

                onSubmit(): void {
                                if (!this.form.name.trim() || !this.form.phone.trim()) {
                                                alert('กรุณากรอกชื่อและเบอร์โทรให้ครบถ้วน');
                                                return;
                                }

                                const req$ = this.isEdit
                                                ? this.api.updateCustomerByID(String(this.currentId), this.form)
                                                : this.api.createCustomer(this.form);

                                req$.subscribe({
                                                next: () => {
                                                                alert(this.isEdit ? 'อัปเดตข้อมูลแล้ว' : 'เพิ่มลูกค้าเรียบร้อย');
                                                                this.resetForm();
                                                                this.loadCustomers();
                                                },
                                                error: (err) => {
                                                                console.error('Submit error:', err);
                                                                alert('เกิดข้อผิดพลาด ลองใหม่อีกครั้ง');
                                                }
                                });
                }

                onDelete(id: number | string): void {
                                if (!id) {
                                                alert('ไม่พบ ID ลูกค้า');
                                                return;
                                }
                                if (!confirm('ยืนยันลบลูกค้ารายนี้ ?')) return;

                                this.api.deleteCustomerByID(String(id)).subscribe({
                                                next: () => {
                                                                alert('ลบข้อมูลเรียบร้อย');
                                                                this.loadCustomers();
                                                },
                                                error: (err) => {
                                                                console.error('Delete error:', err);
                                                                alert('ลบไม่สำเร็จ');
                                                }
                                });
                }

                openMapModal(cust: CustomerModel): void {
                                this.selectedCustomerForMap = cust;
                                const rawUrl = `https://maps.google.com/maps?q=${cust.latitude},${cust.longitude}&hl=th&z=15&output=embed`;
                                this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
                }

                closeMapModal(): void {
                                this.selectedCustomerForMap = null;
                                this.mapUrl = null;
                }

                resetForm(): void {
                                this.isEdit = false;
                                this.currentId = '';
                                this.form = {
                                                name: '',
                                                phone: '',
                                                address: '',
                                                latitude: '16.2462',
                                                longitude: '103.2519'
                                };
                }
}