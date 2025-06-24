# 義式手工冰淇淋電商系統 - Railway部署指南

## 部署概述

本系統採用前後端分離架構：
- **後端**: Node.js + Express + SQLite，部署於 Railway
- **前端**: React + TypeScript + Vite，部署於 Netlify

## 準備工作

### 1. 註冊服務帳號
- [Railway](https://railway.app/) - 後端部署
- [Netlify](https://netlify.com/) - 前端部署
- [Telegram](https://telegram.org/) - 可選：訂單通知機器人

### 2. 準備代碼倉庫
- 將代碼推送到 GitHub 倉庫
- 確保 `gelato-backend` 和 `gelato-ecommerce` 目錄結構正確

## Railway 後端部署

### 1. 創建Railway項目
1. 登入 Railway 控制台
2. 點擊 "New Project"
3. 選擇 "Deploy from GitHub repo"
4. 選擇你的倉庫，設定根目錄為 `gelato-backend`

### 2. 配置環境變量
在 Railway 項目設定中添加以下環境變量：

```env
NODE_ENV=production
DATABASE_PATH=/app/database/gelato.db
JWT_SECRET=your-super-secret-jwt-key-here-min-32-chars
SESSION_SECRET=your-super-secret-session-key-here-min-32-chars
FRONTEND_URL=https://your-frontend-domain.netlify.app
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id
```

### 3. 重要環境變量說明

#### JWT_SECRET
- 用於 JWT token 簽名
- 建議使用 32 字符以上的隨機字符串
- 生成方式：`openssl rand -base64 32`

#### SESSION_SECRET
- 用於 Express session 加密
- 建議使用 32 字符以上的隨機字符串
- 生成方式：`openssl rand -base64 32`

#### FRONTEND_URL
- 前端部署後的 Netlify 域名
- 格式：`https://your-app-name.netlify.app`
- 用於 CORS 設定

#### Telegram 配置（可選）
- TELEGRAM_BOT_TOKEN：機器人 token
- TELEGRAM_CHAT_ID：接收通知的聊天室 ID

### 4. 部署設定
Railway 會自動讀取 `railway.toml` 配置文件：
- 自動運行數據庫初始化
- 配置健康檢查
- 設定重啟策略

### 5. 獲取後端部署域名
部署完成後，複製 Railway 提供的域名（格式：`https://your-app-name.railway.app`）

## Netlify 前端部署

### 1. 創建Netlify項目
1. 登入 Netlify 控制台
2. 點擊 "Add new site" → "Import an existing project"
3. 選擇你的 GitHub 倉庫
4. 設定 Base directory 為 `gelato-ecommerce`

### 2. 配置構建設定
Netlify 會自動讀取 `netlify.toml` 配置，或手動設定：
- Build command: `pnpm build`
- Publish directory: `dist`

### 3. 配置環境變量
在 Netlify 項目設定中添加：

```env
VITE_API_BASE_URL=https://your-backend-domain.railway.app/api
VITE_APP_TITLE=海水不可斗量義式手工冰淇淋
```

## 完整部署流程

### 步驟 1: 部署後端到Railway
1. 推送代碼到 GitHub
2. 在 Railway 創建項目，選擇 `gelato-backend` 目錄
3. 配置環境變量（先設定除 FRONTEND_URL 外的所有變量）
4. 等待部署完成，記錄後端域名

### 步驟 2: 部署前端到Netlify
1. 在 Netlify 創建項目，選擇 `gelato-ecommerce` 目錄
2. 設定環境變量，使用 Railway 提供的後端域名
3. 等待部署完成，記錄前端域名

### 步驟 3: 更新Railway配置
1. 回到 Railway，更新 FRONTEND_URL 環境變量為 Netlify 域名
2. 重新部署後端服務

## 部署後驗證

### 1. 檢查後端API
訪問：`https://your-backend-domain.railway.app/health`
應返回：`{"status":"OK","timestamp":"..."}`

### 2. 檢查前端應用
訪問：`https://your-frontend-domain.netlify.app`
- 確認頁面正常加載
- 測試產品展示功能
- 測試訂單創建流程

### 3. 檢查管理員功能
1. 訪問：`https://your-frontend-domain.netlify.app/admin/login`
2. 使用預設帳號登入：
   - 用戶名：`admin`
   - 密碼：`admin123`
3. 測試管理員功能：產品管理、訂單管理等

## 常見問題排解

### 1. CORS 錯誤
- 確認 Railway 的 FRONTEND_URL 環境變量正確
- 確認 Netlify 的 VITE_API_BASE_URL 環境變量正確

### 2. 數據庫初始化失敗
- 檢查 Railway 日誌，確認數據庫目錄創建成功
- 確認 DATABASE_PATH 環境變量設定正確

### 3. JWT 認證失敗
- 確認 JWT_SECRET 環境變量已設定
- 確認密鑰長度足夠（建議 32+ 字符）

### 4. 訂單通知不工作
- 檢查 Telegram 機器人配置
- 確認 TELEGRAM_BOT_TOKEN 和 TELEGRAM_CHAT_ID 正確

## 安全建議

1. **定期更新密鑰**：定期更新 JWT_SECRET 和 SESSION_SECRET
2. **環境隔離**：生產環境使用獨立的密鑰和配置
3. **監控日誌**：定期檢查 Railway 和 Netlify 的部署日誌
4. **備份數據**：定期備份 SQLite 數據庫

## 維護和更新

### 代碼更新
1. 推送新代碼到 GitHub
2. Railway 和 Netlify 會自動觸發重新部署

### 數據庫遷移
如需修改數據庫結構：
1. 更新 `initDatabase.js`
2. 手動觸發 Railway 重新部署
3. 檢查數據遷移是否成功

## 成本預估

- **Railway**: 免費方案每月 500 小時運行時間
- **Netlify**: 免費方案每月 100GB 流量
- 小型電商網站通常在免費額度範圍內

## 聯繫支援

如遇到部署問題，請檢查：
1. 環境變量配置是否正確
2. 域名設定是否正確
3. 服務日誌是否有錯誤信息

---

**部署完成後，你將擁有一個完整的義式手工冰淇淋電商系統！** 🍨
