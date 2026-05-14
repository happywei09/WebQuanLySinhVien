// ====================================
// REPOSITORY - LOP
// ====================================

const { executeStoredProcedure, sql } = require("../database/connection");
const LOP_PROCEDURES = require("../database/procedures/lop.procedure");

class LopRepository {
  async getAll() {
    const result = await executeStoredProcedure(LOP_PROCEDURES.GET_ALL);
    return result.recordset;
  }

  async getById(maLop) {
    const result = await executeStoredProcedure(LOP_PROCEDURES.GET_BY_ID, {
      MALOP: { type: sql.NVarChar(50), value: maLop },
    });
    return result.recordset[0] || null;
  }

  async getByKhoa(maKhoa) {
    const result = await executeStoredProcedure(LOP_PROCEDURES.GET_BY_KHOA, {
      MAKHOA: { type: sql.NVarChar(50), value: maKhoa },
    });
    return result.recordset;
  }

  async create(data) {
    const result = await executeStoredProcedure(LOP_PROCEDURES.CREATE, {
      MALOP: { type: sql.NVarChar(50), value: data.MALOP },
      TENLOP: { type: sql.NVarChar(100), value: data.TENLOP },
      KHOAHOC: { type: sql.NVarChar(50), value: data.KHOAHOC },
      MAKHOA: { type: sql.NVarChar(50), value: data.MAKHOA },
    });
    return result;
  }

  async update(maLop, data) {
    const result = await executeStoredProcedure(LOP_PROCEDURES.UPDATE, {
      MALOP: { type: sql.NVarChar(50), value: maLop },
      TENLOP: { type: sql.NVarChar(100), value: data.TENLOP },
      KHOAHOC: { type: sql.NVarChar(50), value: data.KHOAHOC },
      MAKHOA: { type: sql.NVarChar(50), value: data.MAKHOA },
    });
    return result;
  }

  async delete(maLop) {
    const result = await executeStoredProcedure(LOP_PROCEDURES.DELETE, {
      MALOP: { type: sql.NVarChar(50), value: maLop },
    });
    return result;
  }

  async search(keyword) {
    const result = await executeStoredProcedure(LOP_PROCEDURES.SEARCH, {
      KEYWORD: { type: sql.NVarChar(100), value: keyword },
    });
    return result.recordset;
  }
}

module.exports = new LopRepository();
