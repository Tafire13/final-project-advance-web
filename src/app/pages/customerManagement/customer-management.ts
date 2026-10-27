import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { lastValueFrom } from 'rxjs';
import { CustomerApiService } from '../../services/customer/customer-api.service';
import type { CustomerModel } from '../../models/customer/customer.model';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-management.html'
})
export class CustomerManagement implements OnInit {
  private readonly customerApi = inject(CustomerApiService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly customers = signal<CustomerModel[]>([]);
  readonly loading = signal(false);
  readonly listError = signal('');
  readonly listMessage = signal('');
  readonly formError = signal('');
  readonly saving = signal(false);

  searchText = signal('');
  selectedCustomerForMap: CustomerModel | null = null;
  mapUrl: SafeResourceUrl | null = null;
  showFormModal = false;
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

  async searchCustomerByName(): Promise<void> {
    const keyword = this.searchText().trim();

    this.listError.set('');
    this.listMessage.set('');

    if (!keyword) {
      await this.loadCustomers();
      return;
    }

    this.loading.set(true);

    try {
      const customers = await lastValueFrom(
        this.customerApi.searchCustomerByName(keyword)
      );
      this.customers.set(customers || []);
    } catch (error) {
      console.error('Failed to search customers:', error);
      this.listError.set('ค้นหาลูกค้าไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      this.loading.set(false);
    }
  }

  async loadCustomers(): Promise<void> {
    this.loading.set(true);
    this.listError.set('');

    try {
      const customers = await lastValueFrom(this.customerApi.getCustomers());
      this.customers.set(customers || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
      this.listError.set('โหลดรายชื่อลูกค้าไม่สำเร็จ กรุณากดโหลดข้อมูลใหม่');
    } finally {
      this.loading.set(false);
    }
  }

  openCreateModal(): void {
    this.resetForm();
    this.listMessage.set('');
    this.showFormModal = true;
  }

  onEdit(customer: CustomerModel): void {
    this.isEdit = true;
    this.currentId = customer.id;
    this.formError.set('');
    this.listMessage.set('');

    this.form = {
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      latitude: customer.latitude,
      longitude: customer.longitude
    };
    this.showFormModal = true;
  }

  async onSubmit(): Promise<void> {
    this.formError.set('');
    this.listMessage.set('');

    if (!this.form.name.trim() || !this.form.phone.trim()) {
      this.formError.set('กรุณากรอกชื่อและเบอร์โทรศัพท์ให้ครบ');
      return;
    }

    const wasEdit = this.isEdit;
    this.saving.set(true);

    try {
      if (wasEdit) {
        await lastValueFrom(
          this.customerApi.updateCustomerByID(String(this.currentId), this.form)
        );
      } else {
        await lastValueFrom(this.customerApi.createCustomer(this.form));
      }

      this.resetForm();
      this.listMessage.set(wasEdit ? 'บันทึกการแก้ไขลูกค้าแล้ว' : 'เพิ่มลูกค้าเรียบร้อยแล้ว');
      await this.loadCustomers();
    } catch (error: any) {
      console.error('Failed to save customer:', error);
      this.formError.set(
        error?.error?.error || 'บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบแล้วลองอีกครั้ง'
      );
    } finally {
      this.saving.set(false);
    }
  }

  async onDelete(id: number | string): Promise<void> {
    if (!id) {
      this.listError.set('ไม่พบ ID ลูกค้า');
      return;
    }

    if (!confirm('ยืนยันลบลูกค้ารายนี้ ?')) return;

    try {
      await lastValueFrom(this.customerApi.deleteCustomerByID(String(id)));
      this.listMessage.set('ลบข้อมูลลูกค้าเรียบร้อยแล้ว');
      await this.loadCustomers();
    } catch (error: any) {
      console.error('Failed to delete customer:', error);
      this.listError.set(error?.error?.error || 'ลบข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง');
    }
  }

  openMapModal(customer: CustomerModel): void {
    this.selectedCustomerForMap = customer;
    const url = `https://maps.google.com/maps?q=${customer.latitude},${customer.longitude}&hl=th&z=15&output=embed`;
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  closeMapModal(): void {
    this.selectedCustomerForMap = null;
    this.mapUrl = null;
  }

  closeFormModal(): void {
    if (this.saving()) return;
    this.resetForm();
  }

  resetForm(): void {
    this.showFormModal = false;
    this.isEdit = false;
    this.currentId = '';
    this.formError.set('');

    this.form = {
      name: '',
      phone: '',
      address: '',
      latitude: '16.2462',
      longitude: '103.2519'
    };
  }
}
