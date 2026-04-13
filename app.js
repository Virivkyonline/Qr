const API_BASE = "https://qr-kody-platinum-api.virivkyonlinecz.workers.dev";

const mockState = {
  me: {
    email: localStorage.getItem('mock_email') || '',
    role: localStorage.getItem('mock_role') || 'user',
    status: localStorage.getItem('mock_status') || 'pending',
    license: {
      status: localStorage.getItem('mock_license_status') || 'pending',
      licenseType: localStorage.getItem('mock_license_type') || 'one_time',
      activatedAt: localStorage.getItem('mock_activated_at') || '',
      variableSymbol: localStorage.getItem('mock_license_vs') || '2026000001',
      paymentStatus: localStorage.getItem('mock_license_payment_status') || 'waiting_payment'
    }
  },
  companies: JSON.parse(localStorage.getItem('mock_companies') || '[]'),
  adminUsers: JSON.parse(localStorage.getItem('mock_admin_users') || '[]'),
  billingCompany: JSON.parse(localStorage.getItem('mock_billing_company') || 'null') || {
    companyName: 'Stavby1 s.r.o.',
    beneficiaryName: localStorage.getItem('mock_billing_beneficiary') || 'Stavby1 s.r.o.',
    iban: localStorage.getItem('mock_billing_iban') || 'SK3883300000002201671168',
    bic: localStorage.getItem('mock_billing_bic') || 'FIOZSKBAXXX',
    paymentNote: 'Licencia QR kódy Platinum',
    amount: 99,
    currencyCode: 'EUR'
  }
};

function saveMock() {
  localStorage.setItem('mock_companies', JSON.stringify(mockState.companies));
  localStorage.setItem('mock_admin_users', JSON.stringify(mockState.adminUsers));
  localStorage.setItem('mock_email', mockState.me.email || '');
  localStorage.setItem('mock_role', mockState.me.role || 'user');
  localStorage.setItem('mock_status', mockState.me.status || 'pending');
  localStorage.setItem('mock_license_status', mockState.me.license.status || 'pending');
  localStorage.setItem('mock_license_type', mockState.me.license.licenseType || 'one_time');
  localStorage.setItem('mock_activated_at', mockState.me.license.activatedAt || '');
  localStorage.setItem('mock_license_vs', mockState.me.license.variableSymbol || '2026000001');
  localStorage.setItem('mock_license_payment_status', mockState.me.license.paymentStatus || 'waiting_payment');
  localStorage.setItem('mock_billing_beneficiary', mockState.billingCompany?.beneficiaryName || '');
  localStorage.setItem('mock_billing_iban', mockState.billingCompany?.iban || '');
  localStorage.setItem('mock_billing_bic', mockState.billingCompany?.bic || '');
  localStorage.setItem('mock_billing_company', JSON.stringify(mockState.billingCompany || null));
}

function resetMockUser() {
  mockState.me.email = '';
  mockState.me.role = 'user';
  mockState.me.status = 'pending';
  mockState.me.license = {
    status: 'pending',
    licenseType: 'one_time',
    activatedAt: '',
    variableSymbol: localStorage.getItem('mock_license_vs') || '2026000001',
    paymentStatus: 'waiting_payment'
  };
  saveMock();
}

function setCurrentUserFromApi(data) {
  const user = data?.user || {};
  const license = data?.license || {};
  mockState.me.email = user.email || '';
  mockState.me.role = user.role || 'user';
  mockState.me.status = user.status || 'pending';
  mockState.me.license = {
    status: license.status || 'pending',
    licenseType: license.licenseType || 'one_time',
    activatedAt: license.activatedAt || '',
    variableSymbol: license.variableSymbol || mockState.me.license.variableSymbol || '2026000001',
    paymentStatus: license.paymentStatus || mockState.me.license.paymentStatus || 'waiting_payment'
  };
  saveMock();
}

function qs(id) { return document.getElementById(id); }
function setStatus(el, msg, type = '') {
  if (!el) return;
  el.textContent = msg || '';
  el.className = 'inline-status' + (type ? ' ' + type : '');
}
function money(v) { return `${Number(v).toFixed(2)} EUR`; }
function uid() { return Math.random().toString(36).slice(2, 10); }

