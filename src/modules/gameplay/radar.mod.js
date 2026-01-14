// src/modules/gameplay/radar.mod.js

export const install = (bus) => {

    // 1. Cek Koordinat
    bus.registerCommand('coords', {
        category: 'INFO',
        description: 'Cek posisi XYZ bot',
        requireEngine: true
    }, async (ctx, services) => {
        const pos = services.mc.bot.entity.position;
        ctx.reply(`📍 **Posisi Saya:**\nX: ${pos.x.toFixed(0)}\nY: ${pos.y.toFixed(0)}\nZ: ${pos.z.toFixed(0)}\nBiome: ${services.mc.bot.blockAt(pos)?.biome?.name || 'Unknown'}`);
    });

    // 2. Scan Musuh/Player
    bus.registerCommand('scan', {
        category: 'INFO',
        description: 'Radar entitas terdekat',
        requireEngine: true
    }, async (ctx, services) => {
        const bot = services.mc.bot;
        
        // Cari player lain
        const players = Object.values(bot.players)
            .filter(p => p.username !== bot.username && p.entity)
            .map(p => `👤 ${p.username} (${Math.floor(p.entity.position.distanceTo(bot.entity.position))}m)`);

        // Cari hostile mobs
        const mobs = Object.values(bot.entities)
            .filter(e => e.type === 'mob' && (e.mobType === 'Hostile' || e.mobType === 'Monsters'))
            .filter(e => e.position.distanceTo(bot.entity.position) < 20)
            .map(e => e.name); // Ambil namanya saja

        // Hitung unique mobs
        const mobCounts = {};
        mobs.forEach(x => { mobCounts[x] = (mobCounts[x] || 0) + 1; });
        const mobStr = Object.entries(mobCounts).map(([k,v]) => `💀 ${k} x${v}`).join('\n');

        let msg = `📡 **RADAR SCAN (Radius 20m)**\n\n`;
        msg += players.length ? players.join('\n') : '👤 Tidak ada player.\n';
        msg += '\n';
        msg += mobStr ? mobStr : '✅ Aman (Tidak ada monster).';

        ctx.reply(msg);
    });
};