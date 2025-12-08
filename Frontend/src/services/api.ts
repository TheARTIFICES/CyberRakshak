// API Service Layer for CyberRakshak Frontend

// Use relative path so it works with Nginx (Port 80) or direct (if proxied)
const API_BASE_URL = '/api';

interface ScanStartRequest {
  target: string;
  scanners?: Record<string, any>;
  config?: Record<string, any>;
  notify_email?: boolean;
  email_recipients?: string[];
}

interface ScanStartResponse {
  job_id: string;
  status: string;
  target: string;
  scanners_requested: string[];
}

interface ScanStatusResponse {
  job_id: string;
  status: string;
  target: string;
  created_at: string;
  scanners_requested: string[] | null;
  tool_status: Record<string, string> | null;
  results: any | null;
}

interface DashboardStatsResponse {
  total_vulnerabilities: number;
  critical_findings: number;
  high_findings: number;
  medium_findings: number;
  low_findings: number;
  asset_criticality_score: number;
  open_ports_detected: number;
  unified_cyber_score: number;
  total_assets: number;
  internet_exposed: number;
  high_risk_assets: number;
  cloud_assets: number;
  asset_distribution: Record<string, number>;
}

export interface RemediationStep {
  cve: string;
  title: string;
  severity: string;
  asset: string;
  action: string;
  source: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "error";
  is_read: boolean;
  timestamp: string;
  job_id?: string;
}

interface ThreatIntelSummaryResponse {
  total_cve_tracked: number;
  cisa_kev_tracked: number;
  exploits_available: number;
  most_recent_sync: string;
}

interface VulnerabilityMetadata {
    cve_id: string;
    description: string;
    cvss_score: number;
    severity: string;
    is_cisa_kev: boolean;
    has_exploit: boolean;
    last_updated: string;
}

interface AssetResponse {
  id: string;
  name: string;
  ip: string;
  os: string;
  exposure: string;
  risk: string;
  cloud: string;
  discovered_by: string;
  last_seen: string;
}

interface VulnerabilityResponse {
  id: string;
  cve: string;
  title: string;
  description?: string;
  severity: string;
  cvss: number;
  asset: string;
  tool: string;
  date: string;
}

interface JobHistoryResponse {
  job_id: string;
  target: string;
  status: string;
  created_at: string;
  scanners_used: string[];
}

interface ReportStatsResponse {
  total: number;
  completed: number;
  pending: number;
  failed: number;
}

interface ReportResponse {
  id: string;
  name: string;
  type: string;
  date: string;
  status: string;
}

// Chat Assistant Interfaces
interface ChatMessageRequest {
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

interface ChatMessageResponse {
  response: string;
}

// Helper function for API calls
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call to ${url} failed:`, error);
    throw error;
  }
}

// Helper to serialize filters
const serializeFilters = (params: URLSearchParams, filters?: Record<string, any>) => {
  if (!filters) return;
  Object.keys(filters).forEach(key => {
    const value = filters[key];
    if (Array.isArray(value)) {
      value.forEach(v => params.append(key, v));
    } else if (value !== undefined && value !== null && value !== "") {
      params.append(key, value);
    }
  });
};

// Scan APIs
export const startScan = async (request: ScanStartRequest): Promise<ScanStartResponse> => {
  return apiCall<ScanStartResponse>('/scan/start', {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

export const getScanStatus = async (jobId: string): Promise<ScanStatusResponse> => {
  return apiCall<ScanStatusResponse>(`/scan/status/${jobId}?include_results=false`);
};

export const getScanGraph = async (jobId: string): Promise<any> => {
  return apiCall<any>(`/scan/graph/${jobId}`);
};

export const getScanReport = async (jobId: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/scan/report/${jobId}`);
  return response.blob();
};

export const getAuditLogs = async (
  limit: number = 50,
  search?: string
): Promise<any[]> => {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (search) params.append("search", search);
  return apiCall<any[]>(`/scan/logs?${params.toString()}`);
};

