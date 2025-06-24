const express = require('express');
const { getDatabase } = require('../utils/initDatabase');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { CustomError } = require('../middleware/errorHandler');

const router = express.Router();

// 獲取總覽統計
router.get('/overview', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const db = getDatabase();
    
    const queries = [
      // 訂單統計
      { 
        name: 'totalOrders', 
        query: 'SELECT COUNT(*) as count FROM orders' 
      },
      { 
        name: 'pendingOrders', 
        query: 'SELECT COUNT(*) as count FROM orders WHERE status = "pending"' 
      },
      { 
        name: 'completedOrders', 
        query: 'SELECT COUNT(*) as count FROM orders WHERE status = "completed"' 
      },
      // 收入統計
      { 
        name: 'totalRevenue', 
        query: 'SELECT COALESCE(SUM(total_amount), 0) as amount FROM orders WHERE status != "cancelled"' 
      },
      { 
        name: 'todayRevenue', 
        query: 'SELECT COALESCE(SUM(total_amount), 0) as amount FROM orders WHERE DATE(created_at) = DATE("now") AND status != "cancelled"' 
      },
      { 
        name: 'monthRevenue', 
        query: 'SELECT COALESCE(SUM(total_amount), 0) as amount FROM orders WHERE strftime("%Y-%m", created_at) = strftime("%Y-%m", "now") AND status != "cancelled"' 
      },
      // 產品統計
      { 
        name: 'totalProducts', 
        query: 'SELECT COUNT(*) as count FROM products WHERE status = "active"' 
      },
      { 
        name: 'lowStockProducts', 
        query: 'SELECT COUNT(*) as count FROM products WHERE stock <= 10 AND status = "active"' 
      },
      // 其他統計
      { 
        name: 'totalFlavors', 
        query: 'SELECT COUNT(*) as count FROM flavors WHERE is_active = 1' 
      },
      { 
        name: 'activeAnnouncements', 
        query: 'SELECT COUNT(*) as count FROM announcements WHERE is_active = 1' 
      }
    ];

    let completed = 0;
    const stats = {};

    queries.forEach(({ name, query }) => {
      db.get(query, [], (err, result) => {
        if (err) {
          console.error(`統計查詢失敗 ${name}:`, err);
          stats[name] = 0;
        } else {
          if (name.includes('Revenue')) {
            stats[name] = result.amount || 0;
          } else {
            stats[name] = result.count || 0;
          }
        }

        completed++;
        
        if (completed === queries.length) {
          db.close();
          
          res.json({
            success: true,
            data: stats
          });
        }
      });
    });
  } catch (error) {
    next(error);
  }
});

// 獲取訂單趨勢數據
router.get('/orders/trend', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { period = '7d' } = req.query;
    const db = getDatabase();
    
    let dateFormat, dateFilter;
    
    switch (period) {
      case '7d':
        dateFormat = '%Y-%m-%d';
        dateFilter = 'DATE(created_at) >= DATE("now", "-7 days")';
        break;
      case '30d':
        dateFormat = '%Y-%m-%d';
        dateFilter = 'DATE(created_at) >= DATE("now", "-30 days")';
        break;
      case '3m':
        dateFormat = '%Y-%m';
        dateFilter = 'DATE(created_at) >= DATE("now", "-3 months")';
        break;
      case '1y':
        dateFormat = '%Y-%m';
        dateFilter = 'DATE(created_at) >= DATE("now", "-1 year")';
        break;
      default:
        dateFormat = '%Y-%m-%d';
        dateFilter = 'DATE(created_at) >= DATE("now", "-7 days")';
    }

    const query = `
      SELECT 
        strftime('${dateFormat}', created_at) as date,
        COUNT(*) as orderCount,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedCount,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelledCount
      FROM orders 
      WHERE ${dateFilter}
      GROUP BY strftime('${dateFormat}', created_at)
      ORDER BY date
    `;

    db.all(query, [], (err, rows) => {
      db.close();
      
      if (err) {
        return next(err);
      }

      res.json({
        success: true,
        data: {
          period,
          trend: rows
        }
      });
    });
  } catch (error) {
    next(error);
  }
});

