import { createClient } from '@supabase/supabase-js';
import { Project, Order, OrderStatus, Reseller, CommissionRecord, UserProfile, MaintenanceBilling } from '../types';

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

const DEMO_RESELLERS: Reseller[] = [
  {
    id: 'demo-reseller-1',
    created_at: '2026-06-01T08:00:00Z',
    user_id: 'demo-reseller-user-1',
    name: 'Demo Reseller',
    email: 'reseller@simpluse.local',
    whatsapp: '081233334444',
    commission_rate: 10,
    status: 'active',
    notes: 'Akun contoh untuk mode demo reseller.'
  }
];

const DEMO_COMMISSION_RECORDS: CommissionRecord[] = [];
const DEMO_MAINTENANCE_BILLINGS: MaintenanceBilling[] = [];

function requireSupabase() {
  if (!supabase || !isRealSupabase) {
    throw new Error('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY, atau aktifkan VITE_DEMO_MODE=true untuk sandbox lokal.');
  }
  return supabase;
}

async function getSupabaseAccessToken() {
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error(error?.message || 'Session Supabase tidak ditemukan. Silakan login ulang.');
  }
  return data.session.access_token;
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

function getDemoResellers(): Reseller[] {
  const local = localStorage.getItem('simpluse_demo_resellers');
  if (!local) {
    localStorage.setItem('simpluse_demo_resellers', JSON.stringify(DEMO_RESELLERS));
    return DEMO_RESELLERS;
  }
  return JSON.parse(local);
}

function setDemoResellers(resellers: Reseller[]) {
  localStorage.setItem('simpluse_demo_resellers', JSON.stringify(resellers));
}

function getDemoCommissionRecords(): CommissionRecord[] {
  const local = localStorage.getItem('simpluse_demo_commission_records');
  if (!local) {
    localStorage.setItem('simpluse_demo_commission_records', JSON.stringify(DEMO_COMMISSION_RECORDS));
    return DEMO_COMMISSION_RECORDS;
  }
  return JSON.parse(local);
}

function setDemoCommissionRecords(records: CommissionRecord[]) {
  localStorage.setItem('simpluse_demo_commission_records', JSON.stringify(records));
}

function getDemoMaintenanceBillings(): MaintenanceBilling[] {
  const local = localStorage.getItem('simpluse_demo_maintenance_billings');
  if (!local) {
    localStorage.setItem('simpluse_demo_maintenance_billings', JSON.stringify(DEMO_MAINTENANCE_BILLINGS));
    return DEMO_MAINTENANCE_BILLINGS;
  }
  return JSON.parse(local);
}

function setDemoMaintenanceBillings(records: MaintenanceBilling[]) {
  localStorage.setItem('simpluse_demo_maintenance_billings', JSON.stringify(records));
}

function calculateMonthlyAmount(order: Partial<Order> | Partial<Project>) {
  if (order.payment_scheme !== 'per_user_contract') return Number(order.deal_price) || Number((order as Partial<Project>).total_price) || 0;
  return (Number(order.price_per_user) || 0) * (Number(order.user_count) || 0);
}

function calculateEstimatedCommission(order: Partial<Order> | Partial<Project>) {
  const baseAmount = order.payment_scheme === 'per_user_contract'
    ? calculateMonthlyAmount(order)
    : Number(order.deal_price) || Number((order as Partial<Project>).total_price) || 0;
  const rate = Number(order.commission_rate) || 0;
  return Math.round(baseAmount * rate) / 100;
}

