// ─── Endpoints definition ────────────────────────────────────────────────────

const ENDPOINTS = [
  { label: 'GET  /submissions',              method: 'GET',    path: '/submissions',                  pathParam: null,           hasBody: false },
  { label: 'POST /submissions',              method: 'POST',   path: '/submissions',                  pathParam: null,           hasBody: true,  hasFile: true,
    defaultBody: '{\n  "filename": "image.jpg",\n  "content_type": "image/jpeg",\n  "file_size_bytes": 1024\n}' },
  { label: 'GET  /submissions/{id}',         method: 'GET',    path: '/submissions/{id}',             pathParam: 'submission_id', hasBody: false },
  { label: 'POST /submissions/{id}/confirm', method: 'POST',   path: '/submissions/{id}/confirm',     pathParam: 'submission_id', hasBody: false },
  { label: 'DEL  /submissions/{id}',         method: 'DELETE', path: '/submissions/{id}',             pathParam: 'submission_id', hasBody: false },
  { label: 'GET  /tasks',                    method: 'GET',    path: '/tasks',                        pathParam: null,           hasBody: false },
  { label: 'POST /tasks',                    method: 'POST',   path: '/tasks',                        pathParam: null,           hasBody: true,
    defaultBody: '{\n  "submission_id": ""\n}' },
  { label: 'GET  /tasks/{id}',               method: 'GET',    path: '/tasks/{id}',                   pathParam: 'task_id',       hasBody: false },
  { label: 'POST /tasks/{id}/cancel',        method: 'POST',   path: '/tasks/{id}/cancel',            pathParam: 'task_id',       hasBody: false },
];

const METHOD_COLORS = {
  GET: '#2563eb', POST: '#16a34a', DELETE: '#dc2626',
};

// ─── Config ──────────────────────────────────────────────────────────────────

const CONFIG_KEY = 'skymap_playground_config';

function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY)) || {};
  } catch {
    return {};
  }
}

function saveConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

function getConfig() {
  const cfg = loadConfig();
  return {
    zitadelUrl: cfg.zitadelUrl || 'http://host.docker.internal:8080',
    clientId:   cfg.clientId   || '',
    apiUrl:     cfg.apiUrl     || 'http://localhost:8001',
    redirectUri: window.location.origin + '/',
  };
}

// ─── PKCE helpers ────────────────────────────────────────────────────────────

function base64urlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generateCodeVerifier() {
  const arr = new Uint8Array(96);
  crypto.getRandomValues(arr);
  return base64urlEncode(arr);
}

async function generateCodeChallenge(verifier) {
  const encoded = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return base64urlEncode(digest);
}

// ─── Auth ────────────────────────────────────────────────────────────────────

const TOKEN_KEY = 'skymap_access_token';
const TOKEN_EXP_KEY = 'skymap_token_exp';

function getToken() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const exp = parseInt(sessionStorage.getItem(TOKEN_EXP_KEY) || '0', 10);
  if (!token || Date.now() > exp) return null;
  return token;
}

function storeToken(token, expiresIn) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(TOKEN_EXP_KEY, String(Date.now() + expiresIn * 1000 - 10000));
}

function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXP_KEY);
  sessionStorage.removeItem('pkce_verifier');
  sessionStorage.removeItem('pkce_state');
}

