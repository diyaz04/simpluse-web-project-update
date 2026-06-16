import { createClient } from '@supabase/supabase-js';
import { Project, Order, OrderStatus } from '../types';

const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';
const isDemoMode = String(env.VITE_DEMO_MODE || '').toLowerCase() === 'true';

const isRealSupabase =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('YOUR_') &&
  supabaseAnonKey.length > 20;

export const supabase = isRealSupabase ? createClient(supabaseUrl, supabaseAnonKey) : null;

const DEMO_PROJECTS: Project[] = [
  {
    id: 'demo-project-1',
    client_name: 'CV Nusantara Sentosa',
    client_wa: '081234567890',
    client_email: 'nusantara@sentosa.example',
    project_name: 'Modern Landing Page - Nusantara Property',
    website_category: 'Landing Page',
    internal_notes: 'Data contoh untuk mode demo.',
    status: 'done',
    start_date: '2026-05-10',
    deadline: '2026-05-25',
    total_price: 3500000,
    dp_paid: 1750000,
    tech_stack: [
      { category: 'Frontend', service: 'React.js + Tailwind CSS', email: 'dev@example.test' },
      { category: 'Hosting', service: 'Vercel', email: 'hosting@example.test' },
      { category: 'Database', service: 'Supabase', email: 'admin@example.test' }
    ],
    is_public: true,
    public_name: 'Nusantara Residence Web Portal',
    screenshot_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
    screenshot_gallery: [
      {
        url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
        caption: 'Hero landing page properti dengan visual hunian modern.'
      },
      {
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        caption: 'Showcase interior dan area detail unit untuk calon pembeli.'
      }
    ],
    live_url: 'https://example.com',
    description: 'Demo landing page interaktif untuk properti, galeri, dan formulir kontak.'
  },
  {
    id: 'demo-project-2',
    client_name: 'Yayasan Bina Mulia',
    client_wa: '085712345678',
    client_email: 'info@binamulia.example',
    project_name: 'Company Profile & Akademik Portal',
    website_category: 'Sekolah',
    internal_notes: 'Data contoh untuk mode demo.',
    status: 'ongoing',
    start_date: '2026-06-01',
    deadline: '2026-06-30',
    total_price: 7500000,
    dp_paid: 4000000,
    tech_stack: [
      { category: 'Frontend', service: 'Next.js App Router', email: 'dev@example.test' },
      { category: 'Database', service: 'PostgreSQL Supabase', email: 'db@example.test' },
      { category: 'Auth', service: 'Supabase Auth', email: 'auth@example.test' }
    ],
    is_public: true,
    public_name: 'Official Web & Portal Akademik SMA Bina Mulia',
    screenshot_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80',
    screenshot_gallery: [
      {
        url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80',
        caption: 'Halaman profil sekolah dan informasi akademik utama.'
      },
      {
        url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
        caption: 'Preview konten kegiatan dan fasilitas pendidikan.'
      }
    ],
    live_url: 'https://example.com',
    description: 'Demo portal akademik dengan pengumuman, materi ajar, dan formulir PPDB.'
  }
];

const DEMO_ORDERS: Order[] = [
  {
    id: 'demo-order-1',
    created_at: '2026-06-05T09:00:00Z',
    full_name: 'Ahmad Faisal',
    whatsapp: '081299998888',
    email: 'faisal@example.test',
    website_type: 'Toko Online (E-Commerce)',
    description: 'Contoh order demo untuk toko online kerajinan.',
    budget: 'Rp 6.000.000 - Rp 10.000.000',
    deadline: '30 Hari',
    status: 'new'
  }
];

function requireSupabase() {
  if (!supabase || !isRealSupabase) {
    throw new Error('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY, atau aktifkan VITE_DEMO_MODE=true untuk sandbox lokal.');
  }
  return supabase;
}

function getDemoProjects(): Project[] {
  const local = localStorage.getItem('simpluse_demo_projects');
  if (!local) {
    localStorage.setItem('simpluse_demo_projects', JSON.stringify(DEMO_PROJECTS));
    return DEMO_PROJECTS;
  }
  return JSON.parse(local);
}

function setDemoProjects(projects: Project[]) {
  localStorage.setItem('simpluse_demo_projects', JSON.stringify(projects));
}

function getDemoOrders(): Order[] {
  const local = localStorage.getItem('simpluse_demo_orders');
  if (!local) {
    localStorage.setItem('simpluse_demo_orders', JSON.stringify(DEMO_ORDERS));
    return DEMO_ORDERS;
  }
  return JSON.parse(local);
}

function setDemoOrders(orders: Order[]) {
  localStorage.setItem('simpluse_demo_orders', JSON.stringify(orders));
}

function makeLocalProject(project: Partial<Project>): Project {
  return {
    id: 'demo-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    created_at: new Date().toISOString(),
    client_name: project.client_name || '',
    client_wa: project.client_wa || '',
    client_email: project.client_email || '',
    project_name: project.project_name || 'Project Baru',
    website_category: project.website_category || '',
    internal_notes: project.internal_notes || '',
    status: project.status || 'ongoing',
    start_date: project.start_date || new Date().toISOString().substring(0, 10),
    deadline: project.deadline || new Date().toISOString().substring(0, 10),
    total_price: Number(project.total_price) || 0,
    dp_paid: Number(project.dp_paid) || 0,
    tech_stack: project.tech_stack || [],
    is_public: project.is_public ?? false,
    public_name: project.public_name || '',
    screenshot_url: project.screenshot_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    screenshot_gallery: project.screenshot_gallery || [],
    live_url: project.live_url || '',
    description: project.description || ''
  };
}

