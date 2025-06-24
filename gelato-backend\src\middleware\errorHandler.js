// 錯誤處理中間件
const errorHandler = (err, req, res, next) => {
  console.error('❌ 服務器錯誤:', err);

  // 默認錯誤
  let error = {
    success: false,
    message: err.message || '服務器內部錯誤',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // SQLite錯誤
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    error.message = '數據已存在，請檢查是否重複';
    return res.status(400).json(error);
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    error.message = '相關數據不存在';
    return res.status(400).json(error);
  }

  // JWT錯誤
  if (err.name === 'JsonWebTokenError') {
    error.message = '無效的認證令牌';
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    error.message = '認證令牌已過期';
    return res.status(401).json(error);
  }

  // 驗證錯誤
  if (err.name === 'ValidationError') {
    error.message = '數據驗證失敗';
    error.details = err.details;
    return res.status(400).json(error);
  }

  // 文件上傳錯誤
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = '文件大小超過限制';
    return res.status(400).json(error);
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error.message = '文件數量超過限制';
    return res.status(400).json(error);
  }

  // 自定義錯誤狀態碼
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json(error);
};

// 創建自定義錯誤類
class CustomError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'CustomError';
  }
}

// 404錯誤處理
const notFound = (req, res, next) => {
  const error = new CustomError(`找不到路徑 ${req.originalUrl}`, 404);
  next(error);
};

module.exports = {
  errorHandler,
  CustomError,
  notFound
};