function autoClearStatus(el, delay = 2000) {
  if (!el) return;
  const timerKey = '__clearTimer';
  if (el[timerKey]) clearTimeout(el[timerKey]);
  el[timerKey] = setTimeout(() => {
    el.textContent = '';
    el.className = 'inline-status';
  }, delay);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('sk-SK');
}

function createDefaultLicensePayment() {
  const variableSymbol = localStorage.getItem('mock_license_vs') || '2026000001';
  return {
    amount: 99,
    currencyCode: 'EUR',
    beneficiaryName: localStorage.getItem('mock_billing_beneficiary') || 'Stavby1 s.r.o.',
    iban: localStorage.getItem('mock_billing_iban') || 'SK3883300000002201671168',
    bic: localStorage.getItem('mock_billing_bic') || 'FIOZSKBAXXX',
    paymentNote: 'Licencia QR kódy Platinum',
    variableSymbol
  };
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

async function loadMeFromApi() {
  const data = await api('/api/auth/me', { method: 'GET' });
  setCurrentUserFromApi(data);
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
  mockState.me.email = email;
  mockState.me.role = 'user';
  mockState.me.status = 'pending';
  mockState.me.license.status = 'pending';
  mockState.me.license.paymentStatus = 'waiting_payment';
  if (!mockState.adminUsers.find((u) => u.email === email)) {
    mockState.adminUsers.push({
      id: uid(),
      email,
      role: 'user',
      status: 'pending',
      licenseStatus: 'pending',
      createdAt: new Date().toISOString()
    });
  }
  saveMock();
  return { ok: true };
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

      if (API_BASE) {
        await api('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
      } else {
        mockRegister(email, password);
      }

      setStatus(qs('registerStatus'), 'Účet bol vytvorený. Po úhrade ho aktivuje admin.', 'ok');
    } catch (err) {
      setStatus(qs('registerStatus'), err.message, 'err');
    }
  });

  forgotForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = qs('forgotEmail')?.value.trim() || '';

    try {
      await api('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      setStatus(qs('forgotPasswordStatus'), 'Ak účet existuje, email bol odoslaný.', 'ok');
      autoClearStatus(qs('forgotPasswordStatus'));
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

      await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      });

      setStatus(qs('resetPasswordStatus'), 'Heslo obnovené.', 'ok');
      resetForm.reset();
      autoClearStatus(qs('resetPasswordStatus'), 2000);

      setTimeout(() => {
        location.href = 'index.html';
      }, 2000);
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

