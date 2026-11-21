import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Pool } from 'pg';

interface ServiceItem {
  id: number;
  category: string;
  title: string;
  desc: string;
  imageUrl: string;
  secondaryImageUrl?: string;
}

interface SiteData {
  companyName: string;
  companyTag: string;
  heroTitle: string;
  heroSubtitle: string;
  phone: string;
  email: string;
  address: string;
  stat1Num: string;
  stat1Label: string;
  stat2Num: string;
  stat2Label: string;
  stat3Num: string;
  stat3Label: string;
  stat4Num: string;
  stat4Label: string;
  aboutTitle: string;
  aboutDesc: string;
  aboutPoints: string[];
  services: ServiceItem[];
}

type InquiryStatus = 'Pending' | 'Contacted' | 'Completed';

interface InquiryItem {
  id: number;
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
}

interface LocalStore {
  siteData: SiteData;
  inquiries: InquiryItem[];
  adminPasswordHash?: string;
}

const PORT = Number(process.env.PORT) || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const ROOT_DIR = process.cwd();
const DATA_FILE = path.join(ROOT_DIR, 'data.json');
const ALLOWED_STATUSES: ReadonlyArray<InquiryStatus> = ['Pending', 'Contacted', 'Completed'];

const DEFAULT_SERVICE_IMAGES: Record<string, string> = {
  guarding: '/src/assets/images/service_manned_guarding_1795262487636.jpg',
  cctv: '/src/assets/images/service_cctv_surveillance_1795262486918.jpg',
  corporate: '/src/assets/images/hero_security_command_1795262486785.jpg',
  event: '/src/assets/images/service_corporate_event_1795262486631.jpg',
};

const defaultSiteData: SiteData = {
  companyName: 'Shree Balaji Security',
  companyTag: 'Security Services.',
  heroTitle: 'Your Safety Is Our Top Priority',
  heroSubtitle:
    '24/7 Professional Security Guards, Corporate Protection, Event Security, and Advanced CCTV Surveillance Solutions across India.',
  phone: '+91 7566514338 / 8319802819',
  email: 'sbs.shreebalajiservice@gmail.com',
  address: 'Madhya Pradesh, India',
  stat1Num: '5+',
  stat1Label: 'Years of Experience',
  stat2Num: '500+',
  stat2Label: 'Trained Security Guards',
  stat3Num: '24/7',
  stat3Label: 'Control Room Support',
  stat4Num: '100%',
  stat4Label: 'Verified & Licensed Staff',
  aboutTitle: 'Why Choose Shree Balaji Security?',
  aboutDesc:
    'We deploy PSARA-compliant, police-verified, and rigorously trained security personnel for residential societies, corporate campuses, banks, and industrial facilities. Our focus goes beyond guarding gates—we deliver complete operational peace of mind.',
  aboutPoints: [
    'Police-Verified & Background Checked Staff',
    'Quick Emergency Response Team',
    'Regular Surprise Night Patrolling',
    'Affordable & Transparent Pricing',
  ],
  services: [
    {
      id: 1,
      category: 'Manned Guarding',
      title: 'Manned Guarding',
      desc: 'Disciplined, police-verified security guards for residential societies, offices, banks, and industrial plants.',
      imageUrl: DEFAULT_SERVICE_IMAGES.guarding,
    },
    {
      id: 2,
      category: 'Surveillance',
      title: 'CCTV & Surveillance',
      desc: 'HD CCTV camera installation, centralized remote monitoring, and 24/7 alarm response systems.',
      imageUrl: DEFAULT_SERVICE_IMAGES.cctv,
    },
    {
      id: 3,
      category: 'Corporate',
      title: 'Corporate Security',
      desc: 'Access control, front-desk security screening, and visitor management for IT parks, corporate towers, and malls.',
      imageUrl: DEFAULT_SERVICE_IMAGES.corporate,
    },
    {
      id: 4,
      category: 'Events & VIP',
      title: 'Event & VIP Security',
      desc: 'Professional bouncers, crowd control teams, and personal security officers (PSOs) for weddings, concerts, and corporate summits.',
      imageUrl: DEFAULT_SERVICE_IMAGES.event,
    },
  ],
};

let pool: Pool | null = null;
let useDB = false;

function readLocal(): LocalStore {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { siteData: structuredClone(defaultSiteData), inquiries: [] };
    }
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as Partial<LocalStore>;
    return {
      siteData: sanitizeSiteData(raw.siteData ?? defaultSiteData),
      inquiries: Array.isArray(raw.inquiries) ? raw.inquiries : [],
      adminPasswordHash: typeof raw.adminPasswordHash === 'string' ? raw.adminPasswordHash : undefined,
    };
  } catch {
    return { siteData: structuredClone(defaultSiteData), inquiries: [] };
  }
}

