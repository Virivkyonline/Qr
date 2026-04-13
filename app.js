const API_BASE = "https://qr-kody-platinum-api.virivkyonlinecz.workers.dev";

const mockState = {
  me: {
    id: localStorage.getItem('mock_user_id') || '',
    email: localStorage.getItem('mock_email') || '',
    role: localStorage.getItem('mock_role') || 'user',
    status: localStorage.getItem('mock_status') || 'pending',
    paymentStatus: localStorage.getItem('mock_payment_status') || 'waiting_payment',
    license: {
      status: localStorage.getItem('mock_license_status') || 'pending',
      licenseType: localStorage.getItem('mock_license_type') || 'one_time',
      activatedAt: localStorage.getItem('mock_activated_at') || '',
      variableSymbol: localStorage.getItem('mock_vs') || '',
      amount: localStorage.getItem('mock_license_amount') || '99.00',
      currency: localStorage.getItem('mock_license_currency') || 'EUR',
      iban: localStorage.getItem('mock_license_iban') || 'SK1200000000000000000000',
      bic: localStorage.getItem('mock_license_bic') || 'SUBASKBX',
      bankName: localStorage.getItem('mock_license_bank') || 'Tvoja banka',
      beneficiaryName: localStorage.getItem('mock_license_beneficiary') || 'QR kódy Platinum',
      paymentNote: localStorage.getItem('mock_license_note') || 'Licencia QR kódy Platinum',
      qrImageUrl: localStorage.getItem('mock_license_qr') || '',
      qrImageBase64: localStorage.getItem('mock_license_qr_base64') || ''
    }
  },
  companies: JSON.parse(localStorage.getItem('mock_companies') || '[]'),
  adminUsers: JSON.parse(localStorage.getItem('mock_admin_users') || '[]')
};

function saveMock() {
  localStorage.setItem('mock_companies', JSON.stringify(mockState.companies));
  localStorage.setItem('mock_admin_users', JSON.stringify(mockState.adminUsers));
  localStorage.setItem('mock_user_id', mockState.me.id || '');
  localStorage.setItem('mock_email', mockState.me.email || '');
  localStorage.setItem('mock_role', mockState.me.role || 'user');
  localStorage.setItem('mock_status', mockState.me.status || 'pending');
  localStorage.setItem('mock_payment_status', mockState.me.paymentStatus || 'waiting_payment');
  localStorage.setItem('mock_license_status', mockState.me.license.status || 'pending');
  localStorage.setItem('mock_license_type', mockState.me.license.licenseType || 'one_time');
  localStorage.setItem('mock_activated_at', mockState.me.license.activatedAt || '');
  localStorage.setItem('mock_vs', mockState.me.license.variableSymbol || '');
  localStorage.setItem('mock_license_amount', mockState.me.license.amount || '49.00');
  localStorage.setItem('mock_license_currency', mockState.me.license.currency || 'EUR');
  localStorage.setItem('mock_license_iban', mockState.me.license.iban || '');
  localStorage.setItem('mock_license_bic', mockState.me.license.bic || '');
  localStorage.setItem('mock_license_bank', mockState.me.license.bankName || '');
  localStorage.setItem('mock_license_beneficiary', mockState.me.license.beneficiaryName || '');
  localStorage.setItem('mock_license_note', mockState.me.license.paymentNote || '');
  localStorage.setItem('mock_license_qr', mockState.me.license.qrImageUrl || '');
  localStorage.setItem('mock_license_qr_base64', mockState.me.license.qrImageBase64 || '');
}

function generateVariableSymbol() {
  return String(Date.now()).slice(-10);
}

