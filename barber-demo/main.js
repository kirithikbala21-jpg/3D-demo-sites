// Entry point. Each module wires up its own part of the page.
import { startUp, initHero } from './js/hero.js';
import './js/ui.js';
import './js/cart.js';
import './js/search.js';
import './js/chat.js';
import './js/sound.js';
import './js/forms.js';
import './js/smooth.js';

// The 3D scene starts only after the short intro, so the intro is never held up by 3D work.
startUp().catch(() => {}).then(initHero);
