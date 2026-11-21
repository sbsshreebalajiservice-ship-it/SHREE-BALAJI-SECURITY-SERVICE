import { useEffect, useState } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { PublicWebsite } from './components/PublicWebsite';
import type { SiteData } from './types';

const FALLBACK_SITE_DATA: SiteData = {
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
      imageUrl: '/src/assets/images/service_manned_guarding_1795262487636.jpg',
    },
    {
      id: 2,
      category: 'Surveillance',
      title: 'CCTV & Surveillance',
      desc: 'HD CCTV camera installation, centralized remote monitoring, and 24/7 alarm response systems.',
      imageUrl: '/src/assets/images/service_cctv_surveillance_1795262486918.jpg',
    },
    {
      id: 3,
      category: 'Corporate',
      title: 'Corporate Security',
      desc: 'Access control, front-desk security screening, and visitor management for IT parks, corporate towers, and malls.',
      imageUrl: '/src/assets/images/hero_security_command_1795262486785.jpg',
    },
    {
      id: 4,
      category: 'Events & VIP',
      title: 'Event & VIP Security',
      desc: 'Professional bouncers, crowd control teams, and personal security officers (PSOs) for weddings, concerts, and corporate summits.',
      imageUrl: '/src/assets/images/service_corporate_event_1795262486631.jpg',
    },
  ],
};

function getRouteFromLocation(): 'public' | 'admin' {
  return window.location.pathname.startsWith('/admin') ? 'admin' : 'public';
}

export default function App() {
  const [route, setRoute] = useState<'public' | 'admin'>(() => getRouteFromLocation());
  const [siteData, setSiteData] = useState<SiteData>(FALLBACK_SITE_DATA);
  const [adminToken, setAdminToken] = useState<string>('');

  useEffect(() => {
    const onPopState = () => setRoute(getRouteFromLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadSite() {
      try {
        const res = await fetch('/api/site');
        if (!res.ok) return;
        const data = (await res.json()) as SiteData;
        if (!cancelled && data && data.companyName) {
          setSiteData(data);
        }
      } catch {
        // Keep fallback initial content if network fails temporarily
      }
    }
    loadSite();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.title =
      route === 'admin'
        ? `Admin Panel | ${siteData.companyName}`
        : `${siteData.companyName} | ${siteData.companyTag}`;
  }, [route, siteData.companyName, siteData.companyTag]);

  const navigate = (path: string) => {
    const normalized = path.startsWith('/admin') ? '/admin' : '/';
    if (window.location.pathname !== normalized) {
      window.history.pushState({}, '', normalized);
    }
    setRoute(normalized === '/admin' ? 'admin' : 'public');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  if (route === 'admin') {
    return (
      <AdminPanel
        siteData={siteData}
        token={adminToken}
        onAuthSuccess={(newToken) => setAdminToken(newToken)}
        onLogout={() => setAdminToken('')}
        onSiteDataUpdated={(next) => setSiteData(next)}
        onNavigate={navigate}
      />
    );
  }

  return <PublicWebsite siteData={siteData} onNavigate={navigate} />;
}
