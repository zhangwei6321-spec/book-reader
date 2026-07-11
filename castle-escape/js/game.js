// ============================================================
// Game Logic — Yokai Labyrinth
// ============================================================

// ---- Map definitions (5 floors) ----
// Legend: 0=empty, 1=stone, 2=brick, 3=wood, 4=moss, 5=locked_door, 6=open_door, 7=portal, 8=bars

const FLOORS = [];

// Floor 1: 🌸 樱花回廊 (24x24) — exit: 紫色 💜
FLOORS.push({
  name: '🌸 樱花回廊',
  map: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,1,1],
    [1,0,0,0,1,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1,0,1,1,1],
    [1,1,0,0,0,0,0,1,0,1,0,1,0,0,0,1,0,0,0,1,0,1,1,1],
    [1,1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1,1,1,0,1,1,1],
    [1,1,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,1],
    [1,1,0,1,0,1,1,1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1],
    [1,1,0,1,0,1,0,0,0,1,0,0,0,0,0,1,0,1,0,0,0,1,1,1],
    [1,1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1,1,1],
    [1,1,0,1,0,0,0,1,0,0,0,0,0,1,0,1,0,1,0,0,0,1,1,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1],
    [1,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1,0,1,0,1,1,1],
    [1,1,0,1,0,1,0,1,1,1,0,1,1,1,1,1,1,1,0,1,0,1,1,1],
    [1,1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1],
    [1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1],
    [1,1,0,0,5,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,1,1],
    [1,1,1,1,0,1,0,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,1,1],
    [1,1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0,0,5,1,1,1],
    [1,1,0,1,1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1,1],
    [1,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,8,1,1,1,1,1,1,1,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,7,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ],
  playerStart: { x: 1.5, y: 1.5, angle: -Math.PI/2 },
  enemies: [
    { x: 13.5, y: 6.5, type: 'ghost', variant: 'red', patrol: [{x:13,y:6},{x:11,y:6},{x:11,y:4},{x:13,y:4}] },
    { x: 20.5, y: 17.5, type: 'ghost', variant: 'red', patrol: [{x:20,y:17},{x:18,y:17},{x:18,y:15},{x:20,y:15}] },
    { x: 4.5, y: 9.5, type: 'ghost', variant: 'red', patrol: [{x:4,y:9},{x:2,y:9},{x:2,y:7},{x:4,y:7}] },
  ],
  items: [
    { x: 20.5, y: 20.5, type: 'key', subtype: 'gold' },
    { x: 2.5, y: 10.5, type: 'key', subtype: 'silver' },
    { x: 20.5, y: 3.5, type: 'coin' },
    { x: 18.5, y: 16.5, type: 'coin' },
    { x: 17.5, y: 4.5, type: 'coin' },
    { x: 15.5, y: 12.5, type: 'coin' },
    { x: 12.5, y: 5.5, type: 'health' },
    { x: 7.5, y: 12.5, type: 'health' },
    { x: 11.5, y: 14.5, type: 'health' },
    { x: 16.5, y: 4.5, type: 'torch' },
    { x: 12.5, y: 10.5, type: 'torch' },
  ],
  doors: [
    { x: 20, y: 18, keyType: 'gold' },
    { x: 4, y: 16, keyType: 'silver' },
  ],
  exit: { x: 22, y: 22 },
  exitColor: '紫色 💜',
});