function writeLocal(content: LocalStore): void {
  const tempPath = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(content, null, 2), 'utf8');
  fs.renameSync(tempPath, DATA_FILE);
}

function cleanStr(val: unknown, fallback: string, maxLen = 400): string {
  if (typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  return trimmed ? trimmed.slice(0, maxLen) : fallback;
}

function sanitizeImageUrl(val: unknown, fallback: string): string {
  if (typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith('/src/assets/images/') || trimmed.startsWith('/assets/')) {
    return trimmed.slice(0, 300);
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:') {
      return parsed.toString().slice(0, 500);
    }
  } catch {
    return fallback;
  }
  return fallback;
}

function sanitizeSiteData(input: unknown): SiteData {
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const rawPoints = Array.isArray(src.aboutPoints) ? src.aboutPoints : defaultSiteData.aboutPoints;
  const aboutPoints = rawPoints
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .map((p) => p.trim().slice(0, 220))
    .slice(0, 12);

  const rawServices = Array.isArray(src.services) ? src.services : defaultSiteData.services;
  const services: ServiceItem[] = rawServices
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item, index) => {
      const secondary =
        typeof item.secondaryImageUrl === 'string' && item.secondaryImageUrl.trim()
          ? sanitizeImageUrl(item.secondaryImageUrl, '')
          : '';
      return {
        id: typeof item.id === 'number' && Number.isFinite(item.id) ? item.id : Date.now() + index,
        category: cleanStr(item.category, 'Security Service', 60),
        title: cleanStr(item.title, 'Security Service', 100),
        desc: cleanStr(item.desc, 'Professional security deployment.', 400),
        imageUrl: sanitizeImageUrl(item.imageUrl, DEFAULT_SERVICE_IMAGES.guarding),
        ...(secondary ? { secondaryImageUrl: secondary } : {}),
      };
    })
    .slice(0, 20);

  return {
    companyName: cleanStr(src.companyName, defaultSiteData.companyName, 100),
    companyTag: cleanStr(src.companyTag, defaultSiteData.companyTag, 120),
    heroTitle: cleanStr(src.heroTitle, defaultSiteData.heroTitle, 160),
    heroSubtitle: cleanStr(src.heroSubtitle, defaultSiteData.heroSubtitle, 400),
    phone: cleanStr(src.phone, defaultSiteData.phone, 80),
    email: cleanStr(src.email, defaultSiteData.email, 120),
    address: cleanStr(src.address, defaultSiteData.address, 180),
    stat1Num: cleanStr(src.stat1Num, defaultSiteData.stat1Num, 20),
    stat1Label: cleanStr(src.stat1Label, defaultSiteData.stat1Label, 60),
    stat2Num: cleanStr(src.stat2Num, defaultSiteData.stat2Num, 20),
    stat2Label: cleanStr(src.stat2Label, defaultSiteData.stat2Label, 60),
    stat3Num: cleanStr(src.stat3Num, defaultSiteData.stat3Num, 20),
    stat3Label: cleanStr(src.stat3Label, defaultSiteData.stat3Label, 60),
    stat4Num: cleanStr(src.stat4Num, defaultSiteData.stat4Num, 20),
    stat4Label: cleanStr(src.stat4Label, defaultSiteData.stat4Label, 60),
    aboutTitle: cleanStr(src.aboutTitle, defaultSiteData.aboutTitle, 160),
    aboutDesc: cleanStr(src.aboutDesc, defaultSiteData.aboutDesc, 600),
    aboutPoints: aboutPoints.length > 0 ? aboutPoints : defaultSiteData.aboutPoints,
    services: services.length > 0 ? services : defaultSiteData.services,
  };
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyScryptPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, hexHash] = parts;
  if (!salt || !hexHash) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hexHash, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function verifyEnvPassword(candidate: string, expected: string): boolean {
  const a = crypto.createHash('sha256').update(candidate).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function createToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ role: 'admin', exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): boolean {
  if (!token || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  if (sig.length !== expectedSig.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number };
    return typeof data.exp === 'number' && data.exp > Date.now();
  } catch {
    return false;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!verifyToken(token)) {
    res.status(401).json({ success: false, error: 'Unauthorized. Please sign in again.' });
    return;
  }
  next();
}

async function getClaimedPasswordHash(): Promise<string | null> {
  if (useDB && pool) {
    const result = await pool.query<{ password_hash: string }>(
      'SELECT password_hash FROM admin_auth WHERE id = 1'
    );
    return result.rows[0]?.password_hash ?? null;
  }
  const local = readLocal();
  return local.adminPasswordHash ?? null;
}

