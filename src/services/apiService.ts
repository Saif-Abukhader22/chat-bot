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
  const candidateSet = new Set<string>();
  const candidates: string[] = [];
  const add = (u: string) => { if (!candidateSet.has(u)) { candidateSet.add(u); candidates.push(u); } };
  if (API_BASE) add(url(p));
  add(p);
  // Dev convenience: when UI runs on :8080 (or :4000), also try FastAPI on :8000
  try {
    const host = typeof window !== 'undefined' ? window.location.host : '';
    if (/localhost:8080|127\.0\.0\.1:8080|localhost:4000|127\.0\.0\.1:4000/.test(host) || (API_BASE && /localhost:4000|127\.0\.0\.1:4000/.test(API_BASE))) {
      add(`http://localhost:8000${p}`);
      add(`http://127.0.0.1:8000${p}`);
    }
  } catch {}
  // Always ensure direct fallbacks to common dev ports are present
  add(`http://localhost:8000${p}`);
  add(`http://127.0.0.1:8000${p}`);

  let lastErr: any = null;
  for (let i = 0; i < candidates.length; i++) {
    const target = candidates[i];
    try {
      const res = await fetch(target, init);
      const isRelative = target.startsWith('/');
      // Retry on common non-ok statuses to try next candidate (e.g., fallback to :8000)
      if (!res.ok && i < candidates.length - 1) {
        const retryable = res.status >= 500 || res.status === 404 || res.status === 405 || res.status === 0;
        if (retryable) {
          continue;
        }
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






































































    // Stream with proper SSE parsing and auth headers, using fallback targets
    const res = await fetchWithFallback(`/api/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...DEFAULT_HEADERS,
        ...authHeader(),
      },
      body: JSON.stringify({ content, stream: true }),
    });
    if (!res.ok || !res.body) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // Normalize CRLF to LF
      buffer = buffer.replace(/\r\n/g, '\n');
      let nlIdx = buffer.indexOf('\n');
      while (nlIdx !== -1) {
        const line = buffer.slice(0, nlIdx);
        buffer = buffer.slice(nlIdx + 1);
        const trimmed = line.trim();
        // Skip comments/keepalives starting with ':' or empty lines
        if (!trimmed || trimmed.startsWith(':')) {
          nlIdx = buffer.indexOf('\n');
          continue;
        }
        if (trimmed.startsWith('data:')) {
          const jsonPart = trimmed.slice(5).trim();
          try {
            const obj = JSON.parse(jsonPart);
            if (obj.error) {
              throw new Error(typeof obj.error === 'string' ? obj.error : 'assistant_unavailable');
            }
            if (obj.delta) {
              const delta = String(obj.delta);
              full += delta;
              onStream(delta);
            }
            // Optional: break if server signals done
            if (obj.done) {
              // Do not break early; ensure body reader drains to let server finish cleanly
            }
          } catch {
            // Keep partial JSON in buffer by prefixing it back for next iteration
            buffer = jsonPart + '\n' + buffer;
          }
        }
        nlIdx = buffer.indexOf('\n');
      }
    }
    // Process any trailing line without newline
    const tail = buffer.trim();
    if (tail.startsWith('data:')) {
      const jsonPart = tail.slice(5).trim();
      try {
        const obj = JSON.parse(jsonPart);
        if (obj.delta) {
          const delta = String(obj.delta);
          full += delta;
          onStream(delta);
        }
      } catch {
        // Ignore
      }
    }
    // If stream yielded nothing, make a non-streaming request as fallback
    if (!full.trim()) {
      try {
        const data = await http<{ userMessage: Message; assistantMessage: Message }>(`/api/threads/${threadId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ content }),
        });
        const text = data.assistantMessage?.content || '';
        if (text) {
          onStream(text);
          return text;
        }
      } catch (e) {
        // Rethrow to be handled by caller
        throw e;
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
