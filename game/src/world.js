// The kitchen simulation: the chef, what is in their hands, what sits on the board, the stove
// and the plates, the order board, the shift clock, coins and combos. Pure logic, no drawing:
// the renderer reads this state and paints it. Events are a bitmask the loop reads each step.
import {
  CHEF_RADIUS, CHEF_SPEED, FLOOR, INGREDIENTS, INTERACT_RANGE, MAX_ORDERS,
  RECIPES, RECIPE_KEYS, SHIFT_SECONDS, STATIONS, difficultyAt,
} from './config.js';

export const EVENT_SERVE = 1;
export const EVENT_EXPIRE = 2;
export const EVENT_OVER = 4;
export const EVENT_CHOP = 8;
export const EVENT_COOKED = 16;
export const EVENT_BURNT = 32;
export const EVENT_ERROR = 64;
export const EVENT_PICKUP = 128;
export const EVENT_PLACE = 256;

let nextOrderId = 1;

function makeItem(kind) {
  const def = INGREDIENTS[kind];
  return { kind, prep: def.prep === 'ready' ? 'ready' : 'raw' };
}

function itemKey(item) {
  return item.prep === 'ready' ? item.kind : `${item.kind}:${item.prep}`;
}

/** The exact plate contents a recipe needs, as item keys. */
export function recipeKeys(recipeKey) {
  return RECIPES[recipeKey].needs.slice();
}

/** Does the plate's items exactly match the recipe (same multiset of item keys)? */
export function plateMatchesRecipe(plateItems, recipeKey) {
  const want = recipeKeys(recipeKey).slice().sort();
  const got = plateItems.map(itemKey).sort();
  if (want.length !== got.length) return false;
  for (let i = 0; i < want.length; i += 1) if (want[i] !== got[i]) return false;
  return true;
}

/** The recipe a finished plate matches, or null. */
export function recipeForPlate(plateItems) {
  for (const key of RECIPE_KEYS) {
    if (plateMatchesRecipe(plateItems, key)) return key;
  }
  return null;
}

