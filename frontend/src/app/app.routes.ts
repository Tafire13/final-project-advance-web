import { Routes } from '@angular/router';
import { CustomerManagement } from './pages/customerManagement/customer-management';
import { OrderManagement } from './pages/orderManagement/order-mangement';

export const routes: Routes = [
  { path: '', redirectTo: 'customers', pathMatch: 'full' }, 
  { path: 'customers', component: CustomerManagement },
  { path: 'orders', component: OrderManagement },
];