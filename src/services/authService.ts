const API_BASE: string = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || '';

function url(path: string) {
  if (!API_BASE) return path;
  const base = API_BASE.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  // If base already ends with /api or /api/auth and path starts with the same segment, avoid duplicating it
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
  if (API_BASE) candidates.push(url(p)); // env-configured base
  candidates.push(p); // relative (Vite proxy or same-origin)
  // Dev convenience: when running the UI on :8080 (or :4000), also try FastAPI on :8000
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
      // If using a relative origin (likely Vite) and it returned 404/405, try next candidate
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

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  tenantId: string;
}

export async function signup(email: string, name: string, password: string) {
  const res = await fetchWithFallback('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    // Build a more informative error to help callers show specific messages
    let raw = '';
    try { raw = await res.text(); } catch {}
    let parsed: any = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch {}
    const message = (parsed?.error || parsed?.message || raw || `HTTP ${res.status}`).toString();
    const err: any = new Error(message);
    err.status = res.status;
    err.body = parsed ?? raw;
    throw err;
  }
  const data: any = await res.json();
  const token: string | undefined = data?.token || data?.access_token;
  if (token) {
    sessionStorage.setItem('auth-token', token);
    // Try to resolve user from response or fallback to /me
    let user: AuthUser | undefined = data?.user;
    if (!user) {
      try { user = await me(); } catch { /* ignore until email verified */ }
    }
    return { token, user } as { token: string; user: AuthUser };
  }
  // No token provided (e.g., verification flow). Return placeholder.
  return data;
}

