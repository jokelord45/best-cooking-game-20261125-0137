// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s steps
// (several in a slow frame, none in a fast one), and the renderer paints what is there. The game
// moves between four screens: title, play, paused and shift over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|end (with &seed=N) stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, STATIONS, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_BURNT, EVENT_CHOP, EVENT_COOKED, EVENT_ERROR, EVENT_EXPIRE, EVENT_OVER, EVENT_PICKUP, EVENT_PLACE, EVENT_SERVE } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { sfx } from './audio.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, 1.2, world.nearestStation());
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and big events.
  function announce(message) {
    status.textContent = message;
  }

  function playEventSound(events) {
    if (events & EVENT_SERVE) sfx.serve();
    else if (events & EVENT_EXPIRE) sfx.expire();
    else if (events & EVENT_CHOP) sfx.chopDone();
    else if (events & EVENT_COOKED) sfx.cooked();
    else if (events & EVENT_BURNT) sfx.burnt();
    else if (events & EVENT_ERROR) sfx.error();
    else if (events & EVENT_PICKUP) sfx.pickup();
    else if (events & EVENT_PLACE) sfx.place();
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    sfx.start();
    announce('Shift started. Take the orders on the board.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.coins > best) {
      best = world.state.coins;
      saveBest(best);
    }
    sfx.gameOver();
    announce(`Shift over. ${world.state.coins} coins, ${world.state.served} dishes served. Best ${best}.`);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      sfx.unlock();
      startGame();
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
    if (screen === SCREEN_PLAY) {
      // A click on a station walks the chef to its front; a click on the floor walks there.
      input.takeClickStation(STATIONS);
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      // The kitchen idles behind the title: a patty sizzles, orders wait.
      return;
    }
    const pressed = input.interactPressed();
    const events = world.step(STEP, input.direction(world.state.chef.x, world.state.chef.y), pressed, input.interactHeld());
    playEventSound(events);
    if (events & EVENT_SERVE) announce(`Served! ${world.state.coins} coins.`);
    else if (events & EVENT_EXPIRE) announce(`An order expired. ${world.state.stars} stars left.`);
    if (events & EVENT_OVER) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, now / 1000, world.nearestStation());
  }

  // Leaving the tab pauses a running game rather than letting orders expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });
  window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyM') {
      const muted = sfx.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
  });

  announce('Sizzle and Serve, Rasa Kitchen. Press Space or click to start the shift.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
