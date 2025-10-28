import { apiRequest } from "./queryClient";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

// Match DB schema (snake_case for URLs)
export interface HazardReportData {
  description: string;
  latitude: number;
  longitude: number;
  image_url?: string;   // snake_case
  audio_url?: string;   // snake_case
  location?: string;
  userId: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    return response.json();
  },

  register: async (data: RegisterData) => {
    const response = await apiRequest("POST", "/api/auth/register", data);
    return response.json();
  },
};

export const hazardReportApi = {
  create: async (data: HazardReportData) => {
    const response = await apiRequest("POST", "/api/hazard-reports", data);
    return response.json();
  },

  getAll: async () => {
    const response = await apiRequest("GET", "/api/hazard-reports");
    return response.json();
  },

  getByUser: async (userId: string) => {
    const response = await apiRequest("GET", `/api/hazard-reports/user/${userId}`);
    return response.json();
  },
};

// Webhook should accept JSON payload with URLs, not FormData
export const submitToN8nWebhook = async (payload: Record<string, any>) => {
  const webhookUrl =
    process.env.VITE_N8N_WEBHOOK_URL ||
    "https://your-n8n-instance.com/webhook/ocean-hazard";

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook submission failed: ${response.statusText}`);
  }

  return response.json();
};
