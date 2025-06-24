# 義式手工冰淇淋電商系統 - 項目結構

## 技術棧選擇
- **前端**: React + TypeScript + Tailwind CSS
- **後端**: Node.js + Express + SQLite
- **部署**: Railway (後端) + Netlify (前端)
- **整合服務**: 7-11 API, Telegram Bot API

## 目錄結構
```
gelato-ecommerce/
├── frontend/                 # React前端應用
│   ├── src/
│   │   ├── components/      # 組件
│   │   ├── pages/          # 頁面
│   │   ├── services/       # API服務
│   │   ├── utils/          # 工具函數
│   │   └── types/          # TypeScript類型
│   ├── public/             # 靜態資源
│   └── dist/               # 構建輸出
├── backend/                 # Node.js後端
│   ├── src/
│   │   ├── routes/         # API路由
│   │   ├── models/         # 數據模型
│   │   ├── services/       # 業務邏輯
│   │   ├── middleware/     # 中間件
│   │   └── utils/          # 工具函數
│   ├── database/           # SQLite數據庫
│   └── uploads/            # 文件上傳目錄
├── docs/                   # 文檔
└── deploy/                 # 部署配置
```

## 數據庫設計 (SQLite)

### 用戶表 (users)
- id, username, password_hash, email, role, created_at, updated_at

### 產品表 (products)
- id, name, description, base_price, category, stock, status, created_at, updated_at

### 產品圖片表 (product_images)
- id, product_id, image_url, image_order, created_at

### 口味表 (flavors)
- id, name, price, description, is_active, created_at, updated_at

### 訂單表 (orders)
- id, order_number, customer_name, customer_phone, store_number, total_amount, status, verification_code, created_at, updated_at

### 訂單項目表 (order_items)
- id, order_id, product_id, flavor_ids, quantity, unit_price, subtotal

### 公告表 (announcements)
- id, title, content, is_active, created_at, updated_at

### 優惠規則表 (discount_rules)
- id, name, description, discount_type, discount_value, min_quantity, is_active, created_at, updated_at
