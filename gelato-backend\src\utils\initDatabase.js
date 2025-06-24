const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// 支援從環境變量讀取數據庫路徑（Railway部署時使用）
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../database/gelato.db');

// 確保database目錄存在
const fs = require('fs');
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('數據庫連接失敗:', err.message);
        reject(err);
        return;
      }
      console.log('✅ SQLite 數據庫連接成功');
    });

    // 創建表格
    db.serialize(() => {
      // 用戶表
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          email TEXT,
          role TEXT DEFAULT 'customer',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 產品表
      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          base_price REAL NOT NULL,
          category TEXT NOT NULL,
          stock INTEGER DEFAULT 0,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 產品圖片表
      db.run(`
        CREATE TABLE IF NOT EXISTS product_images (
          id TEXT PRIMARY KEY,
          product_id TEXT NOT NULL,
          image_url TEXT NOT NULL,
          image_order INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
        )
      `);

      // 口味表
      db.run(`
        CREATE TABLE IF NOT EXISTS flavors (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          price REAL DEFAULT 0,
          description TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 訂單表
      db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          order_number TEXT UNIQUE NOT NULL,
          customer_name TEXT NOT NULL,
          customer_phone TEXT NOT NULL,
          store_number TEXT NOT NULL,
          total_amount REAL NOT NULL,
          status TEXT DEFAULT 'pending',
          verification_code TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 訂單項目表
      db.run(`
        CREATE TABLE IF NOT EXISTS order_items (
          id TEXT PRIMARY KEY,
          order_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          flavor_ids TEXT,
          quantity INTEGER NOT NULL,
          unit_price REAL NOT NULL,
          subtotal REAL NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products (id)
        )
      `);

      // 公告表
      db.run(`
        CREATE TABLE IF NOT EXISTS announcements (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 優惠規則表
      db.run(`
        CREATE TABLE IF NOT EXISTS discount_rules (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          discount_type TEXT NOT NULL,
          discount_value REAL NOT NULL,
          min_quantity INTEGER DEFAULT 1,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 插入預設管理員帳戶
      const adminId = uuidv4();
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      
      db.run(`
        INSERT OR IGNORE INTO users (id, username, password_hash, email, role)
        VALUES (?, ?, ?, ?, ?)
      `, [adminId, 'admin', hashedPassword, 'admin@gelato.com', 'admin']);

      // 插入示例產品
      const sampleProducts = [
        {
          id: uuidv4(),
          name: '經典香草',
          description: '使用優質香草豆製作的經典口味',
          base_price: 80,
          category: 'base',
          stock: 50
        },
        {
          id: uuidv4(),
          name: '比利時巧克力',
          description: '濃郁香醇的比利時進口巧克力',
          base_price: 90,
          category: 'base',
          stock: 40
        },
        {
          id: uuidv4(),
          name: '新鮮草莓',
          description: '當季新鮮草莓製作，酸甜可口',
          base_price: 85,
          category: 'base',
          stock: 30
        }
      ];

      sampleProducts.forEach(product => {
        db.run(`
          INSERT OR IGNORE INTO products (id, name, description, base_price, category, stock, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [product.id, product.name, product.description, product.base_price, product.category, product.stock, 'active']);
      });

      // 插入示例口味
      const sampleFlavors = [
        { id: uuidv4(), name: '焦糖醬', price: 15, description: '香甜焦糖醬' },
        { id: uuidv4(), name: '巧克力脆片', price: 20, description: '酥脆巧克力脆片' },
        { id: uuidv4(), name: '新鮮莓果', price: 25, description: '當季新鮮莓果' },
        { id: uuidv4(), name: '堅果碎', price: 30, description: '香脆堅果碎' },
        { id: uuidv4(), name: '薄荷葉', price: 10, description: '清新薄荷葉' }
      ];

      sampleFlavors.forEach(flavor => {
        db.run(`
          INSERT OR IGNORE INTO flavors (id, name, price, description, is_active)
          VALUES (?, ?, ?, ?, ?)
        `, [flavor.id, flavor.name, flavor.price, flavor.description, 1]);
      });

      // 插入示例公告
      const sampleAnnouncements = [
        {
          id: uuidv4(),
          title: '歡迎光臨',
          content: '🍨 歡迎來到海水不可斗量義式手工冰淇淋！我們提供最優質的義式冰淇淋，支援7-11取貨付款服務。',
          is_active: 1
        },
        {
          id: uuidv4(),
          title: '新品上市',
          content: '🎉 全新口味「宇治抹茶」現已上市！限時特價，快來嚐鮮！',
          is_active: 0
        }
      ];

      sampleAnnouncements.forEach(announcement => {
        db.run(`
          INSERT OR IGNORE INTO announcements (id, title, content, is_active)
          VALUES (?, ?, ?, ?)
        `, [announcement.id, announcement.title, announcement.content, announcement.is_active]);
      });

      console.log('✅ 數據庫表格創建完成');
      console.log('✅ 示例數據插入完成');
      console.log('👤 預設管理員帳戶: admin / admin123');
    });

    db.close((err) => {
      if (err) {
        console.error('數據庫關閉失敗:', err.message);
        reject(err);
      } else {
        console.log('✅ 數據庫初始化完成');
        resolve();
      }
    });
  });
}

// 獲取數據庫連接
function getDatabase() {
  return new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('數據庫連接失敗:', err.message);
    }
  });
}

module.exports = initDatabase;
module.exports.getDatabase = getDatabase;
module.exports.DB_PATH = DB_PATH;

// 如果直接執行這個文件，初始化數據庫
if (require.main === module) {
  initDatabase().then(() => {
    console.log('數據庫初始化完成！');
    process.exit(0);
  }).catch(err => {
    console.error('數據庫初始化失敗:', err);
    process.exit(1);
  });
}
