// Kart numarası aralığı. Kartlar 100–999 arasındaysa MIN değerini 100 yapın.
const MIN = 1;
const MAX = 999;
const LIST_FILE = 'numbers.txt';

// Numara eklerken güncellenecek GitHub reposu, ör. 'kullanici-adi/repo-adi'.
// Boş bırakılırsa site adresinden (kullanici-adi.github.io/repo-adi) bulunur.
const GITHUB_REPO = 'dogualagoz/macscardchecker';

// Token'ın tarayıcıda saklandığı anahtarın adı. Token'ı buraya değil,
// sitedeki "Yönetici girişi" kutusuna yapıştırın.
const TOKEN_KEY = 'macs-card-github-token';

const form = document.getElementById('check-form');
const input = document.getElementById('number');
const result = document.getElementById('result');
const resultNumber = result.querySelector('.result-number');
const resultText = result.querySelector('.result-text');
const resultAction = document.getElementById('result-action');
const stats = document.getElementById('stats');
const nextFreeBtn = document.getElementById('next-free');
const all = document.getElementById('all');
const grid = document.getElementById('grid');

const admin = document.getElementById('admin');
const adminToggle = document.getElementById('admin-toggle');
const adminLogin = document.getElementById('admin-login');
const repoMissing = document.getElementById('repo-missing');
const loginForm = document.getElementById('login-form');
const tokenInput = document.getElementById('token');
const adminPanel = document.getElementById('admin-panel');
const adminRepo = document.getElementById('admin-repo');
const logoutBtn = document.getElementById('logout');
const bulkForm = document.getElementById('bulk-form');
const bulkInput = document.getElementById('bulk');
const toastEl = document.getElementById('toast');

const repo = detectRepo();
let token = loadToken();
let taken = null; // Liste yüklenince Set<number> olur
let current = null; // Sonuç kutusunda gösterilen geçerli numara
let busy = false;

const pad = (n) => String(n).padStart(3, '0');
const isAdmin = () => Boolean(token && repo);

// numbers.txt: her satırda bir numara, "#" sonrası not olarak yok sayılır
function parseList(text) {
  const set = new Set();
  for (const line of text.split('\n')) {
    const content = line.split('#')[0];
    for (const match of content.matchAll(/\d+/g)) {
      const n = Number(match[0]);
      if (n >= MIN && n <= MAX) set.add(n);
      else console.warn(`numbers.txt: ${match[0]} aralık dışında (${pad(MIN)}–${pad(MAX)}), yok sayıldı`);
    }
  }
  return set;
}

// Dosya satır satır düzenlenir, böylece elle yazılmış notlar korunur
function addToFile(text, numbers) {
  const base = !text || text.endsWith('\n') ? text : `${text}\n`;
  return `${base}${numbers.map(pad).join('\n')}\n`;
}

function removeFromFile(text, n) {
  const lines = [];
  for (const line of text.split('\n')) {
    const hashAt = line.indexOf('#');
    const content = hashAt === -1 ? line : line.slice(0, hashAt);
    const note = hashAt === -1 ? '' : line.slice(hashAt);
    const numbers = content.match(/\d+/g) || [];
    if (!numbers.some((m) => Number(m) === n)) {
      lines.push(line);
      continue;
    }
    // Satırda başka numara kalmadıysa satır notuyla birlikte silinir
    const rest = numbers.filter((m) => Number(m) !== n);
    if (rest.length) lines.push(rest.join(', ') + (note ? `  ${note}` : ''));
  }
  return lines.join('\n');
}

function showResult(state, number, text) {
  result.className = `result ${state}`;
  resultNumber.textContent = number;
  resultText.textContent = text;
  if (state !== 'idle') {
    void result.offsetWidth; // animasyonu yeniden başlat
    result.classList.add('pop');
  }
  updateAction();
}

function updateAction() {
  resultAction.hidden = !isAdmin() || current === null;
  if (resultAction.hidden) return;
  resultAction.textContent = taken.has(current) ? 'Listeden çıkar' : 'Alındı olarak işaretle';
  resultAction.disabled = busy;
}

function check(value) {
  current = null;
  if (!value) return showResult('idle', '', '3 haneli numarayı yazın');
  if (!taken) return showResult('idle', '', 'Liste yükleniyor…');

  const n = Number(value);
  if (n < MIN || n > MAX) {
    return showResult('invalid', value.padStart(3, '0'), `Geçersiz numara (${pad(MIN)}–${pad(MAX)} arası)`);
  }
  current = n;
  if (taken.has(n)) showResult('taken', pad(n), '✕ Bu numara alınmış');
  else showResult('free', pad(n), '✓ Bu numara boş');
}

