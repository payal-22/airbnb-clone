export interface Host {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
}

export interface Listing {
  id: number;
  host_id: number;
  title: string;
  description: string;
  location: string;
  country: string;
  property_type: string;
  category: string;
  price_per_night: number;
  cleaning_fee: number;
  service_fee: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  rating: number;
  review_count: number;
  image_url: string;
  image_urls: string | null;
  amenities: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string;
  host: Host | null;
}

export interface PaginatedListings {
  items: Listing[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}