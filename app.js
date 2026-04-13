const API_BASE = "https://qr-kody-platinum-api.virivkyonlinecz.workers.dev";

const DEFAULT_BILLING = {
  beneficiaryName: "PLATINUM LECH SPA",
  iban: "SK3883300000002201671168",
  bic: "FIOZSKBAXXX",
  amount: 99,
  paymentNote: "Licencia QR kódy Platinum"
};

const mockState = {
  me: {
    id: localStorage.getItem('mock_user_id') || '',
    email: localStorage.getItem('mock_email') || '',
    role: localStorage.getItem('mock_role') || 'user',
    status: localStorage.getItem('mock_status') || 'pending',
    license: {
      status: localStorage.getItem('mock_license_status') || 'pending',
      licenseType: localStorage.getItem('mock_license_type') || 'one_time',
      activatedAt: localStorage.getItem('mock_activated_at') || '',
      variableSymbol: localStorage.getItem('mock_license_vs') || '',
      paymentStatus: localStorage.getItem('mock_payment_status') || 'waiting_payment'
    }
  },
  companies: JSON.parse(localStorage.getItem('mock_companies') || '[]'),
  adminUsers: JSON.parse(localStorage.getItem('mock_admin_users') || '[]'),
  adminPaidOverrides: JSON.parse(localStorage.getItem('mock_admin_paid_overrides') || '{}')
};

function saveMock() {
  localStorage.setItem('mock_companies', JSON.stringify(mockState.companies));
  localStorage.setItem('mock_admin_users', JSON.stringify(mockState.adminUsers));
  localStorage.setItem('mock_admin_paid_overrides', JSON.stringify(mockState.adminPaidOverrides || {}));
  localStorage.setItem('mock_user_id', mockState.me.id || '');
  localStorage.setItem('mock_email', mockState.me.email || '');
  localStorage.setItem('mock_role', mockState.me.role || 'user');
  localStorage.setItem('mock_status', mockState.me.status || 'pending');
  localStorage.setItem('mock_license_status', mockState.me.license.status || 'pending');
  localStorage.setItem('mock_license_type', mockState.me.license.licenseType || 'one_time');
  localStorage.setItem('mock_activated_at', mockState.me.license.activatedAt || '');
  localStorage.setItem('mock_license_vs', mockState.me.license.variableSymbol || '');
  localStorage.setItem('mock_payment_status', mockState.me.license.paymentStatus || 'waiting_payment');
}

function resetMockUser() {
  mockState.me = {
    id: '',
    email: '',
    role: 'user',
    status: 'pending',
    license: {
      status: 'pending',
      licenseType: 'one_time',
      activatedAt: '',
      variableSymbol: '',
      paymentStatus: 'waiting_payment'
    }
  };
  saveMock();
}

function setCurrentUserFromApi(data) {
  const user = data?.user || {};
  const license = data?.license || {};
  mockState.me.id = user.id || mockState.me.id || '';
  mockState.me.email = user.email || mockState.me.email || '';
  mockState.me.role = user.role || mockState.me.role || 'user';
  mockState.me.status = user.status || mockState.me.status || 'pending';
  mockState.me.license = {
    status: license.status || 'pending',
    licenseType: license.licenseType || 'one_time',
    activatedAt: license.activatedAt || '',
    variableSymbol: license.variableSymbol || mockState.me.license.variableSymbol || '',
    paymentStatus: license.paymentStatus || (license.status === 'active' ? 'paid' : 'waiting_payment')
  };
  saveMock();
}

function getBillingConfig() {
  try {
    return { ...DEFAULT_BILLING, ...(JSON.parse(localStorage.getItem('billing_company_config') || '{}')) };
  } catch {
    return { ...DEFAULT_BILLING };
  }
}

function saveBillingConfig(config) {
  localStorage.setItem('billing_company_config', JSON.stringify({
    beneficiaryName: config.beneficiaryName || DEFAULT_BILLING.beneficiaryName,
    iban: (config.iban || DEFAULT_BILLING.iban).replace(/\s+/g, '').toUpperCase(),
    bic: (config.bic || DEFAULT_BILLING.bic).trim(),
    amount: Number(config.amount || DEFAULT_BILLING.amount),
    paymentNote: config.paymentNote || DEFAULT_BILLING.paymentNote
  }));
}

function qs(id) { return document.getElementById(id); }
function setStatus(el, msg, type = '') {
  if (!el) return;
  el.textContent = msg || '';
  el.className = 'inline-status' + (type ? ' ' + type : '');
}
function money(v) { return `${Number(v || 0).toFixed(2)} EUR`; }
function uid() { return Math.random().toString(36).slice(2, 10); }
function safeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
function normalizeVs(value) { return String(value || '').replace(/\D/g, '').slice(0, 10); }

