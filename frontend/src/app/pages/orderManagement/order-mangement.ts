import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api';
import type { CustomerModel, OrderModel } from '../../models/app.model';

@Component({
                selector: 'app-order',
                standalone: true,
                imports: [CommonModule, FormsModule, RouterModule],
                templateUrl: './order-management.html'
})
export class OrderManagement implements OnInit {
                orders: OrderModel[] = [];
                customers: CustomerModel[] = [];

                isEditMode = false;
                editingOrderId: number | null = null;

                selectedCustomerId: string | number = '';
                quantity = 1;
                orderDate = new Date().toISOString().split('T')[0];
                randomAmount = 10;

                constructor(private api: ApiService) { }

                ngOnInit(): void {
                                this.reloadAllData();
                }

                reloadAllData(): void {
                                this.api.getOrder().subscribe({
                                                next: (res) => (this.orders = res || []),
                                                error: (err) => console.error('Error fetching orders:', err)
                                });

                                this.api.getCustomers().subscribe({
                                                next: (res) => (this.customers = res || []),
                                                error: (err) => console.error('Error fetching customers:', err)
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
                                                this.api.updateOrderByID(this.editingOrderId, payload).subscribe({
                                                                next: () => {
                                                                                alert('แก้ไขออเดอร์สำเร็จ');
                                                                                this.resetForm();
                                                                                this.reloadAllData();
                                                                },
                                                                error: (err: any) => alert(err.error?.error || 'ไม่สามารถแก้ไขออเดอร์ได้')
                                                });
                                } else {
                                                this.api.createOrder(payload).subscribe({
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
                                this.api.randomOrder(this.randomAmount).subscribe({
                                                next: () => {
                                                                alert(`สุ่มออเดอร์สำเร็จจำนวน ${this.randomAmount} รายการ`);
                                                                this.reloadAllData();
                                                },
                                                error: (err: unknown) => {
                                                                console.error(err);
                                                                alert('ไม่สามารถสุ่มออเดอร์ได้');
                                                }
                                });
                }

                onCancel(id: number): void {
                                if (!confirm('ยกเลิกรายการออเดอร์นี้ ?')) return;

                                this.api.deleteOrderByID(id).subscribe({
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
}