function resetMockUser() {
  mockState.me = {
    id: '',
    email: '',
    role: 'user',
    status: 'pending',
    paymentStatus: 'waiting_payment',
    license: {
      status: 'pending',
      licenseType: 'one_time',
      activatedAt: '',
      variableSymbol: '',
      amount: '49.00',
      currency: 'EUR',
      iban: 'SK1200000000000000000000',
      bic: 'SUBASKBX',
      bankName: 'Tvoja banka',
      beneficiaryName: 'QR kódy Platinum',
      paymentNote: 'Licencia QR kódy Platinum',
      qrImageUrl: '',
      qrImageBase64: ''
    }
  };
  saveMock();
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function normalizeLicenseData(payload = {}) {
  const user = payload?.user || payload?.me || {};
  const license = payload?.license || payload?.payment || payload?.subscription || {};
  const payment = payload?.payment || license?.payment || {};
  const qr = payload?.qr || payment?.qr || {};
  const bank = payload?.bank || payment?.bank || {};

  mockState.me.id = firstDefined(user.id, payload.userId, payload.id, mockState.me.id, '');
  mockState.me.email = firstDefined(user.email, payload.email, mockState.me.email, '');
  mockState.me.role = firstDefined(user.role, payload.role, mockState.me.role, 'user');
  mockState.me.status = firstDefined(user.status, payload.status, license.userStatus, mockState.me.status, 'pending');
  mockState.me.paymentStatus = firstDefined(
    payment.status,
    license.paymentStatus,
    payload.paymentStatus,
    mockState.me.paymentStatus,
    'waiting_payment'
  );

  mockState.me.license = {
    status: firstDefined(license.status, payload.licenseStatus, mockState.me.license.status, 'pending'),
    licenseType: firstDefined(license.licenseType, license.type, payload.licenseType, mockState.me.license.licenseType, 'one_time'),
    activatedAt: firstDefined(license.activatedAt, payload.activatedAt, mockState.me.license.activatedAt, ''),
    variableSymbol: String(firstDefined(
      payment.variableSymbol,
      payment.vs,
      license.variableSymbol,
      license.vs,
      payload.variableSymbol,
      payload.vs,
      mockState.me.license.variableSymbol,
      ''
    )),
    amount: String(firstDefined(payment.amount, license.amount, payload.amount, mockState.me.license.amount, '49.00')),
    currency: firstDefined(payment.currency, license.currency, payload.currency, mockState.me.license.currency, 'EUR'),
    iban: firstDefined(bank.iban, payment.iban, license.iban, payload.iban, mockState.me.license.iban, ''),
    bic: firstDefined(bank.bic, payment.bic, license.bic, payload.bic, mockState.me.license.bic, ''),
    bankName: firstDefined(bank.bankName, payment.bankName, license.bankName, payload.bankName, mockState.me.license.bankName, ''),
    beneficiaryName: firstDefined(bank.beneficiaryName, payment.beneficiaryName, license.beneficiaryName, payload.beneficiaryName, mockState.me.license.beneficiaryName, ''),
    paymentNote: firstDefined(payment.note, payment.paymentNote, license.paymentNote, payload.paymentNote, mockState.me.license.paymentNote, ''),
    qrImageUrl: firstDefined(qr.imageUrl, payment.qrImageUrl, license.qrImageUrl, payload.qrImageUrl, mockState.me.license.qrImageUrl, ''),
    qrImageBase64: firstDefined(qr.imageBase64, payment.qrImageBase64, license.qrImageBase64, payload.qrImageBase64, mockState.me.license.qrImageBase64, '')
  };

  saveMock();
}

function setCurrentUserFromApi(data) {
  normalizeLicenseData(data || {});
}

function qs(id) { return document.getElementById(id); }
function setStatus(el, msg, type = '') {
  if (!el) return;
  el.textContent = msg || '';
  el.className = 'inline-status' + (type ? ' ' + type : '');
}
function money(v, currency = 'EUR') { return `${Number(v || 0).toFixed(2)} ${currency}`; }
function uid() { return Math.random().toString(36).slice(2, 10); }
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
function fmtDateTime(v) {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString('sk-SK');
}
function mapLicenseStatus(status) {
  const s = String(status || '').toLowerCase();
  if (['active', 'activated', 'paid_active'].includes(s)) return { text: 'aktívne', cls: 'active' };
  if (['paid', 'paid_waiting_activation', 'waiting_activation'].includes(s)) return { text: 'uhradené', cls: 'paid' };
  if (['blocked', 'disabled', 'suspended'].includes(s)) return { text: 'blokované', cls: 'blocked' };
  return { text: 'čaká na úhradu', cls: 'pending' };
}
function mapPaymentStatus(status) {
  const s = String(status || '').toLowerCase();
  if (['paid', 'received', 'completed'].includes(s)) return 'uhradené';
  if (['active', 'activated'].includes(s)) return 'aktívne';
  return 'čaká na úhradu';
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

async function apiTry(paths, options = {}) {
  let lastError;
  for (const path of paths) {
    try {
      return await api(path, options);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('API chyba');
}

async function loadMeFromApi() {
  const data = await api('/api/auth/me', { method: 'GET' });
  setCurrentUserFromApi(data);
  return data;
}

async function loadLicenseDetailsFromApi() {
  const data = await apiTry(['/api/license/me', '/api/licenses/me', '/api/payments/me'], { method: 'GET' });
  normalizeLicenseData(data || {});
  return data;
}

function mockLogin(email, password) {
  if (!email || !password) throw new Error('Vyplň email aj heslo.');
  mockState.me.email = email;
  if (email === 'admin@platinum.sk') mockState.me.role = 'admin';
  saveMock();
  return { ok: true, me: mockState.me };
}

function mockRegister(email, password) {
  if (!email || password.length < 8) throw new Error('Heslo musí mať aspoň 8 znakov.');
  const vs = generateVariableSymbol();
  mockState.me.email = email;
  mockState.me.role = 'user';
  mockState.me.status = 'pending';
  mockState.me.paymentStatus = 'waiting_payment';
  mockState.me.license.status = 'pending';
  mockState.me.license.variableSymbol = vs;
  if (!mockState.adminUsers.find((u) => u.email === email)) {
    mockState.adminUsers.push({
      id: uid(),
      email,
      role: 'user',
      status: 'pending',
      paymentStatus: 'waiting_payment',
      licenseStatus: 'pending',
      variableSymbol: vs,
      amount: '49.00',
      createdAt: new Date().toISOString()
    });
  }
  saveMock();
  return { ok: true, payment: { variableSymbol: vs, amount: '49.00', currency: 'EUR' } };
}

function mockLogout() {
  resetMockUser();
}

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

function fillRegistrationPaymentCard(data = {}) {
  const root = qs('registrationPaymentCard');
  if (!root) return;

  normalizeLicenseData(data || {});
  const license = mockState.me.license;
  const qrSrc = license.qrImageBase64 ? `data:image/png;base64,${license.qrImageBase64}` : license.qrImageUrl;

  root.classList.remove('hidden');
  qs('postRegisterEmail') && (qs('postRegisterEmail').textContent = mockState.me.email || '—');
  qs('postRegisterVs') && (qs('postRegisterVs').textContent = license.variableSymbol || '—');
  qs('postRegisterAmount') && (qs('postRegisterAmount').textContent = money(license.amount, license.currency));
  qs('postRegisterIban') && (qs('postRegisterIban').textContent = license.iban || '—');
  qs('postRegisterBic') && (qs('postRegisterBic').textContent = license.bic || '—');
  qs('postRegisterBeneficiary') && (qs('postRegisterBeneficiary').textContent = license.beneficiaryName || '—');
  qs('postRegisterNote') && (qs('postRegisterNote').textContent = license.paymentNote || '—');

  const qrImg = qs('postRegisterQrImage');
  const qrPlaceholder = qs('postRegisterQrPlaceholder');
  if (qrImg) {
    if (qrSrc) {
      qrImg.src = qrSrc;
      qrImg.style.display = 'block';
      if (qrPlaceholder) qrPlaceholder.style.display = 'none';
    } else {
      qrImg.removeAttribute('src');
      qrImg.style.display = 'none';
      if (qrPlaceholder) qrPlaceholder.style.display = 'block';
    }
  }
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
        await api('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
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
        registerData = await api('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        normalizeLicenseData({ ...(registerData || {}), email, user: { ...(registerData?.user || {}), email, status: 'pending' } });
      } else {
        registerData = mockRegister(email, password);
      }

      fillRegistrationPaymentCard(registerData || {});
      setStatus(qs('registerStatus'), 'Účet bol vytvorený. Variabilný symbol aj platobné údaje sú pripravené nižšie.', 'ok');
    } catch (err) {
      setStatus(qs('registerStatus'), err.message, 'err');
    }
  });

  forgotForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = qs('forgotEmail')?.value.trim() || '';
    try {
      if (API_BASE) {
        await apiTry(['/api/auth/forgot-password', '/api/auth/password/forgot', '/api/password/forgot'], {
          method: 'POST',
          body: JSON.stringify({ email })
        });
      }
      setStatus(qs('forgotPasswordStatus'), 'Ak účet existuje, odoslali sa emailové inštrukcie na reset hesla.', 'ok');
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
      if (API_BASE) {
        await apiTry(['/api/auth/reset-password', '/api/auth/password/reset', '/api/password/reset'], {
          method: 'POST',
          body: JSON.stringify({ token, password })
        });
      }
      setStatus(qs('resetPasswordStatus'), 'Heslo bolo zmenené. Teraz sa môžeš prihlásiť.', 'ok');
      setTimeout(() => { location.href = 'index.html'; }, 600);
    } catch (err) {
      setStatus(qs('resetPasswordStatus'), err.message, 'err');
    }
  });

  qs('logoutBtn')?.addEventListener('click', async () => {
    try {
      if (API_BASE) {
        await api('/api/auth/logout', { method: 'POST' });
      }
    } catch {}

    mockLogout();
    location.href = 'index.html';
  });
}

