const express = require('express');
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('../utils/initDatabase');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { CustomError } = require('../middleware/errorHandler');

const router = express.Router();

// 生成訂單號
function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `GEL${year}${month}${day}${random}`;
}

// 生成驗證碼
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 獲取所有訂單（管理員）
router.get('/', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const db = getDatabase();
    
    let query = `
      SELECT o.*, 
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;
    const params = [];
    const conditions = [];
    
    if (status) {
      conditions.push('o.status = ?');
      params.push(status);
    }
    
    if (search) {
      conditions.push(`(
        o.order_number LIKE ? OR 
        o.customer_name LIKE ? OR 
        o.customer_phone LIKE ?
      )`);
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += `
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), offset);

    // 獲取總數查詢
    let countQuery = 'SELECT COUNT(*) as total FROM orders o';
    let countParams = [];
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      countParams = params.slice(0, -2); // 移除 limit 和 offset
    }

    // 執行查詢
    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        db.close();
        return next(err);
      }

      db.all(query, params, (err, orders) => {
        if (err) {
          db.close();
          return next(err);
        }

        // 獲取每個訂單的詳細項目
        const getOrderItems = (orderId) => {
          return new Promise((resolve) => {
            db.all(`
              SELECT oi.*, p.name as product_name, p.category
              FROM order_items oi
              JOIN products p ON oi.product_id = p.id
              WHERE oi.order_id = ?
            `, [orderId], (err, items) => {
              if (err) {
                console.error('獲取訂單項目失敗:', err);
                resolve([]);
              } else {
                resolve(items.map(item => ({
                  ...item,
                  flavorIds: item.flavor_ids ? JSON.parse(item.flavor_ids) : [],
                  productName: item.product_name,
                  unitPrice: item.unit_price
                })));
              }
            });
          });
        };

        Promise.all(
          orders.map(async (order) => {
            const items = await getOrderItems(order.id);
            return {
              ...order,
              orderNumber: order.order_number,
              customerName: order.customer_name,
              customerPhone: order.customer_phone,
              storeNumber: order.store_number,
              totalAmount: order.total_amount,
              verificationCode: order.verification_code,
              createdAt: order.created_at,
              updatedAt: order.updated_at,
              itemCount: order.item_count,
              items
            };
          })
        ).then(ordersWithItems => {
          db.close();
          
          res.json({
            success: true,
            data: {
              orders: ordersWithItems,
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult.total,
                totalPages: Math.ceil(countResult.total / parseInt(limit))
              }
            }
          });
        }).catch(error => {
          db.close();
          next(error);
        });
      });
    });
  } catch (error) {
    next(error);
  }
});