async function copyText(text, okMessageEl, message = 'Skopírované.') {
  try {
    await navigator.clipboard.writeText(String(text || ''));
    setStatus(okMessageEl, message, 'ok');
  } catch {
    setStatus(okMessageEl, 'Nepodarilo sa skopírovať.', 'err');
  }
}

function activateTabs() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach((x) => x.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((x) => x.classList.remove('active'));
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

  let res;
  try {
    res = await fetch(API_BASE + path, {
      credentials: 'include',
      ...options,
      headers
    });
  } catch {
    throw new Error('Nepodarilo sa spojiť so serverom.');
  }

  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json().catch(() => ({})) : await res.text().catch(() => '');

  if (!res.ok) {
    const message = typeof data === 'string' ? data : data?.error || data?.message || data?.detail || 'API chyba';
    throw new Error(message);
  }

  return data;
}

async function loadMeFromApi() {
  const data = await api('/api/auth/me', { method: 'GET' });
  setCurrentUserFromApi(data);
  return data;
}

function mockLogin(email, password) {
  if (!email || !password) throw new Error('Vyplň email aj heslo.');
  mockState.me.email = email;
  mockState.me.role = email === 'admin@platinum.sk' ? 'admin' : 'user';
  mockState.me.status = mockState.me.role === 'admin' ? 'active' : 'pending';
  mockState.me.license.status = mockState.me.role === 'admin' ? 'active' : 'pending';
  mockState.me.license.variableSymbol = normalizeVs(Date.now());
  saveMock();
  return { ok: true, me: mockState.me };
}

function mockRegister(email, password) {
  if (!email || password.length < 8) throw new Error('Heslo musí mať aspoň 8 znakov.');
  const id = uid();
  const vs = normalizeVs(Date.now());
  mockState.me.id = id;
  mockState.me.email = email;
  mockState.me.role = 'user';
  mockState.me.status = 'pending';
  mockState.me.license.status = 'pending';
  mockState.me.license.variableSymbol = vs;
  mockState.me.license.paymentStatus = 'waiting_payment';
  if (!mockState.adminUsers.find((u) => u.email === email)) {
    mockState.adminUsers.push({
      id,
      email,
      role: 'user',
      status: 'pending',
      licenseStatus: 'pending',
      licenseType: 'one_time',
      activatedAt: '',
      variableSymbol: vs,
      paymentStatus: 'waiting_payment',
      createdAt: new Date().toISOString()
    });
  }
  saveMock();
  return { ok: true, user: { id, email, role: 'user', status: 'pending' }, license: { variableSymbol: vs, status: 'pending', licenseType: 'one_time', paymentStatus: 'waiting_payment' } };
}

function mockLogout() { resetMockUser(); }

async function requireAuth() {
  if (!document.body.dataset.protected) return true;

  if (API_BASE) {
    try {
      await loadMeFromApi();
    } catch {
      resetMockUser();
      location.href = 'index.html';
      return false;
    }
  }

  if (!mockState.me.email) {
    location.href = 'index.html';
    return false;
  }

  if (qs('userEmailPill')) qs('userEmailPill').textContent = mockState.me.email;

  if (document.body.dataset.admin === 'true' && mockState.me.role !== 'admin') {
    alert('Táto sekcia je len pre admina.');
    location.href = 'dashboard.html';
    return false;
  }

  return true;
}

function fillPaymentCard(prefix, payment) {
  const set = (id, value) => { if (qs(prefix + id)) qs(prefix + id).textContent = value || '—'; };
  set('Email', payment.email || mockState.me.email || '—');
  set('Vs', payment.variableSymbol || '—');
  set('Amount', money(payment.amount || 0));
  set('Iban', payment.iban || '—');
  set('Bic', payment.bic || '—');
  set('Beneficiary', payment.beneficiaryName || '—');
  set('Note', payment.paymentNote || '—');
}

function fillLicenseSummary(payment, status) {
  const licenseStatus = status || mockState.me.license.status || 'pending';
  const humanPaymentState = mockState.me.license.paymentStatus === 'paid' || licenseStatus === 'active' ? 'uhradené' : licenseStatus === 'blocked' ? 'blokované' : 'čaká na úhradu';

  if (qs('licenseMiniStatus')) qs('licenseMiniStatus').textContent = humanPaymentState;
  if (qs('licenseMiniVs')) qs('licenseMiniVs').textContent = payment.variableSymbol || '—';
  if (qs('licenseMiniAmount')) qs('licenseMiniAmount').textContent = money(payment.amount || 0);
  if (qs('licenseStatusBadgeMirror')) qs('licenseStatusBadgeMirror').textContent = humanPaymentState;
  if (qs('licenseMiniVsMirror')) qs('licenseMiniVsMirror').textContent = payment.variableSymbol || '—';

  if (qs('licensePaymentState')) qs('licensePaymentState').textContent = humanPaymentState;
  if (qs('licenseVariableSymbol')) qs('licenseVariableSymbol').textContent = payment.variableSymbol || '—';
  if (qs('licenseAmount')) qs('licenseAmount').textContent = money(payment.amount || 0);
  if (qs('licenseIban')) qs('licenseIban').textContent = payment.iban || '—';
  if (qs('licenseBic')) qs('licenseBic').textContent = payment.bic || '—';
  if (qs('licenseBeneficiary')) qs('licenseBeneficiary').textContent = payment.beneficiaryName || '—';
  if (qs('licensePaymentNote')) qs('licensePaymentNote').textContent = payment.paymentNote || '—';
}