function renderLicensePaymentBox() {
  const statusObj = mapLicenseStatus(mockState.me.license.status || mockState.me.paymentStatus);
  const qrSrc = mockState.me.license.qrImageBase64 ? `data:image/png;base64,${mockState.me.license.qrImageBase64}` : mockState.me.license.qrImageUrl;

  qs('licenseMiniStatus') && (qs('licenseMiniStatus').textContent = mapPaymentStatus(mockState.me.paymentStatus || mockState.me.license.status));
  qs('licenseMiniVs') && (qs('licenseMiniVs').textContent = mockState.me.license.variableSymbol || '—');
  qs('licenseMiniAmount') && (qs('licenseMiniAmount').textContent = money(mockState.me.license.amount, mockState.me.license.currency));
  qs('licenseStatusBadge') && (qs('licenseStatusBadge').textContent = statusObj.text);
  if (qs('licenseStatusBadge')) qs('licenseStatusBadge').className = `status-badge ${statusObj.cls}`;

  qs('accountEmail').textContent = mockState.me.email || '—';
  qs('accountRole').textContent = mockState.me.role || 'user';
  qs('accountStatus').textContent = mockState.me.status || 'pending';

  const qrImg = qs('dashboardLicenseQrImage');
  const qrPlaceholder = qs('dashboardLicenseQrPlaceholder');
  if (qrImg) {
    if (qrSrc) {
      qrImg.src = qrSrc;
      qrImg.style.display = 'block';
      qrPlaceholder && (qrPlaceholder.style.display = 'none');
    } else {
      qrImg.style.display = 'none';
      qrPlaceholder && (qrPlaceholder.style.display = 'block');
    }
  }
}