// Floor 2: 🦊 狐火地牢 (28x28) — exit: 金色 💛
FLOORS.push({
  name: '🦊 狐火地牢',
  map: [
    [1,1,2,1,2,1,1,1,1,2,2,1,2,2,2,2,2,2,1,2,1,2,1,2,2,2,1,2],
    [1,0,0,0,1,2,2,2,1,1,2,2,2,1,1,2,2,1,2,2,1,1,2,2,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,1,1,2],
    [1,0,0,0,0,2,1,1,0,1,0,1,0,2,1,2,2,1,2,2,0,2,0,1,0,1,2,2],
    [1,2,0,2,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,2,0,0,0,2,2,2],
    [1,1,0,1,2,1,2,2,0,1,1,2,1,1,2,2,1,2,0,1,0,1,2,2,8,2,1,2],
    [2,1,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,1,0,0,0,0,0,0,0,2,1,1],
    [2,1,2,1,1,1,0,2,2,1,0,2,0,2,1,1,1,2,0,1,1,2,1,2,0,1,2,1],
    [1,1,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0,0,1,2,1],
    [1,1,0,2,2,1,2,1,0,2,1,1,2,1,0,1,0,2,0,2,1,2,2,2,0,1,2,1],
    [2,1,0,0,0,0,0,1,0,0,0,0,0,0,0,2,0,1,0,1,0,2,0,0,5,2,1,2],
    [2,1,0,1,1,2,0,1,0,2,1,1,0,1,1,2,0,2,0,2,0,2,0,2,1,1,2,2],
    [1,2,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,1,0,2,0,2,0,0,0,2,2,2],
    [2,1,0,2,0,2,0,2,0,2,1,2,1,2,1,2,2,1,0,1,0,2,2,2,0,2,2,1],
    [2,2,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,2,2,2],
    [1,1,0,2,2,1,0,1,1,2,0,1,1,1,0,1,0,2,2,2,1,1,2,2,2,2,1,1],
    [2,2,0,2,0,2,0,0,0,1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,1,2,2],
    [1,2,0,2,0,2,1,2,0,2,1,1,0,1,0,1,2,1,0,2,0,1,0,2,0,2,1,2],
    [2,1,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,1,0,1,0,0,5,1,0,1,1,2],
    [1,2,0,2,0,2,1,1,1,2,0,2,0,2,2,2,0,1,0,1,2,1,2,2,0,2,1,1],
    [1,2,0,8,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,2,1,1],
    [2,1,0,2,2,1,2,1,2,1,2,1,1,1,0,1,0,2,0,1,0,1,0,1,1,2,1,2],
    [1,2,0,0,0,0,0,0,0,0,0,0,0,2,0,2,0,2,0,1,0,2,0,0,0,2,2,1],
    [1,1,2,2,0,2,2,1,0,2,1,2,2,2,0,2,0,1,0,2,0,1,2,1,0,2,1,2],
    [2,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
    [2,2,2,1,1,2,2,1,1,2,2,2,2,2,1,1,2,2,1,1,2,1,1,2,0,0,0,2],
    [2,2,1,1,2,1,2,2,2,2,1,2,1,1,2,2,1,2,2,2,1,1,1,2,0,0,7,2],
    [2,2,1,1,2,1,1,1,1,2,2,2,1,1,2,2,1,2,2,2,2,2,2,1,2,2,1,2]
  ],
  playerStart: { x: 1.5, y: 1.5, angle: -Math.PI/2 },
  enemies: [
    { x: 20.5, y: 12.5, type: 'ghost', variant: 'green', patrol: [{x:20,y:12},{x:18,y:12},{x:18,y:10},{x:20,y:10}] },
    { x: 12.5, y: 12.5, type: 'ghost', variant: 'green', patrol: [{x:12,y:12},{x:10,y:12},{x:10,y:10},{x:12,y:10}] },
    { x: 18.5, y: 13.5, type: 'ghost', variant: 'red', patrol: [{x:18,y:13},{x:16,y:13},{x:16,y:11},{x:18,y:11}] },
    { x: 14.5, y: 20.5, type: 'ghost', variant: 'boss', patrol: [{x:14,y:20},{x:12,y:20},{x:12,y:18},{x:14,y:18}], boss: true },
  ],
  items: [
    { x: 16.5, y: 12.5, type: 'key', subtype: 'gold' },
    { x: 15.5, y: 6.5, type: 'key', subtype: 'silver' },
    { x: 15.5, y: 24.5, type: 'key', subtype: 'crystal' },
    { x: 18.5, y: 21.5, type: 'coin' },
    { x: 24.5, y: 6.5, type: 'coin' },
    { x: 18.5, y: 8.5, type: 'coin' },
    { x: 18.5, y: 14.5, type: 'coin' },
    { x: 12.5, y: 7.5, type: 'health' },
    { x: 16.5, y: 19.5, type: 'health' },
    { x: 12.5, y: 19.5, type: 'health' },
    { x: 22.5, y: 24.5, type: 'torch' },
    { x: 9.5, y: 10.5, type: 'torch' },
  ],
  doors: [
    { x: 22, y: 18, keyType: 'gold' },
    { x: 10, y: 4, keyType: 'silver' },
    { x: 24, y: 10, keyType: 'crystal' },
  ],
  exit: { x: 26, y: 26 },
  exitColor: '金色 💛',
});

// Floor 3: 📜 幻妖文库 (32x32) — exit: 青色 🩵
FLOORS.push({
  name: '📜 幻妖文库',
  map: [
    [1,3,1,3,3,1,1,3,3,1,3,1,3,1,1,3,1,3,3,3,1,3,1,1,1,3,3,1,1,1,1,1],
    [3,0,0,0,3,1,3,3,3,3,1,1,3,1,3,1,1,1,1,3,1,3,3,1,3,3,3,3,1,1,3,3],
    [3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,3,0,0,0,0,0,0,0,0,0,3,1,1],
    [3,0,0,0,0,3,1,3,1,3,0,1,3,3,0,3,0,3,0,3,0,1,0,3,0,3,1,1,0,1,3,1],
    [1,1,0,0,0,3,0,0,0,3,0,0,0,1,0,0,0,3,0,0,0,1,0,1,0,3,0,0,0,1,3,1],
    [3,3,0,1,0,3,0,1,1,3,0,3,0,1,3,1,0,1,1,1,0,3,0,1,0,1,1,3,0,1,1,3],
    [1,3,0,1,0,3,0,0,0,0,0,1,0,1,0,0,0,0,5,0,0,3,0,0,0,1,0,0,0,1,1,3],
    [3,3,0,1,0,3,0,1,1,1,0,1,0,1,0,3,3,1,0,1,0,3,0,3,0,1,0,1,1,1,1,3],
    [3,3,0,3,0,0,0,0,0,1,0,0,0,1,5,0,0,0,0,3,0,0,0,0,0,1,0,0,0,1,3,1],
    [3,1,0,1,0,3,3,1,1,3,0,3,0,1,1,3,1,1,0,3,3,1,3,3,3,1,3,1,1,1,1,3],
    [1,1,0,0,0,1,0,0,0,0,0,3,0,3,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,3,3,1],
    [1,3,1,3,0,1,0,1,1,3,3,1,0,3,0,3,1,1,1,1,0,3,1,3,1,3,1,1,0,1,1,1],
    [1,3,0,0,0,3,0,0,0,3,0,1,0,3,0,0,0,0,0,1,0,0,0,0,0,0,0,3,0,1,1,3],
    [3,3,0,1,3,1,3,3,0,3,0,1,0,3,1,3,0,1,3,1,1,1,1,1,0,1,0,1,0,1,3,3],
    [3,1,0,1,0,0,0,0,0,1,0,3,0,1,0,3,0,0,0,0,0,0,0,0,0,1,0,3,0,3,3,1],
    [3,1,0,1,0,1,0,1,1,3,0,1,0,3,0,3,3,3,1,3,1,3,0,1,0,3,0,3,0,1,3,3],
    [3,1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,3,0,1,0,0,0,1,3,1],
    [3,1,0,3,3,1,1,1,0,3,3,1,0,1,3,1,0,1,0,1,3,3,3,1,0,1,0,1,3,1,1,3],
    [1,1,0,0,0,3,0,3,0,0,0,3,0,0,0,0,0,0,0,3,0,0,0,0,0,3,0,3,0,3,3,1],
    [1,1,1,1,0,1,0,1,1,3,0,3,3,3,0,1,0,3,0,1,0,3,3,3,3,1,0,1,0,1,3,1],
    [1,3,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,3,0,0,0,3,0,1,3,3],
    [1,1,0,3,3,1,1,3,0,1,1,1,1,1,0,1,0,1,1,3,3,1,0,3,0,1,1,1,0,1,3,1],
    [1,3,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,3,0,0,0,0,0,0,0,1,0,0,0,1,3,3],
    [3,1,3,3,0,1,0,3,1,1,3,3,0,3,0,1,1,1,0,3,3,3,0,3,1,1,0,3,0,3,1,3],
    [1,1,0,1,0,3,0,3,0,0,0,0,0,0,0,0,0,3,5,0,0,0,0,0,0,3,0,3,0,3,3,3],
    [1,1,0,3,0,1,0,1,0,3,1,3,3,1,1,1,0,1,1,3,1,1,3,3,0,1,0,1,0,1,3,3],
    [1,3,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,3,0,0,0,3,0,1,3,1],
    [1,1,0,1,1,1,3,1,3,1,1,3,0,1,0,3,1,1,0,1,1,1,0,3,1,3,3,1,0,3,3,3],
    [1,1,0,0,0,0,0,0,0,0,0,0,5,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3],
    [3,1,3,1,1,3,3,3,1,1,1,3,1,1,3,1,1,3,1,3,1,1,3,3,1,1,3,3,0,0,0,1],
    [3,1,1,1,3,3,1,1,1,3,3,3,1,3,3,3,3,3,1,3,1,1,3,1,1,3,1,3,0,0,7,3],
    [1,1,3,1,3,1,1,1,3,3,1,3,1,3,1,1,1,3,1,1,3,3,3,3,1,1,1,3,3,1,1,3]
  ],
  playerStart: { x: 1.5, y: 1.5, angle: -Math.PI/2 },
  enemies: [
    { x: 4.5, y: 16.5, type: 'ghost', variant: 'green', patrol: [{x:4,y:16},{x:2,y:16},{x:2,y:14},{x:4,y:14}] },
    { x: 24.5, y: 16.5, type: 'ghost', variant: 'green', patrol: [{x:24,y:16},{x:22,y:16},{x:22,y:14},{x:24,y:14}] },
    { x: 28.5, y: 5.5, type: 'ghost', variant: 'green', patrol: [{x:28,y:5},{x:26,y:5},{x:26,y:3},{x:28,y:3}] },
    { x: 15.5, y: 20.5, type: 'ghost', variant: 'red', patrol: [{x:15,y:20},{x:13,y:20},{x:13,y:18},{x:15,y:18}] },
    { x: 28.5, y: 25.5, type: 'ghost', variant: 'boss', patrol: [{x:28,y:25},{x:26,y:25},{x:26,y:23},{x:28,y:23}], boss: true },
  ],
  items: [
    { x: 9.5, y: 28.5, type: 'key', subtype: 'gold' },
    { x: 10.5, y: 20.5, type: 'key', subtype: 'silver' },
    { x: 26.5, y: 24.5, type: 'key', subtype: 'crystal' },
    { x: 4.5, y: 23.5, type: 'key', subtype: 'gold' },
    { x: 26.5, y: 20.5, type: 'coin' },
    { x: 3.5, y: 28.5, type: 'coin' },
    { x: 14.5, y: 28.5, type: 'coin' },
    { x: 4.5, y: 14.5, type: 'coin' },
    { x: 3.5, y: 18.5, type: 'health' },
    { x: 20.5, y: 18.5, type: 'health' },
    { x: 6.5, y: 5.5, type: 'health' },
    { x: 26.5, y: 16.5, type: 'torch' },
    { x: 8.5, y: 6.5, type: 'torch' },
  ],
  doors: [
    { x: 18, y: 6, keyType: 'gold' },
    { x: 12, y: 28, keyType: 'silver' },
    { x: 18, y: 24, keyType: 'crystal' },
    { x: 14, y: 8, keyType: 'gold' },
  ],
  exit: { x: 30, y: 30 },
  exitColor: '青色 🩵',
});

// Floor 4: 👻 鬼灯墓场 (36x36) — exit: 红色 ❤️
FLOORS.push({
  name: '👻 鬼灯墓场',
  map: [
    [4,1,1,4,4,1,1,4,1,1,1,1,1,4,1,1,1,1,4,4,4,4,4,1,1,1,1,4,4,4,4,1,1,4,4,1],
    [4,0,0,0,1,4,1,1,4,4,1,4,4,4,4,4,1,4,4,4,1,4,1,4,1,4,1,1,4,4,4,1,4,1,4,1],
    [4,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,4,4,4],
    [1,0,0,0,0,4,1,1,4,1,0,1,0,1,4,1,1,1,0,1,0,4,1,1,0,1,1,4,0,1,1,4,0,4,4,4],
    [4,4,0,0,0,1,0,4,0,0,5,4,0,1,0,0,0,1,0,0,0,1,0,0,0,4,0,0,0,0,0,0,0,4,1,4],
    [4,1,4,1,4,4,0,1,0,1,0,1,0,4,1,4,0,4,0,4,1,4,0,1,4,4,0,4,0,4,0,1,4,4,1,4],
    [4,4,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,4,0,0,0,4,0,1,0,1,0,0,0,1,1,4],
    [1,4,4,1,1,1,4,1,1,4,0,4,0,1,0,4,4,4,4,1,0,4,1,1,0,1,0,1,0,4,0,4,1,4,4,4],
    [4,4,0,0,0,0,0,0,0,4,0,4,0,1,0,0,0,0,0,4,0,0,0,0,0,0,0,1,0,4,0,0,0,1,1,4],
    [4,4,0,4,4,1,4,4,0,4,0,1,0,1,4,4,0,4,0,1,0,1,1,4,1,4,4,4,0,4,4,4,0,4,4,4],
    [4,1,0,0,0,1,0,1,0,0,0,1,0,0,0,0,0,1,0,4,0,0,0,0,0,0,0,1,0,0,0,1,0,1,4,1],
    [1,1,4,1,0,1,0,4,1,1,4,1,1,4,0,4,0,1,0,1,0,4,4,1,0,1,0,1,1,1,0,4,0,4,4,4],
    [4,4,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,0,0,4,0,4,4,1],
    [1,4,0,4,4,4,4,1,0,4,1,1,0,1,4,4,4,1,0,4,4,4,0,1,0,4,4,1,1,4,1,4,0,4,4,1],
    [1,4,0,4,0,0,0,1,0,0,0,0,0,4,0,0,0,1,0,4,0,0,0,1,0,0,0,0,0,4,0,0,0,4,4,4],
    [1,1,0,1,0,1,0,4,0,1,4,4,0,4,0,4,0,1,0,4,0,1,1,1,1,1,1,4,0,4,0,1,0,4,1,1],
    [1,1,0,1,0,0,0,0,0,0,5,4,0,1,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,4,0,4,0,1,4,1],
    [1,1,0,4,0,4,1,4,1,1,0,4,0,4,1,1,1,4,0,4,1,1,0,1,0,4,0,1,0,1,4,4,0,4,4,1],
    [1,1,0,4,0,0,0,0,0,0,0,4,0,4,0,0,0,0,0,0,0,1,0,4,0,1,0,1,0,0,0,0,0,1,1,4],
    [4,1,0,1,4,1,4,1,0,1,0,1,0,4,0,1,4,1,1,1,0,4,0,1,0,4,0,1,0,1,4,1,0,1,1,4],
    [1,4,0,4,0,0,0,0,0,4,0,1,0,1,0,4,0,0,0,0,0,4,0,1,0,4,0,1,0,0,0,4,0,4,4,4],
    [1,1,0,4,0,4,0,4,0,4,0,1,0,1,0,1,0,4,0,4,0,4,0,4,0,4,1,4,0,1,0,1,0,4,1,4],
    [1,4,0,0,0,1,0,4,0,1,0,4,0,0,0,4,0,4,0,4,0,1,0,1,0,0,0,0,0,1,5,0,0,1,1,1],
    [1,1,1,4,1,1,0,1,4,4,0,4,0,1,4,1,0,1,0,1,0,1,0,4,1,4,1,4,4,4,0,1,0,4,1,1],
    [4,1,0,0,0,1,0,0,0,1,5,0,0,1,0,0,0,1,0,4,0,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
    [4,1,0,4,0,4,4,1,0,1,1,4,0,4,1,4,0,4,0,4,0,4,0,4,0,4,0,4,4,1,1,4,0,4,4,4],
    [4,4,0,1,0,0,0,1,0,0,0,0,0,4,0,0,0,1,0,0,0,1,0,4,0,1,0,0,0,0,0,0,0,4,1,1],
    [4,1,0,4,1,1,1,4,4,1,1,4,4,1,0,1,4,4,0,1,4,1,1,4,0,4,1,4,0,1,4,1,4,1,1,4],
    [4,4,0,0,0,4,0,0,0,1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,4,0,0,0,1,0,0,0,4,1,4],
    [1,4,1,1,0,1,0,4,0,4,0,1,0,1,0,4,0,4,4,1,1,4,1,4,1,4,0,4,1,4,0,4,0,1,1,4],
    [1,4,0,0,0,4,0,1,5,0,0,1,0,1,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,4,1,1],
    [4,4,0,4,4,1,0,4,0,4,0,1,4,1,4,4,0,1,0,4,1,1,0,1,0,4,1,1,1,1,0,1,0,1,4,1],
    [4,1,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,4],
    [1,4,1,1,1,4,4,1,1,4,1,4,1,1,4,1,4,1,4,1,1,4,4,4,1,1,4,4,1,4,1,4,0,0,0,4],
    [1,1,1,4,1,1,1,4,4,4,4,1,1,4,4,4,4,1,4,1,4,4,1,4,1,1,4,4,1,1,4,1,0,0,7,4],
    [1,1,4,4,4,4,1,1,1,1,1,4,1,4,1,1,4,1,1,1,4,1,1,4,4,4,4,4,4,1,1,1,1,1,1,4]
  ],
  playerStart: { x: 1.5, y: 1.5, angle: -Math.PI/2 },
  enemies: [
    { x: 12.5, y: 26.5, type: 'ghost', variant: 'red', patrol: [{x:12,y:26},{x:10,y:26},{x:10,y:24},{x:12,y:24}] },
    { x: 12.5, y: 23.5, type: 'ghost', variant: 'green', patrol: [{x:12,y:23},{x:10,y:23},{x:10,y:21},{x:12,y:21}] },
    { x: 6.5, y: 31.5, type: 'ghost', variant: 'green', patrol: [{x:6,y:31},{x:4,y:31},{x:4,y:29},{x:6,y:29}] },
    { x: 17.5, y: 18.5, type: 'ghost', variant: 'red', patrol: [{x:17,y:18},{x:15,y:18},{x:15,y:16},{x:17,y:16}] },
    { x: 20.5, y: 28.5, type: 'ghost', variant: 'green', patrol: [{x:20,y:28},{x:18,y:28},{x:18,y:26},{x:20,y:26}] },
    { x: 22.5, y: 31.5, type: 'ghost', variant: 'boss', patrol: [{x:22,y:31},{x:20,y:31},{x:20,y:29},{x:22,y:29}], boss: true },
  ],
  items: [
    { x: 31.5, y: 4.5, type: 'key', subtype: 'gold' },
    { x: 4.5, y: 26.5, type: 'key', subtype: 'silver' },
    { x: 5.5, y: 14.5, type: 'key', subtype: 'crystal' },
    { x: 20.5, y: 30.5, type: 'key', subtype: 'gold' },
    { x: 12.5, y: 29.5, type: 'key', subtype: 'silver' },
    { x: 30.5, y: 7.5, type: 'coin' },
    { x: 28.5, y: 22.5, type: 'coin' },
    { x: 7.5, y: 18.5, type: 'coin' },
    { x: 22.5, y: 12.5, type: 'coin' },
    { x: 9.5, y: 30.5, type: 'health' },
    { x: 26.5, y: 12.5, type: 'health' },
    { x: 26.5, y: 26.5, type: 'health' },
    { x: 4.5, y: 12.5, type: 'torch' },
    { x: 28.5, y: 21.5, type: 'torch' },
  ],
  doors: [
    { x: 10, y: 24, keyType: 'gold' },
    { x: 30, y: 22, keyType: 'silver' },
    { x: 8, y: 30, keyType: 'crystal' },
    { x: 10, y: 4, keyType: 'gold' },
    { x: 10, y: 16, keyType: 'silver' },
  ],
  exit: { x: 34, y: 34 },
  exitColor: '红色 ❤️',
});

// Floor 5: 👺 天狗王座 (40x40) — exit: 白色 🤍
FLOORS.push({
  name: '👺 天狗王座',
  map: [
    [1,1,1,1,1,2,1,1,1,1,2,2,1,2,1,1,2,2,2,1,1,2,1,2,1,2,1,1,2,2,2,1,1,2,2,1,2,2,2,2],
    [2,0,0,0,1,2,2,2,1,1,2,2,1,1,2,1,2,2,1,1,1,2,2,1,1,1,2,1,2,1,2,1,1,2,2,2,2,2,2,2],
    [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,1,2,1],
    [1,0,0,0,2,2,0,2,0,1,0,1,1,1,1,1,2,1,1,2,0,2,1,2,0,1,0,1,0,2,0,2,0,1,2,2,0,2,2,2],
    [1,1,0,2,0,0,0,1,0,2,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,2,0,0,0,2,0,2,0,0,0,1,0,1,1,2],
    [1,2,0,2,0,1,2,2,0,2,1,2,2,2,0,1,0,1,0,2,0,2,2,2,2,2,2,1,1,1,0,1,0,2,0,2,0,1,2,2],
    [1,2,0,0,0,0,0,2,0,0,0,2,0,2,0,2,0,1,0,1,0,1,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,1,1,2],
    [1,2,0,1,1,2,0,1,2,2,0,2,0,2,0,1,0,2,0,1,0,2,2,2,2,1,0,2,0,1,1,2,2,2,0,1,2,2,2,1],
    [2,1,0,0,0,1,0,0,5,2,0,2,0,0,0,0,0,1,0,2,0,0,0,0,0,2,0,1,0,1,0,0,0,1,0,0,0,2,2,1],
    [2,2,1,2,0,1,2,2,0,2,0,2,0,1,0,2,0,2,2,2,1,1,1,2,0,1,0,2,0,2,0,2,0,1,1,2,0,2,1,1],
    [1,2,0,2,0,0,0,0,0,2,0,2,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,2,0,0,0,0,5,2,2,1],
    [2,1,0,2,1,1,1,1,1,1,0,2,2,2,2,2,1,1,0,1,2,1,1,2,0,2,0,1,1,2,1,1,1,2,2,1,2,2,1,2],
    [1,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,1,1,1],
    [2,2,0,2,0,1,2,1,0,1,0,1,0,1,0,1,0,2,0,2,0,2,2,1,0,2,0,2,0,1,0,2,0,2,0,2,0,1,2,1],
    [2,2,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,2,2],
    [2,2,1,1,2,2,0,1,0,2,0,2,0,2,1,1,2,1,1,2,2,2,0,1,2,1,0,2,2,2,2,2,1,1,2,1,0,2,2,2],
    [2,1,0,1,0,0,0,1,0,2,0,1,0,0,0,1,0,0,0,2,0,0,0,1,0,0,0,2,0,0,0,0,0,0,0,2,0,1,1,1],
    [1,1,0,2,0,2,2,2,0,1,0,2,0,1,0,2,0,2,0,1,0,1,2,2,1,2,2,1,0,1,1,1,1,2,0,1,0,2,1,1],
    [2,2,0,0,0,2,0,0,0,0,0,0,0,1,0,1,0,2,0,1,0,0,0,0,5,1,0,0,0,0,0,1,0,0,0,2,0,2,2,1],
    [1,1,0,1,2,2,0,2,2,1,2,1,0,1,0,2,0,1,0,2,0,1,2,1,0,1,0,2,2,1,0,2,0,1,2,2,0,1,1,2],
    [1,2,0,0,0,0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,2,1,1],
    [1,1,0,2,1,2,0,2,1,1,2,2,2,2,2,1,0,1,1,2,0,1,0,2,0,2,0,2,0,1,1,2,2,1,2,1,0,2,1,1],
    [2,2,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,2,0,2,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,0,0,2,1,2],
    [2,1,0,2,1,1,1,1,0,1,0,1,0,1,0,2,2,1,0,2,2,1,2,1,0,2,0,2,0,2,0,2,2,1,0,1,1,2,1,1],
    [2,1,0,0,0,0,0,1,0,0,0,0,0,2,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,2,0,0,0,1,0,0,0,1,2,1],
    [2,1,2,1,2,2,0,1,2,1,1,1,0,2,0,2,0,2,2,1,2,1,2,2,0,1,0,1,1,2,2,1,0,1,2,1,0,2,2,1],
    [1,2,0,0,0,1,0,0,0,0,0,1,0,1,0,1,0,2,0,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,1,0,1,2,2],
    [2,2,0,1,0,2,0,1,2,1,0,2,0,2,0,2,2,2,0,2,1,2,0,2,0,1,2,2,1,1,0,2,2,1,0,1,0,2,1,2],
    [2,2,0,1,0,0,0,2,0,2,0,1,0,1,0,2,0,0,0,1,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,1,0,1,1,1],
    [2,2,0,1,2,2,2,2,0,1,0,1,0,1,0,2,0,1,1,2,0,1,1,2,2,2,0,2,0,2,0,2,0,2,0,1,0,1,1,1],
    [2,1,0,2,0,0,5,0,0,0,0,1,0,1,0,0,0,2,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,1,0,2,0,2,2,2],
    [2,2,0,2,2,1,0,1,0,1,1,1,0,1,0,8,0,1,0,1,0,1,0,2,0,1,0,1,2,1,0,1,0,2,0,2,1,2,2,1],
    [1,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,2,0,2,0,0,5,1,0,0,0,0,0,2,5,0,0,1,1,2],
    [2,1,0,2,0,1,1,2,0,2,2,2,1,2,0,2,0,2,2,1,0,1,0,1,0,2,2,1,2,2,2,1,2,2,2,2,0,1,1,2],
    [1,2,0,0,0,2,0,0,0,2,0,0,0,1,0,0,0,1,0,0,0,2,0,2,0,1,0,0,0,2,0,0,0,0,0,2,0,2,2,2],
    [1,1,0,2,1,2,0,1,1,1,0,1,0,2,0,1,2,2,0,2,1,1,0,1,0,1,0,2,0,2,0,2,0,1,0,1,0,1,1,2],
    [2,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,2,0,0,0,0,0,2],
    [2,2,1,2,1,1,1,2,2,1,1,1,8,1,1,1,1,2,1,2,2,2,1,1,2,2,1,1,1,2,2,1,1,2,2,2,0,0,0,1],
    [1,2,2,2,2,1,1,2,1,1,2,2,2,2,2,1,2,1,1,1,1,2,2,2,1,2,1,2,1,1,1,2,2,2,2,2,0,0,7,2],
    [1,2,1,2,2,1,2,2,2,1,2,1,1,2,2,1,2,1,1,2,2,1,1,1,2,1,2,2,1,1,2,2,2,1,1,1,2,2,1,2]
  ],
  playerStart: { x: 1.5, y: 1.5, angle: -Math.PI/2 },
  enemies: [
    { x: 8.5, y: 13.5, type: 'ghost', variant: 'green', patrol: [{x:8,y:13},{x:6,y:13},{x:6,y:11},{x:8,y:11}] },
    { x: 22.5, y: 10.5, type: 'ghost', variant: 'green', patrol: [{x:22,y:10},{x:20,y:10},{x:20,y:8},{x:22,y:8}] },
    { x: 36.5, y: 15.5, type: 'ghost', variant: 'red', patrol: [{x:36,y:15},{x:34,y:15},{x:34,y:13},{x:36,y:13}] },
    { x: 10.5, y: 14.5, type: 'ghost', variant: 'green', patrol: [{x:10,y:14},{x:8,y:14},{x:8,y:12},{x:10,y:12}] },
    { x: 20.5, y: 16.5, type: 'ghost', variant: 'green', patrol: [{x:20,y:16},{x:18,y:16},{x:18,y:14},{x:20,y:14}] },
    { x: 31.5, y: 8.5, type: 'ghost', variant: 'red', patrol: [{x:31,y:8},{x:29,y:8},{x:29,y:6},{x:31,y:6}] },
    { x: 34.5, y: 4.5, type: 'ghost', variant: 'boss', patrol: [{x:34,y:4},{x:32,y:4},{x:32,y:2},{x:34,y:2}], boss: true },
  ],
  items: [
    { x: 28.5, y: 9.5, type: 'key', subtype: 'gold' },
    { x: 20.5, y: 4.5, type: 'key', subtype: 'silver' },
    { x: 21.5, y: 20.5, type: 'key', subtype: 'crystal' },
    { x: 21.5, y: 20.5, type: 'key', subtype: 'gold' },
    { x: 33.5, y: 2.5, type: 'key', subtype: 'silver' },
    { x: 24.5, y: 6.5, type: 'key', subtype: 'crystal' },
    { x: 4.5, y: 28.5, type: 'coin' },
    { x: 30.5, y: 23.5, type: 'coin' },
    { x: 10.5, y: 10.5, type: 'coin' },
    { x: 34.5, y: 31.5, type: 'coin' },
    { x: 30.5, y: 30.5, type: 'health' },
    { x: 11.5, y: 22.5, type: 'health' },
    { x: 26.5, y: 16.5, type: 'health' },
    { x: 36.5, y: 4.5, type: 'torch' },
    { x: 30.5, y: 19.5, type: 'torch' },
  ],
  doors: [
    { x: 24, y: 18, keyType: 'gold' },
    { x: 26, y: 32, keyType: 'silver' },
    { x: 8, y: 8, keyType: 'crystal' },
    { x: 6, y: 30, keyType: 'gold' },
    { x: 34, y: 32, keyType: 'silver' },
    { x: 36, y: 10, keyType: 'crystal' },
  ],
  exit: { x: 38, y: 38 },
  exitColor: '白色 🤍',
});

// ============================================================
// Game State
// ============================================================

class Game {
  constructor() {
    this.currentFloor = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.keys = {};
    this.score = 0;
    this.torchTimer = 0;
    this.invincibleTimer = 0;
    this.gameOver = false;
    this.gameWon = false;
    this.messages = [];
    this.messageTimer = 0;
    this.floorTransition = false;
    this.transitionTimer = 0;

    this._loadFloor(0);
  }

  _loadFloor(index) {
    if (index >= FLOORS.length) {
      this.gameWon = true;
      return;
    }
    const floor = FLOORS[index];
    this.currentFloor = index;
    this.map = floor.map.map(row => [...row]);
    this.engine = new RaycastEngine(this.map);

    // Player
    this.player = {
      x: floor.playerStart.x,
      y: floor.playerStart.y,
      dirX: Math.cos(floor.playerStart.angle),
      dirY: Math.sin(floor.playerStart.angle),
      planeX: -Math.sin(floor.playerStart.angle) * 0.66,
      planeY: Math.cos(floor.playerStart.angle) * 0.66,
      angle: floor.playerStart.angle,
      pitch: 0,
      moveSpeed: 3.5,
      rotSpeed: 2.5,
    };

    // Enemies (deep copy)
    this.enemies = floor.enemies.map(e => ({
      ...e,
      alive: true,
      patrolIndex: 0,
      patrolDir: 1,
      damageTimer: 0,
      x: e.x, y: e.y
    }));

    // Items (collectible)
    this.items = floor.items.map(i => ({
      ...i,
      collected: false
    }));

    // Doors
    this.doors = floor.doors.map(d => ({ ...d, open: false }));

    // Exit
    this.exit = floor.exit;

    // Reset keys for each floor (or carry over? Let's reset)
    this.keys = {};

    this.addMessage(`🏚️ ${floor.name}`, 180);
    this.floorTransition = true;
    this.transitionTimer = 90; // 1.5 seconds at 60fps
  }

  // ---- Update ----
  update(dt, input) {
    if (this.gameOver || this.gameWon) return;
    if (this.floorTransition) {
      this.transitionTimer--;
      if (this.transitionTimer <= 0) this.floorTransition = false;
      return;
    }

    // Timers
    if (this.torchTimer > 0) this.torchTimer -= dt;
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    if (this.messageTimer > 0) {
      this.messageTimer -= dt;
      if (this.messageTimer <= 0) this.messages.shift();
    }

    // Player movement
    this._movePlayer(dt, input);
    // Player interaction (E key)
    if (input.use && !input._prevUse) {
      this._interact();
    }
    input._prevUse = input.use;

    // Update enemies
    this._updateEnemies(dt);

    // Check item pickup
    this._checkItemPickup();

    // Check exit
    this._checkExit();
  }

  _movePlayer(dt, input) {
    const p = this.player;
    const moveStep = p.moveSpeed * dt;
    const rotStep = p.rotSpeed * dt;

    // Rotation
    if (input.left) {
      const cos = Math.cos(-rotStep), sin = Math.sin(-rotStep);
      const oldDirX = p.dirX, oldPlaneX = p.planeX;
      p.dirX = p.dirX * cos - p.dirY * sin;
      p.dirY = oldDirX * sin + p.dirY * cos;
      p.planeX = p.planeX * cos - p.planeY * sin;
      p.planeY = oldPlaneX * sin + p.planeY * cos;
    }
    if (input.right) {
      const cos = Math.cos(rotStep), sin = Math.sin(rotStep);
      const oldDirX = p.dirX, oldPlaneX = p.planeX;
      p.dirX = p.dirX * cos - p.dirY * sin;
      p.dirY = oldDirX * sin + p.dirY * cos;
      p.planeX = p.planeX * cos - p.planeY * sin;
      p.planeY = oldPlaneX * sin + p.planeY * cos;
    }

    // Mouse looking
    if (input.mouseX !== undefined && input.mouseX !== 0) {
      const mRot = input.mouseX * 0.003;
      const cos = Math.cos(mRot), sin = Math.sin(mRot);
      const oldDirX = p.dirX, oldPlaneX = p.planeX;
      p.dirX = p.dirX * cos - p.dirY * sin;
      p.dirY = oldDirX * sin + p.dirY * cos;
      p.planeX = p.planeX * cos - p.planeY * sin;
      p.planeY = oldPlaneX * sin + p.planeY * cos;
    }

    // Forward/backward
    if (input.forward) {
      const newX = p.x + p.dirX * moveStep;
      const newY = p.y + p.dirY * moveStep;
      if (this._canMoveTo(newX, p.y)) p.x = newX;
      if (this._canMoveTo(p.x, newY)) p.y = newY;
    }
    if (input.backward) {
      const newX = p.x - p.dirX * moveStep;
      const newY = p.y - p.dirY * moveStep;
      if (this._canMoveTo(newX, p.y)) p.x = newX;
      if (this._canMoveTo(p.x, newY)) p.y = newY;
    }

    // Strafe
    if (input.strafeLeft) {
      const newX = p.x - p.planeX * moveStep * 0.6;
      const newY = p.y - p.planeY * moveStep * 0.6;
      if (this._canMoveTo(newX, p.y)) p.x = newX;
      if (this._canMoveTo(p.x, newY)) p.y = newY;
    }
    if (input.strafeRight) {
      const newX = p.x + p.planeX * moveStep * 0.6;
      const newY = p.y + p.planeY * moveStep * 0.6;
      if (this._canMoveTo(newX, p.y)) p.x = newX;
      if (this._canMoveTo(p.x, newY)) p.y = newY;
    }
  }

  _canMoveTo(x, y) {
    const margin = 0.2;
    const checks = [
      [x + margin, y + margin], [x - margin, y + margin],
      [x + margin, y - margin], [x - margin, y - margin]
    ];
    for (const [cx, cy] of checks) {
      const mx = Math.floor(cx), my = Math.floor(cy);
      if (my < 0 || my >= this.map.length || mx < 0 || mx >= this.map[0].length) return false;
      const cell = this.map[my][mx];
      if (cell > 0 && cell !== 6) return false; // Wall or closed door
    }
    return true;
  }

  _updateEnemies(dt) {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Chase player if close enough and visible
      const chaseRange = enemy.boss ? 12 : 8;
      if (dist < chaseRange && this.engine.hasLineOfSight(enemy.x, enemy.y, this.player.x, this.player.y)) {
        // Chase
        const speed = (enemy.boss ? 1.5 : enemy.variant === 'red' ? 1.2 : 0.8) * dt;
        const nx = enemy.x + (dx / dist) * speed;
        const ny = enemy.y + (dy / dist) * speed;
        if (this._canMoveTo(nx, ny)) {
          enemy.x = nx; enemy.y = ny;
        } else if (this._canMoveTo(nx, enemy.y)) {
          enemy.x = nx;
        } else if (this._canMoveTo(enemy.x, ny)) {
          enemy.y = ny;
        }
      } else if (enemy.patrol && enemy.patrol.length > 0) {
        // Patrol
        const target = enemy.patrol[enemy.patrolIndex];
        const tdx = target.x + 0.5 - enemy.x;
        const tdy = target.y + 0.5 - enemy.y;
        const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
        if (tdist < 0.3) {
          enemy.patrolIndex += enemy.patrolDir;
          if (enemy.patrolIndex >= enemy.patrol.length) {
            enemy.patrolIndex = enemy.patrol.length - 2;
            enemy.patrolDir = -1;
          } else if (enemy.patrolIndex < 0) {
            enemy.patrolIndex = 1;
            enemy.patrolDir = 1;
          }
        } else {
          const speed = 0.5 * dt;
          const nx = enemy.x + (tdx / tdist) * speed;
          const ny = enemy.y + (tdy / tdist) * speed;
          if (this._canMoveTo(nx, ny)) {
            enemy.x = nx; enemy.y = ny;
          }
        }
      }

      // Collision damage
      if (dist < 0.5 && enemy.damageTimer <= 0 && this.invincibleTimer <= 0) {
        const dmg = enemy.boss ? 25 : enemy.variant === 'red' ? 15 : 10;
        this.health -= dmg;
        enemy.damageTimer = 60; // 1 second cooldown
        this.invincibleTimer = 0.5;
        this.addMessage(`💀 受到 ${dmg} 点伤害!`, 90);

        // Knockback
        const kbDist = 0.5;
        const kbx = this.player.x + (dx / dist) * kbDist;
        const kby = this.player.y + (dy / dist) * kbDist;
        if (this._canMoveTo(kbx, kby)) {
          this.player.x = kbx; this.player.y = kby;
        }

        if (this.health <= 0) {
          this.health = 0;
          this.gameOver = true;
          this.addMessage('💀 被妖怪包围了...', 300);
        }
      }
      if (enemy.damageTimer > 0) enemy.damageTimer--;
    }
  }

  _checkItemPickup() {
    const p = this.player;
    for (const item of this.items) {
      if (item.collected) continue;
      const dx = p.x - item.x, dy = p.y - item.y;
      if (Math.sqrt(dx * dx + dy * dy) < 0.5) {
        item.collected = true;
        switch (item.type) {
          case 'key':
            this.keys[item.subtype] = (this.keys[item.subtype] || 0) + 1;
            this.addMessage(`🔑 获得 ${item.subtype === 'gold' ? '金' : item.subtype === 'silver' ? '银' : '水晶'} 钥匙!`, 120);
            break;
          case 'health':
            this.health = Math.min(this.maxHealth, this.health + 25);
            this.addMessage('❤️ +25 生命值!', 90);
            break;
          case 'torch':
            this.torchTimer = 30;
            this.addMessage('🔥 灯笼罩点亮了! 视野扩大 30秒', 120);
            break;
          case 'coin':
            this.score += 100;
            this.addMessage('💰 +100 金币!', 60);
            break;
        }
      }
    }
  }

  _interact() {
    const p = this.player;
    // Check if player is facing a door
    const checkDist = 1.5;
    const cx = p.x + p.dirX * checkDist;
    const cy = p.y + p.dirY * checkDist;
    const mx = Math.floor(cx), my = Math.floor(cy);

    if (my >= 0 && my < this.map.length && mx >= 0 && mx < this.map[0].length) {
      const cell = this.map[my][mx];
      if (cell === 5) {
        // Locked door - check for key
        const door = this.doors.find(d => d.x === mx && d.y === my);
        if (door && this.keys[door.keyType] > 0) {
          this.keys[door.keyType]--;
          door.open = true;
          this.map[my][mx] = 6; // Change to open door
          this.engine = new RaycastEngine(this.map); // Refresh engine
          this.addMessage(`🚪 门已打开!`, 90);
        } else if (door) {
          this.addMessage(`🔒 需要 ${door.keyType === 'gold' ? '金' : door.keyType === 'silver' ? '银' : '水晶'} 钥匙!`, 90);
        }
      }
    }
  }

  _checkExit() {
    const p = this.player;
    if (!this.exit) return;
    const dx = p.x - (this.exit.x + 0.5);
    const dy = p.y - (this.exit.y + 0.5);
    if (Math.sqrt(dx * dx + dy * dy) < 0.8) {
      this.score += 500;
      if (this.currentFloor + 1 >= FLOORS.length) {
        this.gameWon = true;
        this.addMessage('🏆 你逃出了古堡!', 600);
      } else {
        this.addMessage(`⬇️ 进入下一层...`, 60);
        this._loadFloor(this.currentFloor + 1);
      }
    }
  }

  addMessage(text, duration) {
    this.messages.push(text);
    this.messageTimer = Math.max(this.messageTimer, duration / 60);
    if (this.messages.length > 5) this.messages.shift();
  }

  // Get sprites for rendering (enemies + items)
  getSprites() {
    const sprites = [];
    for (const enemy of this.enemies) {
      if (enemy.alive) sprites.push(enemy);
    }
    for (const item of this.items) {
      if (!item.collected) sprites.push(item);
    }
    if (this.exit) {
      sprites.push({ ...this.exit, x: this.exit.x + 0.5, y: this.exit.y + 0.5, type: 'exit' });
    }
    return sprites;
  }

  getTorchMultiplier() {
    return this.torchTimer > 0 ? 1.5 : 1.0;
  }
}
