const express = require('express');
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const { getDatabase } = require('../utils/initDatabase');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { CustomError } = require('../middleware/errorHandler');

const router = express.Router();

// 獲取所有公告
router.get('/', optionalAuth, (req, res, next) => {
  try {
    const { isActive } = req.query;
    const isAdmin = req.user && req.user.role === 'admin';
    const db = getDatabase();
    
    let query = 'SELECT * FROM announcements';
    const params = [];
    
    // 如果不是管理員，只顯示啟用的公告
    if (!isAdmin) {
      query += ' WHERE is_active = 1';
    } else if (isActive !== undefined) {
      query += ' WHERE is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }
    
    query += ' ORDER BY created_at DESC';

    db.all(query, params, (err, announcements) => {
      db.close();
      
      if (err) {
        return next(err);
      }

      res.json({
        success: true,
        data: announcements.map(announcement => ({
          ...announcement,
          isActive: !!announcement.is_active,
          createdAt: announcement.created_at,
          updatedAt: announcement.updated_at
        }))
      });
    });
  } catch (error) {
    next(error);
  }
});

// 獲取啟用的公告（用於前端顯示）
router.get('/active', (req, res, next) => {
  try {
    const db = getDatabase();
    
    db.all(
      'SELECT * FROM announcements WHERE is_active = 1 ORDER BY created_at DESC',
      [],
      (err, announcements) => {
        db.close();
        
        if (err) {
          return next(err);
        }

        res.json({
          success: true,
          data: announcements.map(announcement => ({
            id: announcement.id,
            title: announcement.title,
            content: announcement.content,
            createdAt: announcement.created_at
          }))
        });
      }
    );
  } catch (error) {
    next(error);
  }
});

// 獲取單個公告
router.get('/:id', optionalAuth, (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user && req.user.role === 'admin';
    const db = getDatabase();
    
    let query = 'SELECT * FROM announcements WHERE id = ?';
    let params = [id];
    
    // 如果不是管理員，只能查看啟用的公告
    if (!isAdmin) {
      query += ' AND is_active = 1';
    }
    
    db.get(query, params, (err, announcement) => {
      db.close();
      
      if (err) {
        return next(err);
      }

      if (!announcement) {
        throw new CustomError('公告不存在', 404);
      }

      res.json({
        success: true,
        data: {
          ...announcement,
          isActive: !!announcement.is_active,
          createdAt: announcement.created_at,
          updatedAt: announcement.updated_at
        }
      });
    });
  } catch (error) {
    next(error);
  }
});