async function saveClaimedPasswordHash(passwordHash: string): Promise<boolean> {
  if (useDB && pool) {
    const result = await pool.query(
      'INSERT INTO admin_auth (id, password_hash) VALUES (1, $1) ON CONFLICT (id) DO NOTHING RETURNING id',
      [passwordHash]
    );
    return result.rows.length > 0;
  }
  const local = readLocal();
  if (local.adminPasswordHash) return false;
  local.adminPasswordHash = passwordHash;
  writeLocal(local);
  return true;
}

async function initStorage(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (dbUrl) {
    try {
      const useSSL = !dbUrl.includes('railway.internal') && !dbUrl.includes('localhost');
      pool = new Pool({
        connectionString: dbUrl,
        ssl: useSSL ? { rejectUnauthorized: false } : false,
      });

      await pool.query('CREATE TABLE IF NOT EXISTS site_settings (id INT PRIMARY KEY, data JSONB NOT NULL);');
      await pool.query(
        "CREATE TABLE IF NOT EXISTS inquiries (id SERIAL PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, service TEXT NOT NULL, message TEXT, status TEXT DEFAULT 'Pending', created_at TIMESTAMPTZ DEFAULT NOW());"
      );
      await pool.query(
        'CREATE TABLE IF NOT EXISTS admin_auth (id INT PRIMARY KEY, password_hash TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW());'
      );

      const res = await pool.query('SELECT data FROM site_settings WHERE id = 1');
      if (res.rows.length === 0) {
        await pool.query('INSERT INTO site_settings (id, data) VALUES (1, $1)', [
          JSON.stringify(defaultSiteData),
        ]);
      }
      useDB = true;
      console.log('Connected to PostgreSQL database');
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown DB error';
      console.error('Database unavailable, falling back to local JSON storage:', message);
      pool = null;
      useDB = false;
    }
  }

  if (!fs.existsSync(DATA_FILE)) {
    writeLocal({ siteData: structuredClone(defaultSiteData), inquiries: [] });
  }
  console.log('Using local JSON storage (data.json)');
}

