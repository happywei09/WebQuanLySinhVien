// ====================================
// REPOSITORY - ACCOUNT
// ====================================

const { executeStoredProcedure, getPool, sql } = require("../database/connection");

class AccountRepository {
  async getAll() {
    const pool = getPool();
    const result = await pool.request().execute("SP_GET_ALL_ACCOUNTS");

    return result.recordset || [];
  }

  async create(data) {
    const normalizedRole = data.role === "SINHVIEN" ? "SV" : data.role;

    await executeStoredProcedure("SP_CREATE_LOGIN", {
      LoginName: { type: sql.NVarChar(50), value: data.username },
      Password: { type: sql.NVarChar(50), value: data.password },
    });

    return executeStoredProcedure("SP_CREATE_USER", {
      LoginName: { type: sql.NVarChar(50), value: data.username },
      UserName: { type: sql.NVarChar(50), value: data.maNV },
      RoleName: { type: sql.NVarChar(20), value: normalizedRole },
    });
  }

  async delete(username) {
    const pool = getPool();

    await pool.request()
      .input("LoginName", sql.NVarChar(128), username)
      .execute("SP_DROP_LOGIN_AND_USER");

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
