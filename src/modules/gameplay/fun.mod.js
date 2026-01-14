// src/modules/gameplay/fun.mod.js

export const install = (bus) => {

    // 1. Joget (Dance)
    bus.registerCommand('dance', {
        category: 'FUN',
        description: 'Bot berjoget ria',
        requireEngine: true
    }, async (ctx, services) => {
        ctx.reply('💃 Let\'s party!');
        const bot = services.mc.bot;
        
        // Loop joget selama 5 detik
        bot.setControlState('jump', true);
        
        let spin = 0;
        const interval = setInterval(() => {
            spin += 0.5;
            bot.look(spin, 0); // Putar kepala
            bot.swingArm(); // Pukul-pukul tangan
        }, 100);

        // Berhenti setelah 5 detik
        setTimeout(() => {
            clearInterval(interval);
            bot.setControlState('jump', false);
            bot.look(0, 0);
            ctx.reply('🥵 Huh.. capek.');
        }, 5000);
    });

    // 2. Say (Katakan Sesuatu)
    bus.registerCommand('say', {
        category: 'FUN',
        description: 'Bot bicara di chat game',
        requireEngine: true
    }, async (ctx, services) => {
        const text = ctx.message.text.replace('/say ', '');
        if (!text) return ctx.reply('Mau ngomong apa? /say Halo');
        
        services.mc.bot.chat(text);
        ctx.reply(`🗣️ Mengatakan: "${text}"`);
    });
};