function populateDashboard() {
  if (!qs('accountEmail')) return;

  qs('companiesCount').textContent = String(mockState.companies.length);
  qs('lastQrCount').textContent = localStorage.getItem('mock_qr_count') || '0';
  renderLicensePaymentBox();

  const companySelect = qs('quickCompany');
  if (companySelect) {
    companySelect.innerHTML = '';
    mockState.companies.forEach((c) => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = `${c.companyName} • ${c.iban}`;
      companySelect.appendChild(o);
    });
  }

  qs('quickQrForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (mockState.me.license.status !== 'active') {
      return setStatus(qs('quickQrStatus'), 'Účet ešte nie je aktivovaný.', 'err');
    }
    const amount = qs('quickAmount')?.value;
    if (!amount) return setStatus(qs('quickQrStatus'), 'Zadaj sumu.', 'err');

    localStorage.setItem('mock_qr_count', String(Number(localStorage.getItem('mock_qr_count') || '0') + 1));
    setStatus(qs('quickQrStatus'), 'Rýchly formulár je pripravený. Pre plné QR použi generátor.', 'ok');
    qs('lastQrCount').textContent = localStorage.getItem('mock_qr_count');
  });

  qs('copyVsBtn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(mockState.me.license.variableSymbol || '');
      setStatus(qs('dashboardLicenseStatus'), 'Variabilný symbol bol skopírovaný.', 'ok');
    } catch {
      setStatus(qs('dashboardLicenseStatus'), 'Nepodarilo sa skopírovať variabilný symbol.', 'err');
    }
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
            <strong>${escapeHtml(company.companyName)}</strong>
            <div class="muted">${escapeHtml(company.beneficiaryName)}</div>
            <div class="muted">${escapeHtml(company.iban)}</div>
          </div>
          ${company.isDefault ? '<span class="status-badge active">predvolená</span>' : ''}
        </div>
        <div class="item-actions">
          <button class="btn-small btn-edit" data-edit="${company.id}">Upraviť</button>
          <button class="btn-small btn-delete" data-delete="${company.id}">Vymazať</button>
        </div>
      `;
      list.appendChild(item);
    });

    list.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => editCompany(btn.dataset.edit)));
    list.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteCompany(btn.dataset.delete)));
  }

  [select, quick].forEach((sel) => {
    if (!sel) return;
    sel.innerHTML = '';
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
    const e = qs(id);
    if (e) e.value = '';
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
      saveMock();
      renderCompanies();
      setStatus(qs('companyStatus'), 'Firma bola vymazaná.', 'ok');
      return;
    }
  } catch (err) {
    setStatus(qs('companyStatus'), err.message, 'err');
    return;
  }

  mockState.companies = mockState.companies.filter((x) => x.id !== id);
  saveMock();
  renderCompanies();
}

async function loadCompanies() {
  if (!API_BASE) {
    renderCompanies();
    return;
  }

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
  saveMock();
  renderCompanies();
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

    if (!payload.companyName || !payload.beneficiaryName || !payload.iban) {
      return setStatus(qs('companyStatus'), 'Vyplň názov firmy, príjemcu a IBAN.', 'err');
    }

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

        if (payload.id) {
          await api(`/api/companies/${payload.id}`, { method: 'PUT', body });
        } else {
          await api('/api/companies', { method: 'POST', body });
        }

        await loadCompanies();
      } else {
        const localPayload = { ...payload, id: payload.id || uid() };
        if (localPayload.isDefault) mockState.companies.forEach((x) => { x.isDefault = false; });
        const ix = mockState.companies.findIndex((x) => x.id === localPayload.id);
        if (ix >= 0) mockState.companies[ix] = localPayload;
        else mockState.companies.push(localPayload);
        saveMock();
        renderCompanies();
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
    const d = new Date();
    d.setDate(d.getDate() + 7);
    due.value = d.toISOString().slice(0, 10);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (mockState.me.license.status !== 'active') {
      return setStatus(qs('generatorStatus'), 'Generovanie je zamknuté, kým nie je licencia aktívna.', 'err');
    }

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

        const img = qs('qrPreviewImage');
        if (data?.imageBase64) {
          img.src = `data:image/png;base64,${data.imageBase64}`;
          img.style.display = 'block';
          qs('qrPreviewPlaceholder').style.display = 'none';
        }

        qs('generatorSummary').classList.remove('hidden');
        qs('sumGenCompany').textContent = company.companyName;
        qs('sumGenAmount').textContent = money(amount);
        qs('sumGenVs').textContent = qs('genVs')?.value || '—';
        qs('sumGenNote').textContent = qs('genNote')?.value || '—';
        localStorage.setItem('mock_qr_count', String(Number(localStorage.getItem('mock_qr_count') || '0') + 1));
        setStatus(qs('generatorStatus'), data?.imageBase64 ? 'QR bolo úspešne vygenerované.' : 'Backend odpovedal, ale nevrátil obrázok QR.', 'ok');
        return;
      }
    } catch (err) {
      setStatus(qs('generatorStatus'), err.message, 'err');
      return;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
      <rect width="300" height="300" fill="white"/>
      <rect x="20" y="20" width="260" height="260" fill="none" stroke="#111827" stroke-width="8"/>
      <text x="150" y="120" font-size="22" text-anchor="middle" fill="#111827" font-family="Arial">QR kódy Platinum</text>
      <text x="150" y="155" font-size="16" text-anchor="middle" fill="#374151" font-family="Arial">${company.companyName}</text>
      <text x="150" y="185" font-size="18" text-anchor="middle" fill="#2563eb" font-family="Arial">${money(amount)}</text>
      <text x="150" y="225" font-size="12" text-anchor="middle" fill="#6b7280" font-family="Arial">Náhľad frontend verzie</text>
    </svg>`;
    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

    const img = qs('qrPreviewImage');
    img.src = dataUrl;
    img.style.display = 'block';
    qs('qrPreviewPlaceholder').style.display = 'none';
    qs('generatorSummary').classList.remove('hidden');
    qs('sumGenCompany').textContent = company.companyName;
    qs('sumGenAmount').textContent = money(amount);
    qs('sumGenVs').textContent = qs('genVs')?.value || '—';
    qs('sumGenNote').textContent = qs('genNote')?.value || '—';
    localStorage.setItem('mock_qr_count', String(Number(localStorage.getItem('mock_qr_count') || '0') + 1));
    setStatus(qs('generatorStatus'), 'Toto je len vizuálny náhľad.', 'ok');
  });
}

