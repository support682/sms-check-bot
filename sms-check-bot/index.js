import TelegramBot from 'node-telegram-bot-api';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text?.trim();

    if (!text) {
        return bot.sendMessage(chatId, 'Будь ласка, надішліть текст для перевірки.');
    }

    try {
        // Прості правила для фільтрації
        const spamRules = [
            { regex: /100% безкоштовно/i, message: 'Фраза "100% безкоштовно" часто тригерить спам-фільтри' },
            { regex: /!!!/g, message: 'Занадто багато знаків оклику' },
            { regex: /заробіть|виграйте/i, message: 'Слова типу "заробіть", "виграйте" підвищують ризик спаму' }
        ];

        let ruleWarnings = [];
        spamRules.forEach(rule => {
            if (rule.regex.test(text)) {
                ruleWarnings.push(rule.message);
            }
        });

        // Виклик до OpenAI для оцінки ризику
        const aiResponse = await openai.responses.create({
            model: "gpt-4o-mini",
            input: `Ти експерт з SMS-маркетингу. Оціни, чи текст "${text}" може потрапити у спам. Дай короткий висновок.`
        });

        let aiMessage = aiResponse.output_text || "Не вдалося отримати відповідь від AI.";

        let finalMessage = "✅ Результат перевірки:

";
        if (ruleWarnings.length > 0) {
            finalMessage += "⚠️ Потенційні ризики:
- " + ruleWarnings.join("
- ") + "

";
        } else {
            finalMessage += "ℹ️ Правила: критичних ризиків не знайдено.

";
        }

        finalMessage += "🤖 Висновок AI:
" + aiMessage;

        bot.sendMessage(chatId, finalMessage);
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "Сталася помилка при перевірці.");
    }
});

console.log("Бот запущено та готовий до роботи.");