function populateDashboard() {
  if (!qs('accountEmail')) return;

  qs('accountEmail').textContent = mockState.me.email || '—';
  qs('accountRole').textContent = mockState.me.role || 'user';
  qs('accountStatus').textContent = mockState.me.status || 'pending';

  const badge = qs('licenseStatusBadge');
  if (badge) {
    badge.textContent = mockState.me.license.status;
    badge.className = 'status-badge ' + (
      mockState.me.license.status === 'active'
        ? 'active'
        : mockState.me.license.status === 'blocked'
          ? 'blocked'
          : 'pending'
    );
  }

  qs('companiesCount').textContent = String(mockState.companies.length);
  qs('lastQrCount').textContent = localStorage.getItem('mock_qr_count') || '0';

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
            <strong>${company.companyName}</strong>
            <div class="muted">${company.beneficiaryName}</div>
            <div class="muted">${company.iban}</div>
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
      const data = await api('/api/license/me', { method: 'GET' });
      mockState.me.license = {
        status: data.license?.status || 'pending',
        licenseType: data.license?.licenseType || 'one_time',
        activatedAt: data.license?.activatedAt || '',
        variableSymbol: data.license?.variableSymbol || mockState.me.license.variableSymbol || '2026000001',
        paymentStatus: data.license?.paymentStatus || mockState.me.license.paymentStatus || 'waiting_payment'
      };
      saveMock();
    }
  } catch (err) {
    setStatus(qs('licenseStatusMessage'), err.message, 'err');
  }

  const status = mockState.me.license.status || 'pending';
  const badge = qs('licensePageStatus');
  badge.textContent = status;
  badge.className = 'status-badge ' + (status === 'active' ? 'active' : status === 'blocked' ? 'blocked' : 'pending');
  qs('licenseType').textContent = mockState.me.license.licenseType || 'one_time';
  qs('licenseActivatedAt').textContent = formatDate(mockState.me.license.activatedAt);

  const fallbackPayment = createDefaultLicensePayment();
  const payment = {
    ...fallbackPayment,
    variableSymbol: mockState.me.license.variableSymbol || fallbackPayment.variableSymbol
  };

  try {
    if (API_BASE) {
      const paymentData = await api('/api/license/payment-qr', {
        method: 'POST',
        body: JSON.stringify({
          amount: fallbackPayment.amount,
          currencyCode: fallbackPayment.currencyCode,
          paymentNote: fallbackPayment.paymentNote,
          variableSymbol: mockState.me.license.variableSymbol || fallbackPayment.variableSymbol
        })
      });

      if (paymentData?.payment) Object.assign(payment, paymentData.payment);

      const img = qs('licenseQrImage');
      const placeholder = qs('licenseQrPlaceholder');
      if (img && paymentData?.imageBase64) {
        img.src = `data:image/png;base64,${paymentData.imageBase64}`;
        img.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
      }
    }
  } catch (err) {
    setStatus(qs('licenseStatusMessage'), err.message, 'err');
  }

  qs('licensePaymentState').textContent = mockState.me.license.paymentStatus === 'paid' ? 'uhradené' : 'čaká na úhradu';
  qs('licenseVariableSymbol').textContent = payment.variableSymbol || '—';
  qs('licenseAmount').textContent = money(payment.amount || 0);
  qs('licenseIban').textContent = payment.iban || '—';
  qs('licenseBic').textContent = payment.bic || '—';
  qs('licenseBeneficiary').textContent = payment.beneficiaryName || '—';
  qs('licensePaymentNote').textContent = payment.paymentNote || '—';

  qs('copyLicenseVsBtn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(payment.variableSymbol || '');
      setStatus(qs('licenseStatusMessage'), 'Variabilný symbol bol skopírovaný.', 'ok');
      autoClearStatus(qs('licenseStatusMessage'));
    } catch {
      setStatus(qs('licenseStatusMessage'), 'Nepodarilo sa skopírovať variabilný symbol.', 'err');
    }
  });

  qs('changePasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = qs('currentPassword')?.value || '';
    const newPassword = qs('newPassword')?.value || '';
    const newPassword2 = qs('newPassword2')?.value || '';

    try {
      if (newPassword !== newPassword2) throw new Error('Heslá sa nezhodujú.');
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      setStatus(qs('changePasswordStatus'), 'Heslo bolo zmenené.', 'ok');
      autoClearStatus(qs('changePasswordStatus'));
      qs('changePasswordForm')?.reset();
    } catch (err) {
      setStatus(qs('changePasswordStatus'), err.message, 'err');
    }
  });
}

