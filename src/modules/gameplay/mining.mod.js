// src/modules/gameplay/mining.mod.js

// Tidak ada export default. Kita pakai 'Named Export' untuk fungsi instalasi.
export const install = (bus) => {
    
    // 1. Command: Mining
    bus.registerCommand('mine', {
        category: 'GAMEPLAY',
        description: 'Menambang blok otomatis',
        requireEngine: true
    }, async (ctx, services) => {
        
        const parts = ctx.message.text.split(' ');
        const block = parts[1];
        const count = parts[2] || 1;

        if (!block) return ctx.reply('⚠️ Format: /mine <nama_blok> <jumlah>');

        // Panggil fungsi MC langsung dari services yang di-inject
        const result = await services.mc.mine(block, count);
        ctx.reply(result);
    });

    // 2. Command: Tunnel
    bus.registerCommand('tunnel', {
        category: 'GAMEPLAY',
        description: 'Gali terowongan',
        requireEngine: true
    }, async (ctx, services) => {
        ctx.reply('🚇 Memulai penggalian terowongan...');
        services.mc.tunnel(10);
    });

};