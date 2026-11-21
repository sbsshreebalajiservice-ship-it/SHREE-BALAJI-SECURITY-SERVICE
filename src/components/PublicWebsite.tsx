import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Mail,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { SiteData } from '../types';
import { ResilientImage } from './ResilientImage';

interface PublicWebsiteProps {
  siteData: SiteData;
}

const LOGO_IMAGE = '/src/assets/images/shree_balaji_logo.png';

export function PublicWebsite({ siteData }: PublicWebsiteProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [service, setService] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectServiceForQuote = (serviceTitle: string) => {
    setService(serviceTitle);
    scrollToSection('contact');
  };

  const handleQuoteSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          service,
          message: message.trim(),
        }),
      });
      const json = (await res.json()) as { success?: boolean; message?: string; error?: string };

      if (res.ok && json.success) {
        setFeedback({
          type: 'success',
          text: json.message || 'Your quote request has been saved. Our team will call you shortly.',
        });
        setName('');
        setPhone('');
        setEmail('');
        setService('');
        setMessage('');
      } else {
        setFeedback({
          type: 'error',
          text: json.error || 'Please check your details and try again.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        text: 'Network error while submitting your request. Please call our 24/7 desk.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const stats = [
    { num: siteData.stat1Num, label: siteData.stat1Label },
    { num: siteData.stat2Num, label: siteData.stat2Label },
    { num: siteData.stat3Num, label: siteData.stat3Label },
    { num: siteData.stat4Num, label: siteData.stat4Label },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 relative overflow-x-hidden">
      {/* Subtle Background Logo Watermark */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[5] pointer-events-none select-none flex items-center justify-center overflow-hidden"
      >
        <img
          src={LOGO_IMAGE}
          alt=""
          referrerPolicy="no-referrer"
          className="w-[260px] sm:w-[440px] lg:w-[540px] aspect-square object-contain opacity-[0.05] [mask-image:radial-gradient(circle_at_center,black_38%,transparent_72%)]"
        />
      </div>

      {/* Top Bar Contract: Zone 1 (Wordmark) — Zone 2 (4 Nav Links) — Zone 3 (1 Primary CTA) */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-3 sm:gap-8">
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('home');
            }}
            className="inline-flex items-center gap-2.5 sm:gap-3 font-display text-[13px] sm:text-lg font-extrabold tracking-[0.04em] sm:tracking-[0.08em] [word-spacing:0.14em] sm:[word-spacing:0.22em] text-white uppercase whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
          >
            <img
              src={LOGO_IMAGE}
              alt={`${siteData.companyName} official logo`}
              referrerPolicy="no-referrer"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-amber-400/60 shrink-0"
            />
            <span>{siteData.companyName}</span>
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300"
          >
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('home');
              }}
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Home
            </a>
            <a
              href="#services"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('services');
              }}
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Services
            </a>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('about');
              }}
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              About Us
            </a>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('contact');
              }}
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Contact
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              Request Quote
            </button>
            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-md text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950 px-6 py-4 flex flex-col gap-2">
            {[
              { label: 'Home', id: 'home' },
              { label: 'Services', id: 'services' },
              { label: 'About Us', id: 'about' },
              { label: 'Contact', id: 'contact' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="text-left py-2.5 px-2 text-sm font-medium text-slate-200 hover:text-amber-400 transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="mt-2 w-full py-3 px-4 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors cursor-pointer"
            >
              Request Quote
            </button>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Split Section + Full-Width KPI Strip */}
        <section id="home" className="relative overflow-hidden bg-slate-950 text-white border-b border-slate-800">
          <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center">
                <div className="flex items-center gap-3.5 sm:gap-4 mb-5">
                  <img
                    src={LOGO_IMAGE}
                    alt={`${siteData.companyName} crest`}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl object-cover border border-amber-400/50 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-display text-base sm:text-2xl font-extrabold tracking-[0.05em] sm:tracking-[0.08em] [word-spacing:0.14em] sm:[word-spacing:0.24em] text-amber-400 uppercase leading-tight">
                      {siteData.companyName}
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-slate-300 mt-1">
                      {siteData.companyTag} · PSARA Compliant · {siteData.address}
                    </p>
                  </div>
                </div>
                <h1
                  className="font-display font-extrabold tracking-tight text-white leading-[1.08] mb-5 sm:mb-6"
                  style={{ fontSize: 'clamp(2rem, 4vw, 3.75rem)', textWrap: 'balance' }}
                >
                  {siteData.heroTitle}
                </h1>
                <p className="text-sm sm:text-lg text-slate-300 leading-relaxed max-w-xl mb-7 sm:mb-8">
                  {siteData.heroSubtitle}
                </p>

                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 mb-7 sm:mb-8">
                  <button
                    type="button"
                    onClick={() => scrollToSection('contact')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                  >
                    <span>Request Free Quote</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('services')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm sm:text-base font-medium text-slate-200 hover:text-white border border-slate-700 hover:border-slate-500 rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Explore Services
                  </button>
                </div>

                <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-300">
                  <span className="text-slate-400">24/7 Control Room Dispatch:</span>
                  <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                    {siteData.phone
                      .split(/[,/]/)
                      .map((num) => num.trim())
                      .filter(Boolean)
                      .map((num, idx) => (
                        <span key={idx} className="inline-flex items-center gap-2">
                          {idx > 0 && (
                            <span aria-hidden="true" className="text-slate-500">
                              /
                            </span>
                          )}
                          <a
                            href={`tel:${num.replace(/[^\d+]/g, '')}`}
                            className="inline-flex items-center gap-1.5 font-mono tabular-nums font-medium text-white hover:text-amber-400 transition-colors"
                          >
                            {idx === 0 && <Phone className="w-4 h-4 text-amber-400" />}
                            <span>{num}</span>
                          </a>
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 relative rounded-lg overflow-hidden border border-slate-800 bg-[#0b0c0e] flex flex-col justify-between">
                <div className="relative aspect-square sm:aspect-[5/4] lg:aspect-auto lg:flex-1 lg:min-h-[480px] w-full overflow-hidden">
                  <ResilientImage
                    src={LOGO_IMAGE}
                    alt={`${siteData.companyName} official crest`}
                    fallbackTitle={siteData.companyName}
                    className="w-full h-full object-cover object-center"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent"
                  />
                </div>
                <div className="relative z-10 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-4 text-xs sm:text-sm text-slate-200 border-t border-slate-800/80 bg-slate-950/90">
                  <span className="font-medium">Command & Guarding Operations</span>
                  <span className="font-mono text-amber-300 tabular-nums shrink-0">Active 24/7</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Column KPI Strip */}
          <div className="bg-slate-900/90 border-t border-slate-800">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-7 grid grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-4 lg:gap-0 lg:divide-x lg:divide-slate-800">
              {stats.map((item, idx) => (
                <div key={idx} className={idx > 0 ? 'lg:pl-8' : ''}>
                  <div className="font-mono tabular-nums text-2xl sm:text-3xl font-semibold text-amber-400">
                    {item.num}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-300 mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Services Section */}
        <section id="services" className="py-14 sm:py-16 lg:py-24 bg-slate-50">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="max-w-2xl mb-12">
              <p className="text-sm font-medium text-amber-700 mb-2">Security Capabilities</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-3">
                Our Security Services
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Disciplined manned guarding, corporate protection, event management, and remote CCTV surveillance tailored to your site risk profile.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
              {siteData.services.map((srv, index) => {
                const isWide =
                  siteData.services.length >= 4 && (index === 0 || index === 3)
                    ? 'lg:col-span-7'
                    : siteData.services.length >= 4
                      ? 'lg:col-span-5'
                      : 'lg:col-span-6';
                const numPrefix = String(index + 1).padStart(2, '0');

                return (
                  <article
                    key={srv.id}
                    className={`${isWide} bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col justify-between transition-colors duration-150 hover:border-slate-300`}
                  >
                    <div>
                      <div className="aspect-[16/9] sm:aspect-[4/3] max-h-64 w-full overflow-hidden bg-slate-900 relative">
                        <ResilientImage
                          src={srv.imageUrl}
                          alt={srv.title}
                          fallbackTitle={srv.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-6 sm:p-7">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-2">
                          <span className="font-mono tabular-nums">{numPrefix}</span>
                          <span aria-hidden="true">·</span>
                          <span>{srv.category}</span>
                        </div>
                        <h3 className="font-display text-xl font-bold text-slate-900 tracking-tight mb-2">
                          {numPrefix}. {srv.title}
                        </h3>
                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                          {srv.desc}
                        </p>
                      </div>
                    </div>

                    <div className="px-6 sm:px-7 pb-6 pt-2">
                      <button
                        type="button"
                        onClick={() => handleSelectServiceForQuote(srv.title)}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 hover:text-amber-700 transition-colors cursor-pointer"
                      >
                        <span>Request {srv.title}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Active On-Ground Deployment Showcase — Jabalpur, Madhya Pradesh */}
        <section id="jabalpur-deployments" className="py-14 sm:py-16 lg:py-24 bg-white border-t border-slate-200">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 sm:mb-12">
              <div className="max-w-2xl">
                <p className="text-sm font-medium text-amber-700 mb-2">
                  On-Ground Operations · Jabalpur, Madhya Pradesh
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-3">
                  Active Security Services in Jabalpur
                </h2>
                <p className="text-base text-slate-600 leading-relaxed">
                  Providing disciplined, uniformed guarding, hospitality entrance security, and visitor screening across commercial venues in Jabalpur — including active 24/7 site deployment at{' '}
                  <span className="font-semibold text-slate-900">House of Blends, Jabalpur</span>.
                </p>
              </div>
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => scrollToSection('contact')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors duration-150 whitespace-nowrap cursor-pointer"
                >
                  <span>Request Jabalpur Deployment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {[
                {
                  src: '/src/assets/images/jabalpur_1.jpg',
                  alt: 'Shree Balaji Security officer welcoming guests at House of Blends Jabalpur',
                  tag: 'House of Blends · Jabalpur',
                  title: 'Front Entrance Hospitality Guarding',
                  desc: 'Courteous guest reception, doorway access control, and visible deterrence at Jabalpur retail and cafe venues.',
                },
                {
                  src: '/src/assets/images/jabalpur_2.jpg',
                  alt: 'Shree Balaji Security guard checking digital duty log inside Jabalpur cafe',
                  tag: 'Digital Check-In · Jabalpur',
                  title: 'Duty Roster & Visitor Verification',
                  desc: 'Real-time shift logging, supervision reporting, and digital entry verification by trained site guards.',
                },
                {
                  src: '/src/assets/images/jabalpur_3.jpg',
                  alt: 'Shree Balaji Security guard screening visitors at entrance in Jabalpur',
                  tag: 'Access Screening · Jabalpur',
                  title: 'Visitor & Bag Screening',
                  desc: 'Alert entry-point screening ensuring safety for families, patrons, and staff throughout operating hours.',
                },
                {
                  src: '/src/assets/images/jabalpur_4.jpg',
                  alt: 'Uniformed Shree Balaji Security guard stationed outside House of Blends Jabalpur',
                  tag: 'Active Post · Jabalpur, MP',
                  title: 'Dedicated Site Protection',
                  desc: 'PSARA-compliant, background-verified officers stationed on-site across Jabalpur businesses and establishments.',
                },
              ].map((item, idx) => (
                <article
                  key={item.src}
                  className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex flex-col transition-colors duration-150 hover:border-slate-300"
                >
                  <div className="aspect-[4/5] w-full overflow-hidden bg-slate-900 relative">
                    <ResilientImage
                      src={item.src}
                      alt={item.alt}
                      fallbackTitle={item.title}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-amber-700 font-medium mb-1.5">
                        <span className="font-mono tabular-nums">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.tag}</span>
                      </div>
                      <h3 className="font-display text-lg font-bold text-slate-900 tracking-tight mb-1.5">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Proof & Operations / About Us Section */}
        <section id="about" className="py-14 sm:py-16 lg:py-24 bg-slate-100 border-y border-slate-200">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-7">
              <p className="text-sm font-medium text-amber-700 mb-2">Operational Standards</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-4">
                {siteData.aboutTitle}
              </h2>
              <p className="text-base text-slate-600 leading-relaxed max-w-2xl mb-8">
                {siteData.aboutDesc}
              </p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {siteData.aboutPoints.map((point, idx) => (
                  <li
                    key={idx}
                    className="bg-white border border-slate-200 rounded-lg p-4 flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-800 leading-snug">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-5 bg-slate-950 text-white rounded-lg p-7 sm:p-9 border border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0" />
                <h3 className="font-display text-xl font-bold tracking-tight text-white">
                  24/7 Emergency Control Room
                </h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Need rapid guard deployment, site security audit, or urgent event protection? Our operations desk responds around the clock.
              </p>

              <div className="space-y-4 border-t border-slate-800 pt-6">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                  {siteData.phone
                    .split(/[,/]/)
                    .map((num) => num.trim())
                    .filter(Boolean)
                    .map((num, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2">
                        {idx > 0 && (
                          <span aria-hidden="true" className="text-slate-500">
                            /
                          </span>
                        )}
                        <a
                          href={`tel:${num.replace(/[^\d+]/g, '')}`}
                          className="inline-flex items-center gap-2 text-base font-mono tabular-nums font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          {idx === 0 && <Phone className="w-4 h-4 shrink-0" />}
                          <span>{num}</span>
                        </a>
                      </span>
                    ))}
                </div>
                <a
                  href={`mailto:${siteData.email}`}
                  className="flex items-center gap-3 text-sm text-slate-300 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{siteData.email}</span>
                </a>
                <div className="flex items-start gap-3 text-sm text-slate-300">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{siteData.address}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => scrollToSection('contact')}
                className="mt-7 w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-sm rounded-md transition-colors cursor-pointer"
              >
                Schedule Site Security Assessment
              </button>
            </div>
          </div>
        </section>

        {/* Lead Capture / Request a Quote Form */}
        <section id="contact" className="py-14 sm:py-16 lg:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <p className="text-sm font-medium text-amber-700 mb-2">Request Deployment Proposal</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-3">
                Request a Free Quote
              </h2>
              <p className="text-base text-slate-600">
                Share your site location, shift requirements, and guard count. Our operations team will respond promptly with a tailored security plan.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 sm:p-10">
              <form onSubmit={handleQuoteSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="quote-name"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Full Name *
                    </label>
                    <input
                      id="quote-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="quote-phone"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Phone Number *
                    </label>
                    <input
                      id="quote-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98XXX XXXXX"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm font-mono tabular-nums text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="quote-email"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="quote-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="quote-service"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Security Service *
                    </label>
                    <select
                      id="quote-service"
                      required
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:border-slate-900"
                    >
                      <option value="">Select Security Service *</option>
                      {siteData.services.map((srv) => (
                        <option key={srv.id} value={srv.title}>
                          {srv.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="quote-message"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Site Location & Requirement Details
                  </label>
                  <textarea
                    id="quote-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Mention site address, number of shifts or guards needed, or CCTV coverage area..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                  />
                </div>

                {feedback && (
                  <div
                    role="status"
                    className={`p-3.5 rounded-md border flex items-start gap-2.5 text-sm font-medium ${
                      feedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    {feedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    )}
                    <span>{feedback.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold rounded-md transition-colors duration-150 cursor-pointer"
                >
                  {submitting ? 'Submitting Inquiry...' : 'Submit Quote Request'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-9 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
            <img
              src={LOGO_IMAGE}
              alt={`${siteData.companyName} logo`}
              referrerPolicy="no-referrer"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border border-amber-400/50 shrink-0"
            />
            <div className="min-w-0">
              <p className="font-display font-extrabold text-white text-sm sm:text-base tracking-[0.05em] sm:tracking-[0.07em] [word-spacing:0.14em] sm:[word-spacing:0.2em] uppercase break-words">
                {siteData.companyName} {siteData.companyTag}
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 break-words">
                Office: {siteData.address} · Email: {siteData.email} · Phone: {siteData.phone}
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 shrink-0 whitespace-nowrap">
            © {new Date().getFullYear()} {siteData.companyName}
          </div>
        </div>
      </footer>
    </div>
  );
}