async function bindAdmin() {
  const list = qs('adminUsersList');
  if (!list) return;

  const billingForm = qs('billingCompanyForm');
  const billingStatus = qs('billingCompanyStatus');
  const billingInfo = qs('currentBillingCompanyInfo');
  const adminFilterEmail = qs('adminFilterEmail');
  const adminFilterVs = qs('adminFilterVs');
  const adminFilterStatus = qs('adminFilterStatus');

  function getPaymentBadge(user) {
    if (user.status === 'blocked' || user.licenseStatus === 'blocked') return 'blocked';
    if (user.paymentStatus === 'paid') return 'paid';
    if (user.licenseStatus === 'active') return 'active';
    return 'pending';
  }

  function renderBillingCompany() {
    if (!billingForm) return;
    const company = mockState.billingCompany || { ...createDefaultLicensePayment(), companyName: 'Stavby1 s.r.o.' };
    qs('billingCompanyName').value = company.companyName || '';
    qs('billingBeneficiaryName').value = company.beneficiaryName || '';
    qs('billingIban').value = company.iban || '';
    qs('billingBic').value = company.bic || '';
    qs('billingPaymentNote').value = company.paymentNote || 'Licencia QR kódy Platinum';
    qs('billingAmount').value = company.amount || 99;
    qs('billingCurrencyCode').value = company.currencyCode || 'EUR';

    if (billingInfo) {
      billingInfo.innerHTML = `
        <div><span>Fakturačná firma</span><strong>${escapeHtml(company.companyName || '—')}</strong></div>
        <div><span>Príjemca</span><strong>${escapeHtml(company.beneficiaryName || '—')}</strong></div>
        <div><span>IBAN</span><strong>${escapeHtml(company.iban || '—')}</strong></div>
        <div><span>BIC</span><strong>${escapeHtml(company.bic || '—')}</strong></div>
        <div><span>Suma licencie</span><strong>${money(company.amount || 99)}</strong></div>
        <div><span>Poznámka</span><strong>${escapeHtml(company.paymentNote || '—')}</strong></div>
      `;
    }
  }

  const render = () => {
    const emailFilter = (adminFilterEmail?.value || '').trim().toLowerCase();
    const vsFilter = (adminFilterVs?.value || '').trim();
    const statusFilter = (adminFilterStatus?.value || '').trim();

    const filteredUsers = mockState.adminUsers.filter((user) => {
      const matchesEmail = !emailFilter || (user.email || '').toLowerCase().includes(emailFilter);
      const matchesVs = !vsFilter || (user.variableSymbol || '').includes(vsFilter);
      const effectiveStatus = getPaymentBadge(user);
      const matchesStatus = !statusFilter || effectiveStatus === statusFilter || user.status === statusFilter || user.licenseStatus === statusFilter;
      return matchesEmail && matchesVs && matchesStatus;
    });

    list.innerHTML = filteredUsers.length ? '' : '<div class="table-note">Žiadny používateľ nezodpovedá filtru.</div>';
    filteredUsers.forEach((user) => {
      const item = document.createElement('article');
      const effectiveStatus = getPaymentBadge(user);
      item.className = 'admin-item';
      item.innerHTML = `
        <div class="admin-top">
          <div>
            <strong>${escapeHtml(user.email)}</strong>
            <div class="muted">rola: ${escapeHtml(user.role)}</div>
            <div class="muted">status účtu: ${escapeHtml(user.status)}</div>
            <div class="muted">VS: ${escapeHtml(user.variableSymbol || '—')}</div>
          </div>
          <span class="status-badge ${effectiveStatus === 'active' ? 'active' : effectiveStatus === 'blocked' ? 'blocked' : effectiveStatus === 'paid' ? 'active' : 'pending'}">${effectiveStatus}</span>
        </div>
        <div class="account-box compact admin-meta-box">
          <div class="account-row"><span>Licencia</span><strong>${escapeHtml(user.licenseType || 'one_time')}</strong></div>
          <div class="account-row"><span>Platba</span><strong>${effectiveStatus === 'paid' ? 'uhradené' : effectiveStatus === 'active' ? 'aktívne' : effectiveStatus === 'blocked' ? 'blokované' : 'čaká na úhradu'}</strong></div>
          <div class="account-row"><span>Vytvorené</span><strong>${escapeHtml(formatDate(user.createdAt))}</strong></div>
          <div class="account-row"><span>Aktivované</span><strong>${escapeHtml(formatDate(user.activatedAt))}</strong></div>
        </div>
        <div class="item-actions">
          <button class="btn-small btn-edit" data-mark-paid="${user.id}">Označiť uhradené</button>
          <button class="btn-small btn-activate" data-activate="${user.id}">Aktivovať</button>
          <button class="btn-small btn-delete" data-block="${user.id}">Blokovať</button>
          <button class="btn-small btn-secondary" data-reset-password="${user.id}">Reset hesla</button>
        </div>
      `;
      list.appendChild(item);
    });

    list.querySelectorAll('[data-activate]').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        await api(`/api/admin/users/${btn.dataset.activate}/activate`, { method: 'POST' });
        await loadAdminUsers();
        setStatus(qs('adminStatus'), 'Používateľ bol aktivovaný.', 'ok');
        autoClearStatus(qs('adminStatus'));
      } catch (err) {
        setStatus(qs('adminStatus'), err.message, 'err');
      }
    }));

    list.querySelectorAll('[data-block]').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        await api(`/api/admin/users/${btn.dataset.block}/block`, { method: 'POST' });
        await loadAdminUsers();
        setStatus(qs('adminStatus'), 'Používateľ bol zablokovaný.', 'ok');
        autoClearStatus(qs('adminStatus'));
      } catch (err) {
        setStatus(qs('adminStatus'), err.message, 'err');
      }
    }));

    list.querySelectorAll('[data-mark-paid]').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        await api(`/api/admin/users/${btn.dataset.markPaid}/mark-paid`, { method: 'POST' });
        await loadAdminUsers();
        setStatus(qs('adminStatus'), 'Platba bola označená ako uhradená.', 'ok');
        autoClearStatus(qs('adminStatus'));
      } catch (err) {
        setStatus(qs('adminStatus'), err.message, 'err');
      }
    }));

    list.querySelectorAll('[data-reset-password]').forEach((btn) => btn.addEventListener('click', async () => {
      const newPassword = window.prompt('Zadaj nové heslo pre používateľa:');
      if (!newPassword) return;
      try {
        await api(`/api/admin/users/${btn.dataset.resetPassword}/reset-password`, {
          method: 'POST',
          body: JSON.stringify({ newPassword })
        });
        setStatus(qs('adminStatus'), 'Heslo používateľa bolo resetované.', 'ok');
        autoClearStatus(qs('adminStatus'));
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
        licenseStatus: u.license_status || 'pending',
        licenseType: u.license_type || 'one_time',
        activatedAt: u.activated_at || '',
        createdAt: u.created_at || '',
        variableSymbol: u.variable_symbol || '',
        paymentStatus: u.payment_status || 'waiting_payment'
      }));
      saveMock();
    }

    render();
  }

  adminFilterEmail?.addEventListener('input', render);
  adminFilterVs?.addEventListener('input', render);
  adminFilterStatus?.addEventListener('change', render);

  qs('refreshAdminBtn')?.addEventListener('click', () => {
    loadAdminUsers().catch((err) => setStatus(qs('adminStatus'), err.message, 'err'));
  });

  qs('resetBillingCompanyForm')?.addEventListener('click', () => {
    mockState.billingCompany = {
      companyName: '',
      beneficiaryName: '',
      iban: '',
      bic: '',
      paymentNote: 'Licencia QR kódy Platinum',
      amount: 99,
      currencyCode: 'EUR'
    };
    saveMock();
    renderBillingCompany();
    setStatus(billingStatus, 'Formulár bol vyčistený.', 'ok');
    autoClearStatus(billingStatus);
  });

  async function loadBillingCompany() {
    if (!billingForm) return;
    if (API_BASE) {
      try {
        const data = await api('/api/admin/billing-company', { method: 'GET' });
        if (data?.billing) {
          mockState.billingCompany = data.billing;
          saveMock();
        }
      } catch {
        // endpoint bude fungovať po nasadení nového workeru
      }
    }
    renderBillingCompany();
  }

  billingForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const companyName = qs('billingCompanyName')?.value.trim() || '';
    const beneficiaryName = qs('billingBeneficiaryName')?.value.trim() || '';
    const iban = qs('billingIban')?.value.trim() || '';
    const bic = qs('billingBic')?.value.trim() || '';
    const paymentNote = qs('billingPaymentNote')?.value.trim() || 'Licencia QR kódy Platinum';
    const amount = Number(qs('billingAmount')?.value || 99);
    const currencyCode = qs('billingCurrencyCode')?.value.trim() || 'EUR';

    if (!companyName || !beneficiaryName || !iban) {
      setStatus(billingStatus, 'Vyplň názov firmy, príjemcu a IBAN.', 'err');
      return;
    }

    const payload = { companyName, beneficiaryName, iban, bic, paymentNote, amount, currencyCode };

    try {
      if (API_BASE) {
        const data = await api('/api/admin/billing-company', {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        mockState.billingCompany = data?.billing || payload;
      } else {
        mockState.billingCompany = payload;
      }
      saveMock();
      renderBillingCompany();
      setStatus(billingStatus, 'Fakturačná firma bola uložená.', 'ok');
      autoClearStatus(billingStatus, 2500);
    } catch (err) {
      mockState.billingCompany = payload;
      saveMock();
      renderBillingCompany();
      setStatus(billingStatus, 'Frontend je pripravený, backend endpoint treba nasadiť podľa patchu.', 'ok');
      autoClearStatus(billingStatus, 2500);
    }
  });

  await loadBillingCompany();
  await loadAdminUsers().catch((err) => setStatus(qs('adminStatus'), err.message, 'err'));
}

document.addEventListener('DOMContentLoaded', async () => {
  activateTabs();
  bindAuth();

  const tokenFromUrl = new URLSearchParams(location.search).get('token');
  if (qs('resetToken') && tokenFromUrl && !qs('resetToken').value) {
    qs('resetToken').value = tokenFromUrl;
  }

  const isProtected = document.body.dataset.protected === 'true';
  if (isProtected) {
    const ok = await requireAuth();
    if (!ok) return;
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
