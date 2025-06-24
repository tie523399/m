const express = require('express');
const svgCaptcha = require('svg-captcha');
const { CustomError } = require('../middleware/errorHandler');

const router = express.Router();

// 生成驗證碼
router.get('/', (req, res, next) => {
  try {
    const captcha = svgCaptcha.create({
      size: 4, // 4個字元
      noise: 2, // 2條干擾線
      color: true, // 顏色
      background: '#f0f0f0', // 背景色
      ignoreChars: '0o1i', // 忽略易混淆的字元
    });

    req.session.captcha = captcha.text.toLowerCase(); // 將驗證碼存入 session (忽略大小寫)
    
    res.type('svg');
    res.status(200).send(captcha.data);
  } catch (error) {
    next(error);
  }
});

// 驗證驗證碼 (可用於前端即時驗證)
router.post('/verify', (req, res, next) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      throw new CustomError('請提供驗證碼', 400);
    }

    if (req.session.captcha && req.session.captcha === code.toLowerCase()) {
      res.json({ success: true, message: '驗證碼正確' });
    } else {
      // 即使驗證失敗，也重新生成驗證碼，防止暴力破解
      const newCaptcha = svgCaptcha.create();
      req.session.captcha = newCaptcha.text.toLowerCase();
      throw new CustomError('驗證碼錯誤', 400);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
