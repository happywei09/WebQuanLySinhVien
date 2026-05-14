// ====================================
// SERVICE - AUTH
// ====================================
// Xử lý Authentication & Authorization
// ====================================

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require("../config");

class AuthService {
  /**
   * Đăng nhập
   * TODO: Nhóm bổ sung - Gọi SP kiểm tra user trong database
   * @param {string} username
   * @param {string} password
   * @returns {Promise<Object>} - { token, refreshToken, user }
   */
  async login(username, password) {
    // TODO: Gọi SP lấy thông tin user theo username
    // const user = await executeStoredProcedure("SP_LOGIN", { ... })

    // ====================================
    // MOCK LOGIN FOR TESTING
    // ====================================
    let user = null;
    
    // Tài khoản test: admin/123, khoa/123, sv/123
    if (username === "admin" && password === "123") {
      user = { USERNAME: "admin", ROLE: "PGV", FULLNAME: "Quản trị viên (PGV)" };
    } else if (username === "khoa" && password === "123") {
      user = { USERNAME: "khoa_cntt", ROLE: "KHOA", FULLNAME: "Giảng viên Khoa CNTT", MAKHOA: "CNTT" };
    } else if (username === "sv" && password === "123") {
      user = { USERNAME: "N20DCCN001", ROLE: "SINHVIEN", FULLNAME: "Nguyễn Văn A" };
    }

    if (!user) {
      throw new Error("Tên đăng nhập hoặc mật khẩu không đúng. Thử: admin/123, khoa/123 hoặc sv/123");
    }

    // TODO: So sánh password (nếu lưu hash)
    // const isMatch = await bcrypt.compare(password, user.PASSWORD);

    // Tạo JWT token
    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      token,
      refreshToken,
      user: {
        username: user.USERNAME,
        role: user.ROLE, // "PGV" | "KHOA" | "SINHVIEN"
        fullName: user.FULLNAME,
        maKhoa: user.MAKHOA || null,
      },
    };
  }

  /**
   * Tạo JWT Access Token
   */
  generateToken(user) {
    return jwt.sign(
      {
        username: user.USERNAME,
        role: user.ROLE,
        maKhoa: user.MAKHOA || null,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  /**
   * Tạo JWT Refresh Token
   */
  generateRefreshToken(user) {
    return jwt.sign(
      { username: user.USERNAME },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }

  /**
   * Verify token
   */
  verifyToken(token) {
    return jwt.verify(token, config.jwt.secret);
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

    // TODO: Lấy lại thông tin user từ DB theo decoded.username
    const user = null;

    if (!user) {
      throw new Error("Invalid refresh token");
    }

    const newToken = this.generateToken(user);
    return { token: newToken };
  }
}

module.exports = new AuthService();
