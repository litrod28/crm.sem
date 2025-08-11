// SEM Events CRM - Supabase-Backed Version (No Local Arrays)
// =========================================
// All CRUD data lives in Supabase tables defined in your SQL script.
// Environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
// should be populated on Vercel for production security.

// ---------------- Supabase Init ----------------
const SUPABASE_URL =
  window?.process?.env?.NEXT_PUBLIC_SUPABASE_URL ||
  window.NEXT_PUBLIC_SUPABASE_URL ||
  'https://drbbxxanlnfttxrkuqzn.supabase.co';
const SUPABASE_ANON_KEY =
  window?.process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  window.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'YOUR-ANON-KEY-HERE';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

// ---------------- Global State ----------------
let currentUser = null; // { id, username, role, full_name }

// ---------------- Helpers ----------------
function sha256Base64(str) {
  const hash = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(str));
  return CryptoJS.enc.Base64.stringify(hash);
}
const $ = (id) => document.getElementById(id);
const show = (el) => el && el.classList.remove('hidden');
const hide = (el) => el && el.classList.add('hidden');

function toast(msg, type = 'success') {
  const div = document.createElement('div');
  div.className = `notification ${type}`;
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3500);
}

// ---------------- Auth ----------------
async function handleLogin(e) {
  e.preventDefault();
  const u = $('username').value.trim();
  const p = $('password').value.trim();
  if (!u || !p) return toast('Username & password required', 'error');
  const hash = sha256Base64(p);
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', u)
    .eq('password_hash', hash)
    .eq('status', 'active')
    .maybeSingle();
  if (error || !data) return toast('Invalid credentials', 'error');
  currentUser = data;
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', currentUser.id);
  onLogin();
}

function onLogin() {
  hide($('loginPage'));
  show($('dashboard'));
  $('currentUser').textContent = currentUser.full_name || currentUser.username;
  buildNav();
  switchTab('userTab');
  welcomePopup();
  refreshStats();
  refreshFollowups();
}

// ---------------- Navigation ----------------
function buildNav() {
  const nav = $('navTabs');
  nav.innerHTML = '';
  const tabs = [];
  const r = currentUser.role;
  if (r === 'user') {
    tabs.push('userTab', 'addLeadTab', 'leadsTab', 'followupTab');
    hide($('assignToRow'));
    hide($('leadsFilters'));
  } else if (r === 'sem') {
    tabs.push('userTab', 'addLeadTab', 'leadsTab', 'reportTab', 'followupTab');
    show($('assignToRow'));
    show($('leadsFilters'));
    loadUsersInto($('assignToSelect'));
    loadUsersInto($('userFilterSelect'), true);
  } else {
    tabs.push('userTab', 'addLeadTab', 'leadsTab', 'reportTab', 'followupTab', 'adminTab');
    show($('assignToRow'));
    show($('leadsFilters'));
    loadUsersInto($('assignToSelect'));
    loadUsersInto($('userFilterSelect'), true);
  }
  const labels = {
    userTab: 'Dashboard',
    addLeadTab: 'Add Lead',
    leadsTab: 'Leads',
    reportTab: 'Report',
    followupTab: 'Follow-ups',
    adminTab: 'Admin',
  };
  tabs.forEach((id) => {
    const b = document.createElement('button');
    b.className = 'nav-tab';
    b.textContent = labels[id];
    b.onclick = () => switchTab(id);
    nav.appendChild(b);
  });
}

function switchTab(id) {
  document.querySelectorAll('.tab-content').forEach((d) => d.classList.add('hidden'));
  $(id).classList.remove('hidden');
  if (id === 'leadsTab') renderLeads();
  if (id === 'reportTab') renderReport();
  if (id === 'followupTab') renderFollowupsTab();
  if (id === 'adminTab') renderUsers();
}

// ---------------- Welcome ----------------
function welcomePopup() {
  $('welcomeUserName').textContent = currentUser.full_name || currentUser.username;
  show($('welcomePopup'));
  setTimeout(() => hide($('welcomePopup')), 1200);
}