function makeLocalProject(project: Partial<Project>): Project {
  const paymentScheme = project.payment_scheme || 'one_time';
  const dealPrice = Number(project.deal_price) || Number(project.total_price) || 0;
  const monthlyAmount = paymentScheme === 'per_user_contract'
    ? calculateMonthlyAmount({ ...project, deal_price: dealPrice, payment_scheme: paymentScheme })
    : 0;
  const commissionRate = Number(project.commission_rate) || 0;

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
    source_order_id: project.source_order_id || null,
    source_channel: project.source_channel || (project.reseller_id ? 'reseller' : 'direct'),
    reseller_id: project.reseller_id || null,
    reseller_name: project.reseller_name || null,
    payment_scheme: paymentScheme,
    deal_price: dealPrice,
    price_per_user: Number(project.price_per_user) || 0,
    user_count: Number(project.user_count) || 0,
    monthly_amount: monthlyAmount,
    support_scope: project.support_scope || '',
    maintenance_terms: project.maintenance_terms || '',
    commission_rate: commissionRate,
    estimated_commission: Number(project.estimated_commission) || calculateEstimatedCommission({ ...project, deal_price: dealPrice, payment_scheme: paymentScheme, commission_rate: commissionRate }),
    commission_status: project.commission_status || 'pending',
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
  const paymentScheme = order.payment_scheme || 'one_time';
  const dealPrice = Number(order.deal_price) || 0;
  const monthlyAmount = paymentScheme === 'per_user_contract'
    ? calculateMonthlyAmount({ ...order, deal_price: dealPrice, payment_scheme: paymentScheme })
    : 0;
  const commissionRate = Number(order.commission_rate) || 0;

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
    status: order.status || 'new',
    source_channel: order.source_channel || (order.reseller_id ? 'reseller' : 'direct'),
    submitted_by: order.submitted_by || null,
    reseller_id: order.reseller_id || null,
    reseller_name: order.reseller_name || null,
    payment_scheme: paymentScheme,
    deal_price: dealPrice,
    price_per_user: Number(order.price_per_user) || 0,
    user_count: Number(order.user_count) || 0,
    monthly_amount: monthlyAmount,
    support_scope: order.support_scope || '',
    maintenance_terms: order.maintenance_terms || '',
    commission_rate: commissionRate,
    estimated_commission: Number(order.estimated_commission) || calculateEstimatedCommission({ ...order, deal_price: dealPrice, payment_scheme: paymentScheme, commission_rate: commissionRate })
  };
}