function showPaymentQr(imgId, placeholderId, imageBase64) {
  const img = qs(imgId);
  const placeholder = qs(placeholderId);
  if (!img || !placeholder) return;

  if (imageBase64) {
    img.src = `data:image/png;base64,${imageBase64}`;
    img.style.display = 'block';
    placeholder.style.display = 'none';
  } else {
    img.removeAttribute('src');
    img.style.display = 'none';
    placeholder.style.display = 'block';
  }
}

async function loadLicensePaymentData() {
  const billing = getBillingConfig();
  const payment = {
    email: mockState.me.email || '',
    amount: Number(billing.amount || DEFAULT_BILLING.amount),
    beneficiaryName: billing.beneficiaryName || DEFAULT_BILLING.beneficiaryName,
    iban: billing.iban || DEFAULT_BILLING.iban,
    bic: billing.bic || DEFAULT_BILLING.bic,
    paymentNote: billing.paymentNote || DEFAULT_BILLING.paymentNote,
    variableSymbol: mockState.me.license.variableSymbol || '—',
    imageBase64: null
  };

  if (!API_BASE || !mockState.me.email) return payment;

  try {
    const data = await api('/api/license/me', { method: 'GET' });
    setCurrentUserFromApi({ user: mockState.me, license: data.license });
    payment.variableSymbol = data.license?.variableSymbol || payment.variableSymbol;
  } catch {}

  try {
    const qrData = await api('/api/license/payment-qr', {
      method: 'POST',
      body: JSON.stringify({
        amount: payment.amount,
        currencyCode: 'EUR',
        paymentNote: payment.paymentNote,
        beneficiaryName: payment.beneficiaryName,
        iban: payment.iban,
        bic: payment.bic,
        variableSymbol: payment.variableSymbol
      })
    });

    payment.imageBase64 = qrData?.imageBase64 || null;
    payment.amount = qrData?.payment?.amount || payment.amount;
    payment.beneficiaryName = qrData?.payment?.beneficiaryName || payment.beneficiaryName;
    payment.iban = qrData?.payment?.iban || payment.iban;
    payment.bic = qrData?.payment?.bic || payment.bic;
    payment.paymentNote = qrData?.payment?.paymentNote || payment.paymentNote;
    payment.variableSymbol = qrData?.payment?.variableSymbol || payment.variableSymbol;
  } catch (err) {
    const msgEl = qs('licenseStatusMessage') || qs('dashboardLicenseStatus') || qs('registerStatus');
    if (msgEl) setStatus(msgEl, err.message, 'err');
  }

  return payment;
}

function bindAuth() {
  const loginForm = qs('loginForm');
  const registerForm = qs('registerForm');
  const forgotForm = qs('forgotPasswordForm');
  const resetForm = qs('resetPasswordForm');

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = qs('loginEmail')?.value.trim() || '';
    const password = qs('loginPassword')?.value || '';

    try {
      if (API_BASE) {
        await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        await loadMeFromApi();
      } else {
        mockLogin(email, password);
      }
      setStatus(qs('loginStatus'), 'Prihlásenie prebehlo úspešne.', 'ok');
      setTimeout(() => { location.href = 'dashboard.html'; }, 300);
    } catch (err) {
      setStatus(qs('loginStatus'), err.message, 'err');
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = qs('registerEmail')?.value.trim() || '';
    const password = qs('registerPassword')?.value || '';
    const password2 = qs('registerPassword2')?.value || '';

    try {
      if (password !== password2) throw new Error('Heslá sa nezhodujú.');

      let registerData;
      if (API_BASE) {
        registerData = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });
        await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        await loadMeFromApi();
      } else {
        registerData = mockRegister(email, password);
      }

      setStatus(qs('registerStatus'), 'Účet bol vytvorený. Nižšie sú platobné údaje.', 'ok');
      registerForm.reset();
      qs('registrationPaymentCard')?.classList.remove('hidden');

      const payment = await loadLicensePaymentData();
      payment.email = email;
      payment.variableSymbol = registerData?.license?.variableSymbol || payment.variableSymbol || '—';
      fillPaymentCard('postRegister', payment);
      showPaymentQr('postRegisterQrImage', 'postRegisterQrPlaceholder', payment.imageBase64);
    } catch (err) {
      setStatus(qs('registerStatus'), err.message, 'err');
    }
  });

  forgotForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = qs('forgotEmail')?.value.trim() || '';
    try {
      await api('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
      setStatus(qs('forgotPasswordStatus'), 'Ak účet existuje, email bol odoslaný.', 'ok');
      forgotForm.reset();
    } catch (err) {
      setStatus(qs('forgotPasswordStatus'), err.message, 'err');
    }
  });

  resetForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = qs('resetToken')?.value.trim() || '';
    const password = qs('resetPassword')?.value || '';
    const password2 = qs('resetPassword2')?.value || '';

    try {
      if (!token) throw new Error('Chýba reset token.');
      if (password !== password2) throw new Error('Heslá sa nezhodujú.');
      await api('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });
      setStatus(qs('resetPasswordStatus'), 'Heslo obnovené.', 'ok');
      resetForm.reset();
      setTimeout(() => { location.href = 'index.html'; }, 2000);
    } catch (err) {
      setStatus(qs('resetPasswordStatus'), err.message, 'err');
    }
  });

  qs('logoutBtn')?.addEventListener('click', async () => {
    try { if (API_BASE) await api('/api/auth/logout', { method: 'POST' }); } catch {}
    mockLogout();
    location.href = 'index.html';
  });
}