// 獲取單個訂單詳情
router.get('/:id', optionalAuth, (req, res, next) => {
  try {
    const { id } = req.params;
    const { verificationCode } = req.query;
    const db = getDatabase();
    
    // 如果不是管理員，需要提供驗證碼
    const isAdmin = req.user && req.user.role === 'admin';
    
    let query = 'SELECT * FROM orders WHERE ';
    let params = [];
    
    if (isAdmin) {
      query += 'id = ?';
      params = [id];
    } else {
      query += 'order_number = ? AND verification_code = ?';
      params = [id, verificationCode];
      
      if (!verificationCode) {
        throw new CustomError('需要提供驗證碼來查看訂單', 400);
      }
    }
    
    db.get(query, params, (err, order) => {
      if (err) {
        db.close();
        return next(err);
      }

      if (!order) {
        db.close();
        return next(new CustomError('訂單不存在或驗證碼錯誤', 404));
      }

      // 獲取訂單項目
      db.all(`
        SELECT oi.*, p.name as product_name, p.category
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id], (err, items) => {
        db.close();
        
        if (err) {
          return next(err);
        }

        const orderData = {
          ...order,
          orderNumber: order.order_number,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          storeNumber: order.store_number,
          totalAmount: order.total_amount,
          verificationCode: order.verification_code,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          items: items.map(item => ({
            ...item,
            flavorIds: item.flavor_ids ? JSON.parse(item.flavor_ids) : [],
            productName: item.product_name,
            unitPrice: item.unit_price
          }))
        };

        res.json({
          success: true,
          data: orderData
        });
      });
    });
  } catch (error) {
    next(error);
  }
});

// 創建訂單
router.post('/', async (req, res, next) => {
  try {
    const { 
      customerName, 
      customerPhone, 
      storeNumber, 
      items,
      captcha // 从请求体获取验证码
    } = req.body;

    // 验证码验证
    if (!captcha || !req.session.captcha || captcha.toLowerCase() !== req.session.captcha) {
      // 验证失败后，销毁当前 session 中的验证码，强制用户刷新
      req.session.captcha = null; 
      throw new CustomError('驗證碼錯誤或無效', 400);
    }
    // 验证成功后，立即清除 session 中的验证码，防止重复使用
    req.session.captcha = null;

    // 驗證輸入
    if (!customerName || customerName.trim().length === 0) {
      throw new CustomError('請提供客戶姓名', 400);
    }

    if (!customerPhone || !validator.isMobilePhone(customerPhone, 'zh-TW')) {
      throw new CustomError('請提供有效的手機號碼', 400);
    }

    if (!storeNumber || storeNumber.trim().length === 0) {
      throw new CustomError('請選擇取貨店舖', 400);
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new CustomError('訂單必須包含至少一個商品', 400);
    }

    // 驗證訂單項目
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        throw new CustomError('無效的訂單項目', 400);
      }
    }

    const db = getDatabase();
    
    // 1. 获取所有产品信息
    const productIds = items.map(item => item.productId);
    const placeholders = productIds.map(() => '?').join(',');
    const products = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM products WHERE id IN (${placeholders})`, productIds, (err, rows) => {
        if (err) {
          db.close();
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    const productsById = Object.fromEntries(products.map(p => [p.id, p]));

    // 2. 准备包含完整信息的订单项目
    let totalAmount = 0;
    const processedItems = items.map(item => {
      const product = productsById[item.productId];
      if (!product || product.stock < item.quantity) {
        throw new CustomError(`產品 ${product ? product.name : item.productId} 不存在或庫存不足`, 400);
      }
      const subtotal = product.base_price * item.quantity;
      totalAmount += subtotal;
      return { ...item, productName: product.name, unitPrice: product.base_price, subtotal };
    });

    const orderId = uuidv4();
    const orderNumber = generateOrderNumber();
    const verificationCode = generateVerificationCode();

    // 3. 开始事务
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // 插入订单主表
      db.run(
        'INSERT INTO orders (id, order_number, customer_name, customer_phone, store_number, total_amount, verification_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [orderId, orderNumber, customerName.trim(), customerPhone, storeNumber.trim(), totalAmount, verificationCode, 'pending'],
        (err) => {
          if (err) {
            db.run('ROLLBACK');
            db.close();
            return next(err);
          }

          // 插入订单项目并更新库存
          const itemStmt = db.prepare('INSERT INTO order_items (id, order_id, product_id, flavor_ids, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)');
          const stockStmt = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

          for (const item of processedItems) {
            itemStmt.run(uuidv4(), orderId, item.productId, JSON.stringify(item.flavorIds || []), item.quantity, item.unitPrice, item.subtotal);
            stockStmt.run(item.quantity, item.productId);
          }

          itemStmt.finalize();
          stockStmt.finalize((err) => {
            if (err) {
              db.run('ROLLBACK');
              db.close();
              return next(err);
            }
            db.run('COMMIT', (err) => {
              if (err) {
                db.run('ROLLBACK');
                db.close();
                return next(err);
              }

              // 发送Telegram通知
              if (req.app.locals.sendTelegramNotification) {
                req.app.locals.sendTelegramNotification({
                  orderNumber,
                  customerName: customerName.trim(),
                  customerPhone,
                  storeNumber: storeNumber.trim(),
                  totalAmount,
                  items: processedItems
                });
              }

              db.close();
              res.status(201).json({
                success: true,
                message: '訂單創建成功',
                data: { orderId, orderNumber, verificationCode, totalAmount }
              });
            });
          });
        }
      );
    });
  } catch (error) {
    next(error);
  }
});

// 更新訂單狀態
router.patch('/:id/status', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new CustomError('無效的訂單狀態', 400);
    }

    const db = getDatabase();
    
    db.run(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id],
      function(err) {
        db.close();
        
        if (err) {
          return next(err);
        }

        if (this.changes === 0) {
          return next(new CustomError('訂單不存在', 404));
        }

        res.json({
          success: true,
          message: '訂單狀態更新成功',
          data: { status }
        });
      }
    );
  } catch (error) {
    next(error);
  }
});

