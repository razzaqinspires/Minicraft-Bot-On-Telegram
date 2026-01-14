// src/core/App.js
import 'dotenv/config'; // Load .env paling pertama!
import { GameManager } from './GameManager.js';
import { Interface } from './Telegram.js';

class Application {
    constructor() {
        console.clear();
        console.log('🚀 INITIALIZING TESLA RADIX SYSTEM...');

        // 1. Siapkan Controller Minecraft
        this.gameManager = new GameManager();

        // 2. Siapkan Interface Telegram (Inject Manager ke dalamnya)
        this.telegram = new Interface(
            process.env.TELEGRAM_BOT_TOKEN,
            process.env.TELEGRAM_CHAT_ID,
            this.gameManager // Dependency Injection
        );
    }

    async boot() {
        // A. Start Telegram Interface (Loader Modules jalan di sini)
        this.telegram.start();

        // B. Cek Config: Apakah MC harus langsung nyala?
        if (process.env.ENABLE_MC === 'true') {
            console.log('⚙️ Config: Auto-Start Enabled.');
            await this.gameManager.start();
        } else {
            console.log('💤 Config: Auto-Start Disabled (Standby Mode).');
        }

        // C. Event Wiring Global (Opsional: Logging terpusat)
        this.gameManager.on('mc:connected', () => {
            this.telegram.bot.telegram.sendMessage(this.telegram.chatId, '✅ **Engine Online**: Terhubung ke Server.');
        });
        
        this.gameManager.on('mc:disconnected', (reason) => {
            this.telegram.bot.telegram.sendMessage(this.telegram.chatId, `⚠️ **Engine Offline**: ${reason}`);
        });

        // Handle Graceful Shutdown (Ctrl+C)
        process.on('SIGINT', async () => {
            console.log('\n🔴 SYSTEM SHUTDOWN INITIATED...');
            await this.gameManager.stop();
            console.log('👋 Goodbye.');
            process.exit(0);
        });
    }
}

// --- EXECUTE ---
const app = new Application();
app.boot().catch(err => console.error('FATAL ERROR:', err));