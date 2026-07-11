// ============================================================
// Raycasting Engine — Anime/Manga Style
// Cel-shading, outlines, cherry blossoms, anime sky
// ============================================================

const RENDER_W = 640;
const RENDER_H = 400;

class RaycastEngine {
  constructor(map) {
    this.map = map;
    this.mapW = map[0].length;
    this.mapH = map.length;
    this.screenW = RENDER_W;
    this.screenH = RENDER_H;
    this.textures = {};
    this.particles = [];
    this._generateTextures();
    this._initParticles();
    this.frameCount = 0;
  }

  // ---- Cel-shading brightness ----
  static celShade(dist, torchMul) {
    const d = dist / torchMul;
    // Anime posterization: 5 distinct shade bands for hand-drawn look
    if (d < 2.2) return 1.0;
    if (d < 4.5) return 0.82;
    if (d < 8) return 0.60;
    if (d < 14) return 0.35;
    if (d < 22) return 0.18;
    return 0.08;
  }

  // ---- Cherry blossom particles ----
  _initParticles() {
    this.particles = [];
    for (let i = 0; i < 120; i++) {
      const type = Math.random() < 0.15 ? 'sparkle' : (Math.random() < 0.15 ? 'leaf' : 'petal');
      const sz = type === 'sparkle' ? 1 + Math.random() * 2 : (type === 'leaf' ? 2 + Math.random() * 4 : 3 + Math.random() * 5);
      this.particles.push({
        x: Math.random() * this.screenW,
        y: Math.random() * this.screenH * 0.7,
        vx: (Math.random() - 0.5) * (0.4 + Math.random() * 0.8),
        vy: 0.2 + Math.random() * 1.0,
        size: sz,
        alpha: 0.2 + Math.random() * 0.8,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04,
        life: 200 + Math.random() * 700,
        type: type,
      });
    }
  }

  updateParticles() {
    for (const p of this.particles) {
      p.x += p.vx + Math.sin(p.life * 0.015 + p.x * 0.1) * 0.4;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.life--;
      if (p.life <= 0 || p.y > this.screenH + 20 || p.x < -20 || p.x > this.screenW + 20) {
        p.x = Math.random() * this.screenW;
        p.y = -10 - Math.random() * 100;
        p.vx = (Math.random() - 0.5) * (0.4 + Math.random() * 0.8);
        p.vy = 0.2 + Math.random() * 1.0;
        p.life = 200 + Math.random() * 700;
      }
    }
  }