function select(n) {
  input.value = pad(n);
  check(input.value);
}

function applyList(text) {
  taken = parseList(text);
  const total = MAX - MIN + 1;
  stats.innerHTML = `<strong>${taken.size}</strong> alınmış · <strong>${total - taken.size}</strong> boş`;
  nextFreeBtn.disabled = false;
  if (all.open && !grid.hasChildNodes()) buildGrid();
  for (const cell of grid.children) cell.classList.toggle('taken', taken.has(Number(cell.dataset.n)));
  if (input.value) check(input.value);
}

input.addEventListener('input', () => {
  input.value = input.value.replace(/\D/g, '').slice(0, 3);
  if (input.value.length === 3 || !input.value) check(input.value);
  else {
    current = null;
    showResult('idle', '', '3 hane yazın veya “Kontrol et”e basın');
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value) input.value = input.value.padStart(3, '0');
  check(input.value);
});

nextFreeBtn.addEventListener('click', () => {
  for (let n = MIN; n <= MAX; n++) {
    if (!taken.has(n)) return select(n);
  }
  current = null;
  showResult('invalid', '', 'Boş numara kalmadı');
});

function buildGrid() {
  const fragment = document.createDocumentFragment();
  for (let n = MIN; n <= MAX; n++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.textContent = pad(n);
    cell.dataset.n = n;
    if (taken.has(n)) cell.className = 'taken';
    fragment.append(cell);
  }
  grid.replaceChildren(fragment);
}

all.addEventListener('toggle', () => {
  if (all.open && taken && !grid.hasChildNodes()) buildGrid();
});

grid.addEventListener('click', (e) => {
  const cell = e.target.closest('button');
  if (!cell) return;
  select(Number(cell.dataset.n));
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// --- Bildirim ---

let toastTimer;
function toast(text, kind = '') {
  clearTimeout(toastTimer);
  toastEl.textContent = text;
  toastEl.className = `toast show ${kind}`;
  if (kind !== 'pending') {
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), kind === 'error' ? 8000 : 4000);
  }
}

// --- GitHub ---

