// The screenshot scenes behind ?shot=start|play|end. Each one sets up the real world state
// (orders on the board, food on the board, stove and plates) and steps it a little, so the
// frame is what a real shift looks like and the same seed always gives the same frame.
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function seedOrder(world, recipe, patience, maxPatience) {
  world.state.orders.push({ id: 900 + world.state.orders.length, recipe, patience, maxPatience });
}

/** Set `world` to the named scene and return the screen to draw over it and the best to show. */
export function stageShot(name, world) {
  world.reset();
  const s = world.state;
  if (name === 'end') {
    s.coins = 342;
    s.served = 14;
    s.expired = 2;
    s.bestCombo = 3;
    s.stars = 1;
    s.timeLeft = 0;
    s.elapsed = 150;
    s.over = true;
    s.overReason = 'Shift over! The kitchen closes.';
    seedOrder(world, 'burger', 12, 40);
    return { screen: SCREEN_OVER, best: 342 };
  }
  if (name === 'serve') {
    // The serve moment: the chef carries a finished Rasa Burger to the window,
    // the matching order still on the board, a fresh salad waiting on a plate.
    seedOrder(world, 'burger', 18, 40);
    seedOrder(world, 'cheeseBurger', 34, 44);
    s.plates[0].items = [
      { kind: 'lettuce', prep: 'chopped' },
      { kind: 'tomato', prep: 'chopped' },
      { kind: 'cheese', prep: 'ready' },
    ];
    s.burners[1].item = { kind: 'noodle', prep: 'raw' };
    s.burners[1].t = 4.2;
    s.chef.x = 1120;
    s.chef.y = 300;
    s.chef.dir = 1;
    s.chef.carrying = { kind: 'dish', prep: 'ready', recipe: 'burger', items: [] };
    s.coins = 214;
    s.served = 8;
    s.combo = 3;
    s.comboTimer = 6;
    s.timeLeft = 61;
    s.elapsed = 89;
    s.message = 'Burger ready — serve it at the window!';
    s.messageTimer = 3;
    return { screen: SCREEN_PLAY, best: 210 };
  }
  if (name === 'play') {
    // A busy mid-shift moment: two orders waiting, a burger one ingredient short,
    // a salad finished and glowing on the second plate, a patty frying, chopped
    // tomato on the board, and the chef carrying a tomato to finish the burger.
    seedOrder(world, 'burger', 22, 40);
    seedOrder(world, 'noodles', 31, 44);
    seedOrder(world, 'salad', 38, 46);
    s.plates[0].items = [
      { kind: 'bun', prep: 'ready' },
      { kind: 'patty', prep: 'cooked' },
      { kind: 'lettuce', prep: 'chopped' },
    ];
    s.plates[1].items = [
      { kind: 'lettuce', prep: 'chopped' },
      { kind: 'tomato', prep: 'chopped' },
      { kind: 'cheese', prep: 'ready' },
    ];
    s.burners[0].item = { kind: 'patty', prep: 'raw' };
    s.burners[0].t = 2.6;
    s.burners[1].item = { kind: 'noodle', prep: 'raw' };
    s.burners[1].t = 3.4;
    s.board.item = { kind: 'tomato', prep: 'raw' };
    s.board.progress = 0.55;
    s.chef.x = 660;
    s.chef.y = 300;
    s.chef.carrying = { kind: 'tomato', prep: 'chopped' };
    s.coins = 128;
    s.served = 5;
    s.combo = 2;
    s.comboTimer = 5;
    s.timeLeft = 96;
    s.elapsed = 54;
    s.message = 'Rasa Burger is one tomato away — chop it!';
    s.messageTimer = 3;
    return { screen: SCREEN_PLAY, best: 210 };
  }
  // start: the title screen over a kitchen already set for the first orders.
  seedOrder(world, 'burger', 40, 40);
  seedOrder(world, 'salad', 46, 46);
  s.burners[0].item = { kind: 'patty', prep: 'raw' };
  s.burners[0].t = 1.2;
  s.plates[0].items = [{ kind: 'bun', prep: 'ready' }];
  s.board.item = { kind: 'lettuce', prep: 'raw' };
  s.chef.x = 640;
  s.chef.y = 520;
  s.coins = 0;
  s.timeLeft = 150;
  return { screen: SCREEN_TITLE, best: 210 };
}