export async function sendVerificationCode(email: string, recaptchaToken?: string | null) {
  const res = await fetchWithFallback('/api/auth/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, recaptcha_token: recaptchaToken ?? null }),
  });
  if (!res.ok) {
    let raw = '';
    try { raw = await res.text(); } catch {}
    throw new Error(raw || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function verifyRegistration(email: string, verificationCode: string, recaptchaToken?: string | null) {
  const res = await fetchWithFallback('/api/auth/verify-registration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, verificationCode, recaptcha_token: recaptchaToken ?? null }),
  });
  if (!res.ok) {
    let raw = '';
    try { raw = await res.text(); } catch {}
    throw new Error(raw || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetchWithFallback('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    let raw = '';
    try { raw = await res.text(); } catch {}
    let parsed: any = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch {}
    const msg = (parsed?.detail || parsed?.message || raw || `HTTP ${res.status}`).toString();
    const err: any = new Error(msg);
    err.status = res.status;
    err.body = parsed ?? raw;
    // Special-case: email not confirmed — signal UI to show verification dialog
    const detail = parsed?.detail ?? parsed;
    const code = (typeof detail === 'string' ? detail : detail?.code) || '';
    const status = (typeof detail === 'string' ? '' : detail?.status) || '';
    if (res.status === 403 && (/email_not_confirmed/i.test(code) || /email_not_confirmed/i.test(msg) || /verification_required/i.test(status))) {
      err.code = 'email_not_confirmed';
      err.statusText = 'verification_required';
    }
    throw err;
  }
  const data: any = await res.json();
  const token: string = data?.token || data?.access_token;
  if (!token) throw new Error('invalid_login_response');
  sessionStorage.setItem('auth-token', token);
  // Some backends don’t return user inline; fetch /me
  let user: AuthUser | undefined = data?.user;
  if (!user) {
    user = await me();
  }
  return { token, user } as { token: string; user: AuthUser };
}

export async function me(): Promise<AuthUser> {
  const token = sessionStorage.getItem('auth-token');
  if (!token) throw new Error('no_token');
  const res = await fetchWithFallback('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function logout() {
  sessionStorage.removeItem('auth-token');
}

export async function updateProfile(updates: { displayName?: string; email?: string }) {
  const token = sessionStorage.getItem('auth-token');
  if (!token) throw new Error('no_token');

  // First try pyserver-compatible endpoint
  const tryPatch = async () => {
    const res = await fetchWithFallback('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    return res;
  };

  // Alternate: some backends may implement PUT /api/auth/me (same shape as PATCH)
  const tryPutSamePath = async () => {
    const res = await fetchWithFallback('/api/auth/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    return res;
  };

  // Some environments only allow POST; support POST /api/auth/me as update alias
  const tryPostSamePath = async () => {
    const res = await fetchWithFallback('/api/auth/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    return res;
  };

  // Fallback to identity_service-style endpoint by mapping displayName → first/last
  // Prefer router-prefixed path first: PUT /api/auth/me/edit-profile
  const tryIdentityPutApiAuth = async () => {
    const display = (updates.displayName || '').trim();
    let first: string | undefined;
    let last: string | undefined;
    if (display) {
      const parts = display.split(/\s+/);
      first = parts.shift();
      last = parts.length ? parts.join(' ') : undefined;
    }
    const body: Record<string, any> = {};
    if (first) body.first_name = first;
    if (last) body.last_name = last;
    const res = await fetchWithFallback('/api/auth/me/edit-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    return res;
  };

  // Root-level alias some backends expose: PUT /me/edit-profile
  const tryIdentityPut = async () => {
    const display = (updates.displayName || '').trim();
    let first: string | undefined;
    let last: string | undefined;
    if (display) {
      const parts = display.split(/\s+/);
      first = parts.shift();
      last = parts.length ? parts.join(' ') : undefined;
    }
    const body: Record<string, any> = {};
    if (first) body.first_name = first;
    if (last) body.last_name = last;
    // email changes are not supported via this UI flow
    const res = await fetchWithFallback('/me/edit-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    return res;
  };

  // Try PATCH first
  let res = await tryPatch();
  if (res.status === 405 || res.status === 404) {
    // Method not allowed → try PUT same path
    const resPut = await tryPutSamePath();
    if (resPut.ok) {
      res = resPut;
    } else {
      // Try POST alias on same path
      const resPost = await tryPostSamePath();
      if (resPost.ok) {
        res = resPost;
      } else {
        // Fallback to identity service style
        const resAlias = await tryIdentityPutApiAuth();
        if (!resAlias.ok && (resAlias.status === 404 || resAlias.status === 405)) {
          // As a last resort, try a root-level alias
          res = await tryIdentityPut();
        } else {
          res = resAlias;
        }
      }
    }
  }
  if (!res.ok) {
    let detail = '';
    try { detail = await res.text(); } catch {}
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return (await res.json()) as AuthUser;
}

export async function changePassword(params: { oldPassword: string; newPassword: string; confirmPassword: string }) {
  const token = sessionStorage.getItem('auth-token');
  if (!token) throw new Error('no_token');

  const tryPut = async () => {
    return fetchWithFallback('/api/auth/me/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(params),
    });
  };

  const tryPost = async () => {
    return fetchWithFallback('/api/auth/me/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(params),
    });
  };

  const tryRootAlias = async () => {
    return fetchWithFallback('/me/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(params),
    });
  };

  let res = await tryPut();
  if (res.status === 405 || res.status === 404) {
    const rp = await tryPost();
    res = rp.ok ? rp : await tryRootAlias();
  }

  if (!res.ok) {
    let raw = '';
    try { raw = await res.text(); } catch {}
    let parsed: any = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch {}
    const detail = parsed?.detail ?? parsed;
    const message = (typeof detail === 'string' ? detail : (detail?.message || detail?.error)) || raw || `HTTP ${res.status}`;
    const err: any = new Error(message);
    err.status = res.status;
    err.body = parsed ?? raw;
    err.code = typeof detail === 'string' ? undefined : detail?.code;
    err.field = typeof detail === 'string' ? undefined : detail?.field;
    err.issues = typeof detail === 'string' ? undefined : detail?.debug?.issues || detail?.issues;
    throw err;
  }
  return res.json();
}

// Request a password reset link to be sent to the given email.
export async function forgotPassword(email: string, recaptchaToken?: string | null) {
  const res = await fetchWithFallback('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, recaptcha_token: recaptchaToken ?? null }),
  });
  if (!res.ok) {
    let raw = '';
    try { raw = await res.text(); } catch {}
    let parsed: any = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch {}
    const detail = parsed?.detail ?? parsed;
    const message = (typeof detail === 'string' ? detail : (detail?.message || detail?.error)) || raw || `HTTP ${res.status}`;
    const err: any = new Error(message);
    err.status = res.status;
    err.body = parsed ?? raw;
    err.code = typeof detail === 'string' ? undefined : detail?.code;
    err.field = typeof detail === 'string' ? undefined : detail?.field;
    throw err;
  }
  return res.json();
}

// Reset password using a token from the email link
export async function resetPassword(token: string, newPassword: string) {
  const res = await fetchWithFallback('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  if (!res.ok) {
    let raw = '';
    try { raw = await res.text(); } catch {}
    let parsed: any = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch {}
    const detail = parsed?.detail ?? parsed;
    const message = (typeof detail === 'string' ? detail : (detail?.message || detail?.error)) || raw || `HTTP ${res.status}`;
    const err: any = new Error(message);
    err.status = res.status;
    err.body = parsed ?? raw;
    err.code = typeof detail === 'string' ? undefined : detail?.code;
    err.field = typeof detail === 'string' ? undefined : detail?.field;
    err.issues = typeof detail === 'string' ? undefined : detail?.debug?.issues || detail?.issues;
    throw err;
  }
  return res.json();
}

// Resend reset link using the existing token (extracts email server-side)
export async function resendResetWithToken(token: string) {
  const res = await fetchWithFallback('/api/auth/resend-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    let raw = '';
    try { raw = await res.text(); } catch {}
    let parsed: any = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch {}
    const detail = parsed?.detail ?? parsed;
    const message = (typeof detail === 'string' ? detail : (detail?.message || detail?.error)) || raw || `HTTP ${res.status}`;
    const err: any = new Error(message);
    err.status = res.status;
    err.body = parsed ?? raw;
    err.code = typeof detail === 'string' ? undefined : detail?.code;
    throw err;
  }
  return res.json();
}