export function createWorld(random) {
  const state = {
    chef: { x: 640, y: 520, dir: 1, walk: 0, carrying: null },
    board: { item: null, progress: 0 },
    burners: [{ item: null, t: 0 }, { item: null, t: 0 }],
    plates: [{ items: [] }, { items: [] }],
    orders: [],
    orderTimer: 4,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    coins: 0,
    served: 0,
    expired: 0,
    stars: 3,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    popups: [],
    message: '',
    messageTimer: 0,
    over: false,
    overReason: '',
  };

  function popup(x, y, text, color) {
    state.popups.push({ x, y, text, color, t: 0 });
  }

  function spawnOrder() {
    if (state.orders.length >= MAX_ORDERS) return;
    const diff = difficultyAt(state.elapsed);
    const recipeKey = random.pick(RECIPE_KEYS);
    state.orders.push({
      id: nextOrderId,
      recipe: recipeKey,
      patience: diff.patience,
      maxPatience: diff.patience,
    });
    nextOrderId += 1;
  }

  function nearestStation() {
    const c = state.chef;
    let best = null;
    let bestDist = Infinity;
    for (const s of STATIONS) {
      const cx = Math.max(s.x, Math.min(c.x, s.x + s.w));
      const cy = Math.max(s.y, Math.min(c.y, s.y + s.h));
      const d = Math.hypot(c.x - cx, c.y - cy);
      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    }
    return bestDist <= INTERACT_RANGE ? best : null;
  }

  function setMessage(text, seconds = 1.6) {
    state.message = text;
    state.messageTimer = seconds;
  }

  /** One interaction press (E / click on a station) at the nearest station. */
  function interactPress() {
    const station = nearestStation();
    if (!station) return 0;
    const chef = state.chef;
    switch (station.kind) {
      case 'bin': {
        if (chef.carrying) { setMessage('Hands full!'); return EVENT_ERROR; }
        chef.carrying = makeItem(station.ingredient);
        return EVENT_PICKUP;
      }
      case 'board': {
        if (state.board.item === null) {
          if (!chef.carrying) return 0;
          const def = INGREDIENTS[chef.carrying.kind];
          if (def.prep !== 'chop' || chef.carrying.prep !== 'raw') {
            setMessage('Only raw lettuce or tomato go on the board');
            return EVENT_ERROR;
          }
          state.board.item = chef.carrying;
          state.board.progress = 0;
          chef.carrying = null;
          return EVENT_PLACE;
        }
        if (state.board.item.prep === 'chopped' && !chef.carrying) {
          chef.carrying = state.board.item;
          state.board.item = null;
          state.board.progress = 0;
          return EVENT_PICKUP;
        }
        return 0;
      }
      case 'stove': {
        const burner = state.burners[station.burner];
        if (burner.item === null) {
          if (!chef.carrying) return 0;
          const def = INGREDIENTS[chef.carrying.kind];
          if ((def.prep !== 'fry' && def.prep !== 'boil') || chef.carrying.prep !== 'raw') {
            setMessage('Only raw patty or noodles go on the stove');
            return EVENT_ERROR;
          }
          burner.item = chef.carrying;
          burner.t = 0;
          chef.carrying = null;
          return EVENT_PLACE;
        }
        if ((burner.item.prep === 'cooked' || burner.item.prep === 'burnt') && !chef.carrying) {
          chef.carrying = burner.item;
          burner.item = null;
          burner.t = 0;
          return EVENT_PICKUP;
        }
        setMessage('Still cooking…');
        return 0;
      }
      case 'plate': {
        const plate = state.plates[station.plate];
        if (chef.carrying && chef.carrying.kind === 'dish') {
          setMessage('Serve that dish at the window, not on a plate');
          return EVENT_ERROR;
        }
        if (chef.carrying) {
          const key = itemKey(chef.carrying);
          if (plate.items.some((i) => itemKey(i) === key)) {
            setMessage('That is already on the plate');
            return EVENT_ERROR;
          }
          if (plate.items.length >= 4) {
            setMessage('Plate is full');
            return EVENT_ERROR;
          }
          plate.items.push(chef.carrying);
          chef.carrying = null;
          const match = recipeForPlate(plate.items);
          if (match) setMessage(`${RECIPES[match].name} is ready — pick it up!`, 2);
          return EVENT_PLACE;
        }
        if (plate.items.length > 0) {
          const match = recipeForPlate(plate.items);
          if (!match) {
            setMessage('That plate does not match any order yet');
            return EVENT_ERROR;
          }
          chef.carrying = { kind: 'dish', prep: 'ready', recipe: match, items: plate.items };
          plate.items = [];
          return EVENT_PICKUP;
        }
        return 0;
      }
      case 'serve': {
        if (!chef.carrying || chef.carrying.kind !== 'dish') {
          setMessage('Bring a finished dish to the window');
          return EVENT_ERROR;
        }
        const idx = state.orders.findIndex((o) => o.recipe === chef.carrying.recipe);
        if (idx === -1) {
          setMessage('Nobody ordered that dish!');
          return EVENT_ERROR;
        }
        const order = state.orders[idx];
        state.orders.splice(idx, 1);
        const recipe = RECIPES[order.recipe];
        const tip = Math.round(15 * (order.patience / order.maxPatience));
        const comboMult = 1 + Math.min(state.combo, 4) * 0.25;
        const earned = Math.round((recipe.price + tip) * comboMult);
        state.coins += earned;
        state.served += 1;
        state.combo += 1;
        state.comboTimer = 8;
        state.bestCombo = Math.max(state.bestCombo, state.combo);
        popup(1166, 190, `+${earned} coins`, '#ffd94a');
        if (state.combo >= 2) popup(1166, 220, `COMBO x${state.combo}!`, '#ff9d5c');
        chef.carrying = null;
        return EVENT_SERVE;
      }
      case 'trash': {
        if (!chef.carrying) return 0;
        chef.carrying = null;
        return EVENT_PLACE;
      }
      default:
        return 0;
    }
  }

  /** Held interact (E held down): chops on the board while the chef stands by it. */
  function interactHeld(dt) {
    const station = nearestStation();
    if (!station || station.kind !== 'board') return 0;
    const item = state.board.item;
    if (!item || item.prep !== 'raw') return 0;
    const def = INGREDIENTS[item.kind];
    state.board.progress += dt / def.chopTime;
    if (state.board.progress >= 1) {
      item.prep = 'chopped';
      state.board.progress = 0;
      return EVENT_CHOP;
    }
    return 0;
  }

  function step(dt, move, interactPressed, held) {
    if (state.over) return EVENT_OVER;
    let events = 0;
    state.elapsed += dt;
    state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }
    if (state.messageTimer > 0) state.messageTimer -= dt;
    for (const p of state.popups) p.t += dt;
    state.popups = state.popups.filter((p) => p.t < 1.4);

    // Walk the chef, clamped to the floor (the counter row is solid).
    const chef = state.chef;
    if (move.x !== 0 || move.y !== 0) {
      chef.x = Math.max(FLOOR.x + CHEF_RADIUS, Math.min(FLOOR.x + FLOOR.width - CHEF_RADIUS, chef.x + move.x * CHEF_SPEED * dt));
      chef.y = Math.max(FLOOR.y + CHEF_RADIUS, Math.min(FLOOR.y + FLOOR.height - CHEF_RADIUS, chef.y + move.y * CHEF_SPEED * dt));
      chef.dir = move.x < 0 ? -1 : move.x > 0 ? 1 : chef.dir;
      chef.walk += dt;
    }

    if (interactPressed) events |= interactPress();
    if (held) events |= interactHeld(dt);

    // The stove keeps cooking: ready, then burnt if forgotten.
    for (const burner of state.burners) {
      if (!burner.item) continue;
      const def = INGREDIENTS[burner.item.kind];
      burner.t += dt;
      if (burner.item.prep === 'raw' && burner.t >= def.cookTime) {
        burner.item.prep = 'cooked';
        events |= EVENT_COOKED;
      } else if (burner.item.prep === 'cooked' && burner.t >= def.burnTime) {
        burner.item.prep = 'burnt';
        setMessage('Something burnt on the stove!');
        events |= EVENT_BURNT;
      }
    }

    // Orders arrive faster as the shift goes on; patience runs down.
    const diff = difficultyAt(state.elapsed);
    state.orderTimer -= dt;
    if (state.orderTimer <= 0) {
      spawnOrder();
      state.orderTimer = diff.orderEvery;
    }
    for (let i = state.orders.length - 1; i >= 0; i -= 1) {
      const order = state.orders[i];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(i, 1);
        state.expired += 1;
        state.stars -= 1;
        state.combo = 0;
        popup(640, 120, 'Order expired!', '#ff6b5e');
        events |= EVENT_EXPIRE;
        if (state.stars <= 0) {
          state.over = true;
          state.overReason = 'The customers walked out — too many orders expired.';
          events |= EVENT_OVER;
        }
      }
    }

    if (state.timeLeft <= 0 && !state.over) {
      state.over = true;
      state.overReason = 'Shift over! The kitchen closes.';
      events |= EVENT_OVER;
    }
    return events;
  }

  function reset() {
    nextOrderId = 1;
    state.chef = { x: 640, y: 520, dir: 1, walk: 0, carrying: null };
    state.board = { item: null, progress: 0 };
    state.burners = [{ item: null, t: 0 }, { item: null, t: 0 }];
    state.plates = [{ items: [] }, { items: [] }];
    state.orders = [];
    state.orderTimer = 4;
    state.timeLeft = SHIFT_SECONDS;
    state.elapsed = 0;
    state.coins = 0;
    state.served = 0;
    state.expired = 0;
    state.stars = 3;
    state.combo = 0;
    state.comboTimer = 0;
    state.bestCombo = 0;
    state.popups = [];
    state.message = '';
    state.messageTimer = 0;
    state.over = false;
    state.overReason = '';
  }

  return { state, step, reset, spawnOrder, nearestStation };
}
