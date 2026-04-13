const API_BASE = "https://qr-kody-platinum-api.virivkyonlinecz.workers.dev";

const DEFAULT_BILLING = {
  beneficiaryName: "PLATINUM LECH SPA",
  iban: "SK3883300000002201671168",
  bic: "FIOZSKBAXXX",
  amount: 99,
  paymentNote: "Licencia QR kódy Platinum"
};

let billingConfigCache = null;

const mockState = {
  me: {
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
  adminUsers: JSON.parse(localStorage.getItem('mock_admin_users') || '[]')
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
  localStorage.setItem('mock_license_vs', mockState.me.license.variableSymbol || '');
  localStorage.setItem('mock_payment_status', mockState.me.license.paymentStatus || 'waiting_payment');
}

function resetMockUser() {
  mockState.me.email = '';
  mockState.me.role = 'user';
  mockState.me.status = 'pending';
  mockState.me.license = {
    status: 'pending',
    licenseType: 'one_time',
    activatedAt: '',
    variableSymbol: '',
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
    variableSymbol: license.variableSymbol || '',
    paymentStatus: license.paymentStatus || (license.status === 'active' ? 'paid' : 'waiting_payment')
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

function normalizeBillingCompany(data) {
  const company = data?.company || data || {};
  return {
    beneficiaryName: company.beneficiaryName || DEFAULT_BILLING.beneficiaryName,
    iban: company.iban || DEFAULT_BILLING.iban,
    bic: company.bic || DEFAULT_BILLING.bic,
    amount: Number(company.amount || DEFAULT_BILLING.amount),
    paymentNote: company.paymentNote || DEFAULT_BILLING.paymentNote
  };
}

async function getBillingConfig() {
  if (billingConfigCache) return billingConfigCache;

  if (!API_BASE) {
    billingConfigCache = { ...DEFAULT_BILLING };
    return billingConfigCache;
  }

  const data = await api('/api/admin/billing-company', { method: 'GET' });
  billingConfigCache = normalizeBillingCompany(data);
  return billingConfigCache;
}

async function saveBillingConfig(config) {
  const payload = {
    beneficiaryName: config.beneficiaryName || DEFAULT_BILLING.beneficiaryName,
    iban: String(config.iban || DEFAULT_BILLING.iban).replace(/\s+/g, '').toUpperCase(),
    bic: String(config.bic || DEFAULT_BILLING.bic).trim(),
    amount: Number(config.amount || DEFAULT_BILLING.amount),
    paymentNote: config.paymentNote || DEFAULT_BILLING.paymentNote
  };

  if (!API_BASE) {
    billingConfigCache = payload;
    return payload;
  }

  const data = await api('/api/admin/billing-company', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

  billingConfigCache = normalizeBillingCompany(data);
  return billingConfigCache;
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
  mockState.me.license.variableSymbol = String(Date.now()).slice(-10);
  if (!mockState.adminUsers.find((u) => u.email === email)) {
    mockState.adminUsers.push({
      id: uid(),
      email,
      role: 'user',
      status: 'pending',
      licenseStatus: 'pending',
      variableSymbol: mockState.me.license.variableSymbol,
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
        const data = await api('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        const billing = await getBillingConfig();

        setStatus(qs('registerStatus'), 'Účet bol vytvorený. Po úhrade ho aktivuje admin.', 'ok');

        const card = qs('registrationPaymentCard');
        if (card) card.classList.remove('hidden');

        if (qs('postRegisterEmail')) qs('postRegisterEmail').textContent = email;
        if (qs('postRegisterVs')) qs('postRegisterVs').textContent = data?.license?.variableSymbol || '—';
        if (qs('postRegisterAmount')) qs('postRegisterAmount').textContent = money(billing.amount);
        if (qs('postRegisterIban')) qs('postRegisterIban').textContent = billing.iban;
        if (qs('postRegisterBic')) qs('postRegisterBic').textContent = billing.bic || '—';
        if (qs('postRegisterBeneficiary')) qs('postRegisterBeneficiary').textContent = billing.beneficiaryName;
        if (qs('postRegisterNote')) qs('postRegisterNote').textContent = billing.paymentNote;

        try {
          const qr = await api('/api/license/payment-qr', {
            method: 'POST',
            body: JSON.stringify({
              amount: billing.amount,
              currencyCode: 'EUR',
              paymentNote: billing.paymentNote,
              beneficiaryName: billing.beneficiaryName,
              iban: billing.iban,
              bic: billing.bic,
              variableSymbol: data?.license?.variableSymbol || ''
            })
          });

          const img = qs('postRegisterQrImage');
          if (img && qr?.imageBase64) {
            img.src = `data:image/png;base64,${qr.imageBase64}`;
            img.style.display = 'block';
            qs('postRegisterQrPlaceholder').style.display = 'none';
          }
        } catch {}
      } else {
        mockRegister(email, password);
        setStatus(qs('registerStatus'), 'Účet bol vytvorený. Po úhrade ho aktivuje admin.', 'ok');
      }
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
        variableSymbol: data.license?.variableSymbol || mockState.me.license.variableSymbol || '',
        paymentStatus: data.license?.paymentStatus || (data.license?.status === 'active' ? 'paid' : 'waiting_payment')
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
  qs('licenseActivatedAt').textContent = mockState.me.license.activatedAt || '—';

  try {
    const billing = await getBillingConfig();
    if (qs('licensePaymentState')) qs('licensePaymentState').textContent = mockState.me.license.paymentStatus === 'paid' ? 'uhradené' : 'čaká na úhradu';
    if (qs('licenseVariableSymbol')) qs('licenseVariableSymbol').textContent = mockState.me.license.variableSymbol || '—';
    if (qs('licenseAmount')) qs('licenseAmount').textContent = money(billing.amount);
    if (qs('licenseIban')) qs('licenseIban').textContent = billing.iban;
    if (qs('licenseBic')) qs('licenseBic').textContent = billing.bic || '—';
    if (qs('licenseBeneficiary')) qs('licenseBeneficiary').textContent = billing.beneficiaryName;
    if (qs('licensePaymentNote')) qs('licensePaymentNote').textContent = billing.paymentNote;

    if (qs('licenseMiniStatus')) qs('licenseMiniStatus').textContent = mockState.me.license.paymentStatus === 'paid' ? 'uhradené' : 'čaká na úhradu';
    if (qs('licenseMiniVs')) qs('licenseMiniVs').textContent = mockState.me.license.variableSymbol || '—';
    if (qs('licenseMiniAmount')) qs('licenseMiniAmount').textContent = money(billing.amount);
    if (qs('licenseStatusBadgeMirror')) qs('licenseStatusBadgeMirror').textContent = status;
    if (qs('licenseMiniVsMirror')) qs('licenseMiniVsMirror').textContent = mockState.me.license.variableSymbol || '—';

    try {
      const qr = await api('/api/license/payment-qr', {
        method: 'POST',
        body: JSON.stringify({
          amount: billing.amount,
          currencyCode: 'EUR',
          paymentNote: billing.paymentNote,
          beneficiaryName: billing.beneficiaryName,
          iban: billing.iban,
          bic: billing.bic,
          variableSymbol: mockState.me.license.variableSymbol || ''
        })
      });

      const setQr = (imgId, placeholderId) => {
        const img = qs(imgId);
        const placeholder = qs(placeholderId);
        if (img && qr?.imageBase64) {
          img.src = `data:image/png;base64,${qr.imageBase64}`;
          img.style.display = 'block';
          if (placeholder) placeholder.style.display = 'none';
        }
      };

      setQr('licenseQrImage', 'licenseQrPlaceholder');
      setQr('dashboardLicenseQrImage', 'dashboardLicenseQrPlaceholder');
    } catch {}
  } catch (err) {
    setStatus(qs('licenseStatusMessage') || qs('dashboardLicenseStatus'), err.message, 'err');
  }

  qs('copyLicenseVsBtn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(mockState.me.license.variableSymbol || '');
      setStatus(qs('licenseStatusMessage'), 'VS skopírovaný.', 'ok');
    } catch {}
  });

  qs('copyVsBtn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(mockState.me.license.variableSymbol || '');
      setStatus(qs('dashboardLicenseStatus'), 'VS skopírovaný.', 'ok');
    } catch {}
  });

  const changePasswordForm = qs('changePasswordForm');
  changePasswordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = qs('currentPassword')?.value || '';
    const newPassword = qs('newPassword')?.value || '';
    const newPassword2 = qs('newPassword2')?.value || '';

    try {
      if (newPassword !== newPassword2) throw new Error('Nové heslá sa nezhodujú.');

      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      setStatus(qs('changePasswordStatus'), 'Heslo bolo zmenené.', 'ok');
      changePasswordForm.reset();
    } catch (err) {
      setStatus(qs('changePasswordStatus'), err.message, 'err');
    }
  });
}

async function bindAdmin() {
  const list = qs('adminUsersList');
  if (!list) return;

  const render = () => {
    const emailFilter = (qs('adminFilterEmail')?.value || '').trim().toLowerCase();
    const vsFilter = (qs('adminFilterVs')?.value || '').trim();
    const statusFilter = (qs('adminFilterStatus')?.value || '').trim();

    const filtered = mockState.adminUsers.filter((user) => {
      const paymentStatus = user.licenseStatus === 'active'
        ? 'active'
        : user.status === 'blocked'
          ? 'blocked'
          : (user.paymentStatus === 'paid' ? 'paid' : 'pending');

      const okEmail = !emailFilter || user.email.toLowerCase().includes(emailFilter);
      const okVs = !vsFilter || String(user.variableSymbol || '').includes(vsFilter);
      const okStatus = !statusFilter || paymentStatus === statusFilter;

      return okEmail && okVs && okStatus;
    });

    list.innerHTML = filtered.length ? '' : '<div class="table-note">Zatiaľ nie sú registrovaní používatelia.</div>';
    filtered.forEach((user) => {
      const paymentStatus = user.licenseStatus === 'active'
        ? 'active'
        : user.status === 'blocked'
          ? 'blocked'
          : (user.paymentStatus === 'paid' ? 'paid' : 'pending');

      const item = document.createElement('article');
      item.className = 'admin-item';
      item.innerHTML = `
        <div class="admin-top">
          <div>
            <strong>${user.email}</strong>
            <div class="muted">rola: ${user.role}</div>
            <div class="muted">status: ${user.status}</div>
            <div class="muted">VS: ${user.variableSymbol || '—'}</div>
          </div>
          <span class="status-badge ${paymentStatus === 'active' ? 'active' : paymentStatus === 'blocked' ? 'blocked' : paymentStatus === 'paid' ? 'paid' : 'pending'}">${paymentStatus === 'paid' ? 'uhradené' : paymentStatus}</span>
        </div>
        <div class="item-actions">
          <button class="btn-small btn-paid" data-paid="${user.id}">Označiť uhradené</button>
          <button class="btn-small btn-activate" data-activate="${user.id}">Aktivovať</button>
          <button class="btn-small btn-delete" data-block="${user.id}">Blokovať</button>
          <button class="btn-small btn-reset" data-reset="${user.id}">Reset hesla</button>
        </div>
      `;
      list.appendChild(item);
    });

    list.querySelectorAll('[data-activate]').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        if (API_BASE) {
          await api(`/api/admin/users/${btn.dataset.activate}/activate`, { method: 'POST' });
          await loadAdminUsers();
        }
        setStatus(qs('adminStatus'), 'Používateľ bol aktivovaný.', 'ok');
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

    list.querySelectorAll('[data-paid]').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        if (API_BASE) {
          await api(`/api/admin/users/${btn.dataset.paid}/mark-paid`, { method: 'POST' });
          await loadAdminUsers();
        }
        setStatus(qs('adminStatus'), 'Platba bola označená ako uhradená.', 'ok');
      } catch (err) {
        setStatus(qs('adminStatus'), err.message, 'err');
      }
    }));

    list.querySelectorAll('[data-reset]').forEach((btn) => btn.addEventListener('click', async () => {
      try {
        const newPassword = prompt('Zadaj nové heslo (min. 8 znakov):');
        if (!newPassword) return;
        if (newPassword.length < 8) throw new Error('Nové heslo musí mať aspoň 8 znakov.');

        if (API_BASE) {
          await api(`/api/admin/users/${btn.dataset.reset}/reset-password`, {
            method: 'POST',
            body: JSON.stringify({ newPassword })
          });
        }
        setStatus(qs('adminStatus'), 'Heslo bolo resetované.', 'ok');
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
      render();
      return;
    }

    render();
  }

  qs('refreshAdminBtn')?.addEventListener('click', () => {
    loadAdminUsers().catch((err) => setStatus(qs('adminStatus'), err.message, 'err'));
  });

  ['adminFilterEmail', 'adminFilterVs', 'adminFilterStatus'].forEach((id) => {
    qs(id)?.addEventListener('input', render);
    qs(id)?.addEventListener('change', render);
  });

  const billingForm = qs('billingCompanyForm');
  if (billingForm) {
    try {
      const cfg = await getBillingConfig();
      if (qs('billingBeneficiaryName')) qs('billingBeneficiaryName').value = cfg.beneficiaryName || '';
      if (qs('billingIban')) qs('billingIban').value = cfg.iban || '';
      if (qs('billingBic')) qs('billingBic').value = cfg.bic || '';
      if (qs('billingAmount')) qs('billingAmount').value = String(cfg.amount || '');
      if (qs('billingPaymentNote')) qs('billingPaymentNote').value = cfg.paymentNote || '';
    } catch (err) {
      setStatus(qs('billingCompanyStatus'), err.message, 'err');
    }

    billingForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        await saveBillingConfig({
          beneficiaryName: qs('billingBeneficiaryName')?.value.trim(),
          iban: qs('billingIban')?.value.trim(),
          bic: qs('billingBic')?.value.trim(),
          amount: qs('billingAmount')?.value,
          paymentNote: qs('billingPaymentNote')?.value.trim()
        });

        setStatus(qs('billingCompanyStatus'), 'Fakturačná firma bola uložená.', 'ok');
      } catch (err) {
        setStatus(qs('billingCompanyStatus'), err.message, 'err');
      }
    });
  }

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
