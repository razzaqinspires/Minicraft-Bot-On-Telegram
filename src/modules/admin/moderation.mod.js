// src/modules/admin/moderation.mod.js

// State Internal Modul (Menyimpan status saklar)
let config = {
    antilink: false,
    badword: false
};

// Daftar kata kasar (bisa ditambah)
const BAD_WORDS = ['anjing', 'babi', 'tolol', 'noob', 'goblok'];
// Regex untuk mendeteksi Link (HTTP/HTTPS/WWW)
const LINK_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\.[a-z]{2,}\/)/i;

export const install = (bus, mcController) => {

    // --- 1. PASSIVE LISTENER (Mata-mata Chat) ---
    // Logika ini berjalan otomatis setiap ada chat di Minecraft
    
    mcController.on('mc:chat', (data) => {
        const { sender, message } = data;
        const bot = mcController.mcBot;

        // Jangan menghukum diri sendiri atau pesan system
        if (!bot || sender === bot.bot.username) return;

        // A. Fitur Anti-Link
        if (config.antilink) {
            if (LINK_REGEX.test(message)) {
                console.log(`[MOD] Link terdeteksi dari ${sender}`);
                // Aksi: Kick Player (Butuh OP/Izin Server)
                bot.chat(`/kick ${sender} Dilarang mengirim link!`);
                bot.chat(`⚠️ ${sender} dikick karena mengirim link.`);
            }
        }

        // B. Fitur Bad Word
        if (config.badword) {
            const isBad = BAD_WORDS.some(word => message.toLowerCase().includes(word));
            if (isBad) {
                bot.chat(`/tell ${sender} Jaga bahasa anda!`); // Peringatan personal
                // Opsional: bot.chat(`/kick ${sender} Bad word`);
            }
        }
    });

    // --- 2. COMMANDS (Kontrol dari Telegram) ---

    // Command: Toggle Anti-Link
    bus.registerCommand('antilink', {
        category: 'ADMIN',
        description: 'ON/OFF Anti Link System',
        requireEngine: true
    }, async (ctx) => {
        const args = ctx.message.text.split(' ');
        const mode = args[1]?.toLowerCase();

        if (mode === 'on') {
            config.antilink = true;
            ctx.reply('🛡️ **Anti-Link: AKTIF**\nBot akan auto-kick player yang kirim link.');
        } else if (mode === 'off') {
            config.antilink = false;
            ctx.reply('🔓 **Anti-Link: MATI**');
        } else {
            ctx.reply(`Status Anti-Link: ${config.antilink ? 'ON' : 'OFF'}\nGunakan: /antilink <on/off>`);
        }
    });

    // Command: Kick Manual
    bus.registerCommand('kick', {
        category: 'ADMIN',
        description: '/kick <player> [alasan]',
        requireEngine: true
    }, async (ctx, services) => {
        const args = ctx.message.text.split(' ');
        const target = args[1];
        const reason = args.slice(2).join(' ') || 'Dikick oleh Admin Telegram';

        if (!target) return ctx.reply('⚠️ Format: /kick <nama_player> [alasan]');

        services.mc.chat(`/kick ${target} ${reason}`);
        ctx.reply(`👢 Mengeksekusi kick untuk: **${target}**`);
    });

    // Command: Ban Manual
    bus.registerCommand('ban', {
        category: 'ADMIN',
        description: '/ban <player> [alasan]',
        requireEngine: true
    }, async (ctx, services) => {
        const args = ctx.message.text.split(' ');
        const target = args[1];
        const reason = args.slice(2).join(' ') || 'Banned by Admin';

        if (!target) return ctx.reply('⚠️ Format: /ban <nama_player> [alasan]');

        services.mc.chat(`/ban ${target} ${reason}`);
        ctx.reply(`🔨 **BANNED:** ${target}`);
    });

    // Command: Broadcast (Pengumuman)
    bus.registerCommand('bc', {
        category: 'ADMIN',
        description: 'Kirim pengumuman mencolok',
        requireEngine: true
    }, async (ctx, services) => {
        const text = ctx.message.text.replace('/bc ', '');
        if (!text) return ctx.reply('⚠️ Masukkan pesan broadcast.');

        // Kirim pesan dengan format mencolok (biasanya pakai kode warna Minecraft §)
        // §6 = Gold, §l = Bold, §r = Reset
        services.mc.chat(`§6[📢 PENGUMUMAN]§r ${text}`);
        ctx.reply('📢 Broadcast terkirim.');
    });

    // Command: List Pemain (Tablist Lengkap)
    bus.registerCommand('list', {
        category: 'INFO',
        description: 'Lihat daftar pemain & ping',
        requireEngine: true
    }, async (ctx, services) => {
        const players = services.mc.bot.players;
        let msg = '📋 **Player List:**\n';
        
        Object.values(players).forEach(p => {
            msg += `- ${p.username} (${p.ping}ms)\n`;
        });
        
        ctx.reply(msg);
    });
};