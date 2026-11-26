import {
  User,
  UserRole,
  VentureCard,
  VentureDetail,
  InvestorMandate,
  Connection,
  Message,
  OnboardingQuestion,
  FounderProfile,
  OnboardingAnalysisResult,
  InvestorProfile,
  InvestorAnalysisResult,
  AIChatResponse,
  AIChatMessage,
  MatchCase,
  AppointmentRequest,
  PlatformConfig,
  ReviewStage,
  AppointmentStatus,
} from './types';
import { SEED_VENTURES, SEED_MATCH_CASES, SEED_MANDATE_ROHAN } from './fallbackData';
import { DEMO_ACCOUNTS } from './demoAccounts';

const API_BASE = 'http://localhost:8000/api';

export class Api {
  private static token: string | null = localStorage.getItem('nv_token');
  private static currentUser: User | null = null;

  public static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('nv_token', token);
    } else {
      localStorage.removeItem('nv_token');
    }
  }

  public static getToken(): string | null {
    return this.token;
  }

  public static setCurrentUser(user: User | null) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('nv_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('nv_user');
    }
  }

  public static getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;
    const stored = localStorage.getItem('nv_user');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      } catch {
        return null;
      }
    }
    return null;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (!res.ok) {
        if (res.status === 401) {
          this.logout();
        }
        let errorMsg = `Error ${res.status}`;
        try {
          const data = await res.json();
          errorMsg = data.detail || data.message || errorMsg;
        } catch {
          // fallback
        }
        throw new Error(errorMsg);
      }

      return res.json();
    } catch (networkErr: any) {
      // If network is offline/unreachable in client preview, provide canonical seed fallback
      if (endpoint === '/auth/login' || endpoint.startsWith('/auth/login')) {
        const body = options.body ? JSON.parse(options.body as string) : {};
        const email = body.email || '';
        const demo = DEMO_ACCOUNTS.find((d) => d.email.toLowerCase() === email.toLowerCase()) || DEMO_ACCOUNTS[0];
        const fallbackUser: User = {
          id: demo.role === 'INVESTOR' ? 'usr-investor-01' : 'usr-founder-01',
          email: demo.email,
          full_name: demo.name,
          role: demo.role,
          firm_or_company: demo.firm,
          created_at: new Date().toISOString(),
        };
        const token = 'simulated-token-for-' + demo.email;
        this.setToken(token);
        this.setCurrentUser(fallbackUser);
        return { access_token: token, user: fallbackUser } as unknown as T;
      }
      if (endpoint.startsWith('/auth/me')) {
        const u = this.getCurrentUser();
        if (u) return u as unknown as T;
        const defaultUser: User = {
          id: 'usr-investor-01',
          email: 'investor@peakindia.vc',
          full_name: 'Rohan Varma',
          role: 'INVESTOR',
          firm_or_company: 'Varma Capital Partners',
          created_at: new Date().toISOString(),
        };
        return defaultUser as unknown as T;
      }
      if (endpoint.startsWith('/ventures/')) {
        const vId = endpoint.replace('/ventures/', '').split('?')[0];
        const v = SEED_VENTURES.find((item) => item.id === vId);
        if (v) return v as unknown as T;
      } else if (endpoint.startsWith('/ventures')) {
        return SEED_VENTURES as unknown as T;
      } else if (endpoint.startsWith('/mandates/me')) {
        if (options.method === 'PATCH' && options.body) {
          const patch = JSON.parse(options.body as string);
          const stored = localStorage.getItem('nv_mandate');
          const base = stored ? JSON.parse(stored) : SEED_MANDATE_ROHAN;
          const merged = { ...base, ...patch };
          localStorage.setItem('nv_mandate', JSON.stringify(merged));
          return merged as unknown as T;
        }
        const stored = localStorage.getItem('nv_mandate');
        return (stored ? JSON.parse(stored) : SEED_MANDATE_ROHAN) as unknown as T;
      } else if (endpoint.startsWith('/matches')) {
        return Object.values(SEED_MATCH_CASES) as unknown as T;
      } else if (endpoint.startsWith('/appointments')) {
        return { id: 'apt-simulated-01', status: 'PENDING_FOUNDER_REVIEW' } as unknown as T;
      }
      throw networkErr;
    }
  }

  // Platform Config
  public static async getConfig(): Promise<PlatformConfig> {
    return this.request<PlatformConfig>('/config');
  }

  // Auth
  public static async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await this.request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    this.setCurrentUser(res.user);
    return res;
  }

  public static async register(data: {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    firm_or_company?: string;
  }): Promise<{ access_token: string; user: User }> {
    const res = await this.request<{ access_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.access_token);
    this.setCurrentUser(res.user);
    return res;
  }

  public static async getMe(): Promise<User> {
    const user = await this.request<User>('/auth/me');
    this.setCurrentUser(user);
    return user;
  }

  public static logout() {
    this.setToken(null);
    this.setCurrentUser(null);
  }

  // Ventures
  public static async getVentures(filters?: {
    sector?: string;
    stage?: string;
    min_ticket?: number;
    max_ticket?: number;
    search?: string;
  }): Promise<VentureCard[]> {
    const params = new URLSearchParams();
    if (filters?.sector && filters.sector !== 'all') params.append('sector', filters.sector);
    if (filters?.stage && filters.stage !== 'all') params.append('stage', filters.stage);
    if (filters?.min_ticket) params.append('min_ticket', filters.min_ticket.toString());
    if (filters?.max_ticket) params.append('max_ticket', filters.max_ticket.toString());
    if (filters?.search) params.append('search', filters.search);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return this.request<VentureCard[]>(`/ventures${queryStr}`);
  }

  public static async getVentureDetail(id: string): Promise<VentureDetail> {
    return this.request<VentureDetail>(`/ventures/${id}`);
  }

  public static async getMyVenture(): Promise<VentureDetail> {
    return this.request<VentureDetail>('/ventures/me/current');
  }

  public static async createVenture(data: Partial<VentureDetail>): Promise<VentureDetail> {
    return this.request<VentureDetail>('/ventures', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async updateMyVenture(id: string, data: Partial<VentureDetail>): Promise<VentureDetail> {
    return this.request<VentureDetail>(`/ventures/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public static async addImageToVenture(
    ventureId: string,
    imageUrl: string,
    caption?: string,
    setAsHero: boolean = false
  ): Promise<VentureDetail> {
    return this.request<VentureDetail>(`/ventures/${ventureId}/images`, {
      method: 'POST',
      body: JSON.stringify({ image_url: imageUrl, caption, set_as_hero: setAsHero }),
    });
  }

  // Investor Mandates
  public static async getMyMandate(): Promise<InvestorMandate> {
    return this.request<InvestorMandate>('/mandates/me');
  }

  public static async updateMyMandate(data: Partial<InvestorMandate>): Promise<InvestorMandate> {
    return this.request<InvestorMandate>('/mandates/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public static async getAllMandates(): Promise<InvestorMandate[]> {
    return this.request<InvestorMandate[]>('/mandates');
  }

  // Matching Engine
  public static async runMatchAssessment(ventureId: string, mandateId?: string): Promise<MatchCase> {
    return this.request<MatchCase>('/matches/run', {
      method: 'POST',
      body: JSON.stringify({ venture_id: ventureId, mandate_id: mandateId }),
    });
  }

  public static async getMatchCases(): Promise<MatchCase[]> {
    return this.request<MatchCase[]>('/matches');
  }

  public static async getMatchCase(id: string): Promise<MatchCase> {
    return this.request<MatchCase>(`/matches/${id}`);
  }

  public static async updateMatchReviewStage(id: string, stage: ReviewStage): Promise<MatchCase> {
    return this.request<MatchCase>(`/matches/${id}/review?stage=${stage}`, {
      method: 'PATCH',
    });
  }

  // Appointments
  public static async createAppointment(data: {
    venture_id: string;
    match_case_id?: string | null;
    meeting_purpose: string;
    sharing_scope?: string;
    preferred_times?: string[];
    notes?: string;
  }): Promise<AppointmentRequest> {
    return this.request<AppointmentRequest>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async getAppointments(): Promise<AppointmentRequest[]> {
    return this.request<AppointmentRequest[]>('/appointments');
  }

  public static async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<AppointmentRequest> {
    return this.request<AppointmentRequest>(`/appointments/${id}/status?status=${status}`, {
      method: 'PATCH',
    });
  }

  // Connections
  public static async getConnections(): Promise<Connection[]> {
    return this.request<Connection[]>('/connections');
  }

  public static async requestConnection(ventureId: string, note?: string): Promise<Connection> {
    return this.request<Connection>('/connections/request', {
      method: 'POST',
      body: JSON.stringify({ venture_id: ventureId, note }),
    });
  }

  public static async submitConsent(connectionId: string, consent: boolean): Promise<Connection> {
    return this.request<Connection>(`/connections/${connectionId}/consent`, {
      method: 'POST',
      body: JSON.stringify({ consent }),
    });
  }

  // Messaging (1-on-1 Chat)
  public static async getMessages(connectionId: string): Promise<Message[]> {
    return this.request<Message[]>(`/connections/${connectionId}/messages`);
  }

  public static async sendMessage(connectionId: string, content: string): Promise<Message> {
    return this.request<Message>(`/connections/${connectionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  public static async getUnreadMessages(): Promise<Message[]> {
    return this.request<Message[]>('/connections/messages/unread');
  }

  // AI Assistant Chatbot
  public static async sendAIChat(
    message: string,
    context: 'INVESTOR' | 'FOUNDER',
    ventureId?: string,
    history: AIChatMessage[] = []
  ): Promise<AIChatResponse> {
    return this.request<AIChatResponse>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context, venture_id: ventureId, history }),
    });
  }

  // Onboarding Questions & Founder Discovery
  public static async getOnboardingQuestions(
    v1Only: boolean = true,
    stage: 'founder_discovery' | 'investor_discovery' = 'founder_discovery'
  ): Promise<OnboardingQuestion[]> {
    return this.request<OnboardingQuestion[]>(`/onboarding/questions?v1_only=${v1Only}&stage=${stage}`);
  }

  // Investor Onboarding & Profile
  public static async analyzeInvestorOnboarding(
    answers: Record<string, any>,
    naturalLanguageNote?: string
  ): Promise<InvestorAnalysisResult> {
    return this.request<InvestorAnalysisResult>('/mandates/onboarding/analyze', {
      method: 'POST',
      body: JSON.stringify({ answers, natural_language_note: naturalLanguageNote }),
    });
  }

  public static async submitInvestorOnboarding(
    answers: Record<string, any>,
    confirmedMandate: Record<string, any>,
    aiSummary?: string
  ): Promise<{ status: string; investor_profile: InvestorProfile; mandate: InvestorMandate }> {
    return this.request('/mandates/onboarding/submit', {
      method: 'POST',
      body: JSON.stringify({ answers, confirmed_mandate: confirmedMandate, ai_summary: aiSummary }),
    });
  }

  public static async getInvestorProfile(): Promise<InvestorProfile> {
    return this.request<InvestorProfile>('/mandates/investor-profile');
  }

  public static async updateInvestorProfile(
    data: Partial<InvestorProfile>
  ): Promise<InvestorProfile> {
    return this.request<InvestorProfile>('/mandates/investor-profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public static async getFounderProfile(): Promise<FounderProfile> {
    return this.request<FounderProfile>('/onboarding/founder-profile');
  }

  public static async updateFounderProfile(
    data: Partial<FounderProfile>
  ): Promise<FounderProfile> {
    return this.request<FounderProfile>('/onboarding/founder-profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public static async analyzeOnboardingAnswers(
    answers: Record<string, any>
  ): Promise<OnboardingAnalysisResult> {
    return this.request<OnboardingAnalysisResult>('/onboarding/analyze', {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  public static async submitOnboardingAnswers(
    answers: Record<string, any>,
    aiSummary?: string
  ): Promise<any> {
    return this.request<any>('/onboarding/submit', {
      method: 'POST',
      body: JSON.stringify({ answers, ai_summary: aiSummary }),
    });
  }

  // Dev tools
  public static async resetDevDatabase(): Promise<any> {
    return this.request<any>('/dev/reset', { method: 'POST' });
  }
}
