// ── Auth ────────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  name: string;
  email: string;
  expiresAt: string;
}

export interface CurrentUser {
  userId: string;
  name: string;
  email: string;
}

// ── Bots ─────────────────────────────────────────────────────────────────────

export interface Bot {
  id: string;
  botName: string;
  projectId: string;
  languageCode: string;
  createdDate: string;
  updatedDate: string;
}

export interface BotConfig {
  id: string;
  botName: string;
  projectId: string;
  languageCode: string;
  hasCredential: boolean;
  createdDate: string;
  updatedDate: string;
}

export interface CreateBotRequest {
  botName: string;
  projectId: string;
  languageCode: string;
}

export interface UpdateBotRequest {
  botName?: string;
  languageCode?: string;
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id?: string;
  botId: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: string | Date;
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalBots: number;
  totalMessages: number;
  recentBots: Bot[];
}

// ── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  details?: string;
  statusCode: number;
}

// ── SignalR ──────────────────────────────────────────────────────────────────

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface SignalRMessage {
  sender: 'user' | 'bot';
  message: string;
  timestamp: string;
}
