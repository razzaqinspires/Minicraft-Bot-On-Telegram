// src/modules/admin/system.mod.js

export const install = (bus) => {
    
    // Command: Status
    bus.registerCommand('status', {
        category: 'SYSTEM',
        description: 'Cek status server',
        requireEngine: false
    }, async (ctx, services) => {
        const status = services.isMcRunning ? '🟢 ONLINE' : '🔴 OFFLINE';
        ctx.reply(`🖥️ **System Status:**\nEngine: ${status}`);
    });

    // Command: Stop
    bus.registerCommand('shutdown', {
        category: 'SYSTEM',
        description: 'Matikan Engine MC',
        requireEngine: true
    }, async (ctx, services) => {
        services.controller.stopMinecraft();
        ctx.reply('🛑 Engine dimatikan.');
    });
};