function decodeJwtPayload(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

async function startLogin() {
  const cfg = getConfig();
  if (!cfg.clientId) {
    alert('Set Client ID in Configuration first.');
    document.getElementById('config-section').open = true;
    return;
  }

  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = base64urlEncode(crypto.getRandomValues(new Uint8Array(16)));

  sessionStorage.setItem('pkce_verifier', verifier);
  sessionStorage.setItem('pkce_state', state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    scope: 'openid profile email',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `${cfg.zitadelUrl}/oauth/v2/authorize?${params}`;
}

async function handleCallback(code, state) {
  const cfg = getConfig();
  const verifier = sessionStorage.getItem('pkce_verifier');
  const savedState = sessionStorage.getItem('pkce_state');

  if (state !== savedState) {
    showError('OAuth state mismatch. Possible CSRF attack.');
    return;
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: cfg.redirectUri,
    client_id: cfg.clientId,
    code_verifier: verifier,
  });

  try {
    const res = await fetch(`${cfg.zitadelUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.error || 'Token exchange failed');
    storeToken(data.access_token, data.expires_in);
  } catch (err) {
    showError(`Token exchange error: ${err.message}`);
  }

  // Clean up URL
  history.replaceState({}, '', '/');
}

function logout() {
  clearToken();
  updateAuthBar();
}

// ─── UI ──────────────────────────────────────────────────────────────────────

function updateAuthBar() {
  const token = getToken();
  const authBtn = document.getElementById('auth-btn');
  const userInfo = document.getElementById('user-info');

  if (token) {
    const payload = decodeJwtPayload(token);
    const name = payload?.name || payload?.preferred_username || payload?.sub || 'User';
    userInfo.textContent = name;
    authBtn.textContent = 'Logout';
    authBtn.classList.remove('outline');
    authBtn.onclick = logout;
  } else {
    userInfo.textContent = '';
    authBtn.textContent = 'Login via Zitadel';
    authBtn.classList.add('outline');
    authBtn.onclick = startLogin;
  }
}

function populateEndpoints() {
  const select = document.getElementById('endpoint-select');
  select.innerHTML = '';
  ENDPOINTS.forEach((ep, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = ep.label;
    select.appendChild(opt);
  });
  onEndpointChange();
}

function onEndpointChange() {
  const idx = parseInt(document.getElementById('endpoint-select').value, 10);
  const ep = ENDPOINTS[idx];

  const badge = document.getElementById('method-badge');
  badge.textContent = ep.method;
  badge.style.setProperty('--method-color', METHOD_COLORS[ep.method] || '#888');

  const pathParamSection = document.getElementById('path-params-section');
  const pathParamLabel = document.getElementById('path-params-label');
  const bodySection = document.getElementById('body-section');
  const bodyInput = document.getElementById('body-input');

  if (ep.pathParam) {
    pathParamSection.style.display = 'block';
    pathParamLabel.childNodes[0].textContent = ep.pathParam + ' ';
  } else {
    pathParamSection.style.display = 'none';
  }

  const fileSection = document.getElementById('file-section');
  const autoFlowLabel = document.getElementById('auto-flow-label');
  if (ep.hasFile) {
    fileSection.style.display = 'block';
    autoFlowLabel.style.display = 'flex';
  } else {
    fileSection.style.display = 'none';
    autoFlowLabel.style.display = 'none';
  }

  if (ep.hasBody) {
    bodySection.style.display = 'block';
    if (!bodyInput.value && ep.defaultBody) bodyInput.value = ep.defaultBody;
  } else {
    bodySection.style.display = 'none';
  }
}

function showError(msg) {
  const pre = document.getElementById('response-pre');
  pre.parentElement.innerHTML = `<pre id="response-pre" style="color:#991b1b">${escapeHtml(msg)}</pre>`;
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderResponse(status, body) {
  const box = document.getElementById('response-box');
  const cls = status >= 500 ? 'status-5xx' : status >= 400 ? 'status-4xx' : 'status-2xx';

  let parsed = null;
  let text;
  try {
    parsed = JSON.parse(body);
    text = JSON.stringify(parsed, null, 2);
  } catch {
    text = body;
  }

  let extra = '';

  // Action buttons based on context
  if (parsed) {
    const actions = getContextActions(parsed, status);
    if (actions.length) {
      extra += '<div style="margin-top:0.5rem;">';
      actions.forEach(a => {
        const style = a.primary ? '' : 'class="outline"';
        extra += `<button ${style} class="action-btn" onclick="${a.onclick}">${a.label}</button>`;
      });
      extra += '</div>';
    }
  }

  // Image preview for presigned URLs in response
  if (parsed) {
    const images = extractImageUrls(parsed);
    if (images.length) {
      extra += '<details style="margin-top:0.75rem;"><summary style="cursor:pointer;font-size:0.85rem;font-weight:600;">Images</summary>';
      images.forEach(({ key, url }) => {
        extra += `<div style="margin-top:0.5rem;"><small style="color:var(--pico-muted-color);">${escapeHtml(key)}</small><br/>`
          + `<img src="${escapeHtml(url)}" style="max-width:100%;max-height:400px;border-radius:4px;margin-top:0.25rem;" /></div>`;
      });
      extra += '</details>';
    }
  }

  box.innerHTML = `
    <span class="status-badge ${cls}">${status}</span>
    <pre id="response-pre">${escapeHtml(text)}</pre>
    ${extra}
  `;
}

function extractImageUrls(obj) {
  const results = [];
  const walk = (val, path) => {
    if (typeof val === 'string' && /^https?:\/\//.test(val) && /\.(jpg|jpeg|png|gif|webp)/i.test(val)) {
      results.push({ key: path, url: val });
    } else if (val && typeof val === 'object') {
      for (const [k, v] of Object.entries(val)) {
        walk(v, path ? `${path}.${k}` : k);
      }
    }
  };
  walk(obj, '');
  return results;
}

// ─── Context actions ──────────────────────────────────────────────────────────

function getContextActions(parsed, status) {
  const actions = [];

  // After POST /submissions → View submission
  if (status === 201 && parsed.submission_id) {
    actions.push({
      label: 'View submission',
      onclick: `navigateToEndpoint(2, '${parsed.submission_id}')`,
    });
  }

  // Submission in pending → Confirm
  if (parsed.status === 'pending' && parsed.id && parsed.object_key) {
    actions.push({
      label: 'Confirm upload',
      onclick: `confirmSubmission('${parsed.id}')`,
      primary: true,
    });
  }

  // Submission in uploaded → Create task
  if (parsed.status === 'uploaded' && parsed.id) {
    actions.push({
      label: 'Create task',
      onclick: `createTaskForSubmission('${parsed.id}')`,
      primary: true,
    });
    actions.push({
      label: 'View submission',
      onclick: `navigateToEndpoint(2, '${parsed.id}')`,
    });
  }

  // Task created or in progress → View task
  if (parsed.id && parsed.submission_id && parsed.status) {
    const isTask = ['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(parsed.status) && parsed.submission_id;
    if (isTask) {
      actions.push({
        label: 'Refresh task',
        onclick: `navigateToEndpoint(7, '${parsed.id}')`,
      });
    }
  }

  // Submission with tasks → View first task
  if (parsed.tasks && parsed.tasks.length > 0) {
    actions.push({
      label: `View task ${parsed.tasks[0].id.slice(0, 8)}…`,
      onclick: `navigateToEndpoint(7, '${parsed.tasks[0].id}')`,
    });
  }

  return actions;
}

function navigateToEndpoint(index, paramValue) {
  document.getElementById('endpoint-select').value = index;
  onEndpointChange();
  document.getElementById('path-param-input').value = paramValue;
  sendRequest();
}

async function apiCall(method, path, body) {
  const token = getToken();
  const cfg = getConfig();
  const options = {
    method,
    headers: { Authorization: `Bearer ${token}` },
  };
  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const res = await fetch(cfg.apiUrl + path, options);
  const text = await res.text();
  return { status: res.status, text, ok: res.ok };
}

async function confirmSubmission(id) {
  const pre = document.getElementById('response-pre');
  pre.textContent = 'Confirming…';
  const r = await apiCall('POST', `/submissions/${id}/confirm`);
  renderResponse(r.status, r.text);
}

async function createTaskForSubmission(id) {
  const pre = document.getElementById('response-pre');
  pre.textContent = 'Creating task…';
  const r = await apiCall('POST', '/tasks', { submission_id: id });
  renderResponse(r.status, r.text);
}

// ─── File picker ──────────────────────────────────────────────────────────────

// Selected file reference (set by file input change handler)
let _selectedFile = null;

const MIME_MAP = {
  'image/jpeg': 'image/jpeg',
  'image/png': 'image/png',
  'application/fits': 'application/fits',
};

function onFileSelected(e) {
  const file = e.target.files[0];
  if (!file) { _selectedFile = null; return; }

  _selectedFile = file;

  // Determine content_type
  let contentType = MIME_MAP[file.type];
  if (!contentType && /\.(fits|fit)$/i.test(file.name)) contentType = 'application/fits';
  if (!contentType) contentType = 'image/jpeg'; // fallback

  // Auto-fill body
  const body = {
    filename: file.name,
    content_type: contentType,
    file_size_bytes: file.size,
  };
  document.getElementById('body-input').value = JSON.stringify(body, null, 2);
  document.getElementById('file-info').textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
}

async function uploadFileToPresignedUrl(uploadUrl, file, contentType) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });
  return res;
}

// ─── API call ─────────────────────────────────────────────────────────────────

async function sendRequest() {
  const token = getToken();
  if (!token) {
    alert('Not authenticated. Please login first.');
    return;
  }

  const idx = parseInt(document.getElementById('endpoint-select').value, 10);
  const ep = ENDPOINTS[idx];
  const cfg = getConfig();

  let path = ep.path;
  if (ep.pathParam) {
    const paramVal = document.getElementById('path-param-input').value.trim();
    if (!paramVal) { alert(`Enter ${ep.pathParam}`); return; }
    path = path.replace('{id}', paramVal);
  }

  const url = cfg.apiUrl + path;

  const options = {
    method: ep.method,
    headers: { Authorization: `Bearer ${token}` },
  };

  if (ep.hasBody) {
    const rawBody = document.getElementById('body-input').value.trim();
    try {
      JSON.parse(rawBody);
    } catch {
      alert('Request body is not valid JSON');
      return;
    }
    options.headers['Content-Type'] = 'application/json';
    options.body = rawBody;
  }

  const pre = document.getElementById('response-pre');
  pre.textContent = 'Sending…';

  try {
    const res = await fetch(url, options);
    const text = await res.text();
    renderResponse(res.status, text);

    // Auto-upload file after successful POST /submissions
    if (ep.hasFile && _selectedFile && res.status === 201) {
      try {
        const data = JSON.parse(text);
        if (data.upload_url) {
          const bodyJson = JSON.parse(options.body);
          pre.textContent += '\n\nUploading file…';
          const uploadRes = await uploadFileToPresignedUrl(data.upload_url, _selectedFile, bodyJson.content_type);

          if (!uploadRes.ok) {
            renderResponse(res.status, JSON.stringify({
              ...data,
              _upload_error: `Upload failed: ${uploadRes.status} ${uploadRes.statusText}`
            }, null, 2));
          } else {
            const autoFlow = document.getElementById('auto-flow-cb').checked;
            const steps = { _upload: 'ok' };

            if (autoFlow) {
              // Auto-confirm
              pre.textContent += '\nConfirming…';
              const confirmR = await apiCall('POST', `/submissions/${data.submission_id}/confirm`);
              steps._confirm = confirmR.ok ? 'ok' : `failed (${confirmR.status})`;

              if (confirmR.ok) {
                // Auto-create task
                pre.textContent += '\nCreating task…';
                const taskR = await apiCall('POST', '/tasks', { submission_id: data.submission_id });
                if (taskR.ok) {
                  const taskData = JSON.parse(taskR.text);
                  steps._task = `created (${taskData.id})`;
                  // Show task result
                  renderResponse(taskR.status, taskR.text);
                  return;
                } else {
                  steps._task = `failed (${taskR.status})`;
                }
              }
            }

            renderResponse(res.status, JSON.stringify({ ...data, ...steps }, null, 2));
          }
        }
      } catch (uploadErr) {
        showError(`Submission created, but file upload failed: ${uploadErr.message}`);
      }
    }
  } catch (err) {
    showError(`Network error: ${err.message}`);
  }
}

// ─── Config panel ────────────────────────────────────────────────────────────

function loadConfigIntoForm() {
  const cfg = getConfig();
  document.getElementById('cfg-zitadel-url').value = cfg.zitadelUrl;
  document.getElementById('cfg-client-id').value   = cfg.clientId;
  document.getElementById('cfg-api-url').value     = cfg.apiUrl;
  document.getElementById('cfg-redirect-uri').value = cfg.redirectUri;
}

function onSaveConfig() {
  const raw = loadConfig();
  raw.zitadelUrl = document.getElementById('cfg-zitadel-url').value.trim() || 'http://localhost:8080';
  raw.clientId   = document.getElementById('cfg-client-id').value.trim();
  raw.apiUrl     = document.getElementById('cfg-api-url').value.trim() || '/api/v1';
  saveConfig(raw);
  document.getElementById('config-section').open = false;
}

// ─── Init ────────────────────────────────────────────────────────────────────

async function init() {
  loadConfigIntoForm();
  populateEndpoints();

  // Handle PKCE callback
  const params = new URLSearchParams(window.location.search);
  if (params.has('code')) {
    await handleCallback(params.get('code'), params.get('state'));
  }

  updateAuthBar();

  document.getElementById('endpoint-select').addEventListener('change', onEndpointChange);
  document.getElementById('send-btn').addEventListener('click', sendRequest);
  document.getElementById('save-config-btn').addEventListener('click', onSaveConfig);
  document.getElementById('file-input').addEventListener('change', onFileSelected);

  // Open config if Client ID not set
  const cfg = getConfig();
  if (!cfg.clientId) {
    document.getElementById('config-section').open = true;
  }
}

init();