async function bindLicense() {
  if (!qs('licensePageStatus')) return;

  try {
    if (API_BASE) {
      await loadLicenseDetailsFromApi();
    }
  } catch (err) {
    setStatus(qs('licenseStatusMessage'), err.message, 'err');
  }

  const status = mapLicenseStatus(mockState.me.license.status || mockState.me.paymentStatus);
  const badge = qs('licensePageStatus');
  badge.textContent = status.text;
  badge.className = 'status-badge ' + status.cls;
  qs('licenseType').textContent = mockState.me.license.licenseType || 'one_time';
  qs('licenseActivatedAt').textContent = mockState.me.license.activatedAt ? fmtDateTime(mockState.me.license.activatedAt) : '—';
  qs('licensePaymentState').textContent = mapPaymentStatus(mockState.me.paymentStatus || mockState.me.license.status);
  qs('licenseVariableSymbol').textContent = mockState.me.license.variableSymbol || '—';
  qs('licenseAmount').textContent = money(mockState.me.license.amount, mockState.me.license.currency);
  qs('licenseIban').textContent = mockState.me.license.iban || '—';
  qs('licenseBic').textContent = mockState.me.license.bic || '—';
  qs('licenseBeneficiary').textContent = mockState.me.license.beneficiaryName || '—';
  qs('licensePaymentNote').textContent = mockState.me.license.paymentNote || '—';

  const qrSrc = mockState.me.license.qrImageBase64 ? `data:image/png;base64,${mockState.me.license.qrImageBase64}` : mockState.me.license.qrImageUrl;
  const qrImg = qs('licenseQrImage');
  const qrPlaceholder = qs('licenseQrPlaceholder');
  if (qrImg) {
    if (qrSrc) {
      qrImg.src = qrSrc;
      qrImg.style.display = 'block';
      qrPlaceholder && (qrPlaceholder.style.display = 'none');
    } else {
      qrImg.style.display = 'none';
      qrPlaceholder && (qrPlaceholder.style.display = 'block');
    }
  }

  qs('copyLicenseVsBtn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(mockState.me.license.variableSymbol || '');
      setStatus(qs('licenseStatusMessage'), 'Variabilný symbol bol skopírovaný.', 'ok');
    } catch {
      setStatus(qs('licenseStatusMessage'), 'Nepodarilo sa skopírovať variabilný symbol.', 'err');
    }
  });

  bindChangePassword();
}

