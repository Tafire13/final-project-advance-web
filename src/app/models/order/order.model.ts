import type { CustomerModel } from '../customer/customer.model';

export interface OrderModel {
  id: number;
  customer_id: number;
  quantity: number;
  order_date: string;
  status: string;
  is_demo: number;
  customer?: CustomerModel;
}

export interface CreateOrderModel {
  customer_id: number;
  quantity: number;
  order_date: string;
}

export interface UpdateOrderModel {
  customer_id?: number;
  quantity?: number;
  order_date?: string;
  status?: string;
}

export interface ClearDemoOrderResponse {
  message: string;
  deleted_orders: number;
}

export interface RandomOrderResponse {
  message: string;
  amount: number;
  unique_customers: number;
  unique_delivery_points: number;
  orders: OrderModel[];
}