// Dashboard APIs
export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
  return apiCall<DashboardStatsResponse>('/dashboard/stats');
};

// Asset APIs
export const getAssets = async (
  skip: number = 0, 
  limit: number = 100,
  filters?: Record<string, string[]>
): Promise<AssetResponse[]> => {
  const params = new URLSearchParams();
  params.append("skip", skip.toString());
  params.append("limit", limit.toString());

  if (filters) {
    if (filters.risk?.length) filters.risk.forEach(v => params.append("risk", v));
    if (filters.exposure?.length) filters.exposure.forEach(v => params.append("exposure", v));
    if (filters.os?.length) filters.os.forEach(v => params.append("os", v));
    if (filters.cloud?.length) filters.cloud.forEach(v => params.append("cloud", v));
  }

  return apiCall<AssetResponse[]>(`/assets?${params.toString()}`);
};

// Vulnerability APIs
export const getVulnerabilities = async (
  skip: number = 0, 
  limit: number = 100,
  filters?: { severity?: string[]; tool?: string[]; search?: string }
): Promise<VulnerabilityResponse[]> => {
  const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
  serializeFilters(params, filters);
  return apiCall<VulnerabilityResponse[]>(`/vulnerabilities?${params.toString()}`);
};

// Job History APIs
export const getJobHistory = async (skip: number = 0, limit: number = 100): Promise<JobHistoryResponse[]> => {
  return apiCall<JobHistoryResponse[]>(`/jobs?skip=${skip}&limit=${limit}`);
};

// Report APIs
export const getReports = async (
  skip: number = 0, 
  limit: number = 100,
  filters?: { status?: string[]; search?: string }
): Promise<ReportResponse[]> => {
  const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
  serializeFilters(params, filters);
  return apiCall<ReportResponse[]>(`/reports?${params.toString()}`);
};

// Chat Assistant APIs
export const sendChatMessage = async (message: string): Promise<string> => {
  const request: ChatMessageRequest = { message };
  const response = await apiCall<ChatMessageResponse>('/chat/message', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return response.response;
};

export async function* streamChatResponse(
  message: string, 
  history: { role: "user" | "assistant"; content: string }[] = []
): AsyncGenerator<string, void, unknown> {
  
  const url = `${API_BASE_URL}/chat/stream`;
  console.log("🚀 Starting Stream Request to:", url); // DEBUG LOG

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok) {
    console.error("❌ Stream Request Failed:", response.status);
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  if (!response.body) throw new Error('Response body is null');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("✅ Stream Complete");
        break;
      }
      const chunk = decoder.decode(value, { stream: true });
      console.log("📦 Chunk Received:", chunk); // DEBUG LOG
      yield chunk;
    }
  } catch (err) {
    console.error("🔥 Stream Error:", err);
  } finally {
    reader.releaseLock();
  }
}

export const getThreatIntelSummary = async (): Promise<ThreatIntelSummaryResponse> => {
  return apiCall<ThreatIntelSummaryResponse>("/threat-intel/summary", "GET");
};

export const getThreatIntelFeed = async (
  skip: number = 0, 
  limit: number = 50,
  filters?: { severity?: string[]; exploit_status?: string; search?: string }
): Promise<VulnerabilityMetadata[]> => {
  const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
  serializeFilters(params, filters);
  return apiCall<VulnerabilityMetadata[]>(`/threat-intel/feed?${params.toString()}`, "GET");
};

export const getReportStats = async (): Promise<ReportStatsResponse> => {
  return apiCall<ReportStatsResponse>('/reports/stats');
};

export const getRemediationPlan = async (jobId: string): Promise<RemediationStep[]> => {
  return apiCall<RemediationStep[]>(`/remediation/${jobId}`);
};

// Notifications
export const getNotifications = async (): Promise<Notification[]> => {
  return apiCall<Notification[]>('/notifications');
};

export const markNotificationRead = async (id: string): Promise<void> => {
  return Promise.resolve(); // Placeholder, implement if backend supports it
};