function populateDashboard() {
  if (!qs('accountEmail')) return;

  qs('accountEmail').textContent = mockState.me.email || '—';
  qs('accountRole').textContent = mockState.me.role || 'user';
  qs('accountStatus').textContent = mockState.me.status || 'pending';

  const badge = qs('licenseStatusBadge');
  if (badge) {
    badge.textContent = mockState.me.license.status;
    badge.className = 'status-badge ' + (mockState.me.license.status === 'active' ? 'active' : mockState.me.license.status === 'blocked' ? 'blocked' : 'pending');
  }

  qs('companiesCount').textContent = String(mockState.companies.length);
  qs('lastQrCount').textContent = localStorage.getItem('mock_qr_count') || '0';

  const companySelect = qs('quickCompany');
  if (companySelect) {
    companySelect.innerHTML = mockState.companies.length ? '' : '<option value="">Najprv pridaj firmu</option>';
    mockState.companies.forEach((c) => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = `${c.companyName} • ${c.iban}`;
      companySelect.appendChild(o);
    });
  }

  qs('quickQrForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (mockState.me.license.status !== 'active') return setStatus(qs('quickQrStatus'), 'Účet ešte nie je aktivovaný.', 'err');
    if (!qs('quickAmount')?.value) return setStatus(qs('quickQrStatus'), 'Zadaj sumu.', 'err');
    localStorage.setItem('mock_qr_count', String(Number(localStorage.getItem('mock_qr_count') || '0') + 1));
    setStatus(qs('quickQrStatus'), 'Rýchly formulár je pripravený. Pre plné QR použi generátor.', 'ok');
    qs('lastQrCount').textContent = localStorage.getItem('mock_qr_count');
  });
}

function renderCompanies() {
  const list = qs('companiesList');
  const select = qs('genCompany');
  const quick = qs('quickCompany');

  if (list) {
    list.innerHTML = mockState.companies.length ? '' : '<div class="table-note">Zatiaľ nemáš pridanú žiadnu firmu.</div>';
    mockState.companies.forEach((company) => {
      const item = document.createElement('article');
      item.className = 'company-item';
      item.innerHTML = `
        <div class="company-top">
          <div>
            <strong>${safeText(company.companyName)}</strong>
            <div class="muted">${safeText(company.beneficiaryName)}</div>
            <div class="muted">${safeText(company.iban)}</div>
          </div>
          ${company.isDefault ? '<span class="status-badge active">predvolená</span>' : ''}
        </div>
        <div class="item-actions">
          <button class="btn-small btn-edit" data-edit="${company.id}">Upraviť</button>
          <button class="btn-small btn-delete" data-delete="${company.id}">Vymazať</button>
        </div>`;
      list.appendChild(item);
    });

    list.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => editCompany(btn.dataset.edit)));
    list.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteCompany(btn.dataset.delete)));
  }

  [select, quick].forEach((sel) => {
    if (!sel) return;
    sel.innerHTML = mockState.companies.length ? '' : '<option value="">Najprv pridaj firmu</option>';
    mockState.companies.forEach((c) => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = `${c.companyName} • ${c.iban}`;
      sel.appendChild(o);
    });
  });
}

