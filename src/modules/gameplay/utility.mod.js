// PERBAIKAN IMPORT: Gunakan default import untuk CommonJS module
import pathfinderPkg from 'mineflayer-pathfinder';
const { goals } = pathfinderPkg; 

export const install = (bus) => {

    // 1. Perintah Datang (Come)
    bus.registerCommand('come', {
        category: 'UTILITY',
        description: 'Menyuruh bot datang ke lokasimu',
        requireEngine: true
    }, async (ctx, services) => {
        const targetName = ctx.message.text.split(' ')[1]; // Ambil nama dari argumen
        
        // Validasi input
        if (!targetName) return ctx.reply('⚠️ Format: /come <nama_player>');

        const bot = services.mc.bot;
        const target = bot.players[targetName]?.entity;

        if (!target) return ctx.reply(`❌ Player '${targetName}' tidak ditemukan atau terlalu jauh.`);

        ctx.reply(`🏃 Otw lari ke tempat ${targetName}...`);
        
        // Menggunakan 'goals' yang sudah di-import dengan benar di atas
        bot.pathfinder.setGoal(new goals.GoalFollow(target, 1), true);
    });

    // 2. Perintah Buang Barang (Drop All)
    bus.registerCommand('dropall', {
        category: 'UTILITY',
        description: 'Membuang semua isi inventory',
        requireEngine: true
    }, async (ctx, services) => {
        const bot = services.mc.bot;
        if (bot.inventory.items().length === 0) return ctx.reply('🎒 Tas kosong.');

        ctx.reply('🗑️ Membuang semua barang...');
        const items = bot.inventory.items();
        
        // Loop async untuk buang satu-satu
        for (const item of items) {
            try {
                await bot.tossStack(item);
            } catch (e) {}
        }
        ctx.reply('✅ Tas sudah kosong!');
    });

    // 3. Stop Total (Panic Button)
    bus.registerCommand('stop', {
        category: 'UTILITY',
        description: 'Hentikan semua aksi',
        requireEngine: true
    }, async (ctx, services) => {
        services.mc.stop(); // Panggil fungsi stop di class MinecraftBot
        ctx.reply('🛑 Bot berhenti total (Idle).');
    });
};