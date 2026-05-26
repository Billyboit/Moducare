// Minimal API client wrapper (fetch-based)
export async function request(path, opts = {}){
  const url = path.startsWith('http') ? path : path;
  const headers = Object.assign({ 'Accept':'application/json' }, opts.headers || {});
  const res = await fetch(url, Object.assign({}, opts, { headers }));
  if (!res.ok) {
    const text = await res.text().catch(()=>null);
    const err = new Error(res.statusText || 'Network error');
    err.status = res.status;
    err.body = text;
    throw err;
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}
