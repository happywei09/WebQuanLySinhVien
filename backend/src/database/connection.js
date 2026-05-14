// ====================================
// DATABASE CONNECTION - SQL Server
// ====================================
// File: database/connection.js
// Mục đích: Kết nối SQL Server và thực thi Stored Procedure
// ====================================

const sql = require("mssql");
const config = require("../config");

// ====================================
// CONNECTION POOL
// ====================================

let pool = null;

/**
 * Khởi tạo connection pool tới SQL Server
 * @returns {Promise<sql.ConnectionPool>}
 */
async function getPool() {
  if (!pool) {
    try {
      pool = await sql.connect({
        server: config.database.server,
        port: config.database.port,
        database: config.database.database,
        user: config.database.user,
        password: config.database.password,
        options: config.database.options,
        pool: config.database.pool,
      });

      console.log("✅ Kết nối SQL Server thành công");
    } catch (error) {
      console.error("❌ Lỗi kết nối SQL Server:", error.message);
      throw error;
    }
  }
  return pool;
}

// ====================================
// EXECUTE STORED PROCEDURE
// ====================================

/**
 * Thực thi một Stored Procedure
 *
 * @param {string} procedureName - Tên Stored Procedure (ví dụ: "SP_GET_ALL_KHOA")
 * @param {Object} params - Object chứa các tham số truyền vào SP
 *   Mỗi key là tên param, value là { type, value }
 *   Ví dụ: { MAKHOA: { type: sql.NVarChar(50), value: "CNTT" } }
 * @returns {Promise<Object>} - Kết quả trả về từ SP
 *
 * Cách sử dụng:
 *
 *   const result = await executeStoredProcedure("SP_GET_ALL_KHOA");
 *
 *   const result = await executeStoredProcedure("SP_CREATE_KHOA", {
 *     MAKHOA: { type: sql.NVarChar(50), value: "CNTT" },
 *     TENKHOA: { type: sql.NVarChar(100), value: "Công nghệ thông tin" }
 *   });
 */
async function executeStoredProcedure(procedureName, params = {}) {
  try {
    const poolConnection = await getPool();
    const request = poolConnection.request();

    // TODO: Nhóm bổ sung - Map các tham số vào request
    // Duyệt qua params object và gọi request.input() cho mỗi param
    for (const [key, param] of Object.entries(params)) {
      if (param.type && param.value !== undefined) {
        request.input(key, param.type, param.value);
      }
    }

    // TODO: Nhóm bổ sung - Thực thi Stored Procedure
    const result = await request.execute(procedureName);

    return {
      recordset: result.recordset || [],
      recordsets: result.recordsets || [],
      rowsAffected: result.rowsAffected || [],
      output: result.output || {},
    };
  } catch (error) {
    console.error(
      `❌ Lỗi thực thi SP [${procedureName}]:`,
      error.message
    );
    throw error;
  }
}

// ====================================
// EXECUTE STORED PROCEDURE VỚI OUTPUT PARAMS
// ====================================

/**
 * Thực thi SP có output parameters
 *
 * @param {string} procedureName
 * @param {Object} inputParams - { paramName: { type, value } }
 * @param {Object} outputParams - { paramName: { type } }
 * @returns {Promise<Object>}
 */
async function executeStoredProcedureWithOutput(
  procedureName,
  inputParams = {},
  outputParams = {}
) {
  try {
    const poolConnection = await getPool();
    const request = poolConnection.request();

    // Input params
    for (const [key, param] of Object.entries(inputParams)) {
      if (param.type && param.value !== undefined) {
        request.input(key, param.type, param.value);
      }
    }

    // Output params
    for (const [key, param] of Object.entries(outputParams)) {
      if (param.type) {
        request.output(key, param.type);
      }
    }

    const result = await request.execute(procedureName);

    return {
      recordset: result.recordset || [],
      recordsets: result.recordsets || [],
      rowsAffected: result.rowsAffected || [],
      output: result.output || {},
    };
  } catch (error) {
    console.error(
      `❌ Lỗi thực thi SP [${procedureName}]:`,
      error.message
    );
    throw error;
  }
}

// ====================================
// CLOSE CONNECTION
// ====================================

async function closeConnection() {
  if (pool) {
    await pool.close();
    pool = null;
    console.log("🔌 Đã đóng kết nối SQL Server");
  }
}

module.exports = {
  getPool,
  executeStoredProcedure,
  executeStoredProcedureWithOutput,
  closeConnection,
  sql, // Export sql module để sử dụng sql types (sql.NVarChar, sql.Int, ...)
};
