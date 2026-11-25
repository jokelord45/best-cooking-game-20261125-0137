// Keyboard and mouse input: WASD/arrows to walk, E or Space to interact (hold to chop),
// click to walk somewhere, P or Escape to pause, M to mute. The canvas scales to the window,
// so mouse coordinates are mapped back into the game's 1280x800 view.
import { VIEW_HEIGHT, VIEW_WIDTH } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;

export function createInput(canvas) {
  const keys = new Set();
  let interactHeld = false;
  let interactPressed = false;
  let queuedActions = 0;
  let clickTarget = null;
  let clickStation = null;

  function toGameCoords(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / VIEW_WIDTH, rect.height / VIEW_HEIGHT);
    const offsetX = (rect.width - VIEW_WIDTH * scale) / 2;
    const offsetY = (rect.height - VIEW_HEIGHT * scale) / 2;
    return {
      x: (event.clientX - rect.left - offsetX) / scale,
      y: (event.clientY - rect.top - offsetY) / scale,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) {
      if (event.code === 'KeyE' || event.code === 'Space') interactHeld = true;
      return;
    }
    keys.add(event.code);
    if (event.code === 'KeyE' || event.code === 'Space') {
      interactHeld = true;
      interactPressed = true;
      queuedActions |= ACTION_CONFIRM;
      event.preventDefault();
    }
    if (event.code === 'KeyP' || event.code === 'Escape') queuedActions |= ACTION_PAUSE;
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown' || event.code === 'ArrowLeft' || event.code === 'ArrowRight' || event.code === 'Space') {
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
    if (event.code === 'KeyE' || event.code === 'Space') interactHeld = false;
  });
  window.addEventListener('blur', () => {
    keys.clear();
    interactHeld = false;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const p = toGameCoords(event);
    clickTarget = p;
    clickStation = null;
    queuedActions |= ACTION_CONFIRM;
  });

  return {
    /** Normalised walk direction from held keys, or toward the last click target. */
    direction(chefX, chefY) {
      let dx = 0;
      let dy = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;
      if (dx !== 0 || dy !== 0) {
        clickTarget = null;
        const len = Math.hypot(dx, dy);
        return { x: dx / len, y: dy / len };
      }
      if (clickTarget) {
        const tx = clickTarget.x - chefX;
        const ty = clickTarget.y - chefY;
        const dist = Math.hypot(tx, ty);
        if (dist < 6) {
          clickTarget = null;
          return { x: 0, y: 0 };
        }
        return { x: tx / dist, y: ty / dist };
      }
      return { x: 0, y: 0 };
    },
    interactHeld() { return interactHeld; },
    /** True once per E/Space press (edge), consumed by the caller. */
    interactPressed() {
      const v = interactPressed;
      interactPressed = false;
      return v;
    },
    takeActions() {
      const v = queuedActions;
      queuedActions = 0;
      return v;
    },
    /** The station id the player clicked on, if the click landed on one. */
    takeClickStation(stations) {
      if (!clickTarget) return null;
      for (const s of stations) {
        if (clickTarget.x >= s.x && clickTarget.x <= s.x + s.w && clickTarget.y >= s.y && clickTarget.y <= s.y + s.h) {
          const id = s.id;
          clickTarget = { x: s.x + s.w / 2, y: s.y + s.h + 40 };
          return id;
        }
      }
      return null;
    },
    clearClickTarget() { clickTarget = null; },
  };
}
