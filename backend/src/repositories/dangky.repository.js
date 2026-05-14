// ====================================
// REPOSITORY - DANGKY
// ====================================

const { executeStoredProcedure, sql } = require("../database/connection");
const DANGKY_PROCEDURES = require("../database/procedures/dangky.procedure");

class DangKyRepository {
  async getAll() {
    const result = await executeStoredProcedure(DANGKY_PROCEDURES.GET_ALL);
    return result.recordset;
  }

  async getByLopTinChi(maLTC) {
    const result = await executeStoredProcedure(DANGKY_PROCEDURES.GET_BY_LTC, {
      MALTC: { type: sql.Int, value: maLTC },
    });
    return result.recordset;
  }

  async getBySinhVien(maSV) {
    const result = await executeStoredProcedure(DANGKY_PROCEDURES.GET_BY_SV, {
      MASV: { type: sql.NVarChar(50), value: maSV },
    });
    return result.recordset;
  }

  async create(data) {
    const result = await executeStoredProcedure(DANGKY_PROCEDURES.CREATE, {
      MALTC: { type: sql.Int, value: data.MALTC },
      MASV: { type: sql.NVarChar(50), value: data.MASV },
      DIEM_CC: { type: sql.Float, value: data.DIEM_CC || null },
      DIEM_GK: { type: sql.Float, value: data.DIEM_GK || null },
      DIEM_CK: { type: sql.Float, value: data.DIEM_CK || null },
      HUYDANGKY: { type: sql.Bit, value: data.HUYDANGKY || false },
    });
    return result;
  }

  async update(maLTC, maSV, data) {
    const result = await executeStoredProcedure(DANGKY_PROCEDURES.UPDATE, {
      MALTC: { type: sql.Int, value: maLTC },
      MASV: { type: sql.NVarChar(50), value: maSV },
      DIEM_CC: { type: sql.Float, value: data.DIEM_CC },
      DIEM_GK: { type: sql.Float, value: data.DIEM_GK },
      DIEM_CK: { type: sql.Float, value: data.DIEM_CK },
      HUYDANGKY: { type: sql.Bit, value: data.HUYDANGKY },
    });
    return result;
  }

  async delete(maLTC, maSV) {
    const result = await executeStoredProcedure(DANGKY_PROCEDURES.DELETE, {
      MALTC: { type: sql.Int, value: maLTC },
      MASV: { type: sql.NVarChar(50), value: maSV },
    });
    return result;
  }

  async cancel(maLTC, maSV) {
    const result = await executeStoredProcedure(DANGKY_PROCEDURES.CANCEL, {
      MALTC: { type: sql.Int, value: maLTC },
      MASV: { type: sql.NVarChar(50), value: maSV },
    });
    return result;
  }
}

module.exports = new DangKyRepository();