function detectRepo() {
  // 'https://github.com/kullanici-adi/repo-adi' biçimi de kabul edilir
  if (GITHUB_REPO) return GITHUB_REPO.replace(/^https?:\/\/github\.com\//, '').replace(/(\.git)?\/*$/, '');
  const { hostname, pathname } = location;
  if (!hostname.endsWith('.github.io')) return null;
  const owner = hostname.slice(0, -'.github.io'.length);
  const first = pathname.split('/').filter(Boolean)[0];
  // kullanici-adi.github.io/repo-adi/ ya da doğrudan kullanici-adi.github.io reposu
  return `${owner}/${first && !first.includes('.') ? first : hostname}`;
}

function loadToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveToken(value) {
  try {
    if (value) localStorage.setItem(TOKEN_KEY, value);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Tarayıcı depolamaya izin vermiyorsa token yalnızca bu sekmede kalır
  }
}

async function github(path, options = {}) {
  const res = await fetch(`https://api.github.com/repos/${repo}/${path}`, {
    ...options,
    cache: 'no-store',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (res.ok) return res.json();
  const err = new Error(`GitHub ${res.status}: ${await res.text()}`);
  err.status = res.status;
  throw err;
}

function errorMessage(err) {
  switch (err.status) {
    case 401: return 'Token geçersiz ya da süresi dolmuş, tekrar giriş yapın.';
    case 403: return 'Token’ın bu repoya yazma izni yok (Contents: Read and write gerekli).';
    case 404: return `${repo} reposunda ${LIST_FILE} bulunamadı ya da token’ın bu repoya erişimi yok.`;
    case 409: return 'Liste aynı anda başka biri tarafından değiştirildi, tekrar deneyin.';
    default: return err.status ? `GitHub hatası (${err.status}).` : `GitHub’a bağlanılamadı. İnternet bağlantısını ve app.js’teki GITHUB_REPO ayarını (${repo}) kontrol edin.`;
  }
}

function decodeBase64(b64) {
  const bytes = Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64(text) {
  let binary = '';
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function readRemote() {
  const file = await github(`contents/${LIST_FILE}`);
  return { text: decodeBase64(file.content), sha: file.sha };
}

// change(text) değişiklik yoksa null, varsa { text, message } döner.
// Okuma ile yazma arasında başka biri listeyi değiştirirse bir kez yeniden dener.
async function updateList(change) {
  for (let attempt = 1; ; attempt++) {
    const { text, sha } = await readRemote();
    const edit = change(text);
    if (!edit) {
      applyList(text);
      return false;
    }
    try {
      await github(`contents/${LIST_FILE}`, {
        method: 'PUT',
        body: JSON.stringify({ message: edit.message, content: encodeBase64(edit.text), sha }),
      });
      applyList(edit.text);
      return true;
    } catch (err) {
      if (err.status !== 409 || attempt === 2) throw err;
    }
  }
}

async function runAdmin(task) {
  busy = true;
  updateAction();
  bulkForm.querySelector('button').disabled = true;
  toast('Kaydediliyor…', 'pending');
  try {
    toast(await task(), 'ok');
  } catch (err) {
    console.error(err);
    toast(errorMessage(err), 'error');
    if (err.status === 401) logout();
  } finally {
    busy = false;
    updateAction();
    bulkForm.querySelector('button').disabled = false;
  }
}

// --- Yönetici ---

function renderAdmin() {
  adminToggle.hidden = isAdmin();
  if (isAdmin()) admin.hidden = false;
  repoMissing.hidden = Boolean(repo);
  loginForm.hidden = !repo;
  adminLogin.hidden = isAdmin();
  adminPanel.hidden = !isAdmin();
  adminRepo.textContent = repo || '';
  updateAction();
}

function logout() {
  token = null;
  saveToken(null);
  admin.hidden = true;
  renderAdmin();
}

adminToggle.addEventListener('click', () => {
  admin.hidden = !admin.hidden;
  if (!admin.hidden) {
    admin.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (repo) tokenInput.focus({ preventScroll: true });
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const loginBtn = loginForm.querySelector('button');
  token = tokenInput.value.trim();
  if (!token) return;
  loginBtn.disabled = true;
  try {
    const { text } = await readRemote();
    saveToken(token);
    tokenInput.value = '';
    renderAdmin();
    applyList(text);
    toast('Giriş yapıldı', 'ok');
  } catch (err) {
    console.error(err);
    token = null;
    toast(errorMessage(err), 'error');
  } finally {
    loginBtn.disabled = false;
  }
});

logoutBtn.addEventListener('click', () => {
  logout();
  toast('Çıkış yapıldı');
});

resultAction.addEventListener('click', () => {
  const n = current;
  if (taken.has(n)) {
    if (!confirm(`${pad(n)} numarası listeden çıkarılsın mı?`)) return;
    runAdmin(async () => {
      await updateList((text) => (parseList(text).has(n)
        ? { text: removeFromFile(text, n), message: `Numara sil: ${pad(n)}` }
        : null));
      return `${pad(n)} listeden çıkarıldı.`;
    });
  } else {
    runAdmin(async () => {
      const added = await updateList((text) => (parseList(text).has(n)
        ? null
        : { text: addToFile(text, [n]), message: `Numara ekle: ${pad(n)}` }));
      return added ? `${pad(n)} alındı olarak işaretlendi.` : `${pad(n)} zaten alınmış.`;
    });
  }
});

bulkForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const numbers = [...new Set((bulkInput.value.match(/\d+/g) || []).map(Number))];
  if (!numbers.length) return;
  const invalid = numbers.filter((n) => n < MIN || n > MAX);
  if (invalid.length) {
    toast(`Geçersiz numara: ${invalid.join(', ')} (${pad(MIN)}–${pad(MAX)} arası olmalı)`, 'error');
    return;
  }

  runAdmin(async () => {
    let added = [];
    await updateList((text) => {
      const existing = parseList(text);
      added = numbers.filter((n) => !existing.has(n)).sort((a, b) => a - b);
      if (!added.length) return null;
      const list = added.length <= 10 ? added.map(pad).join(', ') : `${added.length} adet`;
      return { text: addToFile(text, added), message: `Numara ekle: ${list}` };
    });
    bulkInput.value = '';
    const skipped = numbers.length - added.length;
    if (!added.length) return 'Bu numaraların hepsi zaten alınmış.';
    return `${added.length} numara eklendi.${skipped ? ` ${skipped} tanesi zaten alınmıştı.` : ''}`;
  });
});

// --- Başlangıç ---

async function loadList() {
  if (isAdmin()) {
    // Yönetici listeyi doğrudan repodan okur, Pages'in güncellenmesini beklemez
    try {
      applyList((await readRemote()).text);
      return;
    } catch (err) {
      console.error(err);
      toast(errorMessage(err), 'error');
      if (err.status === 401) logout();
    }
  }
  try {
    const res = await fetch(LIST_FILE, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    applyList(await res.text());
  } catch (err) {
    console.error('Numara listesi yüklenemedi:', err);
    stats.textContent = 'Numara listesi yüklenemedi.';
    showResult('error', '', 'Liste yüklenemedi, sayfayı yenileyin');
  }
}

renderAdmin();
loadList();
