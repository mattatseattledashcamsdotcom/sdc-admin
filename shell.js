// Shared sidebar + auth guard — imported by every admin page
import { getSecret } from './config.js';

export function requireAuth() {
  if (!getSecret()) {
    location.href = './login.html';
    return false;
  }
  return true;
}

export function renderShell({ active }) {
  const nav = [
    { id: 'appointments', label: 'Appointments', href: 'appointments.html', icon: `<rect x="2" y="3" width="12" height="12" rx="2"/><path d="M5 1v4M11 1v4M2 8h12"/>` },
    { id: 'zip-lookup', label: 'ZIP Lookup', href: 'zip-lookup.html', icon: `<circle cx="8" cy="7" r="4"/><path d="M8 11v4M5 14h6"/><path d="M5 7h6"/>` },
    { id: 'configurator', label: 'Product Configurator', href: 'configurator.html', icon: `<path d="M2 4h12M2 8h8M2 12h10"/><circle cx="13" cy="12" r="2.5"/><path d="M13 10.5v1l.7.7"/>` },
    { id: 'finder', label: 'Finder / Quiz', href: 'finder.html', icon: `<circle cx="7" cy="7" r="5"/><path d="M10.5 10.5l3.5 3.5"/><path d="M5 7h4M7 5v4"/>` },
    { id: 'schedule', label: 'Schedule Editor', href: 'schedule.html', icon: `<circle cx="8" cy="8" r="6"/><path d="M8 4.5v3.5l2.5 2"/>` },
    { id: 'reminders', label: 'Reminders', href: 'reminders.html', icon: `<path d="M13 3l-1.5 5H10L8.5 13 6 7H4.5L3 3"/>` },
    { id: 'followups', label: 'Follow-ups', href: 'followups.html', icon: `<path d="M2 11l4-4 3 3 5-6"/>` },
  ];

  const sections = {
    'Bookings': ['appointments', 'zip-lookup'],
    'Catalog': ['configurator', 'finder'],
    'Scheduling': ['schedule'],
    'Automation': ['reminders', 'followups'],
  };

  let sidebarHtml = '';
  for (const [section, ids] of Object.entries(sections)) {
    sidebarHtml += `<div class="nav-section">${section}</div>`;
    for (const id of ids) {
      const item = nav.find(n => n.id === id);
      sidebarHtml += `
        <a class="nav-item ${active === id ? 'active' : ''}" href="${item.href}">
          <svg class="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">${item.icon}</svg>
          ${item.label}
        </a>`;
    }
  }

  document.body.insertAdjacentHTML('afterbegin', `
    <div class="sidebar-overlay" id="sidebar-overlay" onclick="closeSidebar()"></div>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <span>SDC Admin</span>
        <small>Seattle Dash Cams</small>
      </div>
      <nav class="sidebar-nav">${sidebarHtml}</nav>
      <div class="sidebar-footer">
        <a href="#" onclick="logout()" style="color:#484f58;text-decoration:none;font-size:0.72rem">Sign out</a>
      </div>
    </aside>
  `);

  // Inject hamburger into topbar after it renders
  requestAnimationFrame(() => {
    const topbar = document.querySelector('.topbar');
    if (topbar) {
      const ham = document.createElement('button');
      ham.className = 'ham-btn';
      ham.setAttribute('aria-label', 'Menu');
      ham.innerHTML = `<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 4h12M2 8h12M2 12h12"/></svg>`;
      ham.onclick = () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-overlay').classList.toggle('open'); };
      topbar.insertBefore(ham, topbar.firstChild);
    }
  });
}

window.closeSidebar = function() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');
};

window.logout = function() {
  localStorage.removeItem('sdc_admin_secret');
  location.href = './login.html';
};