function resetCompanyForm() {
  ['companyId', 'companyName', 'beneficiaryName', 'iban', 'bic', 'addressLine', 'city', 'postalCode'].forEach((id) => {
    const e = qs(id); if (e) e.value = '';
  });
  if (qs('countryCode')) qs('countryCode').value = 'SK';
  if (qs('isDefault')) qs('isDefault').checked = false;
  if (qs('companyFormTitle')) qs('companyFormTitle').textContent = 'Pridať firmu';
}

function editCompany(id) {
  const c = mockState.companies.find((x) => x.id === id);
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

async function deleteCompany(id) {
  try {
    if (API_BASE) {
      await api(`/api/companies/${id}`, { method: 'DELETE' });
      mockState.companies = mockState.companies.filter((x) => x.id !== id);
      saveMock(); renderCompanies(); setStatus(qs('companyStatus'), 'Firma bola vymazaná.', 'ok'); return;
    }
  } catch (err) {
    setStatus(qs('companyStatus'), err.message, 'err'); return;
  }
  mockState.companies = mockState.companies.filter((x) => x.id !== id); saveMock(); renderCompanies();
}

async function loadCompanies() {
  if (!API_BASE) { renderCompanies(); return; }
  const data = await api('/api/companies', { method: 'GET' });
  mockState.companies = (data.companies || []).map((c) => ({
    id: c.id,
    companyName: c.company_name,
    beneficiaryName: c.beneficiary_name,
    iban: c.iban,
    bic: c.bic || '',
    addressLine: c.address_line || '',
    city: c.city || '',
    postalCode: c.postal_code || '',
    countryCode: c.country_code || 'SK',
    isDefault: !!c.is_default,
    createdAt: c.created_at || '',
    updatedAt: c.updated_at || ''
  }));
  saveMock(); renderCompanies();
}

function bindCompanies() {
  const form = qs('companyForm');
  if (!form) return;
  loadCompanies().catch((err) => setStatus(qs('companyStatus'), err.message, 'err'));
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

    if (!payload.companyName || !payload.beneficiaryName || !payload.iban) return setStatus(qs('companyStatus'), 'Vyplň názov firmy, príjemcu a IBAN.', 'err');

    try {
      if (API_BASE) {
        const body = JSON.stringify({
          companyName: payload.companyName,
          beneficiaryName: payload.beneficiaryName,
          iban: payload.iban,
          bic: payload.bic,
          addressLine: payload.addressLine,
          city: payload.city,
          postalCode: payload.postalCode,
          countryCode: payload.countryCode,
          isDefault: payload.isDefault
        });
        if (payload.id) await api(`/api/companies/${payload.id}`, { method: 'PUT', body });
        else await api('/api/companies', { method: 'POST', body });
        await loadCompanies();
      } else {
        const localPayload = { ...payload, id: payload.id || uid() };
        if (localPayload.isDefault) mockState.companies.forEach((x) => { x.isDefault = false; });
        const ix = mockState.companies.findIndex((x) => x.id === localPayload.id);
        if (ix >= 0) mockState.companies[ix] = localPayload; else mockState.companies.push(localPayload);
        saveMock(); renderCompanies();
      }
      resetCompanyForm();
      setStatus(qs('companyStatus'), 'Firma bola uložená.', 'ok');
    } catch (err) {
      setStatus(qs('companyStatus'), err.message, 'err');
    }
  });
}

