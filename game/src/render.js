// Everything the player sees: the kitchen, the chef, the food and the order board,
// painted on one canvas in the game's 1280x800 view. All art is drawn shapes, no images.
import { FLOOR, INGREDIENTS, RECIPES, SHIFT_SECONDS, STATIONS, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { recipeForPlate } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const TILE = 64;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Trebuchet MS, Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** One ingredient drawn as a little food icon. `prep` changes its look (raw / chopped / cooked / burnt). */
export function drawIngredient(ctx, kind, prep, x, y, s) {
  const def = INGREDIENTS[kind];
  ctx.save();
  ctx.translate(x, y);
  if (prep === 'burnt') {
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.2);
    ctx.lineTo(s * 0.2, s * 0.2);
    ctx.moveTo(s * 0.2, -s * 0.2);
    ctx.lineTo(-s * 0.2, s * 0.2);
    ctx.stroke();
    ctx.restore();
    return;
  }
  switch (kind) {
    case 'bun': {
      ctx.fillStyle = '#d98f35';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.05, s * 0.46, s * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2c078';
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.08, s * 0.44, s * 0.26, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#fff2cf';
      for (const [sx, sy] of [[-0.2, -0.18], [0.05, -0.26], [0.24, -0.14]]) {
        ctx.beginPath();
        ctx.arc(sx * s, sy * s, s * 0.04, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'patty': {
      ctx.fillStyle = prep === 'cooked' ? '#8a4b2d' : '#c25e4e';
      roundRect(ctx, -s * 0.46, -s * 0.2, s * 0.92, s * 0.4, s * 0.16);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (const [sx, sy] of [[-0.25, -0.05], [0.1, 0.06], [0.28, -0.08]]) {
        ctx.beginPath();
        ctx.arc(sx * s, sy * s, s * 0.05, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'lettuce': {
      ctx.fillStyle = def.color;
      ctx.beginPath();
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2;
        const r = s * (prep === 'chopped' ? 0.34 : 0.46);
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r * 0.7;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = def.dark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, 0);
      ctx.lineTo(s * 0.3, 0);
      ctx.stroke();
      break;
    }
    case 'tomato': {
      if (prep === 'chopped') {
        ctx.fillStyle = '#f2705e';
        for (const ox of [-0.22, 0.22]) {
          ctx.beginPath();
          ctx.arc(ox * s, 0, s * 0.24, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#ffd9d2';
        ctx.beginPath();
        ctx.arc(-0.22 * s, 0, s * 0.1, 0, Math.PI * 2);
        ctx.arc(0.22 * s, 0, s * 0.1, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = def.color;
        ctx.beginPath();
        ctx.arc(0, s * 0.04, s * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7dc24a';
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.36, s * 0.16, s * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.arc(-s * 0.16, -s * 0.14, s * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'cheese': {
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.moveTo(-s * 0.44, s * 0.3);
      ctx.lineTo(s * 0.44, s * 0.3);
      ctx.lineTo(0, -s * 0.36);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = def.dark;
      for (const [hx, hy] of [[-0.12, 0.08], [0.16, 0.14]]) {
        ctx.beginPath();
        ctx.arc(hx * s, hy * s, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'noodle': {
      ctx.strokeStyle = prep === 'cooked' ? '#e8b64c' : '#f2d38a';
      ctx.lineWidth = s * 0.09;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < 3; i += 1) {
        const yy = (i - 1) * s * 0.22;
        ctx.moveTo(-s * 0.4, yy);
        ctx.bezierCurveTo(-s * 0.2, yy - s * 0.12, s * 0.2, yy + s * 0.12, s * 0.4, yy);
      }
      ctx.stroke();
      break;
    }
    case 'sauce': {
      ctx.fillStyle = '#f2ede4';
      ctx.beginPath();
      ctx.ellipse(0, s * 0.18, s * 0.34, s * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(0, s * 0.1, s * 0.26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(-s * 0.08, s * 0.02, s * 0.07, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

/** A finished dish on a plate: the plate plus its stacked ingredients. */
export function drawDish(ctx, recipeKey, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#f4f1e8';
  ctx.beginPath();
  ctx.ellipse(0, s * 0.28, s * 0.62, s * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9c2ae';
  ctx.lineWidth = 2;
  ctx.stroke();
  const needs = RECIPES[recipeKey].needs;
  needs.forEach((need, i) => {
    const [kind, prep] = need.split(':');
    drawIngredient(ctx, kind, prep || 'ready', 0, s * (0.1 - i * 0.1), s * 0.62);
  });
  ctx.restore();
}

/** The cook: white hat, apron, and a little walk bob. Carried food floats above the hat. */
function drawChef(ctx, chef, t) {
  const bob = chef.walk > 0 && (Math.abs(Math.sin(chef.walk * 10)) > 0.5) ? -3 : 0;
  const x = chef.x;
  const y = chef.y + bob;
  ctx.save();
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, chef.y + 26, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body and apron.
  ctx.fillStyle = '#f5f0e6';
  roundRect(ctx, x - 20, y - 8, 40, 34, 12);
  ctx.fill();
  ctx.fillStyle = '#4a90d9';
  roundRect(ctx, x - 20, y + 2, 40, 24, 10);
  ctx.fill();
  ctx.fillStyle = '#4a90d9';
  ctx.fillRect(x - 20, y - 8, 6, 14);
  ctx.fillRect(x + 14, y - 8, 6, 14);
  // Head and hat.
  ctx.fillStyle = '#f2c69b';
  ctx.beginPath();
  ctx.arc(x, y - 22, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x, y - 36, 19, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 19, y - 40, 38, 8);
  // Eyes look where the chef faces.
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(x + chef.dir * 4 - 5, y - 22, 2.2, 0, Math.PI * 2);
  ctx.arc(x + chef.dir * 4 + 5, y - 22, 2.2, 0, Math.PI * 2);
  ctx.fill();
  // Carried item above the hat.
  if (chef.carrying) {
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(x, y - 62, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8cdb4';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (chef.carrying.kind === 'dish') drawDish(ctx, chef.carrying.recipe, x, y - 62, 26);
    else drawIngredient(ctx, chef.carrying.kind, chef.carrying.prep, x, y - 62, 30);
  }
  ctx.restore();
}

function drawOrderCard(ctx, order, x, y, w, h) {
  const recipe = RECIPES[order.recipe];
  const frac = Math.max(0, order.patience / order.maxPatience);
  const urgent = frac < 0.35;
  ctx.save();
  ctx.fillStyle = urgent ? '#5a2320' : '#3d2b1a';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = urgent ? '#ff6b5e' : '#8a6b45';
  ctx.lineWidth = urgent ? 3 : 2;
  ctx.stroke();
  drawDish(ctx, order.recipe, x + 34, y + h / 2 - 4, 44);
  text(ctx, recipe.name, x + 66, y + 16, 15, '#ffe9c4', 'left');
  // Ingredient chips.
  let cx = x + 70;
  for (const need of recipe.needs) {
    const [kind, prep] = need.split(':');
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.arc(cx, y + 42, 13, 0, Math.PI * 2);
    ctx.fill();
    drawIngredient(ctx, kind, prep || 'ready', cx, y + 42, 20);
    cx += 28;
  }
  // Patience bar.
  ctx.fillStyle = '#241a12';
  roundRect(ctx, x + 66, y + h - 16, w - 78, 8, 4);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#7dc24a' : frac > 0.25 ? '#f7c948' : '#e84a3a';
  roundRect(ctx, x + 66, y + h - 16, Math.max(8, (w - 78) * frac), 8, 4);
  ctx.fill();
  text(ctx, `${Math.ceil(order.patience)}s`, x + w - 8, y + 16, 13, urgent ? '#ff9d94' : '#ffe9c4', 'right');
  ctx.restore();
}

function drawStation(ctx, station, state, t) {
  const { x, y, w, h } = station;
  const highlight = state.nearest && state.nearest.id === station.id;
  ctx.save();
  if (station.kind === 'trash') {
    ctx.fillStyle = '#5b6470';
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.fillStyle = '#39404a';
    ctx.fillRect(x + 6, y + 6, w - 12, 10);
    text(ctx, 'TRASH', x + w / 2, y + h - 16, 12, '#e8e4da');
    ctx.restore();
    return;
  }
  // Counter body.
  ctx.fillStyle = highlight ? '#8a5a2e' : '#6b4423';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.fillStyle = highlight ? '#a9743c' : '#7d5230';
  ctx.fillRect(x, y, w, 12);
  ctx.strokeStyle = highlight ? '#ffd94a' : '#4a2f18';
  ctx.lineWidth = highlight ? 3 : 2;
  roundRect(ctx, x, y, w, h, 8);
  ctx.stroke();

  if (station.kind === 'bin') {
    ctx.fillStyle = '#f4ead6';
    roundRect(ctx, x + 8, y + 20, w - 16, 44, 6);
    ctx.fill();
    drawIngredient(ctx, station.ingredient, INGREDIENTS[station.ingredient].prep === 'ready' ? 'ready' : 'raw', x + w / 2, y + 42, 44);
    text(ctx, station.label, x + w / 2, y + h - 10, 12, '#ffe9c4');
  } else if (station.kind === 'board') {
    ctx.fillStyle = '#d9b380';
    roundRect(ctx, x + 10, y + 18, w - 20, 46, 6);
    ctx.fill();
    ctx.strokeStyle = '#a87c4a';
    ctx.lineWidth = 2;
    ctx.stroke();
    const item = state.board.item;
    if (item) {
      drawIngredient(ctx, item.kind, item.prep, x + w / 2, y + 41, 40);
      if (item.prep === 'raw' && state.board.progress > 0) {
        ctx.fillStyle = '#241a12';
        roundRect(ctx, x + 14, y + 64, w - 28, 7, 3);
        ctx.fill();
        ctx.fillStyle = '#ffd94a';
        roundRect(ctx, x + 14, y + 64, (w - 28) * state.board.progress, 7, 3);
        ctx.fill();
      }
    }
    text(ctx, 'Chop: hold E', x + w / 2, y + h - 8, 11, '#ffe9c4');
  } else if (station.kind === 'stove') {
    const burner = state.burners[station.burner];
    const cx = x + w / 2;
    const cy = y + 44;
    ctx.fillStyle = '#2b2b2e';
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#55555c';
    ctx.lineWidth = 3;
    ctx.stroke();
    if (burner.item) {
      const def = INGREDIENTS[burner.item.kind];
      const frac = Math.min(1, burner.t / def.cookTime);
      // Flame under a cooking pan.
      if (burner.item.prep === 'raw') {
        const flick = Math.sin(t * 14 + station.burner * 3) * 3;
        ctx.fillStyle = '#ff9d2e';
        ctx.beginPath();
        ctx.moveTo(cx - 16, cy + 18);
        ctx.quadraticCurveTo(cx - 10, cy + 2 + flick, cx, cy - 6 + flick);
        ctx.quadraticCurveTo(cx + 10, cy + 2 + flick, cx + 16, cy + 18);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#3a3a3e';
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.fill();
      drawIngredient(ctx, burner.item.kind, burner.item.prep, cx, cy, 36);
      // Cook progress ring.
      ctx.strokeStyle = burner.item.prep === 'burnt' ? '#e84a3a' : burner.item.prep === 'cooked' ? '#7dc24a' : '#ffd94a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 34, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
      ctx.stroke();
      if (burner.item.prep === 'cooked') text(ctx, 'READY!', cx, y + h - 8, 11, '#b8f29a');
      if (burner.item.prep === 'burnt') text(ctx, 'BURNT!', cx, y + h - 8, 11, '#ff9d94');
    } else {
      text(ctx, 'Stove', cx, y + h - 8, 11, '#cfc4ae');
    }
  } else if (station.kind === 'plate') {
    const plate = state.plates[station.plate];
    ctx.fillStyle = '#f4f1e8';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + 46, 40, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9c2ae';
    ctx.lineWidth = 2;
    ctx.stroke();
    plate.items.forEach((item, i) => {
      drawIngredient(ctx, item.kind, item.prep, x + w / 2, y + 40 - i * 9, 30);
    });
    const match = recipeForPlate(plate.items);
    if (match) {
      const pulse = 0.6 + Math.sin(t * 6) * 0.4;
      ctx.fillStyle = `rgba(125,194,74,${pulse})`;
      ctx.beginPath();
      ctx.arc(x + w - 12, y + 14, 9, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, '✓', x + w - 12, y + 14, 12, '#12330a');
      text(ctx, 'Pick up!', x + w / 2, y + h - 8, 11, '#b8f29a');
    } else {
      text(ctx, 'Plate', x + w / 2, y + h - 8, 11, '#cfc4ae');
    }
  } else if (station.kind === 'serve') {
    ctx.fillStyle = '#7a4a21';
    ctx.fillRect(x, y, w, 14);
    ctx.fillStyle = '#ffe9c4';
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 8, y + 26);
    ctx.lineTo(x + w / 2 + 8, y + 26);
    ctx.lineTo(x + w / 2, y + 44);
    ctx.closePath();
    ctx.fill();
    text(ctx, 'SERVE', x + w / 2, y + 62, 16, '#ffd94a');
    text(ctx, 'window', x + w / 2, y + h - 10, 11, '#ffe9c4');
  }
  ctx.restore();
}

function drawKitchen(ctx, state, t) {
  // Wall and floor.
  ctx.fillStyle = '#f7e8cf';
  ctx.fillRect(0, 0, VIEW_WIDTH, 96);
  ctx.fillStyle = '#e8d3ae';
  ctx.fillRect(0, 88, VIEW_WIDTH, 8);
  ctx.fillStyle = '#b98a5a';
  ctx.fillRect(0, 96, VIEW_WIDTH, 8);
  // Floor tiles.
  ctx.fillStyle = '#c98f5f';
  ctx.fillRect(0, 104, VIEW_WIDTH, VIEW_HEIGHT - 104);
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 2;
  for (let x = 0; x < VIEW_WIDTH; x += TILE) {
    ctx.beginPath();
    ctx.moveTo(x, 104);
    ctx.lineTo(x, VIEW_HEIGHT);
    ctx.stroke();
  }
  for (let y = 104; y < VIEW_HEIGHT; y += TILE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW_WIDTH, y);
    ctx.stroke();
  }
  // Wall decor lives behind the order-board strip, so the strip is the wall here:
  // the menu board and lamps are drawn on the strip itself by drawHud.

  for (const station of STATIONS) drawStation(ctx, station, state, t);
  drawChef(ctx, state.chef, t);

  // Floating score popups.
  for (const p of state.popups) {
    ctx.globalAlpha = Math.max(0, 1 - p.t / 1.4);
    text(ctx, p.text, p.x, p.y - p.t * 40, 20, p.color);
    ctx.globalAlpha = 1;
  }
  // Hint message above the floor.
  if (state.messageTimer > 0) {
    ctx.fillStyle = 'rgba(36,26,18,0.85)';
    roundRect(ctx, 380, 742, 520, 34, 10);
    ctx.fill();
    text(ctx, state.message, 640, 760, 16, '#ffe9c4');
  }
}

function drawHud(ctx, state) {
  // Order board strip.
  ctx.fillStyle = '#2e2114';
  ctx.fillRect(0, 0, VIEW_WIDTH, 96);
  ctx.fillStyle = '#241a12';
  ctx.fillRect(0, 92, VIEW_WIDTH, 4);
  text(ctx, 'ORDERS', 12, 22, 14, '#ffd94a', 'left');
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet — get ready!', 90, 48, 15, '#cfc4ae', 'left');
  }
  if (state.orders.length <= 2) {
    text(ctx, '★ RASA KITCHEN ★', 640, 48, 15, 'rgba(255,217,74,0.55)');
  }
  state.orders.forEach((order, i) => {
    drawOrderCard(ctx, order, 90 + i * 218, 8, 208, 80);
  });
  // Coins, combo, timer, stars on the right of the board.
  const rightX = VIEW_WIDTH - 12;
  ctx.fillStyle = '#ffd94a';
  ctx.beginPath();
  ctx.arc(rightX - 78, 22, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a3541e';
  ctx.font = 'bold 13px Trebuchet MS, Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('C', rightX - 78, 23);
  text(ctx, `${state.coins}`, rightX, 22, 20, '#ffd94a', 'right');
  if (state.combo >= 2) text(ctx, `COMBO x${state.combo}`, rightX, 46, 15, '#ff9d5c', 'right');
  const mins = Math.floor(state.timeLeft / 60);
  const secs = Math.ceil(state.timeLeft % 60);
  const timeText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  text(ctx, `Time ${timeText}`, rightX - 150, 22, 20, state.timeLeft < 30 ? '#ff9d94' : '#ffe9c4', 'right');
  let starText = '';
  for (let i = 0; i < 3; i += 1) starText += i < state.stars ? '★' : '☆';
  text(ctx, starText, rightX - 150, 48, 18, '#ffd94a', 'right');
  // Shift progress bar.
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(90, 92, VIEW_WIDTH - 180, 4);
  ctx.fillStyle = '#ffd94a';
  ctx.fillRect(90, 92, (VIEW_WIDTH - 180) * (1 - state.timeLeft / SHIFT_SECONDS), 4);
}

function drawTitle(ctx, state, best, t) {
  ctx.fillStyle = 'rgba(20,12,6,0.72)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = '#fff3d6';
  roundRect(ctx, 290, 130, 700, 500, 18);
  ctx.fill();
  ctx.strokeStyle = '#d98f35';
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, 'SIZZLE & SERVE', 640, 185, 44, '#a3541e');
  text(ctx, '— RASA KITCHEN —', 640, 228, 20, '#7d5230');
  text(ctx, 'Customers are hungry. Chop, fry, boil,', 640, 282, 19, '#4a3220');
  text(ctx, 'assemble the dish and serve it before', 640, 310, 19, '#4a3220');
  text(ctx, 'their patience runs out!', 640, 338, 19, '#4a3220');
  // Mini recipe cards.
  const cards = [
    ['Rasa Burger', 'bun + fried patty + chopped lettuce & tomato'],
    ['Noodle Bowl', 'boiled noodles + sauce + chopped tomato'],
    ['Garden Salad', 'chopped lettuce & tomato + cheese'],
  ];
  cards.forEach(([name, desc], i) => {
    const y = 372 + i * 34;
    ctx.fillStyle = '#f7e8cf';
    roundRect(ctx, 340, y - 14, 600, 28, 8);
    ctx.fill();
    text(ctx, `${name}:  ${desc}`, 640, y, 15, '#4a3220');
  });
  text(ctx, 'Move: WASD / arrows / click   •   Interact: E or Space (hold E to chop)', 640, 492, 16, '#7d5230');
  text(ctx, 'Pause: P   •   Mute: M', 640, 518, 16, '#7d5230');
  const pulse = 0.7 + Math.sin(t * 4) * 0.3;
  ctx.fillStyle = `rgba(211,84,0,${pulse})`;
  roundRect(ctx, 490, 538, 300, 44, 12);
  ctx.fill();
  text(ctx, '▶  START SHIFT  (Space)', 640, 561, 20, '#ffffff');
  if (best > 0) text(ctx, `Best shift: ${best} coins`, 640, 606, 16, '#7d5230');
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20,12,6,0.6)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  text(ctx, 'PAUSED', 640, 380, 48, '#ffe9c4');
  text(ctx, 'Press P or Space to keep cooking', 640, 430, 18, '#cfc4ae');
}

function drawOver(ctx, state, best) {
  ctx.fillStyle = 'rgba(20,12,6,0.78)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = '#fff3d6';
  roundRect(ctx, 340, 150, 600, 440, 18);
  ctx.fill();
  ctx.strokeStyle = '#d98f35';
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, 'SHIFT OVER', 640, 205, 40, '#a3541e');
  text(ctx, state.overReason, 640, 248, 16, '#7d5230');
  text(ctx, `${state.coins} coins`, 640, 310, 34, '#a3541e');
  text(ctx, `Dishes served: ${state.served}     Orders lost: ${state.expired}     Best combo: x${Math.max(1, state.bestCombo)}`, 640, 362, 17, '#4a3220');
  const isBest = state.coins >= best && state.coins > 0;
  text(ctx, isBest ? '★ New best shift! ★' : `Best shift: ${best} coins`, 640, 402, 18, isBest ? '#d35400' : '#7d5230');
  // Stars earned by coins.
  const earned = state.coins >= 300 ? 3 : state.coins >= 180 ? 2 : state.coins >= 90 ? 1 : 0;
  let stars = '';
  for (let i = 0; i < 3; i += 1) stars += i < earned ? '★ ' : '☆ ';
  text(ctx, stars, 640, 448, 34, '#f7c948');
  text(ctx, 'Press Space to cook again', 640, 540, 18, '#7d5230');
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    scale = Math.min(w / VIEW_WIDTH, h / VIEW_HEIGHT) * dpr;
    offsetX = (canvas.width - VIEW_WIDTH * scale) / 2;
    offsetY = (canvas.height - VIEW_HEIGHT * scale) / 2;
  }
  window.addEventListener('resize', resize);
  resize();

  function draw(state, screen, best, t, nearest) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#241a12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    const view = { ...state, nearest };
    drawKitchen(ctx, view, t);
    drawHud(ctx, state);
    if (screen === SCREEN_TITLE) drawTitle(ctx, state, best, t);
    else if (screen === SCREEN_PAUSED) drawPaused(ctx);
    else if (screen === SCREEN_OVER) drawOver(ctx, state, best);
  }

  return { draw };
}
