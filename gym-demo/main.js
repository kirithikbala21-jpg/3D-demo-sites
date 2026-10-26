// Entry point. Each module wires up its own part of the page.
import { startUp, initHero, initParallax } from './js/hero.js';
import './js/ui.js';
import './js/notice.js';
import './js/search.js';
import './js/forms.js';
import './js/classes.js';
import './js/plans.js';
import './js/trial.js';
import './js/growth.js';
import './js/reviews.js';
import './js/smooth.js';

initParallax();

// The 3D scene starts only after the short intro, so the intro is never held up by 3D work.
startUp().catch(() => {}).then(() => setTimeout(initHero, 650)); // after the intro has fully faded out