function bindGenerator() {
  const form = qs('generatorForm');
  if (!form) return;
  loadCompanies().catch(() => {});
  const due = qs('genDueDate');
  if (due && !due.value) {
    const d = new Date(); d.setDate(d.getDate() + 7); due.value = d.toISOString().slice(0, 10);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (mockState.me.license.status !== 'active') return setStatus(qs('generatorStatus'), 'Generovanie je zamknuté, kým nie je licencia aktívna.', 'err');
    const company = mockState.companies.find((c) => c.id === qs('genCompany').value);
    if (!company) return setStatus(qs('generatorStatus'), 'Najprv pridaj firmu.', 'err');
    const amount = qs('genAmount').value;
    if (!amount) return setStatus(qs('generatorStatus'), 'Zadaj sumu.', 'err');

    try {
      if (API_BASE) {
        const data = await api('/api/qr/generate', {
          method: 'POST',
          body: JSON.stringify({
            companyId: company.id,
            amount: Number(amount),
            currencyCode: 'EUR',
            variableSymbol: qs('genVs')?.value.trim() || '',
            specificSymbol: qs('genSs')?.value.trim() || '',
            constantSymbol: qs('genKs')?.value.trim() || '',
            paymentNote: qs('genNote')?.value.trim() || '',
            dueDate: qs('genDueDate')?.value || ''
          })
        });
        if (data?.imageBase64) showPaymentQr('qrPreviewImage', 'qrPreviewPlaceholder', data.imageBase64);
        qs('generatorSummary')?.classList.remove('hidden');
        if (qs('sumGenCompany')) qs('sumGenCompany').textContent = company.companyName;
        if (qs('sumGenAmount')) qs('sumGenAmount').textContent = money(amount);
        if (qs('sumGenVs')) qs('sumGenVs').textContent = qs('genVs')?.value || '—';
        if (qs('sumGenNote')) qs('sumGenNote').textContent = qs('genNote')?.value || '—';
        localStorage.setItem('mock_qr_count', String(Number(localStorage.getItem('mock_qr_count') || '0') + 1));
        setStatus(qs('generatorStatus'), data?.imageBase64 ? 'QR bolo úspešne vygenerované.' : 'Backend odpovedal, ale nevrátil obrázok QR.', 'ok');
        return;
      }
    } catch (err) { setStatus(qs('generatorStatus'), err.message, 'err'); return; }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="white"/><rect x="20" y="20" width="260" height="260" fill="none" stroke="#111827" stroke-width="8"/><text x="150" y="120" font-size="22" text-anchor="middle" fill="#111827" font-family="Arial">QR kódy Platinum</text><text x="150" y="155" font-size="16" text-anchor="middle" fill="#374151" font-family="Arial">${safeText(company.companyName)}</text><text x="150" y="185" font-size="18" text-anchor="middle" fill="#2563eb" font-family="Arial">${money(amount)}</text><text x="150" y="225" font-size="12" text-anchor="middle" fill="#6b7280" font-family="Arial">Náhľad frontend verzie</text></svg>`;
    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    const img = qs('qrPreviewImage');
    img.src = dataUrl; img.style.display = 'block'; qs('qrPreviewPlaceholder').style.display = 'none';
    qs('generatorSummary')?.classList.remove('hidden');
    if (qs('sumGenCompany')) qs('sumGenCompany').textContent = company.companyName;
    if (qs('sumGenAmount')) qs('sumGenAmount').textContent = money(amount);
    if (qs('sumGenVs')) qs('sumGenVs').textContent = qs('genVs')?.value || '—';
    if (qs('sumGenNote')) qs('sumGenNote').textContent = qs('genNote')?.value || '—';
    localStorage.setItem('mock_qr_count', String(Number(localStorage.getItem('mock_qr_count') || '0') + 1));
    setStatus(qs('generatorStatus'), 'Toto je len vizuálny náhľad.', 'ok');
  });
}

async function bindLicense() {
  if (!qs('licensePageStatus') && !qs('dashboardLicenseQrImage') && !qs('registrationPaymentCard')) return;

  try {
    if (API_BASE && mockState.me.email) {
      const data = await api('/api/license/me', { method: 'GET' });
      mockState.me.license = {
        status: data.license?.status || 'pending',
        licenseType: data.license?.licenseType || 'one_time',
        activatedAt: data.license?.activatedAt || '',
        variableSymbol: data.license?.variableSymbol || mockState.me.license.variableSymbol || '',
        paymentStatus: data.license?.paymentStatus || (data.license?.status === 'active' ? 'paid' : 'waiting_payment')
      };
      saveMock();
    }
  } catch (err) { setStatus(qs('licenseStatusMessage'), err.message, 'err'); }

  const status = mockState.me.license.status || 'pending';
  const badge = qs('licensePageStatus');
  if (badge) {
    badge.textContent = status;
    badge.className = 'status-badge ' + (status === 'active' ? 'active' : status === 'blocked' ? 'blocked' : 'pending');
  }
  if (qs('licenseType')) qs('licenseType').textContent = mockState.me.license.licenseType || 'one_time';
  if (qs('licenseActivatedAt')) qs('licenseActivatedAt').textContent = mockState.me.license.activatedAt || '—';

  const payment = await loadLicensePaymentData();
  fillLicenseSummary(payment, status);
  showPaymentQr('licenseQrImage', 'licenseQrPlaceholder', payment.imageBase64);
  showPaymentQr('dashboardLicenseQrImage', 'dashboardLicenseQrPlaceholder', payment.imageBase64);

  qs('copyLicenseVsBtn')?.addEventListener('click', () => copyText(payment.variableSymbol || '', qs('licenseStatusMessage'), 'Variabilný symbol skopírovaný.'));
  qs('copyVsBtn')?.addEventListener('click', () => copyText(payment.variableSymbol || '', qs('dashboardLicenseStatus'), 'Variabilný symbol skopírovaný.'));
  if (qs('dashboardLicenseStatus') && !qs('dashboardLicenseStatus').textContent) setStatus(qs('dashboardLicenseStatus'), payment.imageBase64 ? 'Platobné údaje načítané.' : 'Platobné údaje načítané bez QR obrázka.', 'ok');

  const changeForm = qs('changePasswordForm');
  changeForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = qs('currentPassword')?.value || '';
    const newPassword = qs('newPassword')?.value || '';
    const newPassword2 = qs('newPassword2')?.value || '';
    try {
      if (newPassword !== newPassword2) throw new Error('Nové heslá sa nezhodujú.');
      await api('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
      setStatus(qs('changePasswordStatus'), 'Heslo bolo zmenené.', 'ok');
      changeForm.reset();
    } catch (err) { setStatus(qs('changePasswordStatus'), err.message, 'err'); }
  });
}

async function bindAdmin() {
  const list = qs('adminUsersList');
  if (!list) return;

  function effectivePaymentStatus(user) {
    if (user.status === 'blocked' || user.licenseStatus === 'blocked') return 'blocked';
    if (user.licenseStatus === 'active') return 'active';
    if (user.paymentStatus === 'paid' || mockState.adminPaidOverrides[user.id]) return 'paid';
    return 'pending';
  }

  function applyFilters(users) {
    const emailFilter = (qs('adminFilterEmail')?.value || '').trim().toLowerCase();
    const vsFilter = normalizeVs(qs('adminFilterVs')?.value || '');
    const statusFilter = (qs('adminFilterStatus')?.value || '').trim();
    return users.filter((user) => {
      const computed = effectivePaymentStatus(user);
      const matchesEmail = !emailFilter || String(user.email || '').toLowerCase().includes(emailFilter);
      const matchesVs = !vsFilter || String(user.variableSymbol || '').includes(vsFilter);
      const matchesStatus = !statusFilter || computed === statusFilter;
      return matchesEmail && matchesVs && matchesStatus;
    });
  }

  async function resetUserPassword(userId) {
    const newPassword = prompt('Zadaj nové heslo pre používateľa (min. 8 znakov):', '');
    if (newPassword === null) return;
    if (String(newPassword).trim().length < 8) {
      setStatus(qs('adminStatus'), 'Nové heslo musí mať aspoň 8 znakov.', 'err');
      return;
    }
    await api(`/api/admin/users/${userId}/reset-password`, { method: 'POST', body: JSON.stringify({ newPassword }) });
    setStatus(qs('adminStatus'), 'Heslo bolo resetované.', 'ok');
  }

  function render() {
    const filtered = applyFilters(mockState.adminUsers);
    list.innerHTML = filtered.length ? '' : '<div class="table-note">Žiadny používateľ nespĺňa filter.</div>';
    filtered.forEach((user) => {
      const computedStatus = effectivePaymentStatus(user);
      const item = document.createElement('article');
      item.className = 'admin-item';
      item.innerHTML = `
        <div class="admin-top">
          <div>
            <strong>${safeText(user.email)}</strong>
            <div class="muted">rola: ${safeText(user.role || 'user')}</div>
            <div class="muted">status účtu: ${safeText(user.status || 'pending')}</div>
            <div class="muted">VS: ${safeText(user.variableSymbol || '—')}</div>
          </div>
          <span class="status-badge ${computedStatus === 'active' ? 'active' : computedStatus === 'blocked' ? 'blocked' : computedStatus === 'paid' ? 'paid' : 'pending'}">${computedStatus === 'paid' ? 'uhradené' : computedStatus}</span>
        </div>
        <div class="item-actions">
          <button class="btn-small btn-paid" data-paid="${user.id}">Označiť uhradené</button>
          <button class="btn-small btn-activate" data-activate="${user.id}">Aktivovať</button>
          <button class="btn-small btn-delete" data-block="${user.id}">Blokovať</button>
          <button class="btn-small btn-reset" data-reset="${user.id}">Reset hesla</button>
        </div>`;
      list.appendChild(item);
    });

    list.querySelectorAll('[data-paid]').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        const userId = btn.dataset.paid;
        if (API_BASE) await api(`/api/admin/users/${userId}/mark-paid`, { method: 'POST' });
        mockState.adminPaidOverrides[userId] = true;
        const user = mockState.adminUsers.find((u) => u.id === userId);
        if (user) user.paymentStatus = 'paid';
        saveMock(); render(); setStatus(qs('adminStatus'), 'Platba bola označená ako uhradená.', 'ok');
      } catch (err) { setStatus(qs('adminStatus'), err.message, 'err'); }
    }));

    list.querySelectorAll('[data-activate]').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        if (API_BASE) { await api(`/api/admin/users/${btn.dataset.activate}/activate`, { method: 'POST' }); await loadAdminUsers(); }
        else {
          const user = mockState.adminUsers.find((u) => u.id === btn.dataset.activate);
          if (user) { user.status = 'active'; user.licenseStatus = 'active'; delete mockState.adminPaidOverrides[user.id]; saveMock(); render(); }
        }
        setStatus(qs('adminStatus'), 'Používateľ bol aktivovaný.', 'ok');
      } catch (err) { setStatus(qs('adminStatus'), err.message, 'err'); }
    }));

    list.querySelectorAll('[data-block]').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        if (API_BASE) { await api(`/api/admin/users/${btn.dataset.block}/block`, { method: 'POST' }); await loadAdminUsers(); }
        else {
          const user = mockState.adminUsers.find((u) => u.id === btn.dataset.block);
          if (user) { user.status = 'blocked'; user.licenseStatus = 'blocked'; saveMock(); render(); }
        }
        setStatus(qs('adminStatus'), 'Používateľ bol zablokovaný.', 'ok');
      } catch (err) { setStatus(qs('adminStatus'), err.message, 'err'); }
    }));

    list.querySelectorAll('[data-reset]').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        if (API_BASE) await resetUserPassword(btn.dataset.reset);
        else setStatus(qs('adminStatus'), 'V mock režime sa reset hesla neposiela na backend.', 'ok');
      } catch (err) { setStatus(qs('adminStatus'), err.message, 'err'); }
    }));
  }

  async function loadAdminUsers() {
    if (API_BASE) {
      const data = await api('/api/admin/users', { method: 'GET' });
      mockState.adminUsers = (data.users || []).map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        status: u.status,
        licenseStatus: u.license_status || 'pending',
        licenseType: u.license_type || 'one_time',
        activatedAt: u.activated_at || '',
        createdAt: u.created_at || '',
        variableSymbol: u.variable_symbol || '',
        paymentStatus: mockState.adminPaidOverrides[u.id] ? 'paid' : (u.payment_status || (u.license_status === 'active' ? 'paid' : 'waiting_payment'))
      }));
      saveMock(); render(); return;
    }
    render();
  }

  ['adminFilterEmail', 'adminFilterVs', 'adminFilterStatus'].forEach((id) => {
    qs(id)?.addEventListener('input', render);
    qs(id)?.addEventListener('change', render);
  });
  qs('refreshAdminBtn')?.addEventListener('click', () => { loadAdminUsers().catch((err) => setStatus(qs('adminStatus'), err.message, 'err')); });

  const billingForm = qs('billingCompanyForm');
  if (billingForm) {
    const cfg = getBillingConfig();
    if (qs('billingBeneficiaryName')) qs('billingBeneficiaryName').value = cfg.beneficiaryName || '';
    if (qs('billingIban')) qs('billingIban').value = cfg.iban || '';
    if (qs('billingBic')) qs('billingBic').value = cfg.bic || '';
    if (qs('billingAmount')) qs('billingAmount').value = String(cfg.amount || '');
    if (qs('billingPaymentNote')) qs('billingPaymentNote').value = cfg.paymentNote || '';
    billingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveBillingConfig({
        beneficiaryName: qs('billingBeneficiaryName')?.value.trim(),
        iban: qs('billingIban')?.value.trim(),
        bic: qs('billingBic')?.value.trim(),
        amount: qs('billingAmount')?.value,
        paymentNote: qs('billingPaymentNote')?.value.trim()
      });
      setStatus(qs('billingCompanyStatus'), 'Fakturačná firma bola uložená.', 'ok');
    });
  }

  await loadAdminUsers().catch((err) => setStatus(qs('adminStatus'), err.message, 'err'));
}

document.addEventListener('DOMContentLoaded', async () => {
  activateTabs();
  bindAuth();

  const tokenFromUrl = new URLSearchParams(location.search).get('token');
  if (qs('resetToken') && tokenFromUrl && !qs('resetToken').value) qs('resetToken').value = tokenFromUrl;

  const isProtected = document.body.dataset.protected === 'true';
  if (isProtected) {
    const ok = await requireAuth();
    if (!ok) return;
  }

  if (qs('userEmailPill')) qs('userEmailPill').textContent = mockState.me.email || 'neprihlásený';
  populateDashboard();
  bindCompanies();
  bindGenerator();
  await bindLicense();
  await bindAdmin();
});

const THEME_COLORS = { gold: '#0f172a', blue: '#0f172a', green: '#052e16', purple: '#2e1065' };
function applyTheme(theme) {
  const safeTheme = ['gold', 'blue', 'green', 'purple'].includes(theme) ? theme : 'gold';
  document.body.classList.remove('theme-gold', 'theme-blue', 'theme-green', 'theme-purple');
  document.body.classList.add(`theme-${safeTheme}`);
  localStorage.setItem('app_theme', safeTheme);
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', THEME_COLORS[safeTheme] || '#0f172a');
}
function initTheme() {
  applyTheme(localStorage.getItem('app_theme') || 'gold');
  document.querySelectorAll('[data-theme]').forEach((btn) => btn.addEventListener('click', () => applyTheme(btn.dataset.theme)));
}
if ('serviceWorker' in navigator) window.addEventListener('load', () => { navigator.serviceWorker.register('service-worker.js').catch((err) => console.log('SW ERROR', err)); });
window.addEventListener('DOMContentLoaded', () => { initTheme(); });
