// src/modules/system/menu.mod.js
import { Markup } from 'telegraf';

export const install = (bus, mcController) => {

    // Helper: Generate Tampilan Menu
    const getMenuUI = (isRunning) => {
        if (isRunning) {
            // --- MENU SAAT ONLINE ---
            const statusText = `🟢 **SYSTEM ONLINE**\n\nSiap menerima perintah autonomous.`;
            const buttons = [
                [
                    Markup.button.callback('📊 Info', 'cmd_info'),
                    Markup.button.callback('🎒 Tas', 'cmd_inv'),
                    Markup.button.callback('📡 Radar', 'cmd_scan')
                ],
                [
                    Markup.button.callback('⛏️ Mine', 'menu_mining'), // Sub-menu (nanti)
                    Markup.button.callback('🛡️ Guard', 'cmd_guard'),
                    Markup.button.callback('💃 Joget', 'cmd_dance')
                ],
                [
                    Markup.button.callback('🛑 MATIKAN MESIN', 'sys_stop')
                ]
            ];
            return { text: statusText, keyboard: Markup.inlineKeyboard(buttons) };
        } else {
            // --- MENU SAAT OFFLINE ---
            const statusText = `🔴 **SYSTEM OFFLINE**\n\nMode hemat daya aktif. Mesin Minecraft mati.`;
            const buttons = [
                [Markup.button.callback('⚡ NYALAKAN MESIN', 'sys_start')],
                [Markup.button.callback('🛡️ Cek Moderasi', 'cmd_antilink_status')]
            ];
            return { text: statusText, keyboard: Markup.inlineKeyboard(buttons) };
        }
    };

    // Command: /menu
    bus.registerCommand('menu', {
        category: 'SYSTEM',
        description: 'Buka Control Panel Utama',
        requireEngine: false
    }, async (ctx, services) => {
        const ui = getMenuUI(services.isMcRunning);
        await ctx.reply(ui.text, { parse_mode: 'Markdown', ...ui.keyboard });
    });

    // Command: /start (Alias ke menu)
    bus.registerCommand('start', {
        category: 'SYSTEM',
        description: 'Start Bot',
        requireEngine: false
    }, async (ctx, services) => {
        const ui = getMenuUI(services.isMcRunning);
        await ctx.reply(`🤖 **Tesla Radix v5.2**\nHalo, ${ctx.from.first_name}!`, { parse_mode: 'Markdown' });
        await ctx.reply(ui.text, { parse_mode: 'Markdown', ...ui.keyboard });
    });

};