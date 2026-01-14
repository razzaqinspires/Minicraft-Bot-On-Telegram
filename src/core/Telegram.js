// src/core/Telegram.js
import { Telegraf } from 'telegraf';
import { SystemBus } from './EventBus.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper untuk __dirname di ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Interface {
    constructor(token, authorizedChatId, mcController) {
        this.bot = new Telegraf(token);
        this.chatId = authorizedChatId;
        this.mcController = mcController; // Class GameManager (dari file lain)
        this.bus = new SystemBus();
        
        this.initializeSystem();
    }

    // --- LOADER CANGGIH (Recursive Module Loader) ---
    async loadModules() {
        const modulesPath = path.join(__dirname, '../modules');
        
        // Fungsi rekursif untuk scan semua sub-folder
        const scanDir = async (dir) => {
            const files = fs.readdirSync(dir);
            
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    await scanDir(fullPath); // Masuk ke dalam folder (admin, gameplay, dll)
                } else if (file.endsWith('.mod.js')) {
                    // KITA TEMUKAN MODULE!
                    console.log(`[LOADER] Menginstall modul: ${file}`);
                    
                    // Dynamic Import
                    const module = await import(fullPath);
                    
                    // Jalankan fungsi 'install' yang ada di modul tersebut
                    if (module.install) {
                        module.install(this.bus, this.mcController);
                    }
                }
            }
        };

        await scanDir(modulesPath);
        console.log(`[LOADER] Selesai. Total perintah: ${this.bus.registry.size}`);
    }

    async initializeSystem() {
        // 1. Load semua plugin/modul
        await this.loadModules();

        // 2. Handle Pesan Masuk
        this.bot.on('text', async (ctx) => {
            if (String(ctx.chat.id) !== String(this.chatId)) return; // Security

            const text = ctx.message.text;
            
            // Routing Perintah
            if (text.startsWith('/')) {
                const trigger = text.split(' ')[0].replace('/', '');
                
                // Siapkan "Services" untuk dipassing ke command
                const services = {
                    mc: this.mcController.mcBot,     // Akses ke bot MC
                    isMcRunning: this.mcController.isRunning,
                    controller: this.mcController,   // Akses ke fungsi start/stop
                    telegram: ctx                    // Akses ke chat
                };

                const handled = await this.bus.execute(trigger, ctx, services);
                if (!handled) {
                    // ctx.reply('❓ Perintah tidak dikenal.');
                }
            } else {
                // Chat biasa -> Forward ke MC jika nyala
                if (this.mcController.isRunning && this.mcController.mcBot) {
                    this.mcController.mcBot.chat(`[Owner] ${text}`);
                }
            }
        });
        
        // 3. HANDLE TOMBOL / CALLBACK (TAMBAHKAN INI!) 🟢
        this.bot.on('callback_query', async (ctx) => {
            const action = ctx.callbackQuery.data;
            await ctx.answerCbQuery(); // Hilangkan loading di tombol

            // Security Check
            if (String(ctx.chat.id) !== String(this.chatId)) return;

            // Siapkan Services
            const services = {
                mc: this.mcController.mcBot,
                isMcRunning: this.mcController.isRunning,
                controller: this.mcController,
                telegram: ctx
            };

            // A. Handle System Action (Start/Stop)
            if (action === 'sys_start') {
                if (services.isMcRunning) return ctx.reply('⚠️ Mesin sudah nyala.');
                await ctx.reply('⚡ Menginisialisasi Protokol Start...');
                this.mcController.start();
                // Refresh Menu (Opsional: Kirim menu baru setelah beberapa detik)
                return;
            }
            
            if (action === 'sys_stop') {
                if (!services.isMcRunning) return ctx.reply('⚠️ Mesin sudah mati.');
                await ctx.reply('🛑 Mematikan sistem...');
                this.mcController.stop();
                return;
            }

            // B. Handle Command Redirect (cmd_xxx -> execute command xxx)
            if (action.startsWith('cmd_')) {
                const commandTrigger = action.replace('cmd_', '');
                console.log(`[BTN] Tombol ditekan, menjalankan: /${commandTrigger}`);
                
                // Panggil eksekusi command seolah-olah user mengetik manual
                await this.bus.execute(commandTrigger, ctx, services);
            }

            // C. Handle Menu Navigation (menu_xxx)
            if (action === 'menu_mining') {
                ctx.reply('⛏️ **Menu Mining**\nKetik manual: /mine <blok> <jumlah>\nAtau /tunnel <panjang>');
            }
        });
    }

    start() {
        this.bot.launch();
        console.log('✅ Interface Telegram Aktif.');
    }
}
