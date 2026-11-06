const CONFIG = window.DVAS_CONFIG || {};
const configReady = CONFIG.supabaseUrl && CONFIG.supabaseAnonKey && !CONFIG.supabaseUrl.includes('YOUR_') && !CONFIG.supabaseAnonKey.includes('YOUR_');
const supabase = configReady && window.supabase ? window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey) : null;
const state = { session: null, profile: null, signUpMode: false };

const $ = (selector) => document.querySelector(selector);
const showMessage = (message, isError = false) => {
  const node = $('#auth-message');
  node.textContent = message;
  node.classList.toggle('hidden', !message);
  node.classList.toggle('error', isError);
};

function setTab(tab) {
  document.querySelectorAll('.tab').forEach((button) => button.classList.toggle('active', button.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.id === tab));
}

function safeText(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = value == null ? '' : String(value);
  return node;
}

function renderProjectList(container, projects) {
  container.replaceChildren();
  if (!projects.length) {
    container.append(safeText('p', 'empty-state', 'No projects to display yet.'));
    return;
  }
  for (const project of projects) {
    const card = document.createElement('article');
    card.className = 'project-item';
    card.append(safeText('h3', '', project.client_name));
    card.append(safeText('div', 'project-meta', `${project.project_type} · ${project.budget} · ${project.timeline} · ${project.status}`));
    card.append(safeText('p', '', project.scope || 'No scope details provided.'));
    container.append(card);
  }
}

async function fetchProjects() {
  if (!supabase || !state.session) return;
  const { data, error } = await supabase.from('projects').select('id,client_name,project_type,budget,timeline,scope,status,created_at').order('created_at', { ascending: false }).limit(100);
  if (error) {
    showMessage(`Could not load projects: ${error.message}`, true);
    return;
  }
  const projects = data || [];
  $('#active-projects').textContent = String(projects.length);
  if (state.profile.role === 'client') renderProjectList($('#project-list'), projects);
  if (state.profile.role === 'investor') renderProjectList($('#investor-list'), projects);
  if (state.profile.role === 'admin') renderProjectList($('#admin-project-list'), projects);
}

async function showPortal(session) {
  state.session = session;
  const { data: profile, error } = await supabase.from('profiles').select('role,display_name').eq('id', session.user.id).single();
  if (error || !profile) {
    showMessage('Your profile is not ready. Apply the database migration from supabase/migrations, then sign in again.', true);
    await supabase.auth.signOut();
    return;
  }
  state.profile = profile;
  $('#auth-screen').classList.add('hidden');
  $('#portal-screen').classList.remove('hidden');
  $('#user-label').textContent = profile.display_name || session.user.email;
  $('#role-label').textContent = profile.role;
  document.querySelectorAll('.tab[data-role]').forEach((tab) => {
    const allowed = tab.dataset.role.split(',').includes(profile.role);
    tab.classList.toggle('hidden', !allowed);
  });
  setTab('overview');
  showMessage('');
  await fetchProjects();
}

async function handleAuth(event) {
  event.preventDefault();
  if (!supabase) {
    showMessage('Setup required: add your Supabase project URL and publishable/anon key to config.js. Do not put secret keys in this file.', true);
    return;
  }
  const email = $('#email').value.trim();
  const password = $('#password').value;
  $('#auth-submit').disabled = true;
  try {
    if (state.signUpMode) {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.href.split('#')[0] } });
      if (error) throw error;
      showMessage('Account created. Check your email to confirm the address, then sign in.');
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await showPortal(data.session);
    }
  } catch (error) {
    showMessage(error.message || 'Authentication failed.', true);
  } finally {
    $('#auth-submit').disabled = false;
  }
}

async function submitProject(event) {
  event.preventDefault();
  if (!supabase || !state.session) return showMessage('Sign in before submitting a project.', true);
  const form = new FormData(event.currentTarget);
  const record = {
    client_name: String(form.get('client') || '').trim(),
    project_type: String(form.get('type') || '').trim(),
    budget: String(form.get('budget') || '').trim(),
    timeline: String(form.get('timeline') || '').trim(),
    scope: String(form.get('scope') || '').trim(),
    owner_id: state.session.user.id
  };
  const { error } = await supabase.from('projects').insert(record);
  if (error) return showMessage(`Project was not saved: ${error.message}`, true);
  event.currentTarget.reset();
  showMessage('Project brief saved securely.');
  await fetchProjects();
}

async function askAssistant(event) {
  event.preventDefault();
  const output = $('#assistant-response');
  const question = $('#assistant-query').value.trim();
  if (!question) return;
  if (!supabase || !state.session) {
    output.textContent = 'Configure Supabase and sign in to use the protected assistant endpoint.';
    return;
  }
  output.textContent = 'Contacting watsonx.ai…';
  try {
    const response = await fetch(`${CONFIG.supabaseUrl}/functions/v1/dvas-assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: CONFIG.supabaseAnonKey, Authorization: `Bearer ${state.session.access_token}` },
      body: JSON.stringify({ question })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Assistant request failed.');
    output.textContent = result.answer;
  } catch (error) {
    output.textContent = error.message || 'Assistant is unavailable. Check the Edge Function configuration.';
  }
}

async function start() {
  $('#auth-form').addEventListener('submit', handleAuth);
  $('#auth-mode-toggle').addEventListener('click', () => {
    state.signUpMode = !state.signUpMode;
    $('#auth-submit').textContent = state.signUpMode ? 'Create account' : 'Sign in';
    $('#auth-mode-toggle').textContent = state.signUpMode ? 'Already have an account? Sign in' : 'Need an account? Sign up';
    showMessage('');
  });
  $('#logout-btn').addEventListener('click', () => supabase?.auth.signOut());
  $('#project-form').addEventListener('submit', submitProject);
  $('#assistant-form').addEventListener('submit', askAssistant);
  $('#refresh-projects').addEventListener('click', fetchProjects);
  document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => setTab(button.dataset.tab)));

  if (!supabase) {
    showMessage('Supabase is not configured. Follow README.md before enabling sign-in or project submissions.', true);
    return;
  }
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) setTimeout(() => showPortal(session), 0);
    else {
      state.session = null;
      state.profile = null;
      $('#portal-screen').classList.add('hidden');
      $('#auth-screen').classList.remove('hidden');
    }
  });
  const { data: { session } } = await supabase.auth.getSession();
  if (session) await showPortal(session);
}

document.addEventListener('DOMContentLoaded', start);
