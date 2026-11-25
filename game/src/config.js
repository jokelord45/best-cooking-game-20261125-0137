// Shared constants for Sizzle & Serve — Rasa Kitchen: the room, the food and the recipes.
// Everything the world, the renderer and the screenshot stager agree on lives here.
export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 800;
export const STEP = 1 / 60;
export const SHIFT_SECONDS = 150;
export const CHEF_SPEED = 300;
export const CHEF_RADIUS = 24;
export const INTERACT_RANGE = 78;
export const MAX_ORDERS = 4;
export const BEST_KEY = 'sizzle-and-serve-best';

// The kitchen floor the chef may walk on; the counter row above it is solid.
export const FLOOR = { x: 14, y: 208, width: 1252, height: 566 };

// Every ingredient: what it looks like, what prep it needs, and how long that prep takes.
export const INGREDIENTS = {
  bun:     { name: 'Bun',     color: '#e8a94f', dark: '#b97a28', prep: 'ready',  icon: 'bun' },
  patty:   { name: 'Patty',   color: '#c25e4e', dark: '#7e3226', prep: 'fry',    cookTime: 4, burnTime: 9, icon: 'patty' },
  lettuce: { name: 'Lettuce', color: '#7dc24a', dark: '#4c8a2a', prep: 'chop',   chopTime: 1.2, icon: 'lettuce' },
  tomato:  { name: 'Tomato',  color: '#e84a3a', dark: '#a92c20', prep: 'chop',   chopTime: 1.2, icon: 'tomato' },
  cheese:  { name: 'Cheese',  color: '#f7c948', dark: '#c89a1e', prep: 'ready',  icon: 'cheese' },
  noodle:  { name: 'Noodles', color: '#f2d38a', dark: '#c49a4a', prep: 'boil',   cookTime: 5, burnTime: 10, icon: 'noodle' },
  sauce:   { name: 'Sauce',   color: '#d94f30', dark: '#8f2f1c', prep: 'ready',  icon: 'sauce' },
};

// A dish is a set of prepared ingredients. Order does not matter; the plate must match exactly.
export const RECIPES = {
  burger: {
    name: 'Rasa Burger', price: 24,
    needs: ['bun', 'patty:cooked', 'lettuce:chopped', 'tomato:chopped'],
  },
  cheeseBurger: {
    name: 'Cheese Melt', price: 30,
    needs: ['bun', 'patty:cooked', 'cheese', 'lettuce:chopped'],
  },
  salad: {
    name: 'Garden Salad', price: 20,
    needs: ['lettuce:chopped', 'tomato:chopped', 'cheese'],
  },
  noodles: {
    name: 'Noodle Bowl', price: 28,
    needs: ['noodle:cooked', 'sauce', 'tomato:chopped'],
  },
  sandwich: {
    name: 'Club Sandwich', price: 22,
    needs: ['bun', 'lettuce:chopped', 'cheese', 'tomato:chopped'],
  },
};
export const RECIPE_KEYS = Object.keys(RECIPES);

// Stations along the counter row (top) and the trash can (bottom-left corner).
// A station is { id, kind, label, x, y, w, h, ingredient? , burner? }.
export const STATIONS = [
  { id: 'bin-bun',     kind: 'bin',    label: 'Bun',     x: 16,  y: 104, w: 78, h: 88, ingredient: 'bun' },
  { id: 'bin-patty',   kind: 'bin',    label: 'Patty',   x: 98,  y: 104, w: 78, h: 88, ingredient: 'patty' },
  { id: 'bin-lettuce', kind: 'bin',    label: 'Lettuce', x: 180, y: 104, w: 78, h: 88, ingredient: 'lettuce' },
  { id: 'bin-tomato',  kind: 'bin',    label: 'Tomato',  x: 262, y: 104, w: 78, h: 88, ingredient: 'tomato' },
  { id: 'bin-cheese',  kind: 'bin',    label: 'Cheese',  x: 344, y: 104, w: 78, h: 88, ingredient: 'cheese' },
  { id: 'bin-noodle',  kind: 'bin',    label: 'Noodles', x: 426, y: 104, w: 78, h: 88, ingredient: 'noodle' },
  { id: 'bin-sauce',   kind: 'bin',    label: 'Sauce',   x: 508, y: 104, w: 78, h: 88, ingredient: 'sauce' },
  { id: 'board',       kind: 'board',  label: 'Chopping Board', x: 606, y: 104, w: 108, h: 88 },
  { id: 'stove-0',     kind: 'stove',  label: 'Stove',   x: 734, y: 104, w: 96, h: 88, burner: 0 },
  { id: 'stove-1',     kind: 'stove',  label: 'Stove',   x: 834, y: 104, w: 96, h: 88, burner: 1 },
  { id: 'plate-0',     kind: 'plate',  label: 'Plate',   x: 950, y: 104, w: 96, h: 88, plate: 0 },
  { id: 'plate-1',     kind: 'plate',  label: 'Plate',   x: 1050, y: 104, w: 96, h: 88, plate: 1 },
  { id: 'serve',       kind: 'serve',  label: 'Serve!',  x: 1166, y: 104, w: 98, h: 88 },
  { id: 'trash',       kind: 'trash',  label: 'Trash',   x: 16,  y: 700, w: 72, h: 72 },
];

export function stationById(id) {
  return STATIONS.find((s) => s.id === id);
}

/** Difficulty at `elapsed` seconds into the shift: orders come faster and run out sooner. */
export function difficultyAt(elapsed) {
  const level = 1 + Math.floor(elapsed / 30);
  return {
    level,
    orderEvery: Math.max(7, 13 - level),
    patience: Math.max(28, 48 - 2 * level),
  };
}
