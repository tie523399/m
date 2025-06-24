const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// 導入路由
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const flavorRoutes = require('./routes/flavors');
const orderRoutes = require('./routes/orders');
const announcementRoutes = require('./routes/announcements');
const storeRoutes = require('./routes/stores');
const telegramRoutes = require('./routes/telegram').router; // 仅获取 router
const { sendTelegramNotification } = require('./routes/telegram'); // 获取通知函数
const statsRoutes = require('./routes/stats');
const captchaRoutes = require('./routes/captcha');
const shippingRoutes = require('./routes/shipping'); // 引入 shipping 路由 // 引入 captcha 路由

// 導入中間件
const { errorHandler } = require('./middleware/errorHandler');

// 初始化數據庫
require('./utils/initDatabase')();

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中間件
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS設定
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://shiny-gecko-370b34.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分鐘
  max: 100, // 每15分鐘最多100個請求
  message: '請求過於頻繁，請稍後再試'
});
app.use('/api', limiter);

// 身體解析中間件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 将通知函数附加到app.locals
app.locals.sendTelegramNotification = sendTelegramNotification;

// Session 中間件
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-default-secret-key', // 強烈建議在 .env 中設置
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // 在生產環境中應設為 true
    httpOnly: true,
    maxAge: 10 * 60 * 1000 // 10分鐘
  }
}));

// 靜態文件服務
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/flavors', flavorRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/captcha', captchaRoutes); // 使用 captcha 路由
app.use('/api/shipping', shippingRoutes);

// 404處理
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: '找不到請求的資源' });
});

// 錯誤處理中間件
app.use(errorHandler);

// 啟動服務器
app.listen(PORT, () => {
  console.log(`🍨 義式手工冰淇淋電商系統API正在運行於 http://localhost:${PORT}`);
});

module.exports = app;
