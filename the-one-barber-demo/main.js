// Entry point. Each module wires up its own part of the page.
import { startUp, initHero } from './js/hero.js';
import './js/ui.js';
import './js/notice.js';
import './js/i18n.js';
import './js/forms.js';
import './js/manage.js';
import './js/growth.js';
import './js/smooth.js';

// The 3D scene starts only after the short intro, so the intro is never held up by 3D work.
startUp().catch(() => {}).then(() => setTimeout(initHero, 650)); // after the intro has fully faded out