// ---------------- Users Dropdown ----------------
async function loadUsersInto(selectEl, addAll = false) {
  if (!selectEl) return;
  const { data } = await supabase.from('users').select('id,full_name,username').eq('status', 'active');
  selectEl.innerHTML = addAll ? '<option value="">All Users</option>' : '<option value="">-- Select --</option>';
  data.forEach((u) => {
    const o = document.createElement('option');
    o.value = u.id;
    o.textContent = u.full_name || u.username;
    selectEl.appendChild(o);
  });
}

// ---------------- Stats ----------------
async function refreshStats() {
  const { count: leads } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq(currentUser.role === 'user' ? 'added_by' : 'id', currentUser.id);
  $('userLeadsCount').textContent = leads ?? 0;

  const today = new Date().toISOString().split('T')[0];
  const { count: f } = await supabase
    .from('followups')
    .select('id', { count: 'exact', head: true })
    .eq('followup_date', today)
    .eq('status', 'completed')
    .eq(currentUser.role === 'user' ? 'user_id' : 'id', currentUser.id);
  $('userFollowupsToday').textContent = f ?? 0;
}

// ---------------- Leads CRUD ----------------
async function addLead(e) {
  e.preventDefault();
  const payload = {
    event_name: $('eventName').value.trim(),
    organising_society: $('organisingSociety').value.trim(),
    contact_person: $('contactPerson').value.trim(),
    phone: $('phoneNumber').value.trim(),
    email: $('email').value.trim(),
    stage: $('leadStage').value || 'Cold',
    remarks: $('remarks').value.trim() || null,
    followup_date: $('followupDate').value || null,
    source: $('leadSource').value.trim() || null,
    priority: $('priority').value || 'Medium',
    estimated_value: $('estimatedValue').value ? Number($('estimatedValue').value) : null,
    added_by: currentUser.id,
    assigned_to:
      currentUser.role === 'user' ? currentUser.id : $('assignToSelect').value || null,
  };
  const { data, error } = await supabase.from('leads').insert(payload).select('id').single();
  if (error) return toast('Error adding lead', 'error');
  await supabase.rpc('calculate_lead_score', { lead_id: data.id });
  toast('Lead added');
  e.target.reset();
  renderLeads();
  refreshStats();
}

async function fetchLeads(filterUser = '') {
  let q = supabase.from('leads').select('*, users:added_by(full_name), assignee:assigned_to(full_name)').order('created_at', { ascending: false });
  if (currentUser.role === 'user') q = q.eq('added_by', currentUser.id);
  if (filterUser) q = q.eq('assigned_to', filterUser);
  const { data } = await q;
  return data || [];
}

async function renderLeads() {
  const tbody = $('leadsTableBody');
  const filterUser = $('userFilterSelect')?.value || '';
  const leads = await fetchLeads(filterUser);
  tbody.innerHTML = leads
    .map(
      (l) => `<tr><td>${l.event_name}</td><td>${l.organising_society}</td><td>${l.contact_person}</td><td>${l.phone}</td><td>${l.email}</td><td><span class="lead-stage ${l.stage.toUpperCase()}">${l.stage}</span></td><td>${l.users?.full_name || '-'}</td><td>${new Date(l.created_at).toLocaleDateString()}</td><td><button class="btn btn--outline btn--sm" onclick="openLead('${l.id}')">View</button></td></tr>`
    )
    .join('');
}

window.openLead = async (id) => {
  const { data } = await supabase.from('leads').select('*').eq('id', id).single();
  $('leadDetailsContent').innerHTML = `<p><strong>Event:</strong> ${data.event_name}</p><p><strong>Stage:</strong> ${data.stage}</p>`;
  show($('leadDetailsModal'));
};

// ---------------- Follow-ups ----------------
async function refreshFollowups() {
  const today = new Date().toISOString().split('T')[0];
  let q = supabase.from('followups').select('*, leads(event_name,contact_person)').order('followup_date', { ascending: true });
  if (currentUser.role === 'user') q = q.eq('user_id', currentUser.id);
  const { data } = await q;
  const overdue = data.filter((f) => f.status === 'pending' && f.followup_date < today);
  const todays = data.filter((f) => f.status === 'pending' && f.followup_date === today);
  $('overdueFollowups').innerHTML = renderFList(overdue);
  $('todayFollowups').innerHTML = renderFList(todays);
}