// 獲取熱門產品統計
router.get('/products/popular', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const db = getDatabase();
    
    const query = `
      SELECT 
        p.id,
        p.name,
        p.category,
        p.base_price,
        SUM(oi.quantity) as totalSold,
        COUNT(DISTINCT oi.order_id) as orderCount,
        SUM(oi.subtotal) as totalRevenue
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY p.id, p.name, p.category, p.base_price
      ORDER BY totalSold DESC
      LIMIT ?
    `;

    db.all(query, [parseInt(limit)], (err, products) => {
      db.close();
      
      if (err) {
        return next(err);
      }

      res.json({
        success: true,
        data: products.map(product => ({
          ...product,
          basePrice: product.base_price,
          totalSold: product.totalSold,
          orderCount: product.orderCount,
          totalRevenue: product.totalRevenue
        }))
      });
    });
  } catch (error) {
    next(error);
  }
});

// 獲取口味使用統計
router.get('/flavors/usage', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const db = getDatabase();
    
    const query = `
      SELECT 
        f.id,
        f.name,
        f.price,
        COUNT(*) as usageCount
      FROM flavors f
      JOIN (
        SELECT json_each.value as flavor_id
        FROM order_items,
        json_each(order_items.flavor_ids)
        WHERE json_valid(order_items.flavor_ids)
      ) flavor_usage ON f.id = flavor_usage.flavor_id
      JOIN orders o ON EXISTS (
        SELECT 1 FROM order_items oi 
        WHERE oi.order_id = o.id 
        AND json_extract(oi.flavor_ids, '$') LIKE '%' || f.id || '%'
      )
      WHERE o.status != 'cancelled'
      GROUP BY f.id, f.name, f.price
      ORDER BY usageCount DESC
    `;

    db.all(query, [], (err, flavors) => {
      if (err) {
        // 如果 JSON 函數不可用，使用簡化查詢
        const fallbackQuery = `
          SELECT 
            f.id,
            f.name,
            f.price,
            0 as usageCount
          FROM flavors f
          WHERE f.is_active = 1
          ORDER BY f.name
        `;
        
        db.all(fallbackQuery, [], (fallbackErr, fallbackFlavors) => {
          db.close();
          
          if (fallbackErr) {
            return next(fallbackErr);
          }

          res.json({
            success: true,
            data: fallbackFlavors,
            note: '口味使用統計功能需要更新的 SQLite 版本'
          });
        });
        return;
      }

      db.close();
      
      res.json({
        success: true,
        data: flavors
      });
    });
  } catch (error) {
    next(error);
  }
});