// 創建公告
router.post('/', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { title, content, isActive = true } = req.body;

    // 驗證輸入
    if (!title || title.trim().length === 0) {
      throw new CustomError('公告標題不能為空', 400);
    }

    if (!content || content.trim().length === 0) {
      throw new CustomError('公告內容不能為空', 400);
    }

    if (title.trim().length > 100) {
      throw new CustomError('公告標題不能超過100個字元', 400);
    }

    if (content.trim().length > 1000) {
      throw new CustomError('公告內容不能超過1000個字元', 400);
    }

    const announcementId = uuidv4();
    const db = getDatabase();
    
    db.run(
      `INSERT INTO announcements (id, title, content, is_active)
       VALUES (?, ?, ?, ?)`,
      [announcementId, title.trim(), content.trim(), isActive ? 1 : 0],
      function(err) {
        if (err) {
          db.close();
          return next(err);
        }

        // 獲取創建的公告
        db.get(
          'SELECT * FROM announcements WHERE id = ?',
          [announcementId],
          (err, announcement) => {
            db.close();
            
            if (err) {
              return next(err);
            }

            res.status(201).json({
              success: true,
              message: '公告創建成功',
              data: {
                ...announcement,
                isActive: !!announcement.is_active,
                createdAt: announcement.created_at,
                updatedAt: announcement.updated_at
              }
            });
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
});

// 更新公告
router.put('/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, isActive } = req.body;
    const db = getDatabase();

    // 構建更新查詢
    const updateFields = [];
    const params = [];

    if (title !== undefined) {
      if (!title.trim()) {
        throw new CustomError('公告標題不能為空', 400);
      }
      if (title.trim().length > 100) {
        throw new CustomError('公告標題不能超過100個字元', 400);
      }
      updateFields.push('title = ?');
      params.push(title.trim());
    }

    if (content !== undefined) {
      if (!content.trim()) {
        throw new CustomError('公告內容不能為空', 400);
      }
      if (content.trim().length > 1000) {
        throw new CustomError('公告內容不能超過1000個字元', 400);
      }
      updateFields.push('content = ?');
      params.push(content.trim());
    }

    if (isActive !== undefined) {
      updateFields.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }

    if (updateFields.length === 0) {
      throw new CustomError('沒有提供要更新的字段', 400);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE announcements SET ${updateFields.join(', ')} WHERE id = ?`;

    db.run(query, params, function(err) {
      if (err) {
        db.close();
        return next(err);
      }

      if (this.changes === 0) {
        db.close();
        throw new CustomError('公告不存在', 404);
      }

      // 獲取更新後的公告
      db.get(
        'SELECT * FROM announcements WHERE id = ?',
        [id],
        (err, announcement) => {
          db.close();
          
          if (err) {
            return next(err);
          }

          res.json({
            success: true,
            message: '公告更新成功',
            data: {
              ...announcement,
              isActive: !!announcement.is_active,
              createdAt: announcement.created_at,
              updatedAt: announcement.updated_at
            }
          });
        }
      );
    });
  } catch (error) {
    next(error);
  }
});

// 刪除公告
router.delete('/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    db.run(
      'DELETE FROM announcements WHERE id = ?',
      [id],
      function(err) {
        db.close();
        
        if (err) {
          return next(err);
        }

        if (this.changes === 0) {
          throw new CustomError('公告不存在', 404);
        }

        res.json({
          success: true,
          message: '公告刪除成功'
        });
      }
    );
  } catch (error) {
    next(error);
  }
});

// 批量更新公告狀態
router.patch('/batch-toggle', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { announcementIds, isActive } = req.body;

    if (!Array.isArray(announcementIds) || announcementIds.length === 0) {
      throw new CustomError('請提供要更新的公告ID列表', 400);
    }

    if (typeof isActive !== 'boolean') {
      throw new CustomError('請提供有效的狀態值', 400);
    }

    const db = getDatabase();
    const placeholders = announcementIds.map(() => '?').join(',');
    const params = [isActive ? 1 : 0, ...announcementIds];

    db.run(
      `UPDATE announcements SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
      params,
      function(err) {
        db.close();
        
        if (err) {
          return next(err);
        }

        res.json({
          success: true,
          message: `成功更新 ${this.changes} 個公告的狀態`,
          data: {
            updatedCount: this.changes,
            isActive
          }
        });
      }
    );
  } catch (error) {
    next(error);
  }
});

// 快速切換公告狀態
router.patch('/:id/toggle', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    // 先獲取當前狀態
    db.get(
      'SELECT is_active FROM announcements WHERE id = ?',
      [id],
      (err, announcement) => {
        if (err) {
          db.close();
          return next(err);
        }

        if (!announcement) {
          db.close();
          throw new CustomError('公告不存在', 404);
        }

        // 切換狀態
        const newStatus = announcement.is_active ? 0 : 1;
        
        db.run(
          'UPDATE announcements SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [newStatus, id],
          function(err) {
            db.close();
            
            if (err) {
              return next(err);
            }

            res.json({
              success: true,
              message: '公告狀態切換成功',
              data: {
                id,
                isActive: !!newStatus
              }
            });
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
});

// 獲取公告統計
router.get('/stats/summary', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const db = getDatabase();
    
    const queries = [
      { name: 'total', query: 'SELECT COUNT(*) as count FROM announcements' },
      { name: 'active', query: 'SELECT COUNT(*) as count FROM announcements WHERE is_active = 1' },
      { name: 'inactive', query: 'SELECT COUNT(*) as count FROM announcements WHERE is_active = 0' }
    ];

    let completed = 0;
    const stats = {};

    queries.forEach(({ name, query }) => {
      db.get(query, [], (err, result) => {
        if (err) {
          db.close();
          return next(err);
        }

        stats[name] = result.count;
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

module.exports = router;
