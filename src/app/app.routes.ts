import { Routes } from '@angular/router';
import { CustomerManagement } from './pages/customerManagement/customer-management';
import { OrderManagement } from './pages/orderManagement/order-mangement';
import { RoutePlanning } from './pages/routePlanning/route-planning';
import { DeliveryJobs } from './pages/deliveryJobs/delivery-jobs';
import { RiderJobSearch } from './pages/riderJobSearch/rider-job-search';
import { Dashboard } from './pages/dashboard/dashboard';

export const routes: Routes = [
  { path: '', redirectTo: 'customers', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'customers', component: CustomerManagement },
  { path: 'orders', component: OrderManagement },
  { path: 'route', component: RoutePlanning },
  { path: 'jobs', component: DeliveryJobs },
  {
    path: 'rider',
    component: RiderJobSearch,
    title: 'ค้นหาใบงานไรเดอร์'
  },
  {
    path: 'rider/:code',
    component: RiderJobSearch,
    title: 'ใบงานไรเดอร์'
  }
];