function makeLocalReseller(reseller: Partial<Reseller>): Reseller {
  return {
    id: reseller.id || 'demo-reseller-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    created_at: reseller.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: reseller.user_id || null,
    name: reseller.name || '',
    email: reseller.email || '',
    whatsapp: reseller.whatsapp || '',
    commission_rate: Number(reseller.commission_rate) || 10,
    status: reseller.status || 'active',
    notes: reseller.notes || ''
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

  async getCurrentProfile(): Promise<UserProfile | null> {
    if (isDemoMode) {
      const user = this.getCurrentUser();
      if (!user) return null;
      return {
        id: user.id,
        full_name: user.name || (user.role === 'reseller' ? 'Demo Reseller' : 'Demo Admin'),
        role: user.role || 'admin',
        whatsapp: ''
      };
    }

    const client = requireSupabase();
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError || !authData.user) return null;

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (error) {
      throw new Error(`Gagal memuat profil user dari Supabase: ${error.message}`);
    }

    return (data as UserProfile) || null;
  },

  async getResellers(): Promise<Reseller[]> {
    if (isDemoMode) {
      return getDemoResellers();
    }

    const client = requireSupabase();
    const { data, error } = await client
      .from('resellers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Gagal memuat reseller dari Supabase: ${error.message}`);
    }

    return (data || []) as Reseller[];
  },

  async saveReseller(reseller: Partial<Reseller> & { password?: string }): Promise<Reseller> {
    if (isDemoMode) {
      const resellers = getDemoResellers();
      if (reseller.id) {
        const index = resellers.findIndex((item) => item.id === reseller.id);
        if (index !== -1) {
          const updated = { ...resellers[index], ...reseller, updated_at: new Date().toISOString() } as Reseller;
          resellers[index] = updated;
          setDemoResellers(resellers);
          return updated;
        }
      }

      const newReseller = makeLocalReseller(reseller);
      resellers.unshift(newReseller);
      setDemoResellers(resellers);
      return newReseller;
    }

    if (!reseller.id) {
      requireSupabase();
      const accessToken = await getSupabaseAccessToken();
      const response = await fetch('/api/resellers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(reseller)
      });

      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.error || 'Gagal mendaftarkan akun reseller.');
      }

      return await response.json();
    }

    const client = requireSupabase();
    const { password, ...resellerPayload } = reseller;
    const payload = {
      ...resellerPayload,
      commission_rate: Number(reseller.commission_rate) || 10,
      updated_at: new Date().toISOString()
    };
    const query = client.from('resellers').update(payload).eq('id', reseller.id);

    const { data, error } = await query.select().single();
    if (error) {
      throw new Error(`Gagal menyimpan reseller ke Supabase: ${error.message}`);
    }

    return data as Reseller;
  },

  async getCommissionRecords(resellerId?: string): Promise<CommissionRecord[]> {
    if (isDemoMode) {
      const records = getDemoCommissionRecords();
      return resellerId ? records.filter((record) => record.reseller_id === resellerId) : records;
    }

    const client = requireSupabase();
    let query = client
      .from('commission_records')
      .select('*')
      .order('period_month', { ascending: false });

    if (resellerId) {
      query = query.eq('reseller_id', resellerId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Gagal memuat catatan komisi dari Supabase: ${error.message}`);
    }

    return (data || []) as CommissionRecord[];
  },

  async saveCommissionRecord(record: Partial<CommissionRecord>): Promise<CommissionRecord> {
    if (isDemoMode) {
      const records = getDemoCommissionRecords();
      if (record.id) {
        const index = records.findIndex((item) => item.id === record.id);
        if (index !== -1) {
          const updated = {
            ...records[index],
            ...record
          } as CommissionRecord;
          records[index] = updated;
          setDemoCommissionRecords(records);
          return updated;
        }
      }

      const payload: CommissionRecord = {
        id: record.id || 'demo-commission-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        created_at: record.created_at || new Date().toISOString(),
        reseller_id: record.reseller_id || '',
        reseller_name: record.reseller_name || '',
        project_id: record.project_id || null,
        order_id: record.order_id || null,
        period_month: record.period_month || new Date().toISOString().substring(0, 10),
        base_amount: Number(record.base_amount) || 0,
        commission_rate: Number(record.commission_rate) || 0,
        commission_amount: Number(record.commission_amount) || 0,
        status: record.status || 'pending',
        paid_at: record.paid_at || null,
        notes: record.notes || ''
      };

      records.unshift(payload);
      setDemoCommissionRecords(records);
      return payload;
    }

    const client = requireSupabase();
    const { id, ...recordPayload } = record;
    const query = id
      ? client.from('commission_records').update(recordPayload).eq('id', id)
      : client.from('commission_records').insert([recordPayload]);

    const { data, error } = await query.select().single();
    if (error) {
      throw new Error(`Gagal menyimpan catatan komisi ke Supabase: ${error.message}`);
    }

    return data as CommissionRecord;
  },

  async getMaintenanceBillings(projectId?: string): Promise<MaintenanceBilling[]> {
    if (isDemoMode) {
      const records = getDemoMaintenanceBillings();
      return projectId ? records.filter((record) => record.project_id === projectId) : records;
    }

    const client = requireSupabase();
    let query = client
      .from('maintenance_billings')
      .select('*')
      .order('billing_date', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Gagal memuat tagihan maintenance dari Supabase: ${error.message}`);
    }

    return (data || []) as MaintenanceBilling[];
  },

  async saveMaintenanceBilling(record: Partial<MaintenanceBilling>): Promise<MaintenanceBilling> {
    if (isDemoMode) {
      const records = getDemoMaintenanceBillings();
      if (record.id) {
        const index = records.findIndex((item) => item.id === record.id);
        if (index !== -1) {
          const updated = {
            ...records[index],
            ...record,
            updated_at: new Date().toISOString()
          } as MaintenanceBilling;
          records[index] = updated;
          setDemoMaintenanceBillings(records);
          return updated;
        }
      }

      const payload: MaintenanceBilling = {
        id: 'demo-maintenance-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        project_id: record.project_id || '',
        project_name: record.project_name || '',
        client_name: record.client_name || '',
        billing_date: record.billing_date || new Date().toISOString().substring(0, 10),
        title: record.title || '',
        description: record.description || '',
        amount: Number(record.amount) || 0,
        status: record.status || 'draft',
        paid_at: record.paid_at || null,
        notes: record.notes || ''
      };

      records.unshift(payload);
      setDemoMaintenanceBillings(records);
      return payload;
    }

    const client = requireSupabase();
    const { id, ...recordPayload } = record;
    const query = id
      ? client.from('maintenance_billings').update({
          ...recordPayload,
          updated_at: new Date().toISOString()
        }).eq('id', id)
      : client.from('maintenance_billings').insert([recordPayload]);

    const { data, error } = await query.select().single();
    if (error) {
      throw new Error(`Gagal menyimpan tagihan maintenance ke Supabase: ${error.message}`);
    }

    return data as MaintenanceBilling;
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
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (order.source_channel === 'reseller') {
      headers.Authorization = `Bearer ${await getSupabaseAccessToken()}`;
    }

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers,
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
        const demoUser = { email, id: 'demo-owner', name: 'Demo Admin', mode: 'demo', role: 'admin' };
        localStorage.setItem('simpluse_session', JSON.stringify(demoUser));
        return { success: true, user: demoUser };
      }

      if (email === 'reseller@simpluse.local' && pass === 'demo-reseller') {
        const demoUser = {
          email,
          id: 'demo-reseller-user-1',
          name: 'Demo Reseller',
          mode: 'demo',
          role: 'reseller',
          reseller_id: 'demo-reseller-1'
        };
        localStorage.setItem('simpluse_session', JSON.stringify(demoUser));
        return { success: true, user: demoUser };
      }

      return { success: false, error: 'Demo login gagal. Gunakan demo@simpluse.local / demo-admin atau reseller@simpluse.local / demo-reseller.' };
    }

    const client = requireSupabase();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: pass
    });

    if (error || !data?.user) {
      return { success: false, error: error?.message || 'Login gagal.' };
    }

    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      await client.auth.signOut();
      return {
        success: false,
        error: profileError?.message || 'Akun berhasil login, tapi belum punya profile role. Tambahkan row di tabel profiles terlebih dahulu.'
      };
    }

    let resellerId: string | null = null;
    if (profile.role === 'reseller') {
      const { data: reseller, error: resellerError } = await client
        .from('resellers')
        .select('id, name, status')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (resellerError || !reseller) {
        await client.auth.signOut();
        return {
          success: false,
          error: resellerError?.message || 'Akun reseller belum terhubung ke data reseller. Admin perlu menghubungkan user_id reseller dulu.'
        };
      }

      if (reseller.status !== 'active') {
        await client.auth.signOut();
        return { success: false, error: 'Akun reseller sedang nonaktif. Hubungi admin utama.' };
      }

      resellerId = reseller.id;
    }

    const sessionUser = {
      email: data.user.email,
      id: data.user.id,
      name: profile.full_name || data.user.email?.split('@')[0] || 'User',
      mode: 'supabase',
      role: profile.role,
      reseller_id: resellerId
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
    if (isDemoMode && user.mode === 'demo') {
      if (!user.role) {
        return { ...user, role: 'admin' };
      }
      return user;
    }
    if (!isDemoMode && user.mode === 'supabase') return user;

    localStorage.removeItem('simpluse_session');
    return null;
  }
};