// 獲取訂單狀態分布
router.get('/orders/status-distribution', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const db = getDatabase();
    
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders), 2) as percentage
      FROM orders 
      GROUP BY status
      ORDER BY count DESC
    `;

    db.all(query, [], (err, distribution) => {
      db.close();
      
      if (err) {
        return next(err);
      }

      res.json({
        success: true,
        data: distribution
      });
    });
  } catch (error) {
    next(error);
  }
});

// 獲取每日/每月新客戶統計
router.get('/customers/new', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    const db = getDatabase();
    
    let dateFormat, dateFilter;
    
    switch (period) {
      case '30d':
        dateFormat = '%Y-%m-%d';
        dateFilter = 'DATE(created_at) >= DATE("now", "-30 days")';
        break;
      case '3m':
        dateFormat = '%Y-%m';
        dateFilter = 'DATE(created_at) >= DATE("now", "-3 months")';
        break;
      case '1y':
        dateFormat = '%Y-%m';
        dateFilter = 'DATE(created_at) >= DATE("now", "-1 year")';
        break;
      default:
        dateFormat = '%Y-%m-%d';
        dateFilter = 'DATE(created_at) >= DATE("now", "-30 days")';
    }

    const query = `
      SELECT 
        strftime('${dateFormat}', first_order_date) as date,
        COUNT(*) as newCustomers
      FROM (
        SELECT 
          customer_phone,
          MIN(created_at) as first_order_date
        FROM orders
        WHERE ${dateFilter}
        GROUP BY customer_phone
      ) first_orders
      GROUP BY strftime('${dateFormat}', first_order_date)
      ORDER BY date
    `;

    db.all(query, [], (err, newCustomers) => {
      db.close();
      
      if (err) {
        return next(err);
      }

      res.json({
        success: true,
        data: {
          period,
          newCustomers
        }
      });
    });
  } catch (error) {
    next(error);
  }
});

// 獲取平均訂單金額
router.get('/orders/average-value', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    const db = getDatabase();
    
    let dateFilter;
    
    switch (period) {
      case '7d':
        dateFilter = 'DATE(created_at) >= DATE("now", "-7 days")';
        break;
      case '30d':
        dateFilter = 'DATE(created_at) >= DATE("now", "-30 days")';
        break;
      case '3m':
        dateFilter = 'DATE(created_at) >= DATE("now", "-3 months")';
        break;
      case '1y':
        dateFilter = 'DATE(created_at) >= DATE("now", "-1 year")';
        break;
      case 'all':
        dateFilter = '1=1';
        break;
      default:
        dateFilter = 'DATE(created_at) >= DATE("now", "-30 days")';
    }

    const query = `
      SELECT 
        ROUND(AVG(total_amount), 2) as averageOrderValue,
        MIN(total_amount) as minOrderValue,
        MAX(total_amount) as maxOrderValue,
        COUNT(*) as totalOrders
      FROM orders 
      WHERE ${dateFilter} AND status != 'cancelled'
    `;

    db.get(query, [], (err, result) => {
      db.close();
      
      if (err) {
        return next(err);
      }

      res.json({
        success: true,
        data: {
          period,
          ...result
        }
      });
    });
  } catch (error) {
    next(error);
  }
});

// 獲取庫存警告
router.get('/inventory/warnings', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { threshold = 10 } = req.query;
    const db = getDatabase();
    
    const query = `
      SELECT 
        id,
        name,
        stock,
        category,
        base_price,
        updated_at
      FROM products 
      WHERE stock <= ? AND status = 'active'
      ORDER BY stock ASC
    `;

    db.all(query, [parseInt(threshold)], (err, lowStockProducts) => {
      db.close();
      
      if (err) {
        return next(err);
      }

      res.json({
        success: true,
        data: {
          threshold: parseInt(threshold),
          lowStockProducts: lowStockProducts.map(product => ({
            ...product,
            basePrice: product.base_price,
            updatedAt: product.updated_at
          }))
        }
      });
    });
  } catch (error) {
    next(error);
  }
});

// 獲取完整的儀表板數據
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const db = getDatabase();
    
    // 組合多個統計查詢
    const dashboardData = {};
    let completedQueries = 0;
    const totalQueries = 4;

    // 1. 總覽統計
    const overviewQuery = `
      SELECT 
        (SELECT COUNT(*) FROM orders) as totalOrders,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pendingOrders,
        (SELECT COUNT(*) FROM orders WHERE status = 'completed') as completedOrders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status != 'cancelled') as totalRevenue,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = DATE('now') AND status != 'cancelled') as todayRevenue,
        (SELECT COUNT(*) FROM products WHERE status = 'active') as totalProducts,
        (SELECT COUNT(*) FROM products WHERE stock <= 10 AND status = 'active') as lowStockProducts
    `;

    db.get(overviewQuery, [], (err, overview) => {
      if (err) {
        console.error('總覽統計查詢失敗:', err);
        dashboardData.overview = {};
      } else {
        dashboardData.overview = overview;
      }
      
      completedQueries++;
      if (completedQueries === totalQueries) {
        db.close();
        res.json({ success: true, data: dashboardData });
      }
    });

    // 2. 最近7天趨勢
    const trendQuery = `
      SELECT 
        strftime('%Y-%m-%d', created_at) as date,
        COUNT(*) as orderCount,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders 
      WHERE DATE(created_at) >= DATE('now', '-7 days')
      GROUP BY strftime('%Y-%m-%d', created_at)
      ORDER BY date
    `;

    db.all(trendQuery, [], (err, trend) => {
      if (err) {
        console.error('趨勢統計查詢失敗:', err);
        dashboardData.trend = [];
      } else {
        dashboardData.trend = trend;
      }
      
      completedQueries++;
      if (completedQueries === totalQueries) {
        db.close();
        res.json({ success: true, data: dashboardData });
      }
    });

    // 3. 熱門產品（前5名）
    const popularQuery = `
      SELECT 
        p.name,
        SUM(oi.quantity) as totalSold
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY p.id, p.name
      ORDER BY totalSold DESC
      LIMIT 5
    `;

    db.all(popularQuery, [], (err, popular) => {
      if (err) {
        console.error('熱門產品查詢失敗:', err);
        dashboardData.popularProducts = [];
      } else {
        dashboardData.popularProducts = popular;
      }
      
      completedQueries++;
      if (completedQueries === totalQueries) {
        db.close();
        res.json({ success: true, data: dashboardData });
      }
    });

    // 4. 訂單狀態分布
    const statusQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM orders 
      GROUP BY status
    `;

    db.all(statusQuery, [], (err, statusDistribution) => {
      if (err) {
        console.error('訂單狀態查詢失敗:', err);
        dashboardData.statusDistribution = [];
      } else {
        dashboardData.statusDistribution = statusDistribution;
      }
      
      completedQueries++;
      if (completedQueries === totalQueries) {
        db.close();
        res.json({ success: true, data: dashboardData });
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
