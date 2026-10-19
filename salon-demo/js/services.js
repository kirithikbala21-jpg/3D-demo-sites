// Services tabs with deep links: #services-colour, #services-cut, #services-treatments, #services-beauty.
import { $ } from './util.js';
import { initTabs } from './tabs.js';

const root = $('[data-tabs="services"]');
if (root) {
  const t = initTabs(root, (i, panel, user) => { if (!user) return; try { history.replaceState(null, '', '#' + t.tabs[i].id); } catch (e) { /* ignore */ } });
  const fromHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const i = t.tabs.findIndex((x) => x.id === id);
    if (i >= 0) { t.select(i, false); }
  };
  fromHash();
  window.addEventListener('hashchange', fromHash);
}
