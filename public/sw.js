//service worker for intercept /assets requests
let backendUrl = '';
let accessToken = '';

self.addEventListener('install', (event) => {
  const params = new URL(self.location).searchParams;
  backendUrl = params.get('baseURL');
});

self.addEventListener('message', (event) => {
  if (event.data.type === 'SET_TOKEN') {
    accessToken = event.data.token;
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(fetchWithAuth(event.request));
  }
});

async function fetchWithAuth(request) {
  const path = new URL(request.url).pathname;
  const makeRequest = (token) => fetch(`${backendUrl}/content/api/v1/filesystem/download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ path })
  });

  let response = await makeRequest(accessToken);

  return response;
}
