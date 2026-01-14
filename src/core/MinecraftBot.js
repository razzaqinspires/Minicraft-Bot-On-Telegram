import mineflayer from 'mineflayer';
import pathfinderPkg from 'mineflayer-pathfinder';
import collectBlockPkg from 'mineflayer-collectblock';
import toolPkg from 'mineflayer-tool';
import pvpPkg from 'mineflayer-pvp';
import { EatUtil } from 'mineflayer-auto-eat/dist/new.js';
import utilPlugin from '@nxg-org/mineflayer-util-plugin';
import { Vec3 } from 'vec3';
import { createCanvas } from 'canvas';
import { createRequire } from 'module';
import EventEmitter from 'events';

const require = createRequire(import.meta.url);
const mineflayerViewer = require('prismarine-viewer').mineflayer;

// Destructuring plugin components
const { pathfinder, Movements, goals } = pathfinderPkg;
const { plugin: collectBlock } = collectBlockPkg;
const { plugin: tool } = toolPkg;
const { plugin: pvp } = pvpPkg;

// Loader manual untuk fix bug inisialisasi auto-eat
function manualAutoEatLoader(bot) {
    const plugin = utilPlugin.default ?? utilPlugin;
    if (!bot.hasPlugin(plugin)) {
        bot.loadPlugin(plugin);
    }
    try {
        bot.autoEat = new EatUtil(bot);
    } catch (e) {
        console.error('Error creating EatUtil:', e);
    }
}

