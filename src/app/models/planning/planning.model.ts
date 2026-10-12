export interface RiderModel {
  id: number;
  name: string;
  phone: string;
}

export interface ShopModel {
  id: number;
  name: string;
  latitude: string | number;
  longitude: string | number;
  price_per_box?: string | number;
  cost_per_box?: string | number;
}

export interface RouteStopModel {
  order_id: number;
  stop_sequence: number;
  customer_name: string;
  phone: string;
  address: string;
  latitude: number | string;
  longitude: number | string;
  quantity: number;
  arrival_time: string;
  distance_from_previous_km: number | string;
}

export interface PlannedRouteModel {
  route_id: number;
  rider_id: number;
  rider_number: number;
  rider_name: string;
  rider_phone: string;
  color: string;
  total_boxes: number;
  distance_km: number;
  duration_minutes: number;
  delivery_cost: number;
  job_code: string;
  navigation_url: string;
  geometry: number[][];
  stops: RouteStopModel[];
}

export interface PlanResultModel {
  plan_id: number;
  delivery_date: string;
  departure_time: string;
  deadline_time: string;
  rider_count: number;
  total_orders: number;
  total_boxes: number;
  distance_km: number;
  delivery_cost: number;
  revenue: number;
  food_cost: number;
  profit: number;
  last_arrival_time: string;
  all_on_time: boolean;
  shop: {
    name: string;
    latitude: number;
    longitude: number;
  };
  routes: PlannedRouteModel[];
}
