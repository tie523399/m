const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { CustomError } = require('../middleware/errorHandler');

const router = express.Router();

// 從環境變數讀取配置
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

let bot;

// 初始化Bot
if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
  bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
  console.log('🤖 Telegram Bot 已成功初始化');
} else {
  console.warn('⚠️ 未提供 Telegram Bot Token 或 Chat ID，通知功能將被禁用。');
}

// --- 格式化訂單訊息 ---
function formatOrderForTelegram(order) {
  const { 
    orderNumber, customerName, customerPhone, 
    storeNumber, totalAmount, items 
  } = order;

  let message = `🔔 *新訂單通知* 🔔\n\n`;
  message += `*訂單編號:* \`${orderNumber}\`\n`;
  message += `*客戶姓名:* ${customerName}\n`;
  message += `*聯絡電話:* ${customerPhone}\n`;
  message += `*取貨門市:* ${storeNumber}\n`;
  message += `*訂單總額:* NT$ ${totalAmount}\n\n`;
  message += `*訂單內容:*\n`;
  
  if (items && items.length > 0) {
    items.forEach(item => {
      message += `- ${item.productName} (x${item.quantity}) - $${item.subtotal}\n`;
    });
  } else {
    message += `\- 項目資訊不完整\n`;
  }
  
  message += `\n---`;

  return message;
}

// --- API 路由 ---

/**
 * @swagger
 * /api/telegram/notify:
 *   post:
 *     summary: 發送訂單通知到Telegram
 *     description: (內部使用) 接收訂單資訊並透過Bot發送通知
 *     tags: [Telegram]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order' 
 *     responses:
 *       200:
 *         description: 通知發送成功
 *       500:
 *         description: Bot未初始化或發送失敗
 */
router.post('/notify', authenticateToken, async (req, res, next) => {
  if (!bot) {
    return next(new CustomError('Telegram Bot 未初始化', 500));
  }

  try {
    const order = req.body;
    const message = formatOrderForTelegram(order);

    await bot.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' });

    res.json({ success: true, message: 'Telegram 通知已發送' });

  } catch (error) {
    console.error('發送 Telegram 通知失敗:', error);
    next(new CustomError('發送 Telegram 通知失敗', 500));
  }
});

module.exports = {
  router,
  sendTelegramNotification: async (order) => {
    if (!bot) return;
    try {
      const message = formatOrderForTelegram(order);
      await bot.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('後台發送 Telegram 通知失敗:', error);
    }
  }
};