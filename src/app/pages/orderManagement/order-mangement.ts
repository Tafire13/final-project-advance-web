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
            }
        });
    }

    onSaveOrder(): void {
        if (!this.selectedCustomerId && this.selectedCustomerId !== 0) {
            alert('กรุณาเลือกลูกค้าก่อนสั่งซื้อ');
            return;
        }

        if (this.quantity < 1 || this.quantity > 3) {
            alert('สั่งซื้อได้ 1-3 กล่องเท่านั้น');
            return;
        }

        const payload = {
            customer_id: Number(this.selectedCustomerId),
            quantity: Number(this.quantity),
            order_date: this.orderDate
        };

        if (this.isEditMode && this.editingOrderId !== null) {
            this.orderApi.updateOrderByID(this.editingOrderId, payload).subscribe({
                next: () => {
                    alert('แก้ไขออเดอร์สำเร็จ');
                    this.resetForm();
                    this.reloadAllData();
                },
                error: (err: any) => alert(err.error?.error || 'ไม่สามารถแก้ไขออเดอร์ได้')
            });
        } else {
            this.orderApi.createOrder(payload).subscribe({
                next: () => {
                    alert('สร้างรายการออเดอร์สำเร็จ');
                    this.resetForm();
                    this.reloadAllData();
                },
                error: (err: any) => alert(err.error?.error || 'ไม่สามารถสร้างออเดอร์ได้')
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

        if (!Number.isInteger(amount) || amount < 20 || amount > 30) {
            alert('จำนวนออเดอร์จำลองต้องเป็นจำนวนเต็มระหว่าง 20-30 รายการ');
            return;
        }

        this.orderApi.randomOrder(this.randomAmount).subscribe({
            next: () => {
                alert(`สุ่มออเดอร์สำเร็จจำนวน ${this.randomAmount} รายการ`);
                this.reloadAllData();
            },
            error: (err: any) => {
                console.error(err);
                alert(err?.error?.error || 'ไม่สามารถสุ่มออเดอร์ได้');
            }
        });
    }

    onCancel(id: number): void {
        if (!confirm('ต้องการลบรายการออเดอร์นี้ใช่หรือไม่ ?')) return;

        this.orderApi.deleteOrderByID(id).subscribe({
            next: () => this.reloadAllData(),
            error: (err: any) => alert(err.error?.error || 'เกิดข้อผิดพลาด')
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
        this.ordersLoading.set(true);

        this.orderApi.clearDemoOrder().subscribe({
            next: () => {
                this.reloadAllData();
            },
            error: (err: any) => {
                this.ordersLoading.set(false);
                alert(err.error?.error || 'เกิดข้อผิดพลาด');
            }
        });
    }
}
