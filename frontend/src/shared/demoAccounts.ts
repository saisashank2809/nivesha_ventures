import { UserRole } from './types';

export interface DemoAccount {
  role: UserRole;
  name: string;
  firm: string;
  email: string;
  tab: string;
  badge: string;
  icon: string;
  subtitle: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'INVESTOR',
    name: 'Rohan Varma',
    firm: 'Varma Capital Partners',
    email: 'investor@peakindia.vc',
    tab: 'INVESTOR_DISCOVERY',
    badge: 'Investor',
    icon: '💼',
    subtitle: 'Growth & Credit Fund (₹10L – ₹2Cr tickets)',
  },
  {
    role: 'FOUNDER',
    name: 'Raghavendra Rao',
    firm: "Vayuputra Productions ('Garuda')",
    email: 'film.producer@nivesha.in',
    tab: 'FOUNDER_DASHBOARD',
    badge: 'Film Production',
    icon: '🎬',
    subtitle: '₹12 Cr Mythological Epic • Fractional Equity Units',
  },
  {
    role: 'FOUNDER',
    name: 'Vikramaditya Sahni',
    firm: 'StrideCraft Footwear (Aethel)',
    email: 'footwear.founder@nivesha.in',
    tab: 'FOUNDER_DASHBOARD',
    badge: 'Consumer Brand',
    icon: '👟',
    subtitle: '₹3 Cr D2C Scaling • Celebrity Rev-Share Line',
  },
  {
    role: 'FOUNDER',
    name: 'Suresh Chandra Patra',
    firm: 'Apex Precision Engineering',
    email: 'debt.founder@nivesha.in',
    tab: 'FOUNDER_DASHBOARD',
    badge: 'Secured Debt',
    icon: '⚙️',
    subtitle: '₹25L at 18% p.a. • Pledged 3 BHK Flat (4.6x Cover)',
  },
  {
    role: 'FOUNDER',
    name: 'Sravani Reddy',
    firm: 'GramaBlink Logistics',
    email: 'logistics.founder@nivesha.in',
    tab: 'FOUNDER_DASHBOARD',
    badge: 'Rural Logistics',
    icon: '🚚',
    subtitle: '₹75L • Tier-3 Quick Delivery • DWACRA SHG Hubs',
  },
  {
    role: 'FOUNDER',
    name: 'Dr. Hariprasad Varma',
    firm: 'Varma Multispeciality Care',
    email: 'healthcare.founder@nivesha.in',
    tab: 'FOUNDER_DASHBOARD',
    badge: 'Healthcare',
    icon: '🏥',
    subtitle: '₹5 Cr • 50% Equity Buyout & Digital Cath Lab',
  },
  {
    role: 'FOUNDER',
    name: 'Karthik Narayana',
    firm: 'Suryam Meadows Layout',
    email: 'realestate.founder@nivesha.in',
    tab: 'FOUNDER_DASHBOARD',
    badge: 'Real Estate',
    icon: '🏡',
    subtitle: '₹4 Cr Project Finance • 18-Acre Plotted Layout',
  },
  {
    role: 'FOUNDER',
    name: 'Arvind Nair',
    firm: 'The Malabar Coast Kitchen',
    email: 'founder@malabarcoast.in',
    tab: 'FOUNDER_DASHBOARD',
    badge: 'Hospitality',
    icon: '🍽️',
    subtitle: '₹20L • Revenue-Share Loan for Koramangala Outlet',
  },
  {
    role: 'REVIEWER',
    name: 'Platform Review Desk',
    firm: 'Nivesha Ventures',
    email: 'reviewer@nivesha.in',
    tab: 'PLATFORM_REVIEW',
    badge: 'Reviewer Desk',
    icon: '🛡️',
    subtitle: 'Independent Diligence, Audit & Introduction Clearances',
  },
];
