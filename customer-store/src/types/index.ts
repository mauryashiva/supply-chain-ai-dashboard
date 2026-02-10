// src/types/index.ts
export interface MediaItem {
  id: number;
  media_url: string; // Backend se yahi key aa rahi hai
  media_type: "image" | "video";
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  selling_price: number;
  stock_quantity: number;
  category?: string;
  images?: MediaItem[];
}

export interface DemandForecastPoint {
  date: string;
  value: number;
}

export interface DemandForecast {
  forecast: DemandForecastPoint[];
}
