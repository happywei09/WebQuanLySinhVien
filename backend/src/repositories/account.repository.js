// ====================================
// REPOSITORY - ACCOUNT
// ====================================

const { executeStoredProcedure, getPool, sql } = require("../database/connection");

class AccountRepository {
  async getAll() {
    const result = await executeStoredProcedure("SP_VIEW_ACCOUNTS");
    return result.recordset;
  }

  async create(data) {
    // 1. Tạo Login trên SQL Server bằng username & password
    await executeStoredProcedure("SP_CREATE_LOGIN", {
      LoginName: { type: sql.NVarChar(50), value: data.username },
      Password: { type: sql.NVarChar(50), value: data.password },
    });

    // 2. Tạo User trong database, map với Login và gán Role.
    // Đối số UserName bắt buộc là Mã giảng viên/Mã sinh viên (data.maNV)
    const result = await executeStoredProcedure("SP_CREATE_USER", {
      LoginName: { type: sql.NVarChar(50), value: data.username },
      UserName: { type: sql.NVarChar(50), value: data.maNV },
      RoleName: { type: sql.NVarChar(20), value: data.role },
    });

    // 3. Ghi log vào bảng ACCOUNTS để giao diện có thể hiển thị danh sách tài khoản
    try {
      const pool = getPool();
      await pool.request()
        .input("username", sql.NVarChar(128), data.username)
        .input("fullName", sql.NVarChar(255), data.fullName)
        .input("role", sql.NVarChar(50), data.role)
        .query(`
          IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ACCOUNTS')
          BEGIN
              IF NOT EXISTS (SELECT * FROM ACCOUNTS WHERE USERNAME = @username)
              BEGIN
                  INSERT INTO ACCOUNTS (USERNAME, FULLNAME, ROLE, CREATED_DATE, IS_ACTIVE)
                  VALUES (@username, @fullName, @role, GETDATE(), 1);
              END
          END
        `);
    } catch (auditError) {
      console.warn("Lỗi ghi log ACCOUNTS:", auditError.message);
    }

    return result;
  }

  async delete(username) {
    const pool = getPool();

    // 1. Tìm Database User tương ứng được liên kết với Login này
    const userResult = await pool.request()
      .input("username", sql.NVarChar(128), username)
      .query(`
        SELECT u.name AS UserName 
        FROM sys.database_principals u
        INNER JOIN sys.sql_logins l ON u.sid = l.sid
        WHERE l.name = @username;
      `);

    const dbUser = userResult.recordset.length > 0 ? userResult.recordset[0].UserName : null;

    // 2. Xóa Database User (nếu có)
    if (dbUser) {
      // Vì không thể truyền trực tiếp tên user vào tham số DROP USER, dùng query ghép chuỗi an toàn
      await pool.request().query(`DROP USER [${dbUser}]`);
    }

    // 3. Xóa SQL Server Login
    await pool.request().query(`DROP LOGIN [${username}]`);

    // 4. Xóa khỏi bảng log ACCOUNTS
    await pool.request()
      .input("username", sql.NVarChar(128), username)
      .query(`
        IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ACCOUNTS')
        BEGIN
            DELETE FROM ACCOUNTS WHERE USERNAME = @username;
        END
      `);

    return { success: true };
  }

  async getNhanVien(maKhoa = null) {
    let result;
    if (maKhoa && maKhoa !== "ALL") {
      result = await executeStoredProcedure("SP_GET_GIANGVIEN_BY_KHOA", {
        MAKHOA: { type: sql.NChar(10), value: maKhoa }
      });
    } else {
      result = await executeStoredProcedure("SP_GET_ALL_GIANGVIEN");
    }
    return result.recordset;
  }
}

module.exports = new AccountRepository();
