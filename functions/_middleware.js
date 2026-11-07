// One Cloudflare Pages project serves the six demo sites. Each demo has its own address;
// this maps the address (the host name) to the demo's folder inside dist/.
const SITES = {
  'barberdemo.kbventures.com.au': 'barber-demo',
  'cafedemo.kbventures.com.au': 'cafe-demo-v2',
  'gymdemo.kbventures.com.au': 'gym-demo',
  'plumberdemo.kbventures.com.au': 'plumber-demo',
  'salondemo.kbventures.com.au': 'salon-demo',
  'partsdemo.kbventures.com.au': 'parts-store-demo',
};

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  const folder = SITES[url.hostname];
  if (!folder) return next();
  const inner = new URL(url);
  inner.pathname = '/' + folder + url.pathname;
  const res = await env.ASSETS.fetch(new Request(inner, request));
  // Pages redirects /x.html to /x; keep the folder name out of the address bar
  const loc = res.headers.get('Location');
  if (loc && res.status >= 300 && res.status < 400) {
    const to = new URL(loc, inner);
    if (to.pathname.startsWith('/' + folder + '/')) to.pathname = to.pathname.slice(folder.length + 1);
    to.protocol = url.protocol; to.host = url.host;
    const h = new Headers(res.headers); h.set('Location', to.toString());
    return new Response(null, { status: res.status, headers: h });
  }
  return res;
}
