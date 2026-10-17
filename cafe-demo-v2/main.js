// Entry point. Each module wires up its own part of the page.
import { startUp, initHero } from './js/hero.js';
import './js/motion.js';
import './js/ui.js';
import './js/cart.js';
import './js/search.js';
import './js/chat.js';
import './js/sound.js';
import './js/forms.js';

// The intro finishes first; only then does the heavy 3D scene start (so it can never delay the intro).
startUp().then(initHero, initHero);
