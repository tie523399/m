const express = require('express');
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const { getDatabase } = require('../utils/initDatabase');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { CustomError } = require('../middleware/errorHandler');

const router = express.Router();

// 獲取所有口味
router.get('/', optionalAuth, (req, res, next) => {
  try {
    const { isActive } = req.query;
    const db = getDatabase();
    
    let query = 'SELECT * FROM flavors';
    const params = [];
    
    if (isActive !== undefined) {
      query += ' WHERE is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }
    
    query += ' ORDER BY created_at DESC';

    db.all(query, params, (err, flavors) => {
      db.close();
      
      if (err) {
        return next(err);
      }

      res.json({
        success: true,
        data: flavors.map(flavor => ({
          ...flavor,
          isActive: !!flavor.is_active,
          createdAt: flavor.created_at,
          updatedAt: flavor.updated_at
        }))
      });
    });
  } catch (error) {
    next(error);
  }
});

// 獲取單個口味
router.get('/:id', optionalAuth, (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    db.get(
      'SELECT * FROM flavors WHERE id = ?',
      [id],
      (err, flavor) => {
        db.close();
        
        if (err) {
          return next(err);
        }

        if (!flavor) {
          throw new CustomError('口味不存在', 404);
        }

        res.json({
          success: true,
          data: {
            ...flavor,
            isActive: !!flavor.is_active,
            createdAt: flavor.created_at,
            updatedAt: flavor.updated_at
          }
        });
      }
    );
  } catch (error) {
    next(error);
  }
});

// 創建口味
router.post('/', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { name, price = 0, description = '', isActive = true } = req.body;

    // 驗證輸入
    if (!name || name.trim().length === 0) {
      throw new CustomError('口味名稱不能為空', 400);
    }

    if (price < 0) {
      throw new CustomError('價格不能為負數', 400);
    }

    const flavorId = uuidv4();
    const db = getDatabase();
    
    db.run(
      `INSERT INTO flavors (id, name, price, description, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [flavorId, name.trim(), price, description.trim(), isActive ? 1 : 0],
      function(err) {
        if (err) {
          db.close();
          return next(err);
        }

        // 獲取創建的口味
        db.get(
          'SELECT * FROM flavors WHERE id = ?',
          [flavorId],
          (err, flavor) => {
            db.close();
            
            if (err) {
              return next(err);
            }

            res.status(201).json({
              success: true,
              message: '口味創建成功',
              data: {
                ...flavor,
                isActive: !!flavor.is_active,
                createdAt: flavor.created_at,
                updatedAt: flavor.updated_at
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

// 更新口味
router.put('/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, description, isActive } = req.body;
    const db = getDatabase();

    // 構建更新查詢
    const updateFields = [];
    const params = [];

    if (name !== undefined) {
      if (!name.trim()) {
        throw new CustomError('口味名稱不能為空', 400);
      }
      updateFields.push('name = ?');
      params.push(name.trim());
    }

    if (price !== undefined) {
      if (price < 0) {
        throw new CustomError('價格不能為負數', 400);
      }
      updateFields.push('price = ?');
      params.push(price);
    }

    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description.trim());
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

    const query = `UPDATE flavors SET ${updateFields.join(', ')} WHERE id = ?`;

    db.run(query, params, function(err) {
      if (err) {
        db.close();
        return next(err);
      }

      if (this.changes === 0) {
        db.close();
        throw new CustomError('口味不存在', 404);
      }

      // 獲取更新後的口味
      db.get(
        'SELECT * FROM flavors WHERE id = ?',
        [id],
        (err, flavor) => {
          db.close();
          
          if (err) {
            return next(err);
          }

          res.json({
            success: true,
            message: '口味更新成功',
            data: {
              ...flavor,
              isActive: !!flavor.is_active,
              createdAt: flavor.created_at,
              updatedAt: flavor.updated_at
            }
          });
        }
      );
    });
  } catch (error) {
    next(error);
  }
});

// 刪除口味
router.delete('/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    db.run(
      'DELETE FROM flavors WHERE id = ?',
      [id],
      function(err) {
        db.close();
        
        if (err) {
          return next(err);
        }

        if (this.changes === 0) {
          throw new CustomError('口味不存在', 404);
        }

        res.json({
          success: true,
          message: '口味刪除成功'
        });
      }
    );
  } catch (error) {
    next(error);
  }
});

// 批量更新口味狀態
router.patch('/batch-toggle', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { flavorIds, isActive } = req.body;

    if (!Array.isArray(flavorIds) || flavorIds.length === 0) {
      throw new CustomError('請提供要更新的口味ID列表', 400);
    }

    if (typeof isActive !== 'boolean') {
      throw new CustomError('請提供有效的狀態值', 400);
    }

    const db = getDatabase();
    const placeholders = flavorIds.map(() => '?').join(',');
    const params = [...flavorIds, isActive ? 1 : 0];

    db.run(
      `UPDATE flavors SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
      params,
      function(err) {
        db.close();
        
        if (err) {
          return next(err);
        }

        res.json({
          success: true,
          message: `成功更新 ${this.changes} 個口味的狀態`,
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

module.exports = router;