function renderFList(list) {
  if (!list.length) return '<div class="empty-state"><h3>No items</h3></div>';
  return list
    .map(
      (f) => `<div class="followup-item"><div class="followup-header"><span class="followup-date">${f.followup_date}</span><span class="followup-status">${f.status}</span></div><div class="followup-details">Lead: ${f.leads.event_name}</div><button class="btn btn--primary btn--sm" onclick="completeF('${f.id}')">Done</button></div>`
    )
    .join('');
}

window.completeF = async (id) => {
  await supabase.from('followups').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id);
  toast('Follow-up completed');
  refreshFollowups();
  refreshStats();
};

// Follow-ups tab
async function renderFollowupsTab() {
  const { data } = await supabase.from('followups').select('*, leads(event_name)').order('followup_date');
  $('followupsTabToday').innerHTML = renderFList(data.filter((f) => f.status === 'pending'));
  $('followupsTabOverdue').innerHTML = renderFList(data.filter((f) => f.status === 'overdue'));
}

// Add follow-up modal
window.openAddFollowup = (leadId) => {
  $('followupLeadId').value = leadId;
  show($('addFollowupModal'));
};

async function addFollowup(e) {
  e.preventDefault();
  const pl = {
    lead_id: $('followupLeadId').value,
    user_id: currentUser.id,
    followup_date: $('followupDateInput').value,
    type: $('followupType').value,
    notes: $('followupNotes').value.trim(),
    status: 'pending',
  };
  if (!pl.followup_date) return toast('Date required', 'error');
  await supabase.from('followups').insert(pl);
  hide($('addFollowupModal'));
  e.target.reset();
  toast('Follow-up added');
  refreshFollowups();
}

// ---------------- Reports ----------------
async function renderReport() {
  const { data: leadsAgg } = await supabase.from('leads').select('added_by, count:id').group('added_by');
  const { data: follAgg } = await supabase.from('followups').select('user_id, count:id').eq('status', 'completed').group('user_id');
  const uMap = {};
  (await supabase.from('users').select('id,full_name')).data.forEach((u) => (uMap[u.id] = u));
  const tbody = $('reportTableBody');
  tbody.innerHTML = leadsAgg
    .map((l) => {
      const f = follAgg.find((x) => x.user_id === l.added_by);
      const followCnt = f ? f.count : 0;
      const rate = l.count ? Math.round((followCnt / l.count) * 100) : 0;
      const uname = uMap[l.added_by]?.full_name || '—';
      return `<tr><td>${uname}</td><td>${l.count}</td><td>${followCnt}</td><td>${rate}%</td></tr>`;
    })
    .join('');
}

// ---------------- Admin ----------------
async function renderUsers() {
  const { data } = await supabase.from('users').select('id,full_name,username,role,status');
  $('usersList').innerHTML = data
    .map(
      (u) => `<div class="user-item"><div class="user-info"><span class="user-name">${u.full_name || u.username}</span><span class="user-role">${u.role}</span></div></div>`
    )
    .join('');
}

async function addUser(e) {
  e.preventDefault();
  const payload = {
    username: $('newUsername').value.trim(),
    full_name: $('newDisplayName').value.trim(),
    password_hash: sha256Base64($('newPassword').value),
    role: $('newRole').value,
    status: 'active',
  };
  if (!payload.username || !$('newPassword').value) return toast('Username & Password required', 'error');
  const { error } = await supabase.from('users').insert(payload);
  if (error) return toast('Error', 'error');
  toast('User added');
  e.target.reset();
  renderUsers();
  loadUsersInto($('assignToSelect'));
}

// ---------------- Bind ----------------
function bind() {
  $('loginForm').addEventListener('submit', handleLogin);
  $('addLeadForm').addEventListener('submit', addLead);
  $('addUserForm').addEventListener('submit', addUser);
  $('addFollowupForm').addEventListener('submit', addFollowup);
  $('userFilterSelect')?.addEventListener('change', renderLeads);
}

document.addEventListener('DOMContentLoaded', bind);
