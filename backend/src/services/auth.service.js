// ====================================
// SERVICE - AUTH
// ====================================
// Xử lý Authentication & Authorization
// ====================================

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require("../config");
const { executeStoredProcedure, getPool, sql } = require("../database/connection");

class AuthService {
  /**
   * Đăng nhập
   * Hỗ trợ 2 hình thức:
   * 1. Sinh viên: Kiểm tra qua bảng Sinhvien bằng SP_STUDENT_LOGIN
   * 2. Giảng viên/PGV: Thử kết nối SQL Server bằng username/password của chính họ,
   *    sau đó lấy ra DB User, Role và Họ tên tương ứng.
   * @param {string} username
   * @param {string} password
   * @param {string} serverId - "server1" hoặc "server2"
   * @returns {Promise<Object>} - { token, refreshToken, user }
   */
  async login(username, password, serverId = "server1") {
    let user = null;

    // 1. Thử đăng nhập dưới tư cách Sinh viên (sử dụng SP_STUDENT_LOGIN)
    try {
      const result = await executeStoredProcedure("SP_STUDENT_LOGIN", {
        MaSV: { type: sql.NVarChar(10), value: username },
        Password: { type: sql.NVarChar(40), value: password },
      });

      if (result.recordset && result.recordset.length > 0) {
        const dbSV = result.recordset[0];
        user = {
          USERNAME: dbSV.MASV.trim(),
          ROLE: "SINHVIEN",
          FULLNAME: `${dbSV.HO ? dbSV.HO.trim() : ""} ${dbSV.TEN ? dbSV.TEN.trim() : ""}`.trim(),
          MALOP: dbSV.MALOP ? dbSV.MALOP.trim() : null
        };
      }
    } catch (studentLoginError) {
      console.log("Thử đăng nhập sinh viên không thành công:", studentLoginError.message);
    }

    // 2. Nếu không phải sinh viên, thử kết nối SQL Login (Giảng viên / PGV)
    if (!user) {
      let isConnectSuccess = false;
      try {
        const dbConfig = config.databases[serverId];
        if (!dbConfig) {
          throw new Error(`Không tìm thấy cấu hình cho server ${serverId}`);
        }

        // Tạo ConnectionPool tạm thời bằng thông tin đăng nhập của giảng viên
        const tempPool = new sql.ConnectionPool({
          server: dbConfig.server,
          port: dbConfig.port,
          database: dbConfig.database,
          user: username,
          password: password,
          options: dbConfig.options,
        });

        await tempPool.connect();
        isConnectSuccess = true;
        await tempPool.close();
      } catch (staffLoginError) {
        console.log("Thử đăng nhập Giảng viên/PGV qua SQL Login không thành công:", staffLoginError.message);
      }

      if (isConnectSuccess) {
        try {
          // Kết nối thành công -> Lấy thông tin User bằng mainPool (chạy quyền sa/admin) để tránh lỗi phân quyền
          const mainPool = getPool(serverId);

          // A. Tìm Database User Name tương ứng với Login này
          const dbUserResult = await mainPool.request()
            .input("loginName", sql.NVarChar(128), username)
            .query(`
              SELECT u.name AS UserName 
              FROM sys.database_principals u
              INNER JOIN sys.sql_logins l ON u.sid = l.sid
              WHERE l.name = @loginName;
            `);

          let dbUser = username;
          if (dbUserResult.recordset && dbUserResult.recordset.length > 0) {
            dbUser = dbUserResult.recordset[0].UserName.trim();
          }

          // B. Lấy các Role của User này
          const rolesResult = await mainPool.request()
            .input("UserName", sql.NVarChar(128), dbUser)
            .execute("SP_GET_USER_ROLES");

          let role = "KHOA"; // Mặc định
          if (rolesResult.recordset && rolesResult.recordset.length > 0) {
            role = rolesResult.recordset[0].RoleName.trim();
          } else {
            if (dbUser.toLowerCase() === "dbo" || username.toLowerCase() === "sa" || username.toLowerCase() === "pgv_admin") {
              role = "PGV";
            }
          }

          // C. Lấy họ tên giảng viên từ bảng GIANGVIEN
          const nameResult = await mainPool.request()
            .input("MAGV", sql.NChar(10), dbUser)
            .query("SELECT HO, TEN, MAKHOA FROM GIANGVIEN WHERE MAGV = @MAGV");

          let fullName = username;
          let maKhoa = null;
          if (nameResult.recordset && nameResult.recordset.length > 0) {
            const gv = nameResult.recordset[0];
            fullName = `${gv.HO ? gv.HO.trim() : ""} ${gv.TEN ? gv.TEN.trim() : ""}`.trim();
            maKhoa = gv.MAKHOA ? gv.MAKHOA.trim() : null;
          } else {
            if (role === "PGV" || role === "db_owner") {
              fullName = "Quản trị viên (PGV)";
              role = "PGV";
            } else {
              fullName = `Nhân viên (${dbUser})`;
            }
          }

          // Chuẩn hóa role
          if (role === "db_owner") role = "PGV";
          if (role === "SV") role = "SINHVIEN";

          user = {
            USERNAME: dbUser,
            ROLE: role,
            FULLNAME: fullName,
            MAKHOA: maKhoa
          };
        } catch (fetchInfoError) {
          console.error("Lỗi lấy thông tin tài khoản sau khi login thành công:", fetchInfoError);
          user = {
            USERNAME: username,
            ROLE: username.toLowerCase() === "sa" ? "PGV" : "KHOA",
            FULLNAME: `Tài khoản (${username})`,
            MAKHOA: null
          };
        }
      }
    }

    // MOCK BACKUP: Giữ lại tài khoản test phòng hờ DB trống chưa cài logins
    if (!user) {
      if (username === "admin" && password === "123") {
        user = { USERNAME: "admin", ROLE: "PGV", FULLNAME: "Quản trị viên (PGV)" };
      } else if (username === "khoa" && password === "123") {
        user = { USERNAME: "khoa_cntt", ROLE: "KHOA", FULLNAME: "Giảng viên Khoa CNTT", MAKHOA: "CNTT" };
      }
    }

    if (!user) {
      throw new Error("Tên đăng nhập hoặc mật khẩu không chính xác.");
    }

    // Tạo JWT token (bao gồm serverId)
    const token = this.generateToken(user, serverId);
    const refreshToken = this.generateRefreshToken(user, serverId);

    // Lấy tên server hiển thị
    const serverDisplayName = config.databases[serverId]
      ? config.databases[serverId].displayName
      : serverId;

    return {
      token,
      refreshToken,
      user: {
        username: user.USERNAME,
        role: user.ROLE,
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
        username: user.USERNAME || user.username,
        role: user.ROLE || user.role,
        maKhoa: user.MAKHOA || user.maKhoa || null,
        serverId: serverId,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  /**
   * Tạo JWT Refresh Token
   */
  generateRefreshToken(user, serverId = "server1") {
    return jwt.sign(
      {
        username: user.USERNAME || user.username,
        role: user.ROLE || user.role,
        maKhoa: user.MAKHOA || user.maKhoa || null,
        serverId: serverId,
      },
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
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);

      const user = {
        username: decoded.username,
        role: decoded.role,
        maKhoa: decoded.maKhoa || null,
      };

      const newToken = this.generateToken(user, decoded.serverId || "server1");
      return { token: newToken };
    } catch (error) {
      throw new Error("Invalid or expired refresh token");
    }
  }

  /**
   * Đổi mật khẩu
   * @param {string} username - Mã SV hoặc Mã GV
   * @param {string} oldPassword
   * @param {string} newPassword
   * @param {string} role - "SINHVIEN", "KHOA", "PGV"
   * @returns {Promise<boolean>}
   */
  async changePassword(username, oldPassword, newPassword, role) {
    const isStudent = role === "SINHVIEN" ? 1 : 0;
    
    // Thực thi stored procedure SP_CHANGE_PASSWORD
    await executeStoredProcedure("SP_CHANGE_PASSWORD", {
      UserName: { type: sql.NVarChar(50), value: username },
      OldPassword: { type: sql.NVarChar(50), value: oldPassword },
      NewPassword: { type: sql.NVarChar(50), value: newPassword },
      IsStudent: { type: sql.Bit, value: isStudent },
    });
    
    return true;
  }
}

module.exports = new AuthService();
