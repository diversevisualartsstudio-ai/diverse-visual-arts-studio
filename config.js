const DEMO_PROJECTS = [
  { client_name: 'Aster Labs', project_type: 'Brand Identity & Vector Layout', budget: '$24,000', timeline: '4 weeks', scope: 'Identity refresh and launch toolkit.', status: 'review' },
  { client_name: 'Vector Horizon', project_type: 'Cybersecurity Diagram & Infographics', budget: '$18,500', timeline: '3 weeks', scope: 'Threat model diagrams and SaaS security narrative.', status: 'in_progress' },
  { client_name: 'Northstar Media', project_type: 'AI Video Rendering & Motion Assets', budget: '$32,000', timeline: '5 weeks', scope: 'Campaign motion kit and visual storyboards.', status: 'submitted' }
];

const STORAGE_KEYS = {
  SESSION: 'dvas-portal-session',
  PROJECTS: 'dvas-demo-projects'
};

const rawConfig = window.DVAS_CONFIG || {};
const hasRealSupabase = !!rawConfig.supabaseUrl && !!rawConfig.supabaseAnonKey && !rawConfig.supabaseUrl.includes('YOUR_') && !rawConfig.supabaseAnonKey.includes('YOUR_');
const supabase = hasRealSupabase && window.supabase ? window.supabase.createClient(rawConfig.supabaseUrl, rawConfig.supabaseAnonKey) : null;

const state = {
  session: null,
  profile: null,
  signUpMode: false,
  demoMode: !hasRealSupabase,
  activeTab: 'overview'
};

const $ = (selector) => document.querySelector(selector);

function safeText(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = value == null ? '' : String(value);
  return node;
}

function setTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab').forEach((button) => button.classList.toggle('active', button.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.id === tab));
}

function getDemoProjects() {
  const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
  if (!saved) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(DEMO_PROJECTS));
    return DEMO_PROJECTS;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length ? parsed : DEMO_PROJECTS;
  } catch (error) {
    return DEMO_PROJECTS;
  }
}

function renderProjectList(container, projects) {
  container.replaceChildren();
  if (!projects.length) {
    container.append(safeText('p', 'empty-state', 'No projects to display yet.'));
    return;
  }

  for (const project of projects) {
    const item = document.createElement('article');
    item.className = 'project-item';
    item.append(safeText('h3', '', project.client_name || project.client || 'Untitled project'));
    item.append(safeText('div', 'project-meta', `${project.project_type || project.type || 'General'} · ${project.budget || 'Budget pending'} · ${project.timeline || 'Timeline pending'} · ${project.status || 'submitted'}`));
    item.append(safeText('p', '', project.scope || 'No scope details provided.'));
    container.append(item);
  }
}

function showMessage(message, isError = false) {
  const node = $('#auth-message');
  if (!node) return;
  node.textContent = message;
  node.classList.toggle('hidden', !message);
  node.classList.toggle('error', isError);
}

function setDemoModeNotice() {
  if (state.demoMode) {
    showMessage('Running in demo mode. Replace the placeholder Supabase values in config.js to enable live auth and storage.');
  }
}

function initializePortalState() {
  if (state.demoMode) {
    state.profile = { role: 'admin', display_name: 'Demo Admin' };
    state.session = { user: { id: 'demo-user', email: 'demo@dvas.studio' } };
    $('#auth-screen').classList.add('hidden');
    $('#portal-screen').classList.remove('hidden');
    $('#user-label').textContent = 'Demo Admin';
    $('#role-label').textContent = 'admin';
    document.querySelectorAll('.tab[data-role]').forEach((tab) => {
      const allowed = tab.dataset.role.split(',').includes('admin');
      tab.classList.toggle('hidden', !allowed);
    });
    setTab('overview');
    $('#active-projects').textContent = String(getDemoProjects().length);
    renderProjectList($('#project-list'), getDemoProjects());
    renderProjectList($('#investor-list'), getDemoProjects());
    renderProjectList($('#admin-project-list'), getDemoProjects());
    return;
  }

  $('#auth-screen').classList.remove('hidden');
  $('#portal-screen').classList.add('hidden');
}

