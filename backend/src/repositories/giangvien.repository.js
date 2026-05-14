// ====================================
// REPOSITORY - GIANGVIEN
// ====================================

const { executeStoredProcedure, sql } = require("../database/connection");
const GIANGVIEN_PROCEDURES = require("../database/procedures/giangvien.procedure");

class GiangVienRepository {
  async getAll() {
    const result = await executeStoredProcedure(GIANGVIEN_PROCEDURES.GET_ALL);
    return result.recordset;
  }

  async getById(maGV) {
    const result = await executeStoredProcedure(GIANGVIEN_PROCEDURES.GET_BY_ID, {
      MAGV: { type: sql.NVarChar(50), value: maGV },
    });
    return result.recordset[0] || null;
  }

  async getByKhoa(maKhoa) {
    const result = await executeStoredProcedure(GIANGVIEN_PROCEDURES.GET_BY_KHOA, {
      MAKHOA: { type: sql.NVarChar(50), value: maKhoa },
    });
    return result.recordset;
  }

  async create(data) {
    const result = await executeStoredProcedure(GIANGVIEN_PROCEDURES.CREATE, {
      MAGV: { type: sql.NVarChar(50), value: data.MAGV },
      HO: { type: sql.NVarChar(100), value: data.HO },
      TEN: { type: sql.NVarChar(50), value: data.TEN },
      HOCVI: { type: sql.NVarChar(50), value: data.HOCVI },
      HOCHAM: { type: sql.NVarChar(50), value: data.HOCHAM },
      CHUYENMON: { type: sql.NVarChar(100), value: data.CHUYENMON },
      MAKHOA: { type: sql.NVarChar(50), value: data.MAKHOA },
    });
    return result;
  }

  async update(maGV, data) {
    const result = await executeStoredProcedure(GIANGVIEN_PROCEDURES.UPDATE, {
      MAGV: { type: sql.NVarChar(50), value: maGV },
      HO: { type: sql.NVarChar(100), value: data.HO },
      TEN: { type: sql.NVarChar(50), value: data.TEN },
      HOCVI: { type: sql.NVarChar(50), value: data.HOCVI },
      HOCHAM: { type: sql.NVarChar(50), value: data.HOCHAM },
      CHUYENMON: { type: sql.NVarChar(100), value: data.CHUYENMON },
      MAKHOA: { type: sql.NVarChar(50), value: data.MAKHOA },
    });
    return result;
  }

  async delete(maGV) {
    const result = await executeStoredProcedure(GIANGVIEN_PROCEDURES.DELETE, {
      MAGV: { type: sql.NVarChar(50), value: maGV },
    });
    return result;
  }

  async search(keyword) {
    const result = await executeStoredProcedure(GIANGVIEN_PROCEDURES.SEARCH, {
      KEYWORD: { type: sql.NVarChar(100), value: keyword },
    });
    return result.recordset;
  }
}

module.exports = new GiangVienRepository();
