const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../utils/initDatabase');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { CustomError } = require('../middleware/errorHandler');

const router = express.Router();

// --- Multer Setup for Image Upload ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/products');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new CustomError('僅支持圖片上傳 (jpeg, jpg, png, gif)', 400));
  }
});

// 獲取所有產品
router.get('/', optionalAuth, (req, res, next) => {
  try {
    const db = getDatabase();
    db.all('SELECT * FROM products ORDER BY created_at DESC', [], (err, products) => {
      db.close();
      if (err) return next(err);
      res.json({
        success: true,
        data: products.map(p => ({ ...p, imageUrl: `/uploads/products/${p.image_url}` }))
      });
    });
  } catch (error) {
    next(error);
  }
});

// 獲取單個產品
router.get('/:id', optionalAuth, (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
      db.close();
      if (err) return next(err);
      if (!product) throw new CustomError('產品不存在', 404);
      res.json({ 
        success: true, 
        data: { ...product, imageUrl: `/uploads/products/${product.image_url}` } 
      });
    });
  } catch (error) {
    next(error);
  }
});

// 創建產品
router.post('/', authenticateToken, requireAdmin, upload.single('image'), (req, res, next) => {
  try {
    const { name, description, category, base_price, stock, status } = req.body;
    const imageUrl = req.file ? req.file.filename : null;

    if (!name || !category || !base_price || stock === undefined) {
      throw new CustomError('請提供所有必填欄位 (名稱, 分類, 基礎價格, 庫存)', 400);
    }

    const db = getDatabase();
    const productId = uuidv4();
    db.run(
      'INSERT INTO products (id, name, description, category, base_price, stock, status, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [productId, name, description, category, parseFloat(base_price), parseInt(stock), status || 'active', imageUrl],
      function (err) {
        db.close();
        if (err) return next(err);
        res.status(201).json({ success: true, message: '產品創建成功', data: { id: productId } });
      }
    );
  } catch (error) {
    next(error);
  }
});

// 更新產品
router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, category, base_price, stock, status } = req.body;
    const db = getDatabase();

    db.get('SELECT image_url FROM products WHERE id = ?', [id], (err, product) => {
      if (err) {
        db.close();
        return next(err);
      }
      if (!product) {
        db.close();
        throw new CustomError('產品不存在', 404);
      }

      const oldImageUrl = product.image_url;
      const newImageUrl = req.file ? req.file.filename : oldImageUrl;

      db.run(
        'UPDATE products SET name = ?, description = ?, category = ?, base_price = ?, stock = ?, status = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, description, category, parseFloat(base_price), parseInt(stock), status, newImageUrl, id],
        function (err) {
          db.close();
          if (err) return next(err);

          if (req.file && oldImageUrl) {
            const oldPath = path.join(__dirname, '../../uploads/products', oldImageUrl);
            if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
            }
          }
          res.json({ success: true, message: '產品更新成功' });
        }
      );
    });
  } catch (error) {
    next(error);
  }
});

// 刪除產品
router.delete('/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    db.get('SELECT image_url FROM products WHERE id = ?', [id], (err, product) => {
      if (err) {
        db.close();
        return next(err);
      }
      if (!product) {
        db.close();
        throw new CustomError('產品不存在', 404);
      }

      db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
        db.close();
        if (err) return next(err);

        if (product.image_url) {
          const imagePath = path.join(__dirname, '../../uploads/products', product.image_url);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
        res.json({ success: true, message: '產品刪除成功' });
      });
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
