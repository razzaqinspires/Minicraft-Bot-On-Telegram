// src/modules/gameplay/main.mod.js

export const install = (bus) => {

    // --- GAMEPLAY COMMANDS ---

    bus.registerCommand('mine', {
        category: 'GAMEPLAY',
        description: '/mine <blok> <jumlah>',
        requireEngine: true
    }, async (ctx, services) => {
        const parts = ctx.message.text.split(' ');
        const block = parts[1];
        const count = parseInt(parts[2]) || 1;
        
        ctx.reply(`⛏️ Memerintahkan bot menambang ${count} ${block}...`);
        const res = await services.mc.mine(block, count); // Memanggil fungsi dari MinecraftBot.js lama
        ctx.reply(res);
    });

    bus.registerCommand('build', {
        category: 'GAMEPLAY',
        description: '/build house',
        requireEngine: true
    }, async (ctx, services) => {
        const type = ctx.message.text.split(' ')[1];
        if (type === 'house') {
            ctx.reply('🏠 Mulai membangun rumah...');
            const res = await services.mc.buildSimpleHouse();
            ctx.reply(res);
        } else {
            ctx.reply('Hanya support: /build house');
        }
    });

    bus.registerCommand('guard', {
        category: 'COMBAT',
        description: 'Mode Penjaga',
        requireEngine: true
    }, async (ctx, services) => {
        ctx.reply('🛡️ Guard Mode Aktif.');
        services.mc.guard();
    });

    bus.registerCommand('ss', {
        category: 'VISUAL',
        description: 'Ambil Screenshot',
        requireEngine: true
    }, async (ctx, services) => {
        ctx.reply('📸 Mengambil foto satelit...');
        try {
            const buffer = await services.mc.getMapScreenshot(32);
            ctx.replyWithPhoto({ source: buffer }, { caption: '📍 Posisi Terkini' });
        } catch (e) {
            ctx.reply('Gagal SS: ' + e.message);
        }
    });
    
    // --- INFO COMMANDS ---
    
    bus.registerCommand('info', { category: 'INFO', requireEngine: true }, async (ctx, services) => {
        ctx.reply(services.mc.getInfo());
    });
    
    bus.registerCommand('inv', { category: 'INFO', requireEngine: true }, async (ctx, services) => {
        ctx.reply(services.mc.getInventory());
    });

};