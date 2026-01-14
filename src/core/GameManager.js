import MinecraftBot from './MinecraftBot.js';
import EventEmitter from 'events';

export class GameManager extends EventEmitter {
    constructor() {
        super();
        this.mcBot = null;       // Instance Bot Minecraft (mineflayer)
        this.isRunning = false;  // Status Engine
        
        // Konfigurasi dimuat dari Environment Variable (.env)
        this.config = {
            host: process.env.MC_HOST,
            port: parseInt(process.env.MC_PORT) || 25565,
            username: process.env.MC_USERNAME || 'Tesla_Bot',
            offline: process.env.MC_OFFLINE === 'true'
        };
    }

    /**
     * Menyalakan Engine Minecraft (Membuat koneksi baru)
     */
    async start() {
        if (this.isRunning) {
            console.log('⚠️ [MANAGER] Engine sudah berjalan.');
            return false; 
        }

        console.log('⚡ [MANAGER] Memulai Engine Minecraft...');
        this.isRunning = true;

        // Create FRESH Instance setiap kali start
        this.mcBot = new MinecraftBot(this.config);
        
        // --- WIRING EVENT (PENTING) ---
        // Kita meneruskan event dari bot MC ke Manager ini (Bridge)
        
        // 1. Koneksi
        this.mcBot.on('connected', () => {
            console.log('✅ [MANAGER] Terhubung ke Server!');
            this.emit('mc:connected');
        });
        
        this.mcBot.on('disconnected', (reason) => {
            console.log(`⚠️ [MANAGER] Terputus: ${reason}`);
            this.emit('mc:disconnected', reason);
        });

        // 2. Chat & Log
        this.mcBot.on('chat', (data) => {
            // data = { sender, message }
            this.emit('mc:chat', data);
        });

        // 3. Update Aksi (Status, SS, dll)
        this.mcBot.on('action_update', (data) => {
            // data = { message, screenshot }
            this.emit('mc:update', data);
        });

        // Eksekusi koneksi
        this.mcBot.connect();
        return true;
    }

    /**
     * Mematikan Engine Minecraft (Membersihkan memori)
     */
    async stop() {
        if (!this.isRunning || !this.mcBot) {
            console.log('⚠️ [MANAGER] Engine sudah mati.');
            return false;
        }

        console.log('🛑 [MANAGER] Mematikan Engine Minecraft...');
        
        try {
            // Panggil method stop() di dalam class MinecraftBot untuk bersih-bersih internal
            this.mcBot.stop(); 
        } catch (e) {
            console.error('Error saat stopping instance:', e);
        }

        // Hapus referensi agar Garbage Collector bekerja
        this.mcBot = null; 
        this.isRunning = false;
        
        this.emit('mc:stopped');
        return true;
    }

    /**
     * Restart Engine (Hot Reload)
     * Berguna jika bot nge-bug atau stuck tanpa harus matikan script utama.
     */
    async restart() {
        console.log('🔄 [MANAGER] Melakukan Restart...');
        await this.stop();
        
        // Jeda sedikit biar socket benar-benar putus
        setTimeout(() => {
            this.start();
        }, 3000);
    }
}