function makeLocalOrder(order: Partial<Order>): Order {
  return {
    id: order.id || 'demo-order-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    created_at: order.created_at || new Date().toISOString(),
    full_name: order.full_name || '',
    whatsapp: order.whatsapp || '',
    email: order.email || '',
    website_type: order.website_type || '',
    description: order.description || '',
    budget: order.budget || '',
    deadline: order.deadline || '',
    status: order.status || 'new'
  };
}

export const db = {
  isDemoMode(): boolean {
    return isDemoMode;
  },

  isSupabaseConfigured(): boolean {
    return isRealSupabase;
  },

  async getPublicProjects(): Promise<Project[]> {
    if (isDemoMode) {
      return getDemoProjects().filter((project) => project.is_public);
    }

    const client = requireSupabase();
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Gagal memuat portfolio publik dari Supabase: ${error.message}`);
    }

    return (data || []) as Project[];
  },

  async getProjects(): Promise<Project[]> {
    if (isDemoMode) {
      return getDemoProjects();
    }

    const client = requireSupabase();
    const { data, error } = await client
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Gagal memuat projects dari Supabase: ${error.message}`);
    }

    return (data || []) as Project[];
  },

  async getProjectById(id: string): Promise<Project | null> {
    if (isDemoMode) {
      return getDemoProjects().find((project) => project.id === id) || null;
    }

    const client = requireSupabase();
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Gagal memuat project dari Supabase: ${error.message}`);
    }

    return (data as Project) || null;
  },

  async saveProject(project: Partial<Project>): Promise<Project> {
    if (isDemoMode) {
      const projects = getDemoProjects();
      if (project.id) {
        const index = projects.findIndex((item) => item.id === project.id);
        if (index !== -1) {
          const updated = { ...projects[index], ...project } as Project;
          projects[index] = updated;
          setDemoProjects(projects);
          return updated;
        }
      }

      const newProject = makeLocalProject(project);
      projects.unshift(newProject);
      setDemoProjects(projects);
      return newProject;
    }

    const client = requireSupabase();
    const query = project.id
      ? client.from('projects').update(project).eq('id', project.id)
      : client.from('projects').insert([project]);

    const { data, error } = await query.select().single();
    if (error) {
      throw new Error(`Gagal menyimpan project ke Supabase: ${error.message}`);
    }

    return data as Project;
  },

  async deleteProject(id: string): Promise<boolean> {
    if (isDemoMode) {
      setDemoProjects(getDemoProjects().filter((project) => project.id !== id));
      return true;
    }

    const client = requireSupabase();
    const { error } = await client.from('projects').delete().eq('id', id);
    if (error) {
      throw new Error(`Gagal menghapus project dari Supabase: ${error.message}`);
    }

    return true;
  },

  async getOrders(): Promise<Order[]> {
    if (isDemoMode) {
      return getDemoOrders();
    }

    const client = requireSupabase();
    const { data, error } = await client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Gagal memuat orders dari Supabase: ${error.message}`);
    }

    return (data || []) as Order[];
  },

  async saveOrder(order: Partial<Order>): Promise<Order> {
    if (isDemoMode) {
      const orders = getDemoOrders();
      const newOrder = makeLocalOrder(order);
      orders.unshift(newOrder);
      setDemoOrders(orders);
      return newOrder;
    }

    requireSupabase();

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });

    if (!response.ok) {
      const details = await response.json().catch(() => ({}));
      throw new Error(details.error || 'Gagal mengirim order ke server.');
    }

    return await response.json();
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
    if (isDemoMode) {
      const orders = getDemoOrders();
      const index = orders.findIndex((order) => order.id === id);
      if (index === -1) return null;

      orders[index].status = status;
      setDemoOrders(orders);
      return orders[index];
    }

    const client = requireSupabase();
    const { data, error } = await client
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Gagal memperbarui status order di Supabase: ${error.message}`);
    }

    return data as Order;
  },

  async deleteOrder(id: string): Promise<boolean> {
    if (isDemoMode) {
      setDemoOrders(getDemoOrders().filter((order) => order.id !== id));
      return true;
    }

    const client = requireSupabase();
    const { error } = await client.from('orders').delete().eq('id', id);
    if (error) {
      throw new Error(`Gagal menghapus order dari Supabase: ${error.message}`);
    }

    return true;
  },

  async login(email: string, pass: string): Promise<{ success: boolean; user?: any; error?: string }> {
    if (isDemoMode) {
      if (email === 'demo@simpluse.local' && pass === 'demo-admin') {
        const demoUser = { email, id: 'demo-owner', name: 'Demo Admin', mode: 'demo' };
        localStorage.setItem('simpluse_session', JSON.stringify(demoUser));
        return { success: true, user: demoUser };
      }

      return { success: false, error: 'Demo login gagal. Gunakan demo@simpluse.local / demo-admin.' };
    }

    const client = requireSupabase();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: pass
    });

    if (error || !data?.user) {
      return { success: false, error: error?.message || 'Login gagal.' };
    }

    const sessionUser = {
      email: data.user.email,
      id: data.user.id,
      name: data.user.email?.split('@')[0] || 'User',
      mode: 'supabase'
    };
    localStorage.setItem('simpluse_session', JSON.stringify(sessionUser));
    return { success: true, user: sessionUser };
  },

  logout() {
    if (isRealSupabase && supabase) {
      supabase.auth.signOut();
    }
    localStorage.removeItem('simpluse_session');
  },

  getCurrentUser() {
    const local = localStorage.getItem('simpluse_session');
    if (!local) return null;

    const user = JSON.parse(local);
    if (isDemoMode && user.mode === 'demo') return user;
    if (!isDemoMode && user.mode === 'supabase') return user;

    localStorage.removeItem('simpluse_session');
    return null;
  }
};
