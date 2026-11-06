(() => {
  'use strict';

  const config = window.DVAS_CONFIG || {};
  const configured = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase?.createClient);
  const client = configured ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;
  const $ = (selector) => document.querySelector(selector);
  const state = { session: null, profile: null, signUpMode: false };

  function message(text, isError = false, target = '#auth-message') {
    const node = $(target);
    if (!node) return;
    node.textContent = text;
    node.classList.toggle('hidden', !text);
    node.classList.toggle('error', isError);
  }

  function setTab(tab) {
    document.querySelectorAll('.tab').forEach((button) => button.classList.toggle('active', button.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.id === tab));
  }

  function renderProjects(container, projects) {
    if (!container) return;
    container.replaceChildren();
    if (!projects.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No projects to display.';
      container.append(empty);
      return;
    }
    for (const project of projects) {
      const item = document.createElement('article');
      item.className = 'project-item';
      const title = document.createElement('h3');
      title.textContent = project.client_name || 'Untitled project';
      const meta = document.createElement('div');
      meta.className = 'project-meta';
      meta.textContent = `${project.project_type || 'Project'} · ${project.budget || 'Budget pending'} · ${project.timeline || 'Timeline pending'} · ${project.status || 'submitted'}`;
      const scope = document.createElement('p');
      scope.textContent = project.scope || 'No scope details provided.';
      item.append(title, meta, scope);
      container.append(item);
    }
  }

  function showPortal(session, profile) {
    state.session = session;
    state.profile = profile;
    $('#auth-screen').classList.add('hidden');
    $('#portal-screen').classList.remove('hidden');
    $('#user-label').textContent = profile.display_name || session.user.email || 'Signed in';
    $('#role-label').textContent = profile.role;
    document.querySelectorAll('.tab[data-role]').forEach((tab) => {
      tab.classList.toggle('hidden', !tab.dataset.role.split(',').includes(profile.role));
    });
    setTab('overview');
    message('');
    loadProjects();
  }

  async function loadProjects() {
    if (!client || !state.session || !state.profile) return;
    const { data, error } = await client.from('projects')
      .select('id,client_name,project_type,budget,timeline,scope,status,created_at')
      .order('created_at', { ascending: false }).limit(100);
    if (error) {
      message(`Could not load projects: ${error.message}`, true, '#portal-message');
      return;
    }
    const projects = data || [];
    $('#active-projects').textContent = String(projects.length);
    if (state.profile.role === 'client') renderProjects($('#project-list'), projects);
    if (state.profile.role === 'investor') renderProjects($('#investor-list'), projects);
    if (state.profile.role === 'admin') renderProjects($('#admin-project-list'), projects);
  }

  async function handleAuth(event) {
    event.preventDefault();
    if (!client) return message('Live sign-in is not configured. Set the project URL and public client key in config.js.');
    const email = $('#email').value.trim();
    const password = $('#password').value;
    const button = $('#auth-submit');
    button.disabled = true;
    try {
      if (state.signUpMode) {
        const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: window.location.href.split('#')[0] } });
        if (error) throw error;
        if (data.session) await hydrateSession(data.session);
        else message('Account created. Check your email to confirm, then sign in.');
      } else {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await hydrateSession(data.session);
      }
    } catch (error) {
      message(error.message || 'Authentication failed.');
    } finally {
      button.disabled = false;
    }
  }

  async function hydrateSession(session) {
    if (!session) return;
    const { data: profile, error } = await client.from('profiles')
      .select('role,display_name').eq('id', session.user.id).single();
    if (error || !profile) {
      message('Your account profile is not ready. Apply the database migration and contact the administrator.', true);
      return;
    }
    showPortal(session, profile);
  }

  async function submitProject(event) {
    event.preventDefault();
    if (!client || !state.session) return message('Sign in before submitting a project.', true, '#portal-message');
    const form = new FormData(event.currentTarget);
    const record = {
      client_name: String(form.get('client') || '').trim(),
      project_type: String(form.get('type') || '').trim(),
      budget: String(form.get('budget') || '').trim(),
      timeline: String(form.get('timeline') || '').trim(),
      scope: String(form.get('scope') || '').trim(),
      owner_id: state.session.user.id
    };
    try {
      const { error } = await client.from('projects').insert(record);
      if (error) throw error;
      event.currentTarget.reset();
      message('Project brief submitted.', false, '#portal-message');
      await loadProjects();
    } catch (error) {
      message(`Project was not saved: ${error.message}`, true, '#portal-message');
    }
  }

  async function askAssistant(event) {
    event.preventDefault();
    const output = $('#assistant-response');
    const question = $('#assistant-query').value.trim();
    if (!question) return;
    if (!client || !state.session) {
      output.textContent = 'Sign in and configure the assistant service to use this feature.';
      return;
    }
    output.textContent = 'Contacting the assistant…';
    try {
      const { data: { session }, error } = await client.auth.getSession();
      if (error) throw error;
      const response = await fetch(`${config.supabaseUrl.replace(/\/$/, '')}/functions/v1/dvas-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: config.supabaseAnonKey, Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ question })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Assistant request failed.');
      output.textContent = result.answer;
    } catch (error) {
      output.textContent = error.message || 'Assistant is unavailable.';
    }
  }

  async function start() {
    $('#auth-form').addEventListener('submit', handleAuth);
    $('#project-form').addEventListener('submit', submitProject);
    $('#assistant-form').addEventListener('submit', askAssistant);
    $('#refresh-projects').addEventListener('click', loadProjects);
    $('#auth-mode-toggle').addEventListener('click', () => {
      state.signUpMode = !state.signUpMode;
      $('#auth-submit').textContent = state.signUpMode ? 'Create account' : 'Sign in';
      $('#auth-mode-toggle').textContent = state.signUpMode ? 'Already have an account? Sign in' : 'Need an account? Sign up';
      message('');
    });
    $('#logout-btn').addEventListener('click', async () => {
      if (client) await client.auth.signOut();
    });
    document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => setTab(button.dataset.tab)));

    if (!client) {
      message('Live service is not configured yet. Add your project URL and public client key to config.js, then apply the database setup instructions.');
      return;
    }
    client.auth.onAuthStateChange((_event, session) => {
      if (session) setTimeout(() => hydrateSession(session), 0);
      else {
        state.session = null;
        state.profile = null;
        $('#portal-screen').classList.add('hidden');
        $('#auth-screen').classList.remove('hidden');
        message('');
      }
    });
    const { data, error } = await client.auth.getSession();
    if (error) return message(error.message);
    if (data.session) await hydrateSession(data.session);
  }

  document.addEventListener('DOMContentLoaded', start);
})();
