const STORAGE_KEY = 'dvas-portal-user';
const PROJECT_KEY = 'dvas-projects';

const DEMO_PROJECTS = [
  { client: 'Aster Labs', type: 'Brand Identity & Vector Layout', budget: '$24,000', timeline: '4 weeks', status: 'review', scope: 'Identity refresh and product launch toolkit.' },
  { client: 'Vector Horizon', type: 'Cybersecurity Diagram & Infographics', budget: '$18,500', timeline: '3 weeks', status: 'safe', scope: 'Threat model diagrams and SaaS security narrative.' },
  { client: 'Northstar Media', type: 'AI Video Rendering & Motion Assets', budget: '$32,000', timeline: '5 weeks', status: 'review', scope: 'Campaign visual storyboards and short-form motion kit.' }
];

const state = {
  user: null,
  activeTab: 'overview'
};

function getSavedProjects() {
  const raw = localStorage.getItem(PROJECT_KEY);
  if (!raw) {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(DEMO_PROJECTS));
    return DEMO_PROJECTS;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : DEMO_PROJECTS;
  } catch (error) {
    return DEMO_PROJECTS;
  }
}

function setActiveTab(tabName) {
  state.activeTab = tabName;

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });

  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === tabName);
  });
}

function renderProjects() {
  const list = document.getElementById('project-list');
  const projects = getSavedProjects();

  list.innerHTML = projects
    .map(
      (project) => `
        <article class="project-item">
          <h4>${project.client}</h4>
          <div class="project-meta">
            <span>${project.type}</span>
            <span>•</span>
            <span>${project.budget}</span>
            <span>•</span>
            <span>${project.timeline}</span>
          </div>
          <p>${project.scope}</p>
          <div class="project-status ${project.status === 'safe' ? 'safe' : 'review'}">
            ${project.status === 'safe' ? 'Security Verified' : 'Under Review'}
          </div>
        </article>
      `
    )
    .join('');
}

function loginUser(email) {
  state.user = email;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ email }));
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('portal-screen').classList.remove('hidden');
  document.getElementById('role-switcher').value = 'admin';
  setActiveTab('overview');
}

function logoutUser() {
  localStorage.removeItem(STORAGE_KEY);
  state.user = null;
  document.getElementById('portal-screen').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('login-form').reset();
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    alert('Please enter both email and password.');
    return;
  }

  loginUser(email);
}

function handleDemoLogin() {
  loginUser('admin@dvas.studio');
}

function handleProjectSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);

  const newProject = {
    client: (form.get('client') || '').toString().trim(),
    type: (form.get('type') || '').toString().trim(),
    budget: (form.get('budget') || '').toString().trim(),
    timeline: (form.get('timeline') || '').toString().trim(),
    scope: (form.get('scope') || '').toString().trim() || 'Scope details pending confirmation.',
    status: 'review'
  };

  if (!newProject.client || !newProject.budget || !newProject.timeline) {
    alert('Please complete required project details.');
    return;
  }

  const projects = getSavedProjects();
  projects.unshift(newProject);
  localStorage.setItem(PROJECT_KEY, JSON.stringify(projects));
  event.currentTarget.reset();
  renderProjects();
  setActiveTab('clients');
}

function handleBobQuery() {
  const value = document.getElementById('bob-query').value.trim();
  const output = document.getElementById('bob-response');

  if (!value) {
    output.textContent = 'IBM Bob: Please provide a question about revenue, risk, delivery, or security.';
    return;
  }

  const lower = value.toLowerCase();

  let response = 'IBM Bob: Revenue remains healthy and the pipeline is operating within target security thresholds.';

  if (lower.includes('risk') || lower.includes('security')) {
    response = 'IBM Bob: Security coverage is at 98/100, with zero critical findings and active MFA enforcement across the portfolio.';
  }

  if (lower.includes('revenue') || lower.includes('growth') || lower.includes('profit')) {
    response = 'IBM Bob: Revenue run rate is tracking at $1.42M with a 34.5% QoQ increase and improving project velocity.';
  }

  if (lower.includes('delivery') || lower.includes('timeline') || lower.includes('sla')) {
    response = 'IBM Bob: Delivery performance is currently at 92% SLA compliance, with backlog risk contained and all critical projects assigned.';
  }

  if (lower.includes('brand') || lower.includes('design')) {
    response = 'IBM Bob: Brand and design outputs remain within scope and quality thresholds, with asset delivery pacing ahead of schedule.';
  }

  output.textContent = response;
}

function bindEvents() {
  document.getElementById('login-form').addEventListener('submit', handleLoginSubmit);
  document.getElementById('demo-login-btn').addEventListener('click', handleDemoLogin);
  document.getElementById('logout-btn').addEventListener('click', logoutUser);
  document.getElementById('project-form').addEventListener('submit', handleProjectSubmit);
  document.getElementById('bob-submit').addEventListener('click', handleBobQuery);
  document.getElementById('bob-query').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') handleBobQuery();
  });

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => setActiveTab(tab.dataset.tab));
  });

  document.getElementById('role-switcher').addEventListener('change', (event) => {
    const value = event.target.value;
    if (value === 'client') setActiveTab('clients');
    if (value === 'investor') setActiveTab('investors');
    if (value === 'admin') setActiveTab('admin');
  });
}

function hydrateSession() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.email) {
        loginUser(parsed.email);
        return;
      }
    } catch (error) {
      console.warn('Unable to restore saved auth state', error);
    }
  }

  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('portal-screen').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  renderProjects();
  hydrateSession();
});













































































































































































































" , 