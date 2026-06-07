// ====================================
// MIDDLEWARE - ERROR HANDLER
// ====================================

/**
 * Global error handling middleware
 * Phải đặt SAU tất cả routes
 */
const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err.message);
  console.error("Stack:", err.stack);

  // Lỗi validation
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Lỗi SQL Server
  if (err.name === "RequestError" || err.code === "EREQUEST") {
    const originalMessage = err.originalError?.message || err.message;
    console.error("SQL Error:", originalMessage);
    return res.status(500).json({
      success: false,
      message: `Lỗi truy vấn: ${originalMessage}`,
    });
  }

  // Lỗi kết nối DB
  if (err.code === "ECONNREFUSED" || err.code === "ETIMEOUT") {
    return res.status(503).json({
      success: false,
      message: "Không thể kết nối cơ sở dữ liệu",
    });
  }

  // Lỗi chung
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Lỗi hệ thống",
  });
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy route: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = { errorHandler, notFound };
