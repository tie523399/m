const express = require('express');
const { CustomError } = require('../middleware/errorHandler');

const router = express.Router();

// 模拟的7-11门店数据
const mockStores = {
  'S001': { name: '7-11 總部門市', address: '台北市信義區東興路51號' },
  'S002': { name: '7-11 新國貿門市', address: '台北市信義區基隆路一段333號' },
  'S003': { name: '7-11 松高門市', address: '台北市信義區松高路11號' },
};

/**
 * @swagger
 * /api/shipping/711/validate_store:
 *   post:
 *     summary: 模擬驗證7-11門市資訊
 *     description: 接收門市編號，驗證其是否存在，並返回門市資訊。
 *     tags: [Shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               storeNumber:
 *                 type: string
 *                 description: 7-11門市編號
 *                 example: 'S001'
 *     responses:
 *       200:
 *         description: 門市驗證成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     storeNumber:
 *                       type: string
 *                       example: 'S001'
 *                     storeName:
 *                       type: string
 *                       example: '7-11 總部門市'
 *                     storeAddress:
 *                       type: string
 *                       example: '台北市信義區東興路51號'
 *       400:
 *         description: 門市編號無效或不存在
 */
router.post('/711/validate_store', (req, res, next) => {
  try {
    const { storeNumber } = req.body;

    if (!storeNumber) {
      throw new CustomError('請提供門市編號', 400);
    }

    const storeInfo = mockStores[storeNumber];

    if (!storeInfo) {
      throw new CustomError(`門市編號 ${storeNumber} 不存在`, 404);
    }

    res.json({
      success: true,
      data: {
        storeNumber,
        storeName: storeInfo.name,
        storeAddress: storeInfo.address,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