class MinecraftBot extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.bot = null;
    this.reconnectTimeout = null;
    
    // Konfigurasi Warna Peta (Hex codes)
    this.colors = {
        'grass_block': '#567C1B',
        'dirt': '#866043',
        'water': '#3F76E4',
        'sand': '#D8CF9D',
        'stone': '#7D7D7D',
        'cobblestone': '#606060',
        'oak_log': '#6B511F',
        'oak_leaves': '#3A5F25',
        'spruce_leaves': '#2E4826',
        'birch_leaves': '#5C7439',
        'lava': '#CF5B14',
        'snow': '#F0F0F0',
        'oak_planks': '#A2824E',
        'air': '#00000000'
    };
    this.defaultColor = '#9E9E9E';

    // State Auto Pilot
    this.isAutoPilot = false;
    this.autoPilotInterval = null;
    this.guardInterval = null;
    this.isBusy = false; 
  }

  connect() {
    console.log(`[MC Java] Menghubungkan ke ${this.config.host}:${this.config.port}...`);

    try {
      this.bot = mineflayer.createBot({
        host: this.config.host,
        port: parseInt(this.config.port),
        username: this.config.username,
        auth: this.config.offline ? 'offline' : 'microsoft',
        version: false, // Auto-detect
        hideErrors: false
      });

      // Load Plugins
      this.bot.loadPlugin(pathfinder);
      this.bot.loadPlugin(collectBlock);
      this.bot.loadPlugin(tool);
      this.bot.loadPlugin(pvp);
      manualAutoEatLoader(this.bot);

      this.setupEvents();
    } catch (err) {
      console.error('[MC Java] Gagal inisialisasi bot:', err);
      this.scheduleReconnect();
    }
  }

  setupEvents() {
    // 1. Spawn Event
    this.bot.on('spawn', () => {
      console.log('[MC Java] Bot berhasil spawn!');
      this.emit('connected');

      // Setup Viewer (Visualisasi Web)
      try {
        const viewerPort = parseInt(process.env.VIEWER_PORT || 3001);
        mineflayerViewer(this.bot, { port: viewerPort, firstPerson: true });
        console.log(`[Viewer] Stream aktif di port ${viewerPort}`);
      } catch (err) {
        console.log(`[Viewer] Info: ${err.message}`);
      }
    });

    // 2. Setup Auto Eat
    this.bot.autoEat.options = {
      priority: 'foodPoints',
      startAt: 14,
      bannedFood: ['rotten_flesh', 'spider_eye']
    };

    // 3. Chat Handler
    this.bot.on('chat', (username, message) => {
      if (username === this.bot.username) return;
      this.emit('chat', { sender: username, message: message });
    });

    // 4. Lifecycle Events
    this.bot.on('end', (reason) => {
      console.warn(`[MC Java] Terputus (End): ${reason}`);
      this.emit('disconnected', reason);
      this.scheduleReconnect();
    });

    this.bot.on('kicked', (reason) => {
      console.warn(`[MC Java] Kicked: ${reason}`);
    });

    this.bot.on('error', (err) => {
      console.error('[MC Java] Error Socket:', err.message);
      this.scheduleReconnect();
    });

    // 5. Smart Notifications (Health & Sleep)
    let lastHealth = 20;
    this.bot.on('health', () => {
        if (this.bot.health < lastHealth) {
            const damage = lastHealth - this.bot.health;
            if (damage > 2) { 
                 this.emit('action_update', { message: `⚠️ Terluka -${damage.toFixed(1)} HP (Sisa: ${this.bot.health.toFixed(0)})`, screenshot: null });
            }
        }
        lastHealth = this.bot.health;
    });

    this.bot.on('death', () => {
        this.emit('action_update', { message: '💀 Bot Mati! Respawning...', screenshot: null });
        this.isBusy = false;
    });

    this.bot.on('sleep', () => this.emit('action_update', { message: '💤 Bot tidur...', screenshot: null }));
    this.bot.on('wake', () => this.emit('action_update', { message: '☀️ Bangun pagi!', screenshot: null }));
  }

  // --- CORE METHODS ---

  chat(message) {
    if (this.bot && this.bot.entity) {
      this.bot.chat(message);
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimeout) return;
    
    // PERUBAHAN PENTING:
    // Kita hapus process.exit(1) agar Telegram bot TIDAK MATI saat MC disconnect.
    // Kita biarkan dia mencoba reconnect sendiri.
    
    const delay = 10000;
    console.log(`[MC Java] Mencoba reconnect dalam ${delay/1000} detik...`);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      // Cek jika bot instance masih ada (belum distop manual oleh user)
      if (this.bot) {
          this.bot.end(); // Bersihkan socket lama
          this.connect(); // Buat koneksi baru
      }
    }, delay);
  }

  stop() {
    console.log('[MC Java] Mematikan instance bot...');
    
    // 1. Stop Logika Interval
    this.stopAutoPilot();
    if (this.guardInterval) {
        clearInterval(this.guardInterval);
        this.guardInterval = null;
    }
    if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
    }

    // 2. Stop Mineflayer Actions
    if (this.bot) {
        if (this.bot.pathfinder) this.bot.pathfinder.setGoal(null);
        if (this.bot.pvp) this.bot.pvp.stop();
        
        // 3. Putus Koneksi & Hapus Event Listener
        this.bot.quit(); 
        this.bot.removeAllListeners();
        this.bot = null;
    }
    
    this.isBusy = false;
  }

  // --- HELPER METHODS ---

  async equipBestTool(blockName) {
    const block = this.bot.registry.blocksByName[blockName];
    if (!block) return;
    try {
        await this.bot.tool.equipForBlock(block, { requireHarvest: true });
    } catch (e) { /* Ignore */ }
  }

  async emitUpdate(message, withScreenshot = false) {
      let buffer = null;
      if (withScreenshot) {
          try { buffer = await this.getMapScreenshot(32); } catch (e) {}
      }
      this.emit('action_update', { message, screenshot: buffer });
  }

  // --- INFO GETTERS ---

  getInfo() {
    if (!this.bot || !this.bot.entity) return 'Bot belum spawn.';
    const pos = this.bot.entity.position;
    return `❤️ HP: ${this.bot.health.toFixed(0)} | 🍗 Food: ${this.bot.food.toFixed(0)}\n📍 Pos: ${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}, ${pos.z.toFixed(0)}`;
  }

  getPlayers() {
    if (!this.bot) return 'Offline.';
    return Object.keys(this.bot.players).join(', ') || 'Sendirian.';
  }

  getInventory() {
    if (!this.bot) return 'Offline.';
    const items = this.bot.inventory.items().map(item => `${item.name} x${item.count}`).join('\n');
    return items.length > 0 ? `🎒 Inventory:\n${items}` : '🎒 Inventory kosong.';
  }

  // --- ACTIONS: MOVEMENT & GAMEPLAY ---

  async mine(blockName, count = 1) {
    if (!this.bot) return 'Bot offline.';
    
    const blockType = this.bot.registry.blocksByName[blockName];
    if (!blockType) return `Blok '${blockName}' tidak valid.`;

    await this.equipBestTool(blockName);

    const blocks = this.bot.findBlocks({ matching: blockType.id, maxDistance: 64, count: count });
    if (blocks.length === 0) return `Tidak menemukan ${blockName} di sekitar.`;

    await this.emitUpdate(`⛏️ Menambang ${count} ${blockName}...`, true);

    try {
      const targets = blocks.map(p => this.bot.blockAt(p));
      await this.bot.collectBlock.collect(targets, { ignoreNoPath: true });
      return `✅ Selesai menambang ${blockName}.`;
    } catch (err) {
      return `❌ Gagal menambang: ${err.message}`;
    }
  }

  async buildSimpleHouse() {
    if (!this.bot) return 'Bot offline';

    const basePos = this.bot.entity.position.floored().offset(2, 0, 2);
    const materialName = 'oak_planks';
    const material = this.bot.registry.itemsByName[materialName];
    
    if (this.bot.inventory.count(material.id) < 40) {
        return `⚠️ Butuh minimal 40 ${materialName}.`;
    }

    this.emit('action_update', { message: '🏠 Membangun shelter...', screenshot: null });

    try {
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 5; x++) {
                for (let z = 0; z < 5; z++) {
                    if (x === 0 || x === 4 || z === 0 || z === 4) { // Dinding
                        if (x === 2 && z === 0 && y < 2) continue; // Pintu
                        const targetPos = basePos.offset(x, y, z);
                        if (this.bot.blockAt(targetPos).name !== 'air') continue;
                        
                        await this.bot.pathfinder.goto(new goals.GoalPlaceBlock(targetPos, this.bot.world, { range: 4 }));
                        await this.bot.equip(material.id, 'hand');
                        await this.bot.placeBlock(this.bot.blockAt(targetPos.offset(0, -1, 0)), new Vec3(0, 1, 0));
                    }
                }
            }
        }
        return '✅ Rumah selesai!';
    } catch (err) {
        return `❌ Gagal build: ${err.message}`;
    }
  }

  async guard() {
      if (!this.bot) return 'Offline';
      this.emit('action_update', { message: '🛡️ Mode Penjaga Aktif', screenshot: null });
      
      if (this.guardInterval) clearInterval(this.guardInterval);
      this.guardInterval = setInterval(() => {
          if (!this.bot || !this.bot.entity) return;
          const mob = this.bot.nearestEntity(e => e.type === 'mob' && (e.mobType === 'Hostile' || e.mobType === 'Monsters'));
          if (mob && this.bot.entity.position.distanceTo(mob.position) < 16) {
              if (!this.bot.pvp.target) this.bot.pvp.attack(mob);
          }
      }, 1000);
      return 'Sentinel Mode Activated.';
  }

  async hunt(mobName) {
      if (!this.bot) return 'Offline';
      const mob = this.bot.nearestEntity(e => e.name === mobName && e.type === 'mob');
      if (!mob) return `Tidak ada ${mobName} di dekat sini.`;
      
      this.bot.pvp.attack(mob);
      return `⚔️ Menyerang ${mobName}!`;
  }

  // --- AUTOPILOT BRAIN ---

  startAutoPilot() {
      if (!this.bot) return 'Bot offline.';
      if (this.isAutoPilot) return 'Sudah aktif.';
      
      this.isAutoPilot = true;
      this.emit('action_update', { message: '🧠 AutoPilot ON', screenshot: null });
      this.autoPilotInterval = setInterval(() => this.autoPilotStep(), 5000);
      return 'AI Activated.';
  }

  stopAutoPilot() {
      this.isAutoPilot = false;
      if (this.autoPilotInterval) clearInterval(this.autoPilotInterval);
  }

  async autoPilotStep() {
      if (!this.bot || !this.isAutoPilot || this.isBusy) return;

      // 1. Tidur saat malam
      if (!this.bot.time.isDay && !this.bot.isSleeping) {
           const bed = this.bot.findBlock({ matching: block => this.bot.isABed(block) });
           if (bed) {
               this.isBusy = true;
               try { await this.bot.sleep(bed); } catch (e) {}
               this.isBusy = false;
               return;
           }
      }

      // 2. Random Gathering jika inventory kosong
      if (this.bot.inventory.emptySlotCount() > 5) {
           const logs = this.bot.findBlock({ matching: b => b.name.includes('log'), maxDistance: 32 });
           if (logs) {
               this.isBusy = true;
               try {
                   await this.bot.collectBlock.collect(logs);
                   this.emit('action_update', { message: '🧠 AutoPilot: Mengambil kayu...', screenshot: null });
               } catch (e) {}
               this.isBusy = false;
           }
      }
  }

  // --- VISUAL SYSTEM ---

  async getMapScreenshot(radius = 16) {
    if (!this.bot || !this.bot.entity) throw new Error('Bot belum spawn.');

    const blockSize = 16;
    const size = (radius * 2 + 1) * blockSize;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, size, size);

    const pos = this.bot.entity.position.floored();

    for (let z = -radius; z <= radius; z++) {
        for (let x = -radius; x <= radius; x++) {
            let surfaceBlock = null;
            // Scan vertikal sederhana
            for (let yOffset = 10; yOffset >= -5; yOffset--) {
                 const block = this.bot.blockAt(pos.offset(x, yOffset, z));
                 if (block && block.name !== 'air' && block.name !== 'void_air') {
                     surfaceBlock = block;
                     break;
                 }
            }

            if (surfaceBlock) {
                const color = this.colors[surfaceBlock.name] || this.defaultColor;
                const drawX = (x + radius) * blockSize;
                const drawY = (z + radius) * blockSize;
                ctx.fillStyle = color;
                ctx.fillRect(drawX, drawY, blockSize, blockSize);
            }
        }
    }

    // Gambar Panah Bot
    const centerX = size / 2;
    const centerY = size / 2;
    const yaw = this.bot.entity.yaw;
    
    ctx.beginPath();
    ctx.arc(centerX + 8, centerY + 8, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
    
    // Direction Line
    ctx.beginPath();
    ctx.moveTo(centerX + 8, centerY + 8);
    ctx.lineTo(
        centerX + 8 - Math.sin(yaw) * 12,
        centerY + 8 - Math.cos(yaw) * 12
    );
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 3;
    ctx.stroke();

    return canvas.toBuffer('image/png');
  }
}

export default MinecraftBot;