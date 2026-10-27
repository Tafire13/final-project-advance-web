import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CustomerApiService } from '../../services/customer/customer-api.service';
import type { CustomerModel } from '../../models/customer/customer.model';

@Component({
    selector: 'app-customer',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './customer-management.html'
})
export class CustomerManagement implements OnInit {
    private customerApi = inject(CustomerApiService);
    private sanitizer = inject(DomSanitizer);

    readonly customers = signal<CustomerModel[]>([]);
    readonly loading = signal(false);
    readonly listError = signal('');
    readonly listMessage = signal('');
    readonly formError = signal('');
    readonly formMessage = signal('');
    readonly saving = signal(false);
    selectedCustomerForMap: CustomerModel | null = null;
    mapUrl: SafeResourceUrl | null = null;
    searchText = signal('');

    isEdit = false;
    currentId: number | string = '';

    form = {
        name: '',
        phone: '',
        address: '',
        latitude: '16.2462',
        longitude: '103.2519'
    };


    ngOnInit(): void {
        this.loadCustomers();
    }

    searchCustomerByName() {
        const keyword = this.searchText().trim();
        this.listError.set('');
        this.listMessage.set('');

        if (!keyword) {
            this.loadCustomers();
            return;
        }

        this.loading.set(true);
        this.customerApi.searchCustomerByName(keyword).subscribe({
            next: (data) => {
                this.customers.set(data || []);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to search customers', err);
                this.loading.set(false);
                this.listError.set('ค้นหาลูกค้าไม่สำเร็จ กรุณาลองอีกครั้ง');
            }
        });
    }

    loadCustomers(): void {
        this.loading.set(true);
        this.listError.set('');
        this.customerApi.getCustomers().subscribe({
            next: (data) => {
                this.customers.set(data || []);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load customers', err);
                this.loading.set(false);
                this.listError.set('โหลดรายชื่อลูกค้าไม่สำเร็จ กรุณากดโหลดข้อมูลใหม่');
            }
        });
    }

    onEdit(cust: CustomerModel): void {
        this.isEdit = true;
        this.formError.set('');
        this.formMessage.set('');
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
        this.formError.set('');
        this.formMessage.set('');
        if (!this.form.name.trim() || !this.form.phone.trim()) {
            this.formError.set('กรุณากรอกชื่อและเบอร์โทรศัพท์ให้ครบ');
            return;
        }

        const wasEdit = this.isEdit;
        this.saving.set(true);
        const req$ = this.isEdit
            ? this.customerApi.updateCustomerByID(String(this.currentId), this.form)
            : this.customerApi.createCustomer(this.form);

        req$.subscribe({
            next: () => {
                this.saving.set(false);
                this.resetForm();
                this.formMessage.set(wasEdit ? 'บันทึกการแก้ไขลูกค้าแล้ว' : 'เพิ่มลูกค้าเรียบร้อยแล้ว');
                this.loadCustomers();
            },
            error: (err) => {
                console.error('Submit error:', err);
                this.saving.set(false);
                this.formError.set(err?.error?.error || 'บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบแล้วลองอีกครั้ง');
            }
        });
    }

    onDelete(id: number | string): void {
        if (!id) {
            alert('ไม่พบ ID ลูกค้า');
            return;
        }
        if (!confirm('ยืนยันลบลูกค้ารายนี้ ?')) return;

        this.customerApi.deleteCustomerByID(String(id)).subscribe({
            next: () => {
                this.listMessage.set('ลบข้อมูลลูกค้าเรียบร้อยแล้ว');
                this.loadCustomers();
            },
            error: (err) => {
                console.error('Delete error:', err);
                this.listError.set(err?.error?.error || 'ลบข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง');
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
        this.formError.set('');
        this.formMessage.set('');
        this.saving.set(false);
        this.form = {
            name: '',
            phone: '',
            address: '',
            latitude: '16.2462',
            longitude: '103.2519'
        };
    }
}
