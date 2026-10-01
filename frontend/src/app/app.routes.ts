import { Routes } from '@angular/router';
import { CustomerManagement } from './pages/customerManagement/customer-management';
import { OrderManagement } from './pages/orderManagement/order-mangement';
import { RoutePlanning } from './pages/routePlanning/route-planning';
import { DeliveryJobs } from './pages/deliveryJobs/delivery-jobs';

export const routes: Routes = [
  { path: '', redirectTo: 'customers', pathMatch: 'full' }, 
  { path: 'customers', component: CustomerManagement },
  { path: 'orders', component: OrderManagement },
  { path: 'route', component: RoutePlanning },
  { path: 'jobs', component: DeliveryJobs },
];