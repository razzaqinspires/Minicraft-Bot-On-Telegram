// src/core/EventBus.js
import EventEmitter from 'events';

// Kita pakai Class Extension, bukan export default object biasa
export class SystemBus extends EventEmitter {
    constructor() {
        super();
        this.registry = new Map(); // Database perintah di memori
    }

    // Fungsi untuk mendaftarkan perintah dari Modul luar
    registerCommand(trigger, meta, executionFunction) {
        console.log(`[BUS] Mendaftarkan perintah: /${trigger} [${meta.category}]`);
        this.registry.set(trigger, {
            ...meta,
            exec: executionFunction
        });
    }

    // Fungsi untuk mencari dan mengeksekusi perintah
    async execute(trigger, ctx, services) {
        const cmd = this.registry.get(trigger);
        
        if (!cmd) return false; // Perintah tidak ditemukan
        
        // Middleware: Cek jika butuh Engine MC
        if (cmd.requireEngine && !services.isMcRunning) {
            ctx.reply('🔒 Engine Offline. Perintah ditolak.');
            return true;
        }

        try {
            await cmd.exec(ctx, services);
        } catch (error) {
            console.error(error);
            ctx.reply(`❌ System Fault: ${error.message}`);
        }
        return true;
    }
}