  // ---- Procedural anime-style textures ----
  _generateTextures() {
    const texSize = 64;
    const types = [
      { name: 'stone', c1: '#E8DCC8', c2: '#D4C4A8', c3: '#C8B898', noise: 0.04 },
      { name: 'brick', c1: '#F5D6C3', c2: '#E8C4A8', c3: '#D4A888', noise: 0.03, brick: true },
      { name: 'wood', c1: '#FAEBD7', c2: '#F0DCC0', c3: '#E8D0B0', noise: 0.06, grain: true },
      { name: 'moss', c1: '#C8E6C9', c2: '#A5D6A7', c3: '#81C784', noise: 0.05 },
      { name: 'door_locked', c1: '#FF8A80', c2: '#FF5252', c3: '#D32F2F', noise: 0.04, torii: true },
      { name: 'door_open', c1: '#A5D6A7', c2: '#81C784', c3: '#4CAF50', noise: 0.04 },
      { name: 'portal', c1: '#E1BEE7', c2: '#CE93D8', c3: '#BA68C8', noise: 0.06, portal: true },
      { name: 'bars', c1: '#FFE0B2', c2: '#FFCC80', c3: '#FFB74D', noise: 0.03, bars: true },
    ];

    let s = 42;
    const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

    for (const t of types) {
      const c = document.createElement('canvas');
      c.width = c.height = texSize;
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(texSize, texSize);
      const d = img.data;
      const [r1, g1, b1] = this._hex(t.c1);
      const [r2, g2, b2] = this._hex(t.c2);
      const [r3, g3, b3] = this._hex(t.c3);

      for (let y = 0; y < texSize; y++) {
        for (let x = 0; x < texSize; x++) {
          const i = (y * texSize + x) * 4;
          let rr = r1, gg = g1, bb = b1;
          if (t.brick) {
            const by = y % 8, bx = x % 16;
            if (by < 1 || bx < 1) { rr = r3; gg = g3; bb = b3; }
            else { rr = r2; gg = g2; bb = b2; rr += Math.floor(rand() * 10 - 5); gg += Math.floor(rand() * 10 - 5); bb += Math.floor(rand() * 10 - 5); }
          } else if (t.grain) {
            rr = r2; gg = g2; bb = b2;
            const grain = Math.sin(x * 0.3 + y * 0.15) * 8;
            rr += grain; gg += grain * 0.7; bb += grain * 0.3;
            if (Math.abs(x - 32) < 1.5 || Math.abs(y - 32) < 1.5) { rr = Math.min(255, rr + 20); gg = Math.min(255, gg + 20); bb = Math.min(255, bb + 20); }
          } else if (t.portal) {
            const pulse = Math.sin((x + y) * 0.4) * 20;
            rr = r2; gg = g2; bb = b2;
            bb += pulse * 0.5; rr += pulse * 0.3; gg += pulse * 0.2;
            const dx = x - 32, dy = y - 32, dist = Math.sqrt(dx*dx+dy*dy);
            if (dist > 26 && dist < 30) { rr = 255; gg = 200; bb = 255; }
            if (dist > 14 && dist < 17) { rr = 220; gg = 180; bb = 255; }
          } else if (t.bars) {
            if ((x % 8) < 2 || (y % 8) < 2) { rr = r3; gg = g3; bb = b3; }
          } else if (t.torii) {
            if (y < 10 || y > 54 || (y > 20 && y < 28) || (y > 36 && y < 44)) { rr = r2; gg = g2; bb = b2; }
            if (x < 12 || x > 52) { rr = r1; gg = g1; bb = b1; }
          }
          const n = rand() * t.noise * 255;
          d[i]   = Math.max(0, Math.min(255, rr + n));
          d[i+1] = Math.max(0, Math.min(255, gg + n));
          d[i+2] = Math.max(0, Math.min(255, bb + n));
          d[i+3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      this.textures[t.name] = { canvas: c, ctx, data: img };
    }
  }

  _hex(h) {
    h = h.replace('#','');
    return [parseInt(h.substring(0,2),16), parseInt(h.substring(2,4),16), parseInt(h.substring(4,6),16)];
  }

  // ---- DDA Raycasting ----
  castRays(player) {
    const SW = this.screenW, SH = this.screenH;
    const zBuffer = new Float64Array(SW);
    const walls = new Array(SW);

    for (let x = 0; x < SW; x++) {
      const cameraX = 2 * x / SW - 1;
      const rayDX = player.dirX + player.planeX * cameraX;
      const rayDY = player.dirY + player.planeY * cameraX;

      let mapX = Math.floor(player.x), mapY = Math.floor(player.y);
      let sideDistX, sideDistY;
      let deltaDistX = Math.abs(1 / (rayDX || 1e-12));
      let deltaDistY = Math.abs(1 / (rayDY || 1e-12));
      let stepX, stepY, side, hit = 0;

      if (rayDX < 0) { stepX = -1; sideDistX = (player.x - mapX) * deltaDistX; }
      else { stepX = 1; sideDistX = (mapX + 1.0 - player.x) * deltaDistX; }

      if (rayDY < 0) { stepY = -1; sideDistY = (player.y - mapY) * deltaDistY; }
      else { stepY = 1; sideDistY = (mapY + 1.0 - player.y) * deltaDistY; }

      while (hit === 0) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX; mapX += stepX; side = 0;
        } else {
          sideDistY += deltaDistY; mapY += stepY; side = 1;
        }
        if (mapY < 0 || mapY >= this.mapH || mapX < 0 || mapX >= this.mapW) { hit = -1; }
        else if (this.map[mapY][mapX] > 0 && this.map[mapY][mapX] !== 6) { hit = this.map[mapY][mapX]; }
      }

      let perpWallDist;
      if (side === 0) perpWallDist = (mapX - player.x + (1 - stepX) / 2) / (rayDX || 1e-12);
      else perpWallDist = (mapY - player.y + (1 - stepY) / 2) / (rayDY || 1e-12);

      zBuffer[x] = perpWallDist;
      const lineHeight = Math.floor(SH / perpWallDist);
      const drawStart = -lineHeight / 2 + SH / 2 + player.pitch * 100;
      const drawEnd = lineHeight / 2 + SH / 2 + player.pitch * 100;

      // Wall hit X coordinate (for texturing)
      let wallX;
      if (side === 0) wallX = player.y + perpWallDist * rayDY;
      else wallX = player.x + perpWallDist * rayDX;
      wallX -= Math.floor(wallX);

      walls[x] = {
        hit, mapX, mapY, side, perpWallDist,
        lineHeight, drawStart, drawEnd, wallX
      };
    }
    return { walls, zBuffer };
  }

  // ---- Main Render Frame ----
  renderFrame(ctx, player, sprites = []) {
    const SW = this.screenW, SH = this.screenH;
    this.updateParticles();

    const { walls, zBuffer } = this.castRays(player);

    // Create image data for the whole frame
    const imgData = ctx.createImageData(SW, SH);
    const d = imgData.data;

    // ---- Draw anime sky (dramatic multi-layer gradient) ----
    const horizonY = Math.floor(SH / 2 + 5);
    for (let y = 0; y < horizonY; y++) {
      const t = y / horizonY;
      // Deep space purple -> twilight blue -> warm sunset orange -> bright horizon
      let r, g, b;
      if (t < 0.35) {
        // Deep purple/blue space
        const st = t / 0.35;
        r = Math.floor(25 + 40 * st);
        g = Math.floor(15 + 35 * st);
        b = Math.floor(70 + 60 * st);
      } else if (t < 0.65) {
        // Twilight transition
        const st = (t - 0.35) / 0.30;
        r = Math.floor(65 + 100 * st);
        g = Math.floor(50 + 70 * st);
        b = Math.floor(130 + 50 * st);
      } else if (t < 0.85) {
        // Sunset warm glow
        const st = (t - 0.65) / 0.20;
        r = Math.floor(165 + 60 * st);
        g = Math.floor(120 + 60 * st);
        b = Math.floor(180 + 10 * st - 30 * st * st);
      } else {
        // Bright horizon
        const st = (t - 0.85) / 0.15;
        r = Math.floor(225 + 30 * st);
        g = Math.floor(180 + 50 * st);
        b = Math.floor(190 + 20 * st);
      }
      for (let x = 0; x < SW; x++) {
        const idx = (y * SW + x) * 4;
        d[idx] = r; d[idx+1] = g; d[idx+2] = b; d[idx+3] = 255;
      }
    }

    // ---- Draw anime dungeon floor (checkered pattern) ----
    for (let y = Math.floor(SH / 2); y < SH; y++) {
      const t = (y - SH/2) / (SH/2);
      const fog = Math.max(0.15, 1 - t * 0.95);
      for (let x = 0; x < SW; x++) {
        const idx = (y * SW + x) * 4;
        // Create perspective checkered pattern
        const vx = (x - SW/2) / (y - SH/2 + 1);
        const vy = 1 / (y - SH/2 + 1);
        const checkX = Math.floor(vx * 60 + player.x * 8);
        const checkY = Math.floor(vy * 60 + player.y * 8);
        const isCheck = (checkX + checkY) % 2 === 0;
        const baseR = isCheck ? 160 : 110;
        const baseG = isCheck ? 120 : 80;
        const baseB = isCheck ? 90 : 60;
        d[idx]   = Math.floor(baseR * fog);
        d[idx+1] = Math.floor(baseG * fog);
        d[idx+2] = Math.floor(baseB * fog);
        d[idx+3] = 255;
      }
    }

    // ---- Draw walls with cel-shading + outlines ----
    for (let x = 0; x < SW; x++) {
      const w = walls[x];
      if (!w || w.hit <= 0) continue;

      const { hit, side, perpWallDist, lineHeight, drawStart, drawEnd, wallX } = w;

      // Get texture
      const texNames = [null, 'stone', 'brick', 'wood', 'moss', 'door_locked', null, 'portal', 'bars'];
      const texName = texNames[hit] || 'stone';
      const tex = this.textures[texName];
      if (!tex) continue;

      // Get cel-shading level
      const shade = RaycastEngine.celShade(perpWallDist, 1.0);
      const sideShade = side === 1 ? 0.85 : 1.0;
      const finalShade = shade * sideShade;

      // Check if this is a wall edge (for outline effect)
      const isEdge = (perpWallDist < 2.0);

      let texX = Math.floor(wallX * 64);
      const texCanvas = tex.canvas;
      const texCtx = texCanvas.getContext('2d');
      const texData = texCtx.getImageData(texX % 64, 0, 1, 64).data;

      for (let y = Math.max(0, Math.ceil(drawStart)); y < Math.min(SH, drawEnd); y++) {
        const idx = (y * SW + x) * 4;
        const texY = Math.floor(((y - drawStart) / lineHeight) * 64);
        const ti = (texY * 1) * 4;

        const tr = texData[ti], tg = texData[ti+1], tb = texData[ti+2];

        // Apply manga-style cel-shading with posterization
        let shade = finalShade;
        // Posterize to fewer levels for hand-drawn look
        if (shade > 0.85) shade = 0.95;
        else if (shade > 0.65) shade = 0.75;
        else if (shade > 0.40) shade = 0.50;
        else if (shade > 0.20) shade = 0.28;
        else shade = 0.12;
        
        let cr = Math.floor(tr * shade);
        let cg = Math.floor(tg * shade);
        let cb = Math.floor(tb * shade);

        // Add dark outline at wall edges for anime cel-shading effect
        if (isEdge && (y < drawStart + 5 || y > drawEnd - 5)) {
          cr = Math.floor(cr * 0.5);
          cg = Math.floor(cg * 0.5);
          cb = Math.floor(cb * 0.5);
        }
        
        // Add subtle manga horizontal line at shade transitions
        if (y > drawStart + 2 && y < drawEnd - 2 && 
            ((y - drawStart) % Math.floor(lineHeight / 5) < 2)) {
          cr = Math.floor(cr * 0.85);
          cg = Math.floor(cg * 0.85);
          cb = Math.floor(cb * 0.85);
        }

        d[idx]   = Math.max(0, Math.min(255, cr));
        d[idx+1] = Math.max(0, Math.min(255, cg));
        d[idx+2] = Math.max(0, Math.min(255, cb));
        d[idx+3] = 255;
      }

      // Draw manga-style wall edge outline (thick dark lines)
      if (drawStart > 0 && drawStart < SH) {
        const ey = Math.floor(drawStart);
        for (let ol = 0; ol < 3; ol++) {
          const oy = ey + ol;
          if (oy >= 0 && oy < SH) {
            for (let ox = -2; ox <= 2; ox++) {
              const ex = x + ox;
              if (ex >= 0 && ex < SW) {
                const idx = (oy * SW + ex) * 4;
                const alpha = ol === 0 ? 1.0 : (ol === 1 ? 0.6 : 0.25);
                d[idx]   = Math.floor(d[idx] * (1-alpha) + 15 * alpha);
                d[idx+1] = Math.floor(d[idx+1] * (1-alpha) + 8 * alpha);
                d[idx+2] = Math.floor(d[idx+2] * (1-alpha) + 20 * alpha);
              }
            }
          }
        }
      }
    }

    // ---- Draw Anime Particles (cherry blossoms, leaves, sparkles) ----
    for (const p of this.particles) {
      const px = Math.floor(p.x), py = Math.floor(p.y);
      if (px < 1 || px >= SW - 1 || py < 1 || py >= SH - 1) continue;

      if (py < SH * 0.70) {
        const s = p.size;
        const alpha = p.alpha;
        let pr, pg, pb;
        
        if (p.type === 'sparkle') {
          pr = 255; pg = 240; pb = 200; // Golden sparkle
        } else if (p.type === 'leaf') {
          pr = 180; pg = 220; pb = 150; // Green leaf
        } else {
          pr = 255; pg = 185; pb = 200; // Pink petal (default)
        }
        
        for (let dy = -Math.ceil(s); dy <= Math.ceil(s); dy++) {
          for (let dx = -Math.ceil(s); dx <= Math.ceil(s); dx++) {
            const nx = px + dx, ny = py + dy;
            if (nx < 0 || nx >= SW || ny < 0 || ny >= SH) continue;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < s) {
              const ni = (ny * SW + nx) * 4;
              const blend = alpha * Math.max(0, 1 - dist/s);
              d[ni]   = Math.floor(d[ni] * (1-blend) + pr * blend);
              d[ni+1] = Math.floor(d[ni+1] * (1-blend) + pg * blend);
              d[ni+2] = Math.floor(d[ni+2] * (1-blend) + pb * blend);
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // ---- Render Sprites (Enemies, Items) ----
    const sortedSprites = [...sprites].sort((a, b) => {
      const dA = (a.x - player.x) ** 2 + (a.y - player.y) ** 2;
      const dB = (b.x - player.x) ** 2 + (b.y - player.y) ** 2;
      return dB - dA;
    });

    for (const spr of sortedSprites) {
      let sx = spr.x - player.x, sy = spr.y - player.y;
      const invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
      const transformX = invDet * (player.dirY * sx - player.dirX * sy);
      const transformY = invDet * (-player.planeY * sx + player.planeX * sy);
      if (transformY <= 0.1) continue;

      const sprScreenX = Math.floor((SW / 2) * (1 + transformX / transformY));
      const sprH = Math.abs(Math.floor(SH / transformY)) * 0.8;
      const sprW = sprH;
      const dsY = Math.floor(-sprH / 2 + SH / 2 + player.pitch * 150);
      const dsX = Math.floor(sprScreenX - sprW / 2);

      const stripeW = Math.max(1, Math.floor(sprW / 40));
      for (let stripe = 0; stripe < sprW; stripe += stripeW) {
        const texx = stripe / sprW;
        if (stripe + dsX >= 0 && stripe + dsX < SW && transformY < zBuffer[stripe + dsX]) {
          for (let yp = 0; yp < sprH; yp++) {
            const d2 = dsY + yp;
            if (d2 < 0 || d2 >= SH) continue;
            const texy = yp / sprH;
            const [cr, cg, cb] = this._sprColor(spr, texx, texy);
            if (cr === -1) continue;
            const idx2 = (d2 * SW + stripe + dsX) * 4;
            d[idx2] = cr; d[idx2+1] = cg; d[idx2+2] = cb; d[idx2+3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  _sprColor(spr, nx, ny) {
    const cx = nx - 0.5, cy = ny - 0.5, d = Math.sqrt(cx * cx + cy * cy);

    switch (spr.type) {
      case 'ghost': {
        if (d > 0.44) return [-1,-1,-1];
        // Outlined chibi style
        if (d > 0.40) return [50,25,40];
        if (ny < 0.15 && d > 0.15) {
          if (Math.abs(cx) > 0.08 && Math.abs(cx) < 0.22) {
            if (spr.variant==='red') return [220,80,60];
            if (spr.variant==='boss') return [180,40,180];
            return [80,160,220];
          }
        }
        const ef = Math.max(0, 1 - d / 0.44);
        if (ny > 0.35 && ny < 0.50) {
          if (Math.abs(nx - 0.28) < 0.08 && ny > 0.38 && ny < 0.46) return [255,180,180];
          if (Math.abs(nx - 0.72) < 0.08 && ny > 0.38 && ny < 0.46) return [255,180,180];
        }
        if (ny > 0.22 && ny < 0.38) {
          const leftEye = Math.abs(nx - 0.35) < 0.07 && ny > 0.26 && ny < 0.36;
          const rightEye = Math.abs(nx - 0.65) < 0.07 && ny > 0.26 && ny < 0.36;
          if (leftEye || rightEye) {
            if (Math.abs(nx - (leftEye ? 0.35 : 0.65)) < 0.06 && Math.abs(ny - 0.31) < 0.04) return [255,255,255];
            if (Math.abs(nx - (leftEye ? 0.35 : 0.65)) < 0.03 && Math.abs(ny - 0.31) < 0.03) return [30,30,30];
            if (Math.abs(nx - (leftEye ? 0.33 : 0.63)) < 0.015 && Math.abs(ny - 0.29) < 0.02) return [255,255,255];
            return [60,40,40];
          }
        }
        if (ny > 0.44 && ny < 0.52 && Math.abs(nx - 0.5) < 0.1) {
          const mouthY = 0.48 + Math.sin(Math.abs(nx - 0.5) * 10) * 0.02;
          if (Math.abs(ny - mouthY) < 0.015) return [180,100,100];
        }
        const g = Math.floor(180 + 75 * ef);
        if (spr.variant==='red') return [g, Math.floor(g*0.55), Math.floor(g*0.55)];
        if (spr.variant==='boss') return [Math.floor(g*0.6), Math.floor(g*0.4), g];
        return [Math.floor(g*0.6), Math.floor(g*0.85), g];
      }

      case 'key': {
        if (d > 0.32) return [-1,-1,-1];
        if (d > 0.28) return [80,80,80];
        if (d < 0.06) {
          if (Math.abs(cx) < 0.03 && Math.abs(cy) < 0.03) return [255,255,200];
          return [255,255,150];
        }
        if (ny < 0.25 && d > 0.1 && d < 0.2) {
          if (spr.subtype==='gold') return [255,200,50];
          if (spr.subtype==='silver') return [200,200,210];
          return [120,200,255];
        }
        if (spr.subtype==='gold') return [255,215,0];
        if (spr.subtype==='silver') return [180,185,195];
        return [100,180,255];
      }

      case 'health': {
        if (d > 0.28) return [-1,-1,-1];
        const hx = Math.abs(cx), hy = cy + 0.05;
        const heartVal = Math.pow(hx*hx + hy*hy - 1, 3) - hx*hx * hy*hy*hy;
        if (heartVal < 0) return [255,100,130];
        return [-1,-1,-1];
      }

      case 'torch': {
        if (d > 0.3) return [-1,-1,-1];
        if (d < 0.08) return [255,240,100];
        if (d < 0.15) return [255,200,50];
        const flicker = 0.4 + Math.random() * 0.6;
        return [Math.floor(255*flicker), Math.floor(200*flicker), Math.floor(80*flicker)];
      }

      case 'coin': {
        if (d > 0.20) return [-1,-1,-1];
        if (d < 0.05) return [255,255,180];
        return [255,220,50];
      }

      case 'exit': {
        if (d > 0.40) return [-1,-1,-1];
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.006);
        const angle = Math.atan2(cy, cx);
        const swirl = (d * 5 + angle / Math.PI) % 1;
        if (swirl < 0.3) return [Math.floor(255*pulse), Math.floor(200*pulse), 255];
        if (swirl < 0.5) return [255, Math.floor(220*pulse), Math.floor(255*pulse)];
        return [Math.floor(200*pulse), Math.floor(150*pulse), 255];
      }

      default: return [255,0,255];
    }
  }

  // ---- Line of sight ----
  hasLineOfSight(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 8);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const mx = Math.floor(x1 + dx * t), my = Math.floor(y1 + dy * t);
      if (my < 0 || my >= this.mapH || mx < 0 || mx >= this.mapW) return false;
      const c = this.map[my][mx];
      if (c > 0 && c !== 6) return false;
    }
    return true;
  }

  static get renderW() { return RENDER_W; }
  static get renderH() { return RENDER_H; }
}
