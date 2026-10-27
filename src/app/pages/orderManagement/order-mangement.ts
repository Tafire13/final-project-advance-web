import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { CustomerApiService } from '../../services/customer/customer-api.service';
import { OrderApiService } from '../../services/order/order-api.service';
import type { CustomerModel } from '../../models/customer/customer.model';
import type { OrderModel } from '../../models/order/order.model';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './order-management.html'
})
export class OrderManagement implements OnInit {
  private readonly orderApi = inject(OrderApiService);
  private readonly customerApi = inject(CustomerApiService);

  readonly orders = signal<OrderModel[]>([]);
  readonly customers = signal<CustomerModel[]>([]);
  readonly ordersLoading = signal(false);
  readonly customersLoading = signal(false);
  readonly loading = computed(() => this.ordersLoading() || this.customersLoading());
  readonly listError = signal('');
  readonly actionError = signal('');
  readonly actionMessage = signal('');
  readonly actionLoading = signal(false);

  isEditMode = false;
  editingOrderId: number | null = null;
  selectedCustomerId: string | number = '';
  quantity = 1;
  orderDate = new Date().toISOString().split('T')[0];
  randomAmount = 20;

  ngOnInit(): void {
    this.reloadAllData();
  }

  reloadAllData(): void {
    this.loadOrders();
    this.loadCustomers();
  }

  async loadOrders(): Promise<void> {
    this.ordersLoading.set(true);
    this.listError.set('');

    try {
      const orders = await lastValueFrom(this.orderApi.getOrder());
      this.orders.set(orders || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      this.listError.set('โหลดรายการออเดอร์ไม่สำเร็จ กรุณากดโหลดข้อมูลใหม่');
    } finally {
      this.ordersLoading.set(false);
    }
  }

  async loadCustomers(): Promise<void> {
    this.customersLoading.set(true);

    try {
      const customers = await lastValueFrom(this.customerApi.getCustomers());
      this.customers.set(customers || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
      this.actionError.set('โหลดรายชื่อลูกค้าไม่สำเร็จ จึงยังสร้างออเดอร์ไม่ได้');
    } finally {
      this.customersLoading.set(false);
    }
  }

  async onSaveOrder(): Promise<void> {
    this.actionError.set('');
    this.actionMessage.set('');

    if (!this.selectedCustomerId && this.selectedCustomerId !== 0) {
      this.actionError.set('กรุณาเลือกลูกค้าก่อนสั่งซื้อ');
      return;
    }

    if (this.quantity < 1 || this.quantity > 3) {
      this.actionError.set('จำนวนกล่องต้องอยู่ระหว่าง 1–3 กล่อง');
      return;
    }

    const order = {
      customer_id: Number(this.selectedCustomerId),
      quantity: Number(this.quantity),
      order_date: this.orderDate
    };

    this.actionLoading.set(true);

    try {
      if (this.isEditMode && this.editingOrderId !== null) {
        await lastValueFrom(
          this.orderApi.updateOrderByID(this.editingOrderId, order)
        );
        this.actionMessage.set('แก้ไขออเดอร์เรียบร้อยแล้ว');
      } else {
        await lastValueFrom(this.orderApi.createOrder(order));
        this.actionMessage.set('สร้างรายการออเดอร์เรียบร้อยแล้ว');
      }

      this.resetForm();
      this.reloadAllData();
    } catch (error: any) {
      console.error('Failed to save order:', error);
      this.actionError.set(
        error?.error?.error || 'บันทึกออเดอร์ไม่สำเร็จ กรุณาลองอีกครั้ง'
      );
    } finally {
      this.actionLoading.set(false);
    }
  }

  onEditOrder(order: OrderModel): void {
    if (!order.id) {
      this.actionError.set('ไม่พบ ID รายการออเดอร์');
      return;
    }

    this.isEditMode = true;
    this.editingOrderId = Number(order.id);
    this.selectedCustomerId = Number(order.customer_id);
    this.quantity = Number(order.quantity) || 1;

    if (order.order_date) {
      this.orderDate = new Date(order.order_date).toISOString().split('T')[0];
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async onRandom(): Promise<void> {
    const amount = Number(this.randomAmount);
    this.actionError.set('');
    this.actionMessage.set('');

    if (!Number.isInteger(amount) || amount < 20 || amount > 30) {
      this.actionError.set('จำนวนออเดอร์จำลองต้องเป็นจำนวนเต็มระหว่าง 20–30 รายการ');
      return;
    }

    this.actionLoading.set(true);

    try {
      const result = await lastValueFrom(this.orderApi.randomOrder(amount));
      this.actionMessage.set(
        `สร้างออเดอร์จำลอง ${result.amount} รายการ จากลูกค้า ${result.unique_customers} คน รวม ${result.unique_delivery_points} จุดส่ง`
      );
      this.reloadAllData();
    } catch (error: any) {
      console.error('Failed to create demo orders:', error);
      this.actionError.set(error?.error?.error || 'ไม่สามารถสุ่มออเดอร์ได้');
    } finally {
      this.actionLoading.set(false);
    }
  }

  async onCancel(id: number): Promise<void> {
    if (!confirm('ต้องการลบรายการออเดอร์นี้ใช่หรือไม่ ?')) return;

    this.actionError.set('');
    this.actionMessage.set('');
    this.actionLoading.set(true);

    try {
      await lastValueFrom(this.orderApi.deleteOrderByID(id));
      this.actionMessage.set('ลบออเดอร์เรียบร้อยแล้ว');
      this.reloadAllData();
    } catch (error: any) {
      console.error('Failed to delete order:', error);
      this.actionError.set(error?.error?.error || 'ลบออเดอร์ไม่สำเร็จ');
    } finally {
      this.actionLoading.set(false);
    }
  }

  async clearDemoOrder(): Promise<void> {
    this.actionError.set('');
    this.actionMessage.set('');
    this.actionLoading.set(true);

    try {
      const result = await lastValueFrom(this.orderApi.clearDemoOrder());
      this.actionMessage.set(result.message || 'ล้างออเดอร์จำลองเรียบร้อยแล้ว');
      this.reloadAllData();
    } catch (error: any) {
      console.error('Failed to clear demo orders:', error);
      this.actionError.set(error?.error?.error || 'ล้างออเดอร์จำลองไม่สำเร็จ');
    } finally {
      this.actionLoading.set(false);
    }
  }

  resetForm(): void {
    this.isEditMode = false;
    this.editingOrderId = null;
    this.selectedCustomerId = '';
    this.quantity = 1;
    this.orderDate = new Date().toISOString().split('T')[0];
  }
}
