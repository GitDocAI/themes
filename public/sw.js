//service worker for intercept /assets requests
let initializedBackendUrl = undefined
let initializedAccessToken = undefined

let backendUrl = new Promise(async (then,err)=>{
  const error_timeout = setTimeout(()=>err(),5000)
  //wait for value to be setted
  while(!initializedBackendUrl){
    await (new Promise((th)=>setTimeout(()=>th(),10)))
  }
  clearTimeout(error_timeout)
  //if there's value just return it
  then(initializedBackendUrl)
});
let accessToken = new Promise(async(then,err)=>{
  const error_timeout = setTimeout(()=>err(),5000)
  while(!initializedAccessToken){
    await new Promise((th)=>setTimeout(()=>th(),10))
  }
  clearTimeout(error_timeout)
  then(initializedAccessToken)
});

self.addEventListener('install', (event) => {
  const params = new URL(self.location).searchParams;
  initializedBackendUrl=params.get('baseURL')
  initializedAccessToken=params.get('token') || ''
  self.skipWaiting()
});

self.addEventListener('activate', (event) => {
  self.clients.claim()
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
  console.log('waiting for backend url')
  try{
    const backUr = await backendUrl
    const makeRequest = (token) => fetch(`${backUr}/content/api/v1/filesystem/download`, {
      method: 'POST',
      headers: {
        'Accept': 'application/octet-stream',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path })
    });

    let response = await makeRequest(await accessToken);


    if (!response.ok) {
        return response;
    }

    const blob = await response.blob();
    const mimeType = getMimeType(path)
    const newResponse = new Response(blob, {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000' //caching
      }
    });

    return newResponse;
  }catch(err){
    const newResponse = new Response("waittime for backend url expired", {
      status: 500,
      statusText: 'Timeout',
    });

    return newResponse;
  }
}


function getMimeType(path) {
  const cleanPath = path.split('?')[0];
  const ext = cleanPath.split('.').pop()?.toLowerCase();

  const mimeTypes = {
    // --- Images ---
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'ico': 'image/x-icon',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',
    'tif': 'image/tiff',
    'avif': 'image/avif',

    // --- WEB / Code / Text ---
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'md': 'text/markdown',
    'map': 'application/json', // Source maps

    // --- DOCUMENTS (PDF & OFFICE) ---
    'pdf': 'application/pdf',
    // Word
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Excel
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Powerpoint
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'odp': 'application/vnd.oasis.opendocument.presentation',
    'odt': 'application/vnd.oasis.opendocument.text',
    'ods': 'application/vnd.oasis.opendocument.spreadsheet',

    // --- AUDIO / VIDEO ---
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',

    // --- Fonts ---
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'otf': 'font/otf',
    'eot': 'application/vnd.ms-fontobject',

    // --- Compressed files ---
    'zip': 'application/zip',
    'rar': 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
    'tar': 'application/x-tar',
    'gz': 'application/gzip'
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}