// 批量更新訂單狀態
router.patch('/batch-status', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { orderIds, status } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      throw new CustomError('請提供要更新的訂單ID列表', 400);
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new CustomError('無效的訂單狀態', 400);
    }

    const db = getDatabase();
    const placeholders = orderIds.map(() => '?').join(',');
    const params = [status, ...orderIds];

    db.run(
      `UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
      params,
      function(err) {
        db.close();
        
        if (err) {
          return next(err);
        }

        res.json({
          success: true,
          message: `成功更新 ${this.changes} 個訂單的狀態`,
          data: {
            updatedCount: this.changes,
            status
          }
        });
      }
    );
  } catch (error) {
    next(error);
  }
});

// 匯出訂單為 Excel
router.get('/export/excel', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;
    const db = getDatabase();
    
    let query = `
      SELECT o.*, 
             GROUP_CONCAT(p.name || ' x' || oi.quantity) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
    `;
    const params = [];
    const conditions = [];
    
    if (status) {
      conditions.push('o.status = ?');
      params.push(status);
    }
    
    if (startDate) {
      conditions.push('DATE(o.created_at) >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      conditions.push('DATE(o.created_at) <= ?');
      params.push(endDate);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY o.id ORDER BY o.created_at DESC';

    db.all(query, params, (err, orders) => {
      db.close();
      
      if (err) {
        return next(err);
      }

      // 準備 Excel 數據
      const excelData = orders.map(order => ({
        '訂單編號': order.order_number,
        '客戶姓名': order.customer_name,
        '客戶電話': order.customer_phone,
        '取貨店舖': order.store_number,
        '訂單總額': order.total_amount,
        '訂單狀態': order.status,
        '驗證碼': order.verification_code,
        '商品列表': order.items || '',
        '建立時間': new Date(order.created_at).toLocaleString('zh-TW'),
        '更新時間': new Date(order.updated_at).toLocaleString('zh-TW')
      }));

      // 創建工作簿
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // 設定列寬
      const columnWidths = [
        { wch: 15 }, // 訂單編號
        { wch: 10 }, // 客戶姓名
        { wch: 12 }, // 客戶電話
        { wch: 12 }, // 取貨店舖
        { wch: 10 }, // 訂單總額
        { wch: 10 }, // 訂單狀態
        { wch: 8 },  // 驗證碼
        { wch: 30 }, // 商品列表
        { wch: 18 }, // 建立時間
        { wch: 18 }  // 更新時間
      ];
      
      worksheet['!cols'] = columnWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, '訂單列表');

      // 生成文件
      const fileName = `orders_${new Date().toISOString().split('T')[0]}.xlsx`;
      const filePath = path.join(__dirname, '../../uploads', fileName);
      
      // 確保目錄存在
      const uploadDir = path.dirname(filePath);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      XLSX.writeFile(workbook, filePath);

      // 設定下載響應
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error('文件下載失敗:', err);
        }
        
        // 刪除臨時文件
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('刪除臨時文件失敗:', unlinkErr);
          }
        });
      });
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
