export type ProjectStatus = 'ongoing' | 'done' | 'maintenance' | 'cancelled';
export type OrderStatus = 'new' | 'contacted' | 'deal' | 'rejected';
export type WebsiteCategory = 'Landing Page' | 'Company Profile' | 'Sekolah' | 'Toko Online';

export type TechStackCategory = 
  | 'Frontend' 
  | 'Auth' 
  | 'Database' 
  | 'Storage' 
  | 'Hosting' 
  | 'Email Service' 
  | 'Payment' 
  | 'Other';

export interface TechStackItem {
  category: TechStackCategory;
  service: string;
  email: string;
  notes?: string;
}

export interface ProjectScreenshot {
  url: string;
  caption: string;
}

export interface Project {
  id: string;
  created_at?: string;
  
  // Client info
  client_name: string;
  client_wa: string;
  client_email: string;
  
  // Project info
  project_name: string;
  website_category?: WebsiteCategory | '';
  internal_notes: string;
  status: ProjectStatus;
  start_date: string; // ISO date format YYYY-MM-DD
  deadline: string; // ISO date YYYY-MM-DD
  total_price: number;
  dp_paid: number;
  
  // Tech stack stored as dynamic items list
  tech_stack: TechStackItem[];
  
  // Portfolio setting
  is_public: boolean;
  public_name: string;
  screenshot_url: string;
  screenshot_gallery?: ProjectScreenshot[];
  live_url: string;
  description: string;
}

export interface Order {
  id: string;
  created_at?: string;
  full_name: string;
  whatsapp: string;
  email: string;
  website_type: string;
  description: string;
  budget: string;
  deadline: string;
  status: OrderStatus;
}

export interface DatabaseState {
  isSupabase: boolean;
  connected: boolean;
  message: string;
}
