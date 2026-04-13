const API_BASE = "https://qr-kody-platinum-api.virikyonlinecz.workers.dev";

const STORAGE_KEYS = {
  sessionUser: 'session_user',
  mockEmail: 'mock_email',
  mockRole: 'mock_role',
  mockStatus: 'mock_status',
  mockLicenseStatus: 'mock_license_status',
  mockActivatedAt: 'mock_activated_at',
  mockCompanies: 'mock_companies',
  mockAdminUsers: 'mock_admin_users',
  mockQrCount: 'mock_qr_count'
};

const mockState = {
  me: {
    email: localStorage.getItem(STORAGE_KEYS.mockEmail) || '',
    role: localStorage.getItem(STORAGE_KEYS.mockRole) || 'user',
    status: localStorage.getItem(STORAGE_KEYS.mockStatus) || 'pending',
    license: {
      status: localStorage.getItem(STORAGE_KEYS.mockLicenseStatus) || 'pending',
      licenseType: 'one_time',
      activatedAt: localStorage.getItem(STORAGE_KEYS.mockActivatedAt) || ''
    }
  },
  companies: JSON.parse(localStorage.getItem(STORAGE_KEYS.mockCompanies) || '[]'),
  adminUsers: JSON.parse(localStorage.getItem(STORAGE_KEYS.mockAdminUsers) || '[]')
};

const appState = {
  me: getStoredUser() || null,
  companies: [],
  license: null,
  adminUsers: [],
  featureFlags: {
    companiesApi: null,
    licenseApi: null,
    adminApi: null,
    qrApi: null
  }
};

function saveMock() {
  localStorage.setItem(STORAGE_KEYS.mockCompanies, JSON.stringify(mockState.companies));
  localStorage.setItem(STORAGE_KEYS.mockAdminUsers, JSON.stringify(mockState.adminUsers));
  localStorage.setItem(STORAGE_KEYS.mockEmail, mockState.me.email || '');
  localStorage.setItem(STORAGE_KEYS.mockRole, mockState.me.role || 'user');
  localStorage.setItem(STORAGE_KEYS.mockStatus, mockState.me.status || 'pending');
  localStorage.setItem(STORAGE_KEYS.mockLicenseStatus, mockState.me.license.status || 'pending');
  localStorage.setItem(STORAGE_KEYS.mockActivatedAt, mockState.me.license.activatedAt || '');
}

function qs(id){ return document.getElementById(id); }
function setStatus(el, msg, type=''){ if(!el) return; el.textContent = msg || ''; el.className = 'inline-status' + (type ? ' ' + type : ''); }
function money(v){ return `${Number(v || 0).toFixed(2)} EUR`; }
function uid(){ return Math.random().toString(36).slice(2,10); }
function esc(v){ return String(v ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'": '&#39;'}[m])); }

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.sessionUser) || 'null');
  } catch {
    return null;
  }
}

function saveStoredUser(user) {
  localStorage.setItem(STORAGE_KEYS.sessionUser, JSON.stringify(user));
}

function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEYS.sessionUser);
}

function normalizeLicense(raw = {}) {
  return {
    status: raw.status || raw.licenseStatus || raw.state || 'pending',
    licenseType: raw.licenseType || raw.type || 'one_time',
    activatedAt: raw.activatedAt || raw.activated_at || raw.activationDate || ''
  };
}

function normalizeUser(raw = {}) {
  const license = normalizeLicense(raw.license || raw);
  return {
    id: raw.id || raw.userId || raw._id || '',
    email: raw.email || '',
    role: raw.role || (raw.email === 'admin@platinum.sk' ? 'admin' : 'user'),
    status: raw.status || raw.userStatus || license.status || 'pending',
    license
  };
}

function syncMockFromMe() {
  const me = appState.me;
  if (!me) return;
  mockState.me.email = me.email || '';
  mockState.me.role = me.role || 'user';
  mockState.me.status = me.status || 'pending';
  mockState.me.license = normalizeLicense(me.license || {});
  saveMock();
}

function setCurrentUser(user) {
  appState.me = user ? normalizeUser(user) : null;
  if (appState.me) {
    saveStoredUser(appState.me);
    syncMockFromMe();
  } else {
    clearStoredUser();
  }
}