function bindChangePassword() {
  const form = qs('changePasswordForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = qs('currentPassword')?.value || '';
    const newPassword = qs('newPassword')?.value || '';
    const newPassword2 = qs('newPassword2')?.value || '';
    try {
      if (newPassword !== newPassword2) throw new Error('Nové heslá sa nezhodujú.');
      if (API_BASE) {
        await apiTry(['/api/auth/change-password', '/api/auth/password/change', '/api/password/change'], {
          method: 'POST',
          body: JSON.stringify({ currentPassword, newPassword, password: newPassword })
        });
      }
      form.reset();
      setStatus(qs('changePasswordStatus'), 'Heslo bolo zmenené.', 'ok');
    } catch (err) {
      setStatus(qs('changePasswordStatus'), err.message, 'err');
    }
  });
}

async function bindAdmin() {
  const list = qs('adminUsersList');
  if (!list) return;

  const filters = {
    email: qs('adminFilterEmail'),
    vs: qs('adminFilterVs'),
    status: qs('adminFilterStatus')
  };

  const render = () => {
    const emailNeedle = filters.email?.value.trim().toLowerCase() || '';
    const vsNeedle = filters.vs?.value.trim() || '';
    const statusNeedle = filters.status?.value || '';

    const rows = mockState.adminUsers.filter((user) => {
      const licenseText = String(user.licenseStatus || '').toLowerCase();
      const paymentText = String(user.paymentStatus || '').toLowerCase();
      return (!emailNeedle || String(user.email || '').toLowerCase().includes(emailNeedle))
        && (!vsNeedle || String(user.variableSymbol || '').includes(vsNeedle))
        && (!statusNeedle || licenseText === statusNeedle || paymentText === statusNeedle);
    });

    list.innerHTML = rows.length ? '' : '<div class="table-note">Žiadny používateľ nevyhovuje filtru.</div>';
    rows.forEach((user) => {
      const badge = mapLicenseStatus(user.licenseStatus || user.paymentStatus);
      const item = document.createElement('article');
      item.className = 'admin-item';
      item.innerHTML = `
        <div class="admin-top">
          <div>
            <strong>${escapeHtml(user.email)}</strong>
            <div class="muted">VS: ${escapeHtml(user.variableSymbol || '—')}</div>
            <div class="muted">stav platby: ${escapeHtml(mapPaymentStatus(user.paymentStatus || user.licenseStatus))}</div>
            <div class="muted">suma: ${escapeHtml(money(user.amount || mockState.me.license.amount, user.currency || 'EUR'))}</div>
          </div>
          <span class="status-badge ${badge.cls}">${badge.text}</span>
        </div>
        <div class="item-actions">
          <button class="btn-small btn-activate" data-activate="${user.id}">Aktivovať</button>
          <button class="btn-small btn-paid" data-paid="${user.id}">Označiť uhradené</button>
          <button class="btn-small btn-reset" data-reset="${user.id}">Admin reset hesla</button>
          <button class="btn-small btn-delete" data-block="${user.id}">Blokovať</button>
        </div>
      `;
      list.appendChild(item);
    });

    list.querySelectorAll('[data-activate]').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        if (API_BASE) {
          await apiTry([
            `/api/admin/users/${btn.dataset.activate}/activate`,
            `/api/admin/users/${btn.dataset.activate}/license/activate`
          ], { method: 'POST' });
          await loadAdminUsers();
        }
        setStatus(qs('adminStatus'), 'Používateľ bol aktivovaný.', 'ok');
      } catch (err) {
        setStatus(qs('adminStatus'), err.message, 'err');
      }
    }));

    list.querySelectorAll('[data-paid]').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        if (API_BASE) {
          await apiTry([
            `/api/admin/users/${btn.dataset.paid}/mark-paid`,
            `/api/admin/users/${btn.dataset.paid}/payment/paid`
          ], { method: 'POST' });
          await loadAdminUsers();
        }
        setStatus(qs('adminStatus'), 'Platba bola označená ako uhradená.', 'ok');
      } catch (err) {
        setStatus(qs('adminStatus'), err.message, 'err');
      }
    }));

    list.querySelectorAll('[data-reset]').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        if (API_BASE) {
          await apiTry([
            `/api/admin/users/${btn.dataset.reset}/reset-password`,
            `/api/admin/users/${btn.dataset.reset}/password/reset`
          ], { method: 'POST' });
        }
        setStatus(qs('adminStatus'), 'Admin reset hesla bol odoslaný / vykonaný.', 'ok');
      } catch (err) {
        setStatus(qs('adminStatus'), err.message, 'err');
      }
    }));

    list.querySelectorAll('[data-block]').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        if (API_BASE) {
          await api(`/api/admin/users/${btn.dataset.block}/block`, { method: 'POST' });
          await loadAdminUsers();
        }
        setStatus(qs('adminStatus'), 'Používateľ bol zablokovaný.', 'ok');
      } catch (err) {
        setStatus(qs('adminStatus'), err.message, 'err');
      }
    }));
  };

  async function loadAdminUsers() {
    if (API_BASE) {
      const data = await api('/api/admin/users', { method: 'GET' });
      mockState.adminUsers = (data.users || []).map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        status: u.status,
        paymentStatus: firstDefined(u.payment_status, u.paymentStatus, u.license_status, 'waiting_payment'),
        licenseStatus: firstDefined(u.license_status, u.licenseStatus, 'pending'),
        licenseType: u.license_type || 'one_time',
        activatedAt: u.activated_at || '',
        createdAt: u.created_at || '',
        variableSymbol: String(firstDefined(u.variable_symbol, u.vs, '')),
        amount: String(firstDefined(u.amount, '49.00')),
        currency: firstDefined(u.currency, 'EUR')
      }));
      saveMock();
      render();
      return;
    }

    render();
  }

  [filters.email, filters.vs, filters.status].forEach((el) => el?.addEventListener('input', render));

  qs('refreshAdminBtn')?.addEventListener('click', () => {
    loadAdminUsers().catch((err) => setStatus(qs('adminStatus'), err.message, 'err'));
  });

  await loadAdminUsers().catch((err) => setStatus(qs('adminStatus'), err.message, 'err'));
}

document.addEventListener('DOMContentLoaded', async () => {
  activateTabs();
  bindAuth();

  const tokenFromUrl = new URLSearchParams(location.search).get('token');
  if (qs('resetToken') && tokenFromUrl && !qs('resetToken').value) qs('resetToken').value = tokenFromUrl;

  const ok = await requireAuth();
  if (!ok && document.body.dataset.protected === 'true') return;

  if (document.body.dataset.protected === 'true') {
    try {
      await loadLicenseDetailsFromApi();
    } catch {}
  }

  populateDashboard();
  bindCompanies();
  bindGenerator();
  await bindLicense();
  await bindAdmin();
});

const THEME_COLORS = {
  gold: '#0f172a',
  blue: '#0f172a',
  green: '#052e16',
  purple: '#2e1065'
};

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
  document.querySelectorAll('[data-theme]').forEach((btn) => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch((err) => console.log('SW ERROR', err));
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initTheme();
});
