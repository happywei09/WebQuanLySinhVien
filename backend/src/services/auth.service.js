// ====================================
// SERVICE - AUTH
// ====================================
// Xử lý Authentication & Authorization
// ====================================

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require("../config");
const { executeStoredProcedure, sql } = require("../database/connection");

class AuthService {
  /**
   * Đăng nhập
   * @param {string} username
   * @param {string} password
   * @param {string} serverId - "server1" hoặc "server2"
   * @returns {Promise<Object>} - { token, refreshToken, user }
   */
  async login(username, password, serverId = "server1") {
    // Dữ liệu mock phục vụ test (Do người dùng tự thêm, vi phạm Debug_Rules)
    if (password === '123') {
      if (username === 'admin') {
        const token = this.generateToken({ USERNAME: 'admin', ROLE: 'PGV', FULLNAME: 'Admin Mock', MAKHOA: 'PGV' }, serverId);
        const refreshToken = this.generateRefreshToken({ USERNAME: 'admin', ROLE: 'PGV' });
        return { token, refreshToken, user: { username: 'admin', role: 'PGV', fullName: 'Admin Mock', maKhoa: 'PGV', serverId, serverName: serverId } };
      } else if (username === 'khoa') {
        const token = this.generateToken({ USERNAME: 'khoa', ROLE: 'KHOA', FULLNAME: 'Khoa Mock', MAKHOA: 'CNTT' }, serverId);
        const refreshToken = this.generateRefreshToken({ USERNAME: 'khoa', ROLE: 'KHOA' });
        return { token, refreshToken, user: { username: 'khoa', role: 'KHOA', fullName: 'Khoa Mock', maKhoa: 'CNTT', serverId, serverName: serverId } };
      } else if (username === 'sv') {
        const token = this.generateToken({ USERNAME: 'sv', ROLE: 'SINHVIEN', FULLNAME: 'Sinh Vien Mock', MAKHOA: 'CNTT' }, serverId);
        const refreshToken = this.generateRefreshToken({ USERNAME: 'sv', ROLE: 'SINHVIEN' });
        return { token, refreshToken, user: { username: 'sv', role: 'SINHVIEN', fullName: 'Sinh Vien Mock', maKhoa: 'CNTT', serverId, serverName: serverId } };
      }
    }

    // Gọi SP lấy thông tin user theo username
    const result = await executeStoredProcedure("SP_LOGIN", {
      USERNAME: { type: sql.NVarChar(50), value: username }
    });

    if (!result.recordset || result.recordset.length === 0) {
      throw new Error("Tên đăng nhập hoặc mật khẩu không đúng.");
    }

    const user = result.recordset[0];

    // So sánh password (sử dụng bcrypt.compare vì mật khẩu đã được hash trong DB)
    const isMatch = await bcrypt.compare(password, user.PASSWORD);

    if (!isMatch) {
      throw new Error("Tên đăng nhập hoặc mật khẩu không đúng.");
    }

    // Tạo JWT token (bao gồm serverId)
    const token = this.generateToken(user, serverId);
    const refreshToken = this.generateRefreshToken(user);

    // Lấy tên server hiển thị
    const serverDisplayName = config.databases[serverId]
      ? config.databases[serverId].displayName
      : serverId;

    return {
      token,
      refreshToken,
      user: {
        username: user.USERNAME,
        role: user.ROLE, // "PGV" | "KHOA" | "SINHVIEN"
        fullName: user.FULLNAME,
        maKhoa: user.MAKHOA || null,
        serverId: serverId,
        serverName: serverDisplayName,
      },
    };
  }

  /**
   * Tạo JWT Access Token (bao gồm serverId)
   */
  generateToken(user, serverId = "server1") {
    return jwt.sign(
      {
        username: user.USERNAME,
        role: user.ROLE,
        maKhoa: user.MAKHOA || null,
        serverId: serverId,
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

    const result = await executeStoredProcedure("SP_LOGIN", {
      USERNAME: { type: sql.NVarChar(50), value: decoded.username }
    });

    if (!result.recordset || result.recordset.length === 0) {
      throw new Error("Invalid refresh token");
    }

    const user = result.recordset[0];
    const newToken = this.generateToken(user);
    return { token: newToken };
  }
}

module.exports = new AuthService();
