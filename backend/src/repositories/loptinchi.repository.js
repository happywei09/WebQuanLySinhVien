// ====================================
// REPOSITORY - LOPTINCHI
// ====================================

const { executeStoredProcedure, sql } = require("../database/connection");
const LOPTINCHI_PROCEDURES = require("../database/procedures/loptinchi.procedure");

class LopTinChiRepository {
  async getAll() {
    const result = await executeStoredProcedure(LOPTINCHI_PROCEDURES.GET_ALL);
    return (result.recordset || []).sort((a, b) => b.MALTC - a.MALTC);
  }

  async getById(maLTC) {
    const result = await executeStoredProcedure(LOPTINCHI_PROCEDURES.GET_BY_ID, {
      MALTC: { type: sql.Int, value: maLTC },
    });
    return result.recordset[0] || null;
  }

  async getByKhoa(maKhoa) {
    const result = await executeStoredProcedure(LOPTINCHI_PROCEDURES.GET_BY_KHOA, {
      MAKHOA: { type: sql.NVarChar(50), value: maKhoa },
    });
    return (result.recordset || []).sort((a, b) => b.MALTC - a.MALTC);
  }

  async getByNienKhoaHocKy(nienKhoa, hocKy) {
    const result = await executeStoredProcedure(
      LOPTINCHI_PROCEDURES.GET_BY_NIENKHOA_HOCKY,
      {
        NIENKHOA: { type: sql.NVarChar(50), value: nienKhoa },
        HOCKY: { type: sql.Int, value: hocKy },
      }
    );
    return (result.recordset || []).sort((a, b) => b.MALTC - a.MALTC);
  }

  async getByGiangVien(maGV) {
    const result = await executeStoredProcedure(
      LOPTINCHI_PROCEDURES.GET_BY_GIANGVIEN,
      {
        MAGV: { type: sql.NVarChar(50), value: maGV },
      }
    );
    return (result.recordset || []).sort((a, b) => b.MALTC - a.MALTC);
  }

  async create(data) {
    const result = await executeStoredProcedure(LOPTINCHI_PROCEDURES.CREATE, {
      NIENKHOA: { type: sql.NVarChar(50), value: data.NIENKHOA },
      HOCKY: { type: sql.Int, value: data.HOCKY },
      MAMH: { type: sql.NVarChar(50), value: data.MAMH },
      NHOM: { type: sql.Int, value: data.NHOM },
      MAGV: { type: sql.NVarChar(50), value: data.MAGV },
      MAKHOA: { type: sql.NVarChar(50), value: data.MAKHOA },
      SOSVTOITHIEU: { type: sql.Int, value: data.SOSVTOITHIEU },
      HUYLOP: { type: sql.Bit, value: data.HUYLOP || false },
    });
    return result;
  }

  async update(maLTC, data) {
    const result = await executeStoredProcedure(LOPTINCHI_PROCEDURES.UPDATE, {
      MALTC: { type: sql.Int, value: maLTC },
      NIENKHOA: { type: sql.NVarChar(50), value: data.NIENKHOA },
      HOCKY: { type: sql.Int, value: data.HOCKY },
      MAMH: { type: sql.NVarChar(50), value: data.MAMH },
      NHOM: { type: sql.Int, value: data.NHOM },
      MAGV: { type: sql.NVarChar(50), value: data.MAGV },
      MAKHOA: { type: sql.NVarChar(50), value: data.MAKHOA },
      SOSVTOITHIEU: { type: sql.Int, value: data.SOSVTOITHIEU },
    });
    return result;
  }

  async delete(maLTC) {
    const result = await executeStoredProcedure(LOPTINCHI_PROCEDURES.DELETE, {
      MALTC: { type: sql.Int, value: maLTC },
    });
    return result;
  }

  async cancel(maLTC) {
    const result = await executeStoredProcedure(LOPTINCHI_PROCEDURES.CANCEL, {
      MALTC: { type: sql.Int, value: maLTC },
    });
    return result;
  }

  async restore(maLTC) {
    const result = await executeStoredProcedure(LOPTINCHI_PROCEDURES.RESTORE, {
      MALTC: { type: sql.Int, value: maLTC },
    });
    return result;
  }

  async search(keyword) {
    const result = await executeStoredProcedure(LOPTINCHI_PROCEDURES.SEARCH, {
      KEYWORD: { type: sql.NVarChar(100), value: keyword },
    });
    return (result.recordset || []).sort((a, b) => b.MALTC - a.MALTC);
  }
}

module.exports = new LopTinChiRepository();
