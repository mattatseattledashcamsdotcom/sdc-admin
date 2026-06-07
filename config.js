// Central config — update WORKER_URL if it ever changes
export const WORKER_URL = 'https://sdc-worker.solitary-truth-a9af.workers.dev';

// Admin secret is entered at login and stored in localStorage
export function getSecret() {
  return localStorage.getItem('sdc_admin_secret') || '';
}

export function setSecret(s) {
  localStorage.setItem('sdc_admin_secret', s);
}

export async function api(path, options = {}) {
  const res = await fetch(`${WORKER_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getSecret()}`,
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('sdc_admin_secret');
    location.href = '/sdc-admin/login.html';
    throw new Error('Unauthorized');
  }
  return res;
}
