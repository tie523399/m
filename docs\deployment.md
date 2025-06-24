# 義式手工冰淇淋電商系統 - 部署指南

## 前言
本系統採用前後端分離架構，前端部署至 Netlify，後端部署至 Railway。

## 後端部署 (Railway)

### 1. 準備工作
- 註冊 Railway 帳號
- 安裝 Railway CLI（可選）

### 2. 部署步驟
1. 在 Railway 創建新項目
2. 連接 GitHub 倉庫或上傳代碼
3. 設置環境變數：
   ```
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=your-production-jwt-secret
   FRONTEND_URL=https://your-frontend-domain.netlify.app
   TELEGRAM_BOT_TOKEN=your-telegram-bot-token
   TELEGRAM_CHAT_ID=your-telegram-chat-id
   ```
4. Railway 會自動檢測 Node.js 項目並部署

### 3. 健康檢查
部署完成後，訪問 `https://your-backend-domain.railway.app/health` 確認服務正常運行。

## 前端部署 (Netlify)

### 1. 準備工作
- 註冊 Netlify 帳號
- 確保後端已部署並取得後端 URL

### 2. 部署步驟
1. 在 Netlify 創建新站點
2. 連接 GitHub 倉庫或手動上傳
3. 設置構建配置：
   - 構建命令：`pnpm build`
   - 發布目錄：`dist`
4. 設置環境變數：
   ```
   VITE_API_URL=https://your-backend-domain.railway.app
   ```
5. 部署站點

### 3. 配置重定向
Netlify 會自動讀取 `netlify.toml` 文件中的重定向規則，確保 SPA 路由正常工作。

## 環境變數配置

### 後端環境變數
| 變數名 | 描述 | 必填 |
|--------|------|------|
| NODE_ENV | 環境模式 | 是 |
| PORT | 服務端口 | 是 |
| JWT_SECRET | JWT 密鑰 | 是 |
| FRONTEND_URL | 前端域名 | 是 |
| TELEGRAM_BOT_TOKEN | Telegram 機器人令牌 | 否 |
| TELEGRAM_CHAT_ID | Telegram 聊天 ID | 否 |

### 前端環境變數
| 變數名 | 描述 | 必填 |
|--------|------|------|
| VITE_API_URL | 後端 API 地址 | 是 |

## 部署後檢查清單

### 後端檢查
- [ ] 健康檢查端點正常響應
- [ ] 數據庫連接正常
- [ ] API 端點測試通過
- [ ] 管理員登入功能正常

### 前端檢查
- [ ] 站點正常加載
- [ ] 路由功能正常
- [ ] API 調用正常
- [ ] 管理後台能夠訪問

## 常見問題

### 1. CORS 錯誤
確保後端 CORS 配置包含前端域名：
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### 2. 環境變數未生效
- 檢查變數名稱是否正確
- 重新部署後重啟服務
- 檢查部署平台的環境變數設置

### 3. 數據庫初始化
Railway 第一次部署時會自動初始化 SQLite 數據庫。如果需要重置數據庫，可以通過管理後台或重新部署實現。

## 監控與維護

### 日誌查看
- Railway：在項目儀表板查看實時日誌
- Netlify：在站點設置中查看構建和函數日誌

### 性能監控
建議設置：
- Railway 健康檢查
- Netlify 部署通知
- 自定義監控告警

## 安全建議

1. **環境變數安全**
   - 使用強密碼生成 JWT_SECRET
   - 不要在代碼中硬編碼敏感信息

2. **HTTPS 強制**
   - Railway 和 Netlify 默認提供 HTTPS
   - 確保所有 API 調用使用 HTTPS

3. **定期更新**
   - 定期更新依賴包
   - 監控安全漏洞通知

## 技術支持

如遇部署問題，請檢查：
1. 平台官方文檔
2. 項目日誌輸出
3. 環境變數配置
4. 網路連接狀況

---

**部署完成後，您的義式手工冰淇淋電商系統就可以正式上線服務了！**