async function startServer(): Promise<void> {
  await initStorage();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, storage: useDB ? 'postgres' : 'json' });
  });

  app.get('/api/site', async (_req: Request, res: Response) => {
    try {
      if (useDB && pool) {
        const result = await pool.query<{ data: SiteData }>('SELECT data FROM site_settings WHERE id = 1');
        res.json(sanitizeSiteData(result.rows[0]?.data ?? defaultSiteData));
        return;
      }
      const local = readLocal();
      res.json(sanitizeSiteData(local.siteData));
    } catch {
      res.status(500).json({ error: 'Failed to load site data' });
    }
  });

  app.post('/api/quote', async (req: Request, res: Response) => {
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const service = typeof body.service === 'string' ? body.service.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (name.length < 2 || name.length > 100) {
      res.status(400).json({ success: false, error: 'Please enter a valid full name (at least 2 characters).' });
      return;
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      res.status(400).json({ success: false, error: 'Please enter a valid phone number.' });
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
      return;
    }
    if (!service || service.length > 120) {
      res.status(400).json({ success: false, error: 'Please select a security service.' });
      return;
    }

    const safeEmail = email.slice(0, 140) || 'Not provided';
    const safeMessage = message.slice(0, 1200);

    try {
      if (useDB && pool) {
        await pool.query(
          'INSERT INTO inquiries (name, phone, email, service, message) VALUES ($1, $2, $3, $4, $5)',
          [name, phone.slice(0, 30), safeEmail, service, safeMessage]
        );
      } else {
        const local = readLocal();
        local.inquiries.unshift({
          id: Date.now(),
          name,
          phone: phone.slice(0, 30),
          email: safeEmail,
          service,
          message: safeMessage,
          status: 'Pending',
          created_at: new Date().toISOString(),
        });
        writeLocal(local);
      }

      res.status(201).json({
        success: true,
        message: 'Thank you. Your inquiry has been received and our team will contact you shortly.',
      });
    } catch {
      res.status(500).json({ success: false, error: 'Unable to save inquiry right now. Please call our desk.' });
    }
  });

  app.get('/api/admin/auth-status', async (_req: Request, res: Response) => {
    try {
      const envPass = process.env.ADMIN_PASSWORD?.trim();
      if (envPass) {
        res.json({ configured: true, mode: 'env' });
        return;
      }
      const claimed = await getClaimedPasswordHash();
      if (claimed) {
        res.json({ configured: true, mode: 'claimed' });
        return;
      }
      res.json({ configured: false, mode: 'unclaimed' });
    } catch {
      res.status(500).json({ error: 'Unable to verify admin auth status' });
    }
  });

  app.post('/api/admin/setup', async (req: Request, res: Response) => {
    try {
      const envPass = process.env.ADMIN_PASSWORD?.trim();
      if (envPass) {
        res.status(403).json({ success: false, error: 'Admin password is already managed by environment variables.' });
        return;
      }
      const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
      const password = typeof body.password === 'string' ? body.password : '';
      if (password.length < 6 || password.length > 128) {
        res.status(400).json({ success: false, error: 'Password must be between 6 and 128 characters.' });
        return;
      }

      const passwordHash = hashPassword(password);
      const claimedNow = await saveClaimedPasswordHash(passwordHash);
      if (!claimedNow) {
        res.status(403).json({ success: false, error: 'Admin access has already been claimed. Please sign in.' });
        return;
      }

      res.status(201).json({ success: true, token: createToken() });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to initialize admin password.' });
    }
  });

  app.post('/api/admin/login', async (req: Request, res: Response) => {
    try {
      const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
      const password = typeof body.password === 'string' ? body.password : '';
      if (!password) {
        res.status(400).json({ success: false, error: 'Password is required.' });
        return;
      }

      const envPass = process.env.ADMIN_PASSWORD?.trim();
      if (envPass) {
        if (verifyEnvPassword(password, envPass)) {
          res.json({ success: true, token: createToken() });
          return;
        }
        res.status(401).json({ success: false, error: 'Incorrect admin password.' });
        return;
      }

      const claimedHash = await getClaimedPasswordHash();
      if (!claimedHash) {
        res.status(400).json({ success: false, error: 'Admin password is not configured yet. Complete initial setup.' });
        return;
      }

      if (verifyScryptPassword(password, claimedHash)) {
        res.json({ success: true, token: createToken() });
        return;
      }

      res.status(401).json({ success: false, error: 'Incorrect admin password.' });
    } catch {
      res.status(500).json({ success: false, error: 'Authentication failed.' });
    }
  });

  app.put('/api/admin/site', requireAdmin, async (req: Request, res: Response) => {
    try {
      const updatedData = sanitizeSiteData(req.body);
      if (useDB && pool) {
        await pool.query('UPDATE site_settings SET data = $1 WHERE id = 1', [JSON.stringify(updatedData)]);
      } else {
        const local = readLocal();
        local.siteData = updatedData;
        writeLocal(local);
      }
      res.json({ success: true, data: updatedData, message: 'Website settings saved.' });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to save website settings.' });
    }
  });

  app.get('/api/admin/inquiries', requireAdmin, async (_req: Request, res: Response) => {
    try {
      if (useDB && pool) {
        const result = await pool.query<InquiryItem>('SELECT * FROM inquiries ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
        return;
      }
      const local = readLocal();
      res.json({ success: true, data: local.inquiries });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to load inquiries.' });
    }
  });

  app.patch('/api/admin/inquiries/:id', requireAdmin, async (req: Request, res: Response) => {
    const idNum = Number(req.params.id);
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const status = body.status as InquiryStatus;

    if (!Number.isInteger(idNum) || idNum <= 0) {
      res.status(400).json({ success: false, error: 'Invalid inquiry ID.' });
      return;
    }
    if (!ALLOWED_STATUSES.includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status value.' });
      return;
    }

    try {
      if (useDB && pool) {
        await pool.query('UPDATE inquiries SET status = $1 WHERE id = $2', [status, idNum]);
      } else {
        const local = readLocal();
        const item = local.inquiries.find((i) => i.id === idNum);
        if (!item) {
          res.status(404).json({ success: false, error: 'Inquiry not found.' });
          return;
        }
        item.status = status;
        writeLocal(local);
      }
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to update inquiry status.' });
    }
  });

  app.delete('/api/admin/inquiries/:id', requireAdmin, async (req: Request, res: Response) => {
    const idNum = Number(req.params.id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      res.status(400).json({ success: false, error: 'Invalid inquiry ID.' });
      return;
    }

    try {
      if (useDB && pool) {
        await pool.query('DELETE FROM inquiries WHERE id = $1', [idNum]);
      } else {
        const local = readLocal();
        local.inquiries = local.inquiries.filter((i) => i.id !== idNum);
        writeLocal(local);
      }
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to delete inquiry.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API route not found' });
        return;
      }
      if (req.method !== 'GET') {
        next();
        return;
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Shree Balaji Security server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
