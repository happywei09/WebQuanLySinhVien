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
    let userMessage = "Lỗi truy vấn cơ sở dữ liệu";
    
    if (err.number === 2627 || err.number === 2601) {
      userMessage = "Dữ liệu bị trùng lặp (Mã khoá chính hoặc giá trị duy nhất đã tồn tại)";
    } else if (err.number === 547) {
      userMessage = "Ràng buộc dữ liệu không hợp lệ (Không thể xoá dữ liệu đang được liên kết, hoặc vi phạm điều kiện kiểm tra)";
    } else if (err.message) {
      userMessage = err.message.replace(/^RequestError:\s*/i, "");
    }

    return res.status(500).json({
      success: false,
      message: userMessage,
      sqlErrorNumber: err.number,
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
