export type InquiryStatus = 'Pending' | 'Contacted' | 'Completed';

export interface ServiceItem {
  id: number;
  category: string;
  title: string;
  desc: string;
  imageUrl: string;
}

export interface SiteData {
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

export interface InquiryItem {
  id: number;
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
}

export interface AdminAuthStatus {
  configured: boolean;
  mode: 'env' | 'claimed' | 'unclaimed';
}