async function fetchProjects() {
  if (state.demoMode) {
    const projects = getDemoProjects();
    $('#active-projects').textContent = String(projects.length);
    renderProjectList($('#project-list'), projects);
    renderProjectList($('#investor-list'), projects);
    renderProjectList($('#admin-project-list'), projects);
    return;
  }

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

  if (state.demoMode) {
    state.profile = { role: 'admin', display_name: 'Demo Admin' };
    $('#auth-screen').classList.add('hidden');
    $('#portal-screen').classList.remove('hidden');
    $('#user-label').textContent = 'Demo Admin';
    $('#role-label').textContent = 'admin';
    document.querySelectorAll('.tab[data-role]').forEach((tab) => {
      const allowed = tab.dataset.role.split(',').includes('admin');
      tab.classList.toggle('hidden', !allowed);
    });
    setTab('overview');
    await fetchProjects();
    return;
  }

  const { data: profile, error } = await supabase.from('profiles').select('role,display_name').eq('id', session.user.id).single();
  if (error || !profile) {
    showMessage('Your profile is not ready. Run the Supabase migration and sign in again.', true);
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

  if (state.demoMode) {
    const email = $('#email').value.trim();
    const password = $('#password').value.trim();
    if (!email || !password || password.length < 6) {
      showMessage('Use a valid email and a password with at least 6 characters in demo mode.', true);
      return;
    }
    state.session = { user: { id: 'demo-user', email } };
    state.profile = { role: 'admin', display_name: email.split('@')[0] };
    $('#auth-screen').classList.add('hidden');
    $('#portal-screen').classList.remove('hidden');
    $('#user-label').textContent = state.profile.display_name;
    $('#role-label').textContent = state.profile.role;
    setTab('overview');
    await fetchProjects();
    showMessage('');
    return;
  }

  if (!supabase) {
    showMessage('Fill in your Supabase values in config.js to enable live auth.', true);
    return;
  }

  const email = $('#email').value.trim();
  const password = $('#password').value;
  $('#auth-submit').disabled = true;

  try {
    if (state.signUpMode) {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.href.split('#')[0] } });
      if (error) throw error;
      showMessage('Account created. Check your email for confirmation, then sign in.');
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

  if (state.demoMode) {
    const form = new FormData(event.currentTarget);
    const newProject = {
      client_name: String(form.get('client') || '').trim(),
      project_type: String(form.get('type') || '').trim(),
      budget: String(form.get('budget') || '').trim(),
      timeline: String(form.get('timeline') || '').trim(),
      scope: String(form.get('scope') || '').trim() || 'Scope details pending confirmation.',
      status: 'submitted'
    };

    if (!newProject.client_name || !newProject.budget || !newProject.timeline) {
      showMessage('Please complete all required fields before submitting a project.', true);
      return;
    }

    const projects = getDemoProjects();
    projects.unshift(newProject);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    event.currentTarget.reset();
    await fetchProjects();
    showMessage('Project saved in demo mode.');
    return;
  }

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

function generateDemoAnswer(question) {
  const q = question.toLowerCase();
  if (q.includes('risk') || q.includes('security')) {
    return 'Security coverage is stable with MFA and access controls in place. Keep the current review process and continue to verify all client workstreams before release.';
  }
  if (q.includes('revenue') || q.includes('growth') || q.includes('profit')) {
    return 'Revenue remains healthy with an improved run rate across active clients. Maintain focus on pipeline conversion and on-time delivery to sustain the current trend.';
  }
  if (q.includes('project') || q.includes('intake')) {
    return 'A complete project brief should include scope, budget, timeline, deliverables, and security requirements before moving into review.';
  }
  if (q.includes('design') || q.includes('brand')) {
    return 'Brand and design work should remain aligned to the approved identity system and the client-approved milestone plan.';
  }
  return 'The DVAS portal is functioning in demo mode. Add your real Supabase and IBM credentials to connect live project, auth, and AI services.';
}

async function askAssistant(event) {
  event.preventDefault();
  const output = $('#assistant-response');
  const question = $('#assistant-query').value.trim();
  if (!question) return;

  if (state.demoMode) {
    output.textContent = generateDemoAnswer(question);
    return;
  }

  if (!supabase || !state.session) {
    output.textContent = 'Configure Supabase and sign in to use the protected assistant endpoint.';
    return;
  }

  output.textContent = 'Contacting the AI service…';
  try {
    const response = await fetch(`${rawConfig.supabaseUrl}/functions/v1/dvas-assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: rawConfig.supabaseAnonKey, Authorization: `Bearer ${state.session.access_token}` },
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
  $('#project-form').addEventListener('submit', submitProject);
  $('#assistant-form').addEventListener('submit', askAssistant);
  $('#refresh-projects').addEventListener('click', fetchProjects);
  $('#auth-mode-toggle').addEventListener('click', () => {
    state.signUpMode = !state.signUpMode;
    $('#auth-submit').textContent = state.signUpMode ? 'Create account' : 'Sign in';
    $('#auth-mode-toggle').textContent = state.signUpMode ? 'Already have an account? Sign in' : 'Need an account? Sign up';
    showMessage('');
  });
  $('#logout-btn').addEventListener('click', () => {
    if (state.demoMode) {
      state.session = null;
      state.profile = null;
      $('#portal-screen').classList.add('hidden');
      $('#auth-screen').classList.remove('hidden');
      $('#auth-form').reset();
      showMessage('');
      return;
    }
    supabase?.auth.signOut();
  });
  document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => setTab(button.dataset.tab)));

  if (state.demoMode) {
    setDemoModeNotice();
    initializePortalState();
    return;
  }

  if (!supabase) {
    showMessage('Supabase is not configured. Fill in config.js to enable live auth and project storage.', true);
    return;
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) setTimeout(() => showPortal(session), 0);
    else {
      state.session = null;
      state.profile = null;
      $('#portal-screen').classList.add('hidden');
      $('#auth-screen').classList.remove('hidden');
      showMessage('');
    }
  });

  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    showMessage(error.message, true);
    return;
  }

  if (session) {
    await showPortal(session);
  }
}

document.addEventListener('DOMContentLoaded', start);

