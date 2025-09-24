export type ID = string;

export interface Agent {
  id: ID;
  tenantId: ID;
  name: string;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  createdAt: string;
}

export interface Thread {
  id: ID;
  tenantId: ID;
  userId: ID;
  agentId: ID;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: ID;
  threadId: ID;
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt: string;
}

const API_BASE: string = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || '';

const DEFAULT_HEADERS: HeadersInit = {
  // Optional dev headers; backend will default if omitted
  // 'x-tenant-id': 'dev-tenant',
  // 'x-user-id': 'dev-user',
  // 'x-user-name': 'Dev User',
};

function url(path: string) {
  if (!API_BASE) return path;
  const base = API_BASE.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  if (/\/api\/auth$/.test(base) && p.startsWith('/api/auth/')) {
    return `${base}${p.replace(/^\/api\/auth/, '')}`;
  }
  if (/\/api$/.test(base) && p.startsWith('/api/')) {
    return `${base}${p.replace(/^\/api/, '')}`;
  }
  return `${base}${p}`;
}

async function fetchWithFallback(inputPath: string, init?: RequestInit): Promise<Response> {
  const p = inputPath.startsWith('/') ? inputPath : `/${inputPath}`;
  const candidates: string[] = [];
  if (API_BASE) candidates.push(url(p));
  candidates.push(p);
  // Dev convenience: when UI runs on :8080 (or :4000), also try FastAPI on :8000
  try {
    const host = typeof window !== 'undefined' ? window.location.host : '';
    if (/localhost:8080|127\.0\.0\.1:8080|localhost:4000/.test(host) || (API_BASE && /localhost:4000/.test(API_BASE))) {
      candidates.push(`http://localhost:8000${p}`);
    }
  } catch {}

  let lastErr: any = null;
  for (let i = 0; i < candidates.length; i++) {
    const target = candidates[i];
    try {
      const res = await fetch(target, init);
      const isRelative = target.startsWith('/');
      if (!res.ok && isRelative && (res.status === 404 || res.status === 405) && i < candidates.length - 1) {
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  throw lastErr || new Error('network_error');
}

function authHeader(): Record<string, string> {
  try {
    const token = sessionStorage.getItem('auth-token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function http<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithFallback(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}), ...DEFAULT_HEADERS, ...authHeader() },
  });
  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch {}
    throw new Error(`HTTP ${res.status}: ${detail || res.statusText}`);
  }
  return res.json();
}

export async function getAgents(): Promise<Agent[]> {
  const data = await http<{ agents: Agent[] }>(`/api/agents`);
  return data.agents;
}

export async function health(): Promise<{ ok: boolean } | any> {
  return http(`/health`);
}

export async function listThreads(): Promise<Thread[]> {
  const data = await http<{ threads: Thread[] }>(`/api/threads`);
  return data.threads;
}

export async function createThread(agentId: string, title: string): Promise<Thread> {
  const data = await http<{ thread: Thread }>(`/api/threads`, {
    method: 'POST',
    body: JSON.stringify({ agentId, title }),
  });
  return data.thread;
}

export async function listMessages(threadId: string): Promise<Message[]> {
  const data = await http<{ messages: Message[] }>(`/api/threads/${threadId}/messages`);
  return data.messages;
}

export async function updateThread(threadId: string, input: { title: string }): Promise<Thread> {
  const data = await http<{ thread: Thread }>(`/api/threads/${threadId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return data.thread;
}

export async function sendMessage(
  threadId: string,
  content: string,
  onStream?: (delta: string) => void,
): Promise<{ userMessage: Message; assistantMessage: Message } | string> {
  if (onStream) {
    const res = await fetch(url(`/api/threads/${threadId}/messages`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', ...DEFAULT_HEADERS },
      body: JSON.stringify({ content, stream: true }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      // Parse SSE lines like: data: {"delta":"text"}
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const jsonPart = trimmed.slice(5).trim();
        try {
          const obj = JSON.parse(jsonPart);
          if (obj.error) {
            throw new Error(typeof obj.error === 'string' ? obj.error : 'assistant_unavailable');
          }
          if (obj.delta) {
            full += obj.delta as string;
            onStream(obj.delta as string);
          }
          // done event ignored here; backend persists final message server-side
        } catch {
          // ignore parse errors on keepalives
        }
      }
    }
    return full;
  }

  const data = await http<{ userMessage: Message; assistantMessage: Message }>(`/api/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  return data;
}
