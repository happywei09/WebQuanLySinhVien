// ====================================
// MIDDLEWARE - AUTHENTICATION
// ====================================

const jwt = require("jsonwebtoken");
const config = require("../config");

/**
 * Verify JWT token từ Authorization header
 * Format: Bearer <token>
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Không có quyền truy cập. Vui lòng đăng nhập.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    // Gắn thông tin user vào request
    req.user = {
      username: decoded.username,
      role: decoded.role,
      maKhoa: decoded.maKhoa,
      serverId: decoded.serverId || "server1",
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token đã hết hạn. Vui lòng đăng nhập lại.",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ.",
    });
  }
};

module.exports = { authenticate };
