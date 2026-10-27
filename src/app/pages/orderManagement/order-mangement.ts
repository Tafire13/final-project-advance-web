import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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

    constructor(
        private orderApi: OrderApiService,
        private customerApi: CustomerApiService
    ) { }

    ngOnInit(): void {
        this.reloadAllData();
    }

    reloadAllData(): void {
        this.listError.set('');
        this.ordersLoading.set(true);
        this.customersLoading.set(true);

        this.orderApi.getOrder().subscribe({
            next: (res) => {
                this.orders.set(res || []);
                this.ordersLoading.set(false);
            },
            error: (err) => {
                console.error('Error fetching orders:', err);
                this.ordersLoading.set(false);
                this.listError.set('โหลดรายการออเดอร์ไม่สำเร็จ กรุณากดโหลดข้อมูลใหม่');
            }
        });

        this.customerApi.getCustomers().subscribe({
            next: (res) => {
                this.customers.set(res || []);
                this.customersLoading.set(false);
            },
            error: (err) => {
                console.error('Error fetching customers:', err);
                this.customersLoading.set(false);
                this.actionError.set('โหลดรายชื่อลูกค้าไม่สำเร็จ จึงยังสร้างออเดอร์ไม่ได้');
            }
        });
    }

    onSaveOrder(): void {
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

        const payload = {
            customer_id: Number(this.selectedCustomerId),
            quantity: Number(this.quantity),
            order_date: this.orderDate
        };

        if (this.isEditMode && this.editingOrderId !== null) {
            this.actionLoading.set(true);
            this.orderApi.updateOrderByID(this.editingOrderId, payload).subscribe({
                next: () => {
                    this.actionLoading.set(false);
                    this.resetForm();
                    this.actionMessage.set('แก้ไขออเดอร์เรียบร้อยแล้ว');
                    this.reloadAllData();
                },
                error: (err: any) => {
                    this.actionLoading.set(false);
                    this.actionError.set(err.error?.error || 'ไม่สามารถแก้ไขออเดอร์ได้ กรุณาลองอีกครั้ง');
                }
            });
        } else {
            this.actionLoading.set(true);
            this.orderApi.createOrder(payload).subscribe({
                next: () => {
                    this.actionLoading.set(false);
                    this.resetForm();
                    this.actionMessage.set('สร้างรายการออเดอร์เรียบร้อยแล้ว');
                    this.reloadAllData();
                },
                error: (err: any) => {
                    this.actionLoading.set(false);
                    this.actionError.set(err.error?.error || 'ไม่สามารถสร้างออเดอร์ได้ กรุณาลองอีกครั้ง');
                }
            });
        }
    }

    onEditOrder(item: OrderModel): void {
        if (!item.id) {
            alert('ไม่พบ ID รายการออเดอร์');
            return;
        }

        this.isEditMode = true;
        this.editingOrderId = Number(item.id);

        this.selectedCustomerId = Number(item.customer_id);
        this.quantity = Number(item.quantity) || 1;

        if (item.order_date) {
            const formattedDate = new Date(item.order_date).toISOString().split('T')[0];
            this.orderDate = formattedDate;
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    onRandom(): void {
        const amount = Number(this.randomAmount);
        this.actionError.set('');
        this.actionMessage.set('');

        if (!Number.isInteger(amount) || amount < 20 || amount > 30) {
            this.actionError.set('จำนวนออเดอร์จำลองต้องเป็นจำนวนเต็มระหว่าง 20–30 รายการ');
            return;
        }

        this.actionLoading.set(true);
        this.orderApi.randomOrder(this.randomAmount).subscribe({
            next: (result) => {
                this.actionLoading.set(false);
                this.actionMessage.set(`สร้างออเดอร์จำลอง ${result.amount} รายการ จากลูกค้า ${result.unique_customers} คน รวม ${result.unique_delivery_points} จุดส่ง`);
                this.reloadAllData();
            },
            error: (err: any) => {
                console.error(err);
                this.actionLoading.set(false);
                this.actionError.set(err?.error?.error || 'ไม่สามารถสุ่มออเดอร์ได้ กรุณาลองอีกครั้ง');
            }
        });
    }

    onCancel(id: number): void {
        if (!confirm('ต้องการลบรายการออเดอร์นี้ใช่หรือไม่ ?')) return;

        this.actionError.set('');
        this.actionMessage.set('');
        this.actionLoading.set(true);
        this.orderApi.deleteOrderByID(id).subscribe({
            next: () => {
                this.actionLoading.set(false);
                this.actionMessage.set('ลบออเดอร์เรียบร้อยแล้ว');
                this.reloadAllData();
            },
            error: (err: any) => {
                this.actionLoading.set(false);
                this.actionError.set(err.error?.error || 'ลบออเดอร์ไม่สำเร็จ กรุณาลองอีกครั้ง');
            }
        });
    }

    resetForm(): void {
        this.isEditMode = false;
        this.editingOrderId = null;
        this.selectedCustomerId = '';
        this.quantity = 1;
        this.orderDate = new Date().toISOString().split('T')[0];
    }

    clearDemoOrder(): void {
        this.actionError.set('');
        this.actionMessage.set('');
        this.actionLoading.set(true);
        this.ordersLoading.set(true);

        this.orderApi.clearDemoOrder().subscribe({
            next: (result) => {
                this.actionLoading.set(false);
                this.actionMessage.set(result?.message || 'ล้างออเดอร์จำลองเรียบร้อยแล้ว');
                this.reloadAllData();
            },
            error: (err: any) => {
                this.actionLoading.set(false);
                this.ordersLoading.set(false);
                this.actionError.set(err.error?.error || 'ล้างออเดอร์จำลองไม่สำเร็จ กรุณาลองอีกครั้ง');
            }
        });
    }
}
