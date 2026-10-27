export interface ShopModel {
  id: number;
  name: string;
  latitude: string | number;
  longitude: string | number;
  price_per_box?: string | number;
  cost_per_box?: string | number;
}

export interface PlannedStopModel {
  id: number;
  customer_id: number;
  quantity: number;
  customer_name: string;
  phone?: string;
  address?: string;
  latitude: number | string;
  longitude: number | string;
  stop_sequence: number;
  arrival_time?: string;
  distance_from_previous_km?: number;
}

export interface PlannedRouteModel {
  plan_id?: number;
  route_id?: number;
  job_code?: string;
  color?: string;
  delivery_cost?: number;
  navigation_url?: string;
  rider: {
    id: number;
    name: string;
    phone: string;
  };
  total_boxes: number;
  stops: PlannedStopModel[];
  distance_km: number;
  travel_minutes: number;
  geometry: [number, number][];
}

export interface PlanResultModel {
  plan_id: number;
  delivery_date: string;
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
  routes: PlannedRouteModel[];
}

// ใช้แสดงจุดส่งในใบงานไรเดอร์
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
