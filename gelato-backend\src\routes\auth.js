const express = require('express');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { getDatabase } = require('../utils/initDatabase');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { CustomError } = require('../middleware/errorHandler');

const router = express.Router();

// 登入
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 驗證輸入
    if (!username || !password) {
      throw new CustomError('請提供用戶名和密碼', 400);
    }

    if (username.length < 3) {
      throw new CustomError('用戶名至少需要3個字元', 400);
    }

    if (password.length < 6) {
      throw new CustomError('密碼至少需要6個字元', 400);
    }

    const db = getDatabase();
    
    // 查找用戶
    db.get(
      'SELECT * FROM users WHERE username = ?',
      [username],
      async (err, user) => {
        if (err) {
          db.close();
          return next(err);
        }

        if (!user) {
          db.close();
          return res.status(401).json({
            success: false,
            message: '用戶名或密碼錯誤'
          });
        }

        // 驗證密碼
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
          db.close();
          return res.status(401).json({
            success: false,
            message: '用戶名或密碼錯誤'
          });
        }

        // 生成令牌
        const token = generateToken(user);

        // 更新最後登入時間
        db.run(
          'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [user.id],
          (err) => {
            db.close();
            
            if (err) {
              console.error('更新登入時間失敗:', err);
            }

            // 返回用戶信息（不包含密碼）
            const { password_hash, ...userWithoutPassword } = user;
            
            res.json({
              success: true,
              message: '登入成功',
              data: {
                user: userWithoutPassword,
                token
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

// 登出
router.post('/logout', authenticateToken, (req, res) => {
  // 在實際應用中，可以將令牌加入黑名單
  // 這裡簡單返回成功消息
  res.json({
    success: true,
    message: '登出成功'
  });
});

// 變更密碼
router.post('/change-password', authenticateToken, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    // 驗證輸入
    if (!oldPassword || !newPassword) {
      throw new CustomError('請提供舊密碼和新密碼', 400);
    }

    if (newPassword.length < 6) {
      throw new CustomError('新密碼至少需要6個字元', 400);
    }

    if (oldPassword === newPassword) {
      throw new CustomError('新密碼不能與舊密碼相同', 400);
    }

    const db = getDatabase();
    
    // 獲取用戶當前密碼
    db.get(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId],
      async (err, user) => {
        if (err) {
          db.close();
          return next(err);
        }

        if (!user) {
          db.close();
          throw new CustomError('用戶不存在', 404);
        }

        // 驗證舊密碼
        const isValidOldPassword = await bcrypt.compare(oldPassword, user.password_hash);
        
        if (!isValidOldPassword) {
          db.close();
          return res.status(400).json({
            success: false,
            message: '舊密碼錯誤'
          });
        }

        // 加密新密碼
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // 更新密碼
        db.run(
          'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [hashedNewPassword, userId],
          function(err) {
            db.close();
            
            if (err) {
              return next(err);
            }

            res.json({
              success: true,
              message: '密碼已成功更新'
            });
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
});

// 獲取當前用戶信息
router.get('/me', authenticateToken, (req, res, next) => {
  try {
    const db = getDatabase();
    
    db.get(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id],
      (err, user) => {
        db.close();
        
        if (err) {
          return next(err);
        }

        if (!user) {
          throw new CustomError('用戶不存在', 404);
        }

        res.json({
          success: true,
          data: user
        });
      }
    );
  } catch (error) {
    next(error);
  }
});

// 驗證令牌
router.post('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: '令牌有效',
    data: {
      user: req.user
    }
  });
});

module.exports = router;
