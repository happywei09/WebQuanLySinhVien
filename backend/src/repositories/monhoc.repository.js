// ====================================
// REPOSITORY - MONHOC
// ====================================

const { executeStoredProcedure, sql } = require("../database/connection");
const MONHOC_PROCEDURES = require("../database/procedures/monhoc.procedure");

class MonHocRepository {
  async getAll() {
    const result = await executeStoredProcedure(MONHOC_PROCEDURES.GET_ALL);
    return result.recordset;
  }

  async getById(maMH) {
    const result = await executeStoredProcedure(MONHOC_PROCEDURES.GET_BY_ID, {
      MAMH: { type: sql.NVarChar(50), value: maMH },
    });
    return result.recordset[0] || null;
  }

  async create(data) {
    const result = await executeStoredProcedure(MONHOC_PROCEDURES.CREATE, {
      MAMH: { type: sql.NVarChar(50), value: data.MAMH },
      TENMH: { type: sql.NVarChar(100), value: data.TENMH },
      SOTIET_LT: { type: sql.Int, value: data.SOTIET_LT },
      SOTIET_TH: { type: sql.Int, value: data.SOTIET_TH },
    });
    return result;
  }

  async update(maMH, data) {
    const result = await executeStoredProcedure(MONHOC_PROCEDURES.UPDATE, {
      MAMH: { type: sql.NVarChar(50), value: maMH },
      TENMH: { type: sql.NVarChar(100), value: data.TENMH },
      SOTIET_LT: { type: sql.Int, value: data.SOTIET_LT },
      SOTIET_TH: { type: sql.Int, value: data.SOTIET_TH },
    });
    return result;
  }

  async delete(maMH) {
    const result = await executeStoredProcedure(MONHOC_PROCEDURES.DELETE, {
      MAMH: { type: sql.NVarChar(50), value: maMH },
    });
    return result;
  }

  async search(keyword) {
    const result = await executeStoredProcedure(MONHOC_PROCEDURES.SEARCH, {
      KEYWORD: { type: sql.NVarChar(100), value: keyword },
    });
    return result.recordset;
  }
}

module.exports = new MonHocRepository();
