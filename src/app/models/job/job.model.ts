import type { RouteStopModel } from '../planning/planning.model';

export interface DeliveryJobModel {
  job_code: string;
  delivery_date: string;
  plan_id: number;
  route_id: number;
  rider_number: number;
  rider_id: number;
  rider_name: string;
  rider_phone: string;
  color: string;
  total_boxes: number;
  distance_km: number | string;
  duration_minutes: number;
  delivery_cost: number | string;
  navigation_url: string;
  total_orders: number;
}

export interface DeliveryJobDetailModel extends DeliveryJobModel {
  departure_time: string;
  deadline_time: string;
  last_arrival_time: string;
  all_on_time: number | boolean;
  geometry: number[][] | string;
  stops: RouteStopModel[];
}
