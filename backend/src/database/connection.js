// ====================================
// DATABASE CONNECTION - SQL Server (Dual Server)
// ====================================
// File: database/connection.js
// Mục đích: Kết nối 2 SQL Server, đồng bộ dữ liệu 2 chiều
// ====================================

const sql = require("mssql");
const { AsyncLocalStorage } = require("async_hooks");
const config = require("../config");

// ====================================
// ASYNC LOCAL STORAGE - Server Context
// ====================================
// Lưu trữ serverId ("server1" | "server2") cho mỗi request
const dbStorage = new AsyncLocalStorage();

// ====================================
// CONNECTION POOLS - Dual Server
// ====================================

const pools = {
  server1: null,
  server2: null,
};

/**
 * Khởi tạo connection pool cho một server cụ thể
 * @param {"server1"|"server2"} serverId
 * @returns {Promise<sql.ConnectionPool>}
 */
async function initPool(serverId) {
  const dbConfig = config.databases[serverId];
  if (!dbConfig) {
    throw new Error(`Không tìm thấy cấu hình cho ${serverId}`);
  }

  try {
    pools[serverId] = await sql.connect({
      server: dbConfig.server,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password,
      options: dbConfig.options,
      pool: dbConfig.pool,
    });

    console.log(
      `✅ Kết nối ${dbConfig.displayName} (${dbConfig.database}@${dbConfig.server}) thành công`
    );
    return pools[serverId];
  } catch (error) {
    console.error(
      `❌ Lỗi kết nối ${dbConfig.displayName} (${dbConfig.database}@${dbConfig.server}):`,
      error.message
    );
    throw error;
  }
}

/**
 * Khởi tạo cả 2 server
 * Nếu 1 server lỗi thì vẫn cho phép chạy với server còn lại
 */
async function initAllPools() {
  const results = { server1: false, server2: false };

  try {
    await initPool("server1");
    results.server1 = true;
  } catch (err) {
    console.error("⚠️ Cảnh báo: Server 1 không khả dụng:", err.message);
  }

  // Server 2 dùng connection string riêng, tránh trùng pool
  try {
    const db2Config = config.databases.server2;
    const pool2 = new sql.ConnectionPool({
      server: db2Config.server,
      port: db2Config.port,
      database: db2Config.database,
      user: db2Config.user,
      password: db2Config.password,
      options: db2Config.options,
      pool: db2Config.pool,
    });
    pools.server2 = await pool2.connect();
    console.log(
      `✅ Kết nối ${db2Config.displayName} (${db2Config.database}@${db2Config.server}) thành công`
    );
    results.server2 = true;
  } catch (err) {
    console.error("⚠️ Cảnh báo: Server 2 không khả dụng:", err.message);
  }

  return results;
}

/**
 * Lấy connection pool theo serverId
 * @param {"server1"|"server2"} serverId
 * @returns {sql.ConnectionPool}
 */
function getPool(serverId) {
  const targetId = serverId || dbStorage.getStore() || "server1";
  const pool = pools[targetId];
  if (!pool) {
    throw new Error(
      `Pool cho ${targetId} chưa được khởi tạo hoặc đã bị đóng`
    );
  }
  return pool;
}

// ====================================
// WRITE PROCEDURE DETECTION
// ====================================

/**
 * Kiểm tra xem stored procedure có phải là thao tác ghi (write) hay không
 * Nếu là write → cần thực thi trên CẢ HAI server để đồng bộ
 * @param {string} procedureName
 * @returns {boolean}
 */
function isWriteProcedure(procedureName) {
  const writeKeywords = [
    "CREATE",
    "INSERT",
    "UPDATE",
    "DELETE",
    "CANCEL",
    "RESTORE",
    "ADD",
    "REMOVE",
  ];
  const upperName = procedureName.toUpperCase();
  return writeKeywords.some((keyword) => upperName.includes(keyword));
}

// ====================================
// EXECUTE ON A SPECIFIC POOL
// ====================================

/**
 * Thực thi SP trên một pool cụ thể
 * @param {sql.ConnectionPool} pool
 * @param {string} procedureName
 * @param {Object} params
 * @returns {Promise<Object>}
 */
async function executeSPOnPool(pool, procedureName, params = {}) {
  const request = pool.request();

  for (const [key, param] of Object.entries(params)) {
    if (param.type && param.value !== undefined) {
      request.input(key, param.type, param.value);
    }
  }

  const result = await request.execute(procedureName);

  return {
    recordset: result.recordset || [],
    recordsets: result.recordsets || [],
    rowsAffected: result.rowsAffected || [],
    output: result.output || {},
  };
}



// ====================================
// EXECUTE STORED PROCEDURE (with dual-write)
// ====================================

/**
 * Thực thi một Stored Procedure
 *
 * - READ: chỉ chạy trên server đang được chọn (theo AsyncLocalStorage)
 * - WRITE: chạy trên CẢ HAI server để đồng bộ dữ liệu
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
  const currentServerId = dbStorage.getStore() || "server1";

  try {
    if (isWriteProcedure(procedureName)) {
      // ====================================
      // WRITE: Thực thi trên CẢ 2 server (đồng bộ)
      // ====================================
      const primaryPool = getPool(currentServerId);
      const primaryResult = await executeSPOnPool(
        primaryPool,
        procedureName,
        params
      );

      // Đồng bộ sang server còn lại
      const replicaId = currentServerId === "server1" ? "server2" : "server1";
      try {
        const replicaPool = pools[replicaId];
        if (replicaPool) {
          await executeSPOnPool(replicaPool, procedureName, params);
          console.log(
            `🔄 Đồng bộ SP [${procedureName}] sang ${replicaId} thành công`
          );
        } else {
          console.warn(
            `⚠️ ${replicaId} không khả dụng, bỏ qua đồng bộ SP [${procedureName}]`
          );
        }
      } catch (replicaError) {
        // Ghi log lỗi nhưng KHÔNG throw - vẫn trả kết quả primary
        console.error(
          `⚠️ Lỗi đồng bộ SP [${procedureName}] sang ${replicaId}:`,
          replicaError.message
        );
      }

      return primaryResult;
    } else {
      // ====================================
      // READ: Chỉ thực thi trên server hiện tại
      // ====================================
      const pool = getPool(currentServerId);
      return await executeSPOnPool(pool, procedureName, params);
    }
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

async function closeAllConnections() {
  for (const [id, pool] of Object.entries(pools)) {
    if (pool) {
      try {
        await pool.close();
        pools[id] = null;
        console.log(`🔌 Đã đóng kết nối ${id}`);
      } catch (err) {
        console.error(`❌ Lỗi đóng kết nối ${id}:`, err.message);
      }
    }
  }
}

/**
 * Lấy danh sách server khả dụng (cho API /servers)
 */
function getAvailableServers() {
  return Object.entries(config.databases).map(([id, dbConf]) => ({
    id,
    name: dbConf.displayName,
    database: dbConf.database,
    connected: !!pools[id],
  }));
}

module.exports = {
  initAllPools,
  getPool,
  executeStoredProcedure,
  closeAllConnections,
  getAvailableServers,
  dbStorage,
  sql, // Export sql module để sử dụng sql types (sql.NVarChar, sql.Int, ...)
};