function currentUser() {
  return appState.me || normalizeUser(mockState.me);
}

function currentLicense() {
  return appState.license ? normalizeLicense(appState.license) : normalizeLicense(currentUser().license);
}

function activateTabs(){
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      document.querySelector(`[data-panel="${tab}"]`)?.classList.add('active');
    });
  });
}

async function api(path, options = {}) {
  if (!API_BASE) throw new Error('Backend ešte nie je nastavený.');
  const headers = { ...(options.headers || {}) };
  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

  const res = await fetch(API_BASE + path, {
    credentials: 'include',
    ...options,
    headers
  });

  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const message = typeof data === 'string'
      ? data
      : data?.error || data?.message || data?.detail || 'API chyba';
    throw new Error(message);
  }
  return data;
}

async function tryApi(paths, options = {}) {
  const list = Array.isArray(paths) ? paths : [paths];
  let lastError = null;
  for (const path of list) {
    try {
      return await api(path, options);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('API chyba');
}

function mockLogin(email, password){
  if (!email || !password) throw new Error('Vyplň email aj heslo.');
  mockState.me.email = email;
  mockState.me.role = email === 'admin@platinum.sk' ? 'admin' : 'user';
  saveMock();
  setCurrentUser(mockState.me);
  return { ok: true, me: currentUser() };
}

function mockRegister(email, password){
  if (!email || password.length < 8) throw new Error('Heslo musí mať aspoň 8 znakov.');
  mockState.me.email = email;
  mockState.me.role = email === 'admin@platinum.sk' ? 'admin' : 'user';
  mockState.me.status = 'pending';
  mockState.me.license.status = 'pending';
  if (!mockState.adminUsers.find(u => u.email === email)) {
    mockState.adminUsers.push({
      id: uid(),
      email,
      role: mockState.me.role,
      status: 'pending',
      licenseStatus: 'pending',
      createdAt: new Date().toISOString()
    });
  }
  saveMock();
  setCurrentUser(mockState.me);
  return { ok: true };
}

function mockLogout(){
  mockState.me.email = '';
  mockState.me.role = 'user';
  mockState.me.status = 'pending';
  mockState.me.license.status = 'pending';
  saveMock();
  setCurrentUser(null);
}

async function loadMeFromApi() {
  const data = await tryApi(['/api/auth/me', '/api/me'], { method: 'GET' });
  const me = normalizeUser(data?.user || data?.me || data);
  if (!me.email) throw new Error('Nepodarilo sa načítať používateľa.');
  setCurrentUser(me);
  return me;
}

async function ensureMe() {
  if (!document.body.dataset.protected) return currentUser();

  if (!API_BASE) {
    const me = currentUser();
    if (!me.email) throw new Error('Nie si prihlásený.');
    return me;
  }

  if (appState.me?.email) return appState.me;

  const stored = getStoredUser();
  if (stored?.email) {
    setCurrentUser(stored);
    try {
      return await loadMeFromApi();
    } catch {
      return currentUser();
    }
  }

  return await loadMeFromApi();
}

async function requireAuth(){
  if (!document.body.dataset.protected) return true;
  try {
    const me = await ensureMe();
    if (!me?.email) throw new Error('Nie si prihlásený.');
    if (qs('userEmailPill')) qs('userEmailPill').textContent = me.email;
    if (document.body.dataset.admin === 'true' && me.role !== 'admin') {
      alert('Táto sekcia je len pre admina.');
      location.href = 'dashboard.html';
      return false;
    }
    return true;
  } catch {
    location.href = 'index.html';
    return false;
  }
}

function bindAuth(){
  const loginForm = qs('loginForm');
  const registerForm = qs('registerForm');

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = qs('loginEmail').value.trim();
    const password = qs('loginPassword').value;
    try {
      if (API_BASE) {
        await api('/api/auth/login', { method:'POST', body: JSON.stringify({ email, password }) });
        await loadMeFromApi();
      } else {
        mockLogin(email, password);
      }
      setStatus(qs('loginStatus'), 'Prihlásenie prebehlo úspešne.', 'ok');
      setTimeout(() => location.href = 'dashboard.html', 250);
    } catch (err) {
      setStatus(qs('loginStatus'), err.message, 'err');
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = qs('registerEmail').value.trim();
    const password = qs('registerPassword').value;
    const password2 = qs('registerPassword2').value;
    try {
      if (password !== password2) throw new Error('Heslá sa nezhodujú.');
      if (password.length < 8) throw new Error('Heslo musí mať aspoň 8 znakov.');
      if (API_BASE) {
        await api('/api/auth/register', { method:'POST', body: JSON.stringify({ email, password }) });
      } else {
        mockRegister(email, password);
      }
      setStatus(qs('registerStatus'), 'Účet bol vytvorený. Prihlás sa a počkaj na aktiváciu licencie.', 'ok');
      registerForm.reset();
    } catch (err) {
      setStatus(qs('registerStatus'), err.message, 'err');
    }
  });

  qs('logoutBtn')?.addEventListener('click', async () => {
    try {
      if (API_BASE) await tryApi(['/api/auth/logout', '/api/logout'], { method:'POST' });
    } catch {}
    mockLogout();
    location.href = 'index.html';
  });
}

async function loadCompanies() {
  if (API_BASE && appState.featureFlags.companiesApi !== false) {
    try {
      const data = await tryApi(['/api/companies', '/api/company'], { method: 'GET' });
      const items = Array.isArray(data) ? data : (data.items || data.companies || []);
      appState.featureFlags.companiesApi = true;
      appState.companies = items.map((item) => ({
        id: item.id || item._id || uid(),
        companyName: item.companyName || item.name || '',
        beneficiaryName: item.beneficiaryName || item.beneficiary || item.recipientName || '',
        iban: item.iban || '',
        bic: item.bic || '',
        addressLine: item.addressLine || item.address || '',
        city: item.city || '',
        postalCode: item.postalCode || item.zip || '',
        countryCode: item.countryCode || item.country || 'SK',
        isDefault: Boolean(item.isDefault || item.default)
      }));
      mockState.companies = [...appState.companies];
      saveMock();
      return appState.companies;
    } catch {
      appState.featureFlags.companiesApi = false;
    }
  }
  appState.companies = [...mockState.companies];
  return appState.companies;
}

async function saveCompany(payload) {
  if (API_BASE && appState.featureFlags.companiesApi !== false) {
    try {
      const hasId = Boolean(payload.id);
      const result = await tryApi(
        hasId ? [`/api/companies/${payload.id}`, `/api/company/${payload.id}`] : ['/api/companies', '/api/company'],
        {
          method: hasId ? 'PUT' : 'POST',
          body: JSON.stringify(payload)
        }
      );
      appState.featureFlags.companiesApi = true;
      await loadCompanies();
      return result;
    } catch {
      appState.featureFlags.companiesApi = false;
    }
  }

  if (payload.isDefault) mockState.companies.forEach(x => x.isDefault = false);
  const id = payload.id || uid();
  const ix = mockState.companies.findIndex(x => x.id === id);
  const clean = { ...payload, id };
  if (ix >= 0) mockState.companies[ix] = clean; else mockState.companies.push(clean);
  saveMock();
  appState.companies = [...mockState.companies];
  return clean;
}

async function removeCompany(id) {
  if (API_BASE && appState.featureFlags.companiesApi !== false) {
    try {
      await tryApi([`/api/companies/${id}`, `/api/company/${id}`], { method: 'DELETE' });
      appState.featureFlags.companiesApi = true;
      await loadCompanies();
      return;
    } catch {
      appState.featureFlags.companiesApi = false;
    }
  }

  mockState.companies = mockState.companies.filter(x => x.id !== id);
  saveMock();
  appState.companies = [...mockState.companies];
}

async function loadLicense() {
  if (API_BASE && appState.featureFlags.licenseApi !== false) {
    try {
      const data = await tryApi(['/api/license', '/api/licenses/me', '/api/license/me'], { method: 'GET' });
      const raw = data.license || data.item || data;
      appState.featureFlags.licenseApi = true;
      appState.license = normalizeLicense(raw);
      if (appState.me) {
        appState.me.license = appState.license;
        appState.me.status = appState.license.status || appState.me.status;
        saveStoredUser(appState.me);
        syncMockFromMe();
      }
      return appState.license;
    } catch {
      appState.featureFlags.licenseApi = false;
    }
  }
  appState.license = normalizeLicense(mockState.me.license);
  return appState.license;
}

async function loadAdminUsers() {
  if (API_BASE && appState.featureFlags.adminApi !== false) {
    try {
      const data = await tryApi(['/api/admin/users', '/api/users'], { method: 'GET' });
      const items = Array.isArray(data) ? data : (data.items || data.users || []);
      appState.featureFlags.adminApi = true;
      appState.adminUsers = items.map((user) => {
        const n = normalizeUser(user);
        return {
          id: user.id || user._id || n.id || uid(),
          email: n.email,
          role: n.role,
          status: n.status,
          licenseStatus: n.license.status,
          createdAt: user.createdAt || user.created_at || ''
        };
      });
      mockState.adminUsers = [...appState.adminUsers];
      saveMock();
      return appState.adminUsers;
    } catch {
      appState.featureFlags.adminApi = false;
    }
  }

  if (!mockState.adminUsers.length && currentUser().email) {
    mockState.adminUsers.push({
      id: uid(),
      email: currentUser().email,
      role: currentUser().role,
      status: currentUser().status,
      licenseStatus: currentLicense().status,
      createdAt: new Date().toISOString()
    });
    saveMock();
  }
  appState.adminUsers = [...mockState.adminUsers];
  return appState.adminUsers;
}

async function setAdminUserStatus(userId, action) {
  if (API_BASE && appState.featureFlags.adminApi !== false) {
    const pathMap = {
      active: [
        `/api/admin/users/${userId}/activate`,
        `/api/admin/users/${userId}/status`,
        `/api/admin/activate`
      ],
      blocked: [
        `/api/admin/users/${userId}/block`,
        `/api/admin/users/${userId}/status`,
        `/api/admin/block`
      ]
    };
    const bodyMap = {
      active: [
        undefined,
        JSON.stringify({ status: 'active', licenseStatus: 'active' }),
        JSON.stringify({ userId, status: 'active', licenseStatus: 'active' })
      ],
      blocked: [
        undefined,
        JSON.stringify({ status: 'blocked', licenseStatus: 'blocked' }),
        JSON.stringify({ userId, status: 'blocked', licenseStatus: 'blocked' })
      ]
    };
    const methods = action === 'active' ? ['POST', 'PUT', 'POST'] : ['POST', 'PUT', 'POST'];

    for (let i = 0; i < pathMap[action].length; i += 1) {
      try {
        await api(pathMap[action][i], {
          method: methods[i],
          ...(bodyMap[action][i] ? { body: bodyMap[action][i] } : {})
        });
        appState.featureFlags.adminApi = true;
        await loadAdminUsers();
        if (appState.me?.id === userId || appState.me?.email === appState.adminUsers.find(u => u.id === userId)?.email) {
          await loadMeFromApi().catch(() => null);
          await loadLicense().catch(() => null);
        }
        return;
      } catch {}
    }
    appState.featureFlags.adminApi = false;
  }

  const user = mockState.adminUsers.find(x => x.id === userId);
  if (!user) throw new Error('Používateľ neexistuje.');
  user.status = action;
  user.licenseStatus = action;
  if (currentUser().email === user.email) {
    mockState.me.status = action;
    mockState.me.license.status = action;
    if (action === 'active') mockState.me.license.activatedAt = new Date().toISOString().slice(0,10);
  }
  saveMock();
  appState.adminUsers = [...mockState.adminUsers];
  appState.license = normalizeLicense(mockState.me.license);
  setCurrentUser(mockState.me);
}

async function generateQr(payload) {
  if (API_BASE && appState.featureFlags.qrApi !== false) {
    try {
      const data = await tryApi(
        ['/api/qr/generate', '/api/qr', '/api/generate-qr'],
        { method: 'POST', body: JSON.stringify(payload) }
      );
      appState.featureFlags.qrApi = true;
      return {
        image: data.image || data.qrImage || data.qr || data.dataUrl || '',
        message: 'QR kód bol vygenerovaný cez backend.',
        backend: true
      };
    } catch {
      appState.featureFlags.qrApi = false;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
    <rect width="300" height="300" fill="white"/>
    <rect x="20" y="20" width="260" height="260" fill="none" stroke="#111827" stroke-width="8"/>
    <text x="150" y="110" font-size="22" text-anchor="middle" fill="#111827" font-family="Arial">QR kódy Platinum</text>
    <text x="150" y="145" font-size="16" text-anchor="middle" fill="#374151" font-family="Arial">${esc(payload.companyName)}</text>
    <text x="150" y="175" font-size="18" text-anchor="middle" fill="#2563eb" font-family="Arial">${esc(money(payload.amount))}</text>
    <text x="150" y="205" font-size="12" text-anchor="middle" fill="#6b7280" font-family="Arial">${esc(payload.note || 'Lokálny náhľad')}</text>
    <text x="150" y="235" font-size="12" text-anchor="middle" fill="#6b7280" font-family="Arial">Backend QR endpoint zatiaľ neodpovedá</text>
  </svg>`;

  return {
    image: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
    message: 'Zobrazený je lokálny náhľad. Backend QR endpoint zatiaľ neodpovedá.',
    backend: false
  };
}

function renderCompaniesSelects() {
  const companies = appState.companies.length ? appState.companies : mockState.companies;
  [qs('genCompany'), qs('quickCompany')].forEach(sel => {
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '';
    if (!companies.length) {
      const o = document.createElement('option');
      o.value = '';
      o.textContent = 'Najprv pridaj firmu';
      sel.appendChild(o);
      return;
    }
    companies.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = `${c.companyName} • ${c.iban}`;
      if (current && current === c.id) o.selected = true;
      sel.appendChild(o);
    });
    if (!sel.value) {
      const def = companies.find(c => c.isDefault) || companies[0];
      if (def) sel.value = def.id;
    }
  });
}

function updateUserPill() {
  const me = currentUser();
  if (qs('userEmailPill')) qs('userEmailPill').textContent = me.email || 'neprihlásený';
}

async function populateDashboard(){
  if (!qs('accountEmail')) return;
  const me = currentUser();
  const license = await loadLicense();
  await loadCompanies();
  updateUserPill();

  qs('accountEmail').textContent = me.email || '—';
  qs('accountRole').textContent = me.role || 'user';
  qs('accountStatus').textContent = license.status || me.status || 'pending';

  const badge = qs('licenseStatusBadge');
  if (badge) {
    badge.textContent = license.status;
    badge.className = 'status-badge ' + (license.status === 'active' ? 'active' : license.status === 'blocked' ? 'blocked' : 'pending');
  }

  qs('companiesCount').textContent = String(appState.companies.length);
  qs('lastQrCount').textContent = localStorage.getItem(STORAGE_KEYS.mockQrCount) || '0';
  renderCompaniesSelects();

  qs('quickQrForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const company = appState.companies.find(c => c.id === qs('quickCompany').value);
    if (!company) return setStatus(qs('quickQrStatus'), 'Najprv pridaj firmu.', 'err');
    if (currentLicense().status !== 'active') {
      return setStatus(qs('quickQrStatus'), 'Účet ešte nie je aktivovaný.', 'err');
    }
    const amount = qs('quickAmount').value;
    if (!amount) return setStatus(qs('quickQrStatus'), 'Zadaj sumu.', 'err');

    await generateQr({
      companyId: company.id,
      companyName: company.companyName,
      iban: company.iban,
      amount,
      note: qs('quickNote').value.trim()
    });

    localStorage.setItem(STORAGE_KEYS.mockQrCount, String(Number(localStorage.getItem(STORAGE_KEYS.mockQrCount) || '0') + 1));
    qs('lastQrCount').textContent = localStorage.getItem(STORAGE_KEYS.mockQrCount);
    setStatus(qs('quickQrStatus'), 'QR požiadavka prebehla úspešne.', 'ok');
  });
}

function renderCompanies(){
  const list = qs('companiesList');
  if (list) {
    list.innerHTML = appState.companies.length ? '' : '<div class="table-note">Zatiaľ nemáš pridanú žiadnu firmu.</div>';
    appState.companies.forEach(company => {
      const item = document.createElement('article');
      item.className = 'company-item';
      item.innerHTML = `
        <div class="company-top">
          <div>
            <strong>${esc(company.companyName)}</strong>
            <div class="muted">${esc(company.beneficiaryName)}</div>
            <div class="muted">${esc(company.iban)}</div>
          </div>
          ${company.isDefault ? '<span class="status-badge active">predvolená</span>' : ''}
        </div>
        <div class="item-actions">
          <button class="btn-small btn-edit" data-edit="${esc(company.id)}">Upraviť</button>
          <button class="btn-small btn-delete" data-delete="${esc(company.id)}">Vymazať</button>
        </div>
      `;
      list.appendChild(item);
    });

    list.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => editCompany(btn.dataset.edit)));
    list.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', async () => {
      await deleteCompany(btn.dataset.delete);
    }));
  }

  renderCompaniesSelects();
}

function resetCompanyForm(){
  ['companyId','companyName','beneficiaryName','iban','bic','addressLine','city','postalCode'].forEach(id => { const e=qs(id); if(e) e.value=''; });
  if (qs('countryCode')) qs('countryCode').value = 'SK';
  if (qs('isDefault')) qs('isDefault').checked = false;
  if (qs('companyFormTitle')) qs('companyFormTitle').textContent = 'Pridať firmu';
}

function editCompany(id){
  const c = appState.companies.find(x => x.id === id);
  if (!c) return;
  qs('companyId').value = c.id;
  qs('companyName').value = c.companyName || '';
  qs('beneficiaryName').value = c.beneficiaryName || '';
  qs('iban').value = c.iban || '';
  qs('bic').value = c.bic || '';
  qs('addressLine').value = c.addressLine || '';
  qs('city').value = c.city || '';
  qs('postalCode').value = c.postalCode || '';
  qs('countryCode').value = c.countryCode || 'SK';
  qs('isDefault').checked = !!c.isDefault;
  qs('companyFormTitle').textContent = 'Upraviť firmu';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteCompany(id){
  await removeCompany(id);
  await loadCompanies();
  renderCompanies();
  setStatus(qs('companyStatus'), 'Firma bola vymazaná.', 'ok');
}

async function bindCompanies(){
  const form = qs('companyForm');
  if (!form) return;
  await loadCompanies();
  renderCompanies();

  qs('resetCompanyForm')?.addEventListener('click', resetCompanyForm);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      id: qs('companyId').value || '',
      companyName: qs('companyName').value.trim(),
      beneficiaryName: qs('beneficiaryName').value.trim(),
      iban: qs('iban').value.trim(),
      bic: qs('bic').value.trim(),
      addressLine: qs('addressLine').value.trim(),
      city: qs('city').value.trim(),
      postalCode: qs('postalCode').value.trim(),
      countryCode: qs('countryCode').value.trim() || 'SK',
      isDefault: qs('isDefault').checked
    };
    if (!payload.companyName || !payload.beneficiaryName || !payload.iban) {
      return setStatus(qs('companyStatus'), 'Vyplň názov firmy, príjemcu a IBAN.', 'err');
    }
    await saveCompany(payload);
    await loadCompanies();
    renderCompanies();
    resetCompanyForm();
    setStatus(qs('companyStatus'), appState.featureFlags.companiesApi ? 'Firma bola uložená do backendu.' : 'Firma bola uložená lokálne.', 'ok');
  });
}

async function bindGenerator(){
  const form = qs('generatorForm');
  if (!form) return;
  await loadCompanies();
  await loadLicense();
  renderCompaniesSelects();

  const due = qs('genDueDate');
  if (due && !due.value) {
    const d = new Date(); d.setDate(d.getDate()+7);
    due.value = d.toISOString().slice(0,10);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (currentLicense().status !== 'active') {
      return setStatus(qs('generatorStatus'), 'Generovanie je zamknuté, kým nie je licencia aktívna.', 'err');
    }
    const company = appState.companies.find(c => c.id === qs('genCompany').value);
    if (!company) return setStatus(qs('generatorStatus'), 'Najprv pridaj firmu.', 'err');

    const amount = qs('genAmount').value;
    if (!amount) return setStatus(qs('generatorStatus'), 'Zadaj sumu.', 'err');

    const result = await generateQr({
      companyId: company.id,
      companyName: company.companyName,
      beneficiaryName: company.beneficiaryName,
      iban: company.iban,
      bic: company.bic,
      amount,
      vs: qs('genVs').value.trim(),
      ss: qs('genSs').value.trim(),
      ks: qs('genKs').value.trim(),
      dueDate: qs('genDueDate').value,
      note: qs('genNote').value.trim()
    });

    const img = qs('qrPreviewImage');
    img.src = result.image;
    img.style.display = 'block';
    qs('qrPreviewPlaceholder').style.display = 'none';
    qs('generatorSummary').classList.remove('hidden');
    qs('sumGenCompany').textContent = company.companyName;
    qs('sumGenAmount').textContent = money(amount);
    qs('sumGenVs').textContent = qs('genVs').value || '—';
    qs('sumGenNote').textContent = qs('genNote').value || '—';
    localStorage.setItem(STORAGE_KEYS.mockQrCount, String(Number(localStorage.getItem(STORAGE_KEYS.mockQrCount) || '0') + 1));
    setStatus(qs('generatorStatus'), result.message, result.backend ? 'ok' : 'err');
  });
}

async function bindLicense(){
  if (!qs('licensePageStatus')) return;
  const status = await loadLicense();
  const badge = qs('licensePageStatus');
  badge.textContent = status.status;
  badge.className = 'status-badge ' + (status.status === 'active' ? 'active' : status.status === 'blocked' ? 'blocked' : 'pending');
  qs('licenseType').textContent = status.licenseType || 'one_time';
  qs('licenseActivatedAt').textContent = status.activatedAt || '—';
}

async function bindAdmin(){
  const list = qs('adminUsersList');
  if (!list) return;
  await loadAdminUsers();

  const render = async () => {
    await loadAdminUsers();
    list.innerHTML = appState.adminUsers.length ? '' : '<div class="table-note">Zatiaľ nie sú registrovaní používatelia.</div>';
    appState.adminUsers.forEach(user => {
      const item = document.createElement('article');
      item.className = 'admin-item';
      item.innerHTML = `
        <div class="admin-top">
          <div>
            <strong>${esc(user.email)}</strong>
            <div class="muted">rola: ${esc(user.role)}</div>
            <div class="muted">status: ${esc(user.status)}</div>
          </div>
          <span class="status-badge ${user.licenseStatus === 'active' ? 'active' : user.licenseStatus === 'blocked' ? 'blocked' : 'pending'}">${esc(user.licenseStatus)}</span>
        </div>
        <div class="item-actions">
          <button class="btn-small btn-activate" data-activate="${esc(user.id)}">Aktivovať</button>
          <button class="btn-small btn-delete" data-block="${esc(user.id)}">Blokovať</button>
        </div>
      `;
      list.appendChild(item);
    });

    list.querySelectorAll('[data-activate]').forEach(btn => btn.addEventListener('click', async () => {
      try {
        await setAdminUserStatus(btn.dataset.activate, 'active');
        await bindLicense();
        await populateDashboard();
        setStatus(qs('adminStatus'), appState.featureFlags.adminApi ? 'Používateľ bol aktivovaný cez backend.' : 'Používateľ bol aktivovaný lokálne.', 'ok');
        await render();
      } catch (err) {
        setStatus(qs('adminStatus'), err.message, 'err');
      }
    }));

    list.querySelectorAll('[data-block]').forEach(btn => btn.addEventListener('click', async () => {
      try {
        await setAdminUserStatus(btn.dataset.block, 'blocked');
        await bindLicense();
        await populateDashboard();
        setStatus(qs('adminStatus'), appState.featureFlags.adminApi ? 'Používateľ bol zablokovaný cez backend.' : 'Používateľ bol zablokovaný lokálne.', 'ok');
        await render();
      } catch (err) {
        setStatus(qs('adminStatus'), err.message, 'err');
      }
    }));
  };

  qs('refreshAdminBtn')?.addEventListener('click', render);
  await render();
}

document.addEventListener('DOMContentLoaded', async () => {
  activateTabs();
  bindAuth();
  const ok = await requireAuth();
  if (!ok) return;
  await Promise.all([
    populateDashboard(),
    bindCompanies(),
    bindGenerator(),
    bindLicense(),
    bindAdmin()
  ]);
});
