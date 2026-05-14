// ====================================
// REPOSITORY - SINHVIEN
// ====================================

const { executeStoredProcedure, sql } = require("../database/connection");
const SINHVIEN_PROCEDURES = require("../database/procedures/sinhvien.procedure");

class SinhVienRepository {
  async getAll() {
    const result = await executeStoredProcedure(SINHVIEN_PROCEDURES.GET_ALL);
    return result.recordset;
  }

  async getById(maSV) {
    const result = await executeStoredProcedure(SINHVIEN_PROCEDURES.GET_BY_ID, {
      MASV: { type: sql.NVarChar(50), value: maSV },
    });
    return result.recordset[0] || null;
  }

  async getByLop(maLop) {
    const result = await executeStoredProcedure(SINHVIEN_PROCEDURES.GET_BY_LOP, {
      MALOP: { type: sql.NVarChar(50), value: maLop },
    });
    return result.recordset;
  }

  async getByKhoa(maKhoa) {
    const result = await executeStoredProcedure(SINHVIEN_PROCEDURES.GET_BY_KHOA, {
      MAKHOA: { type: sql.NVarChar(50), value: maKhoa },
    });
    return result.recordset;
  }

  async create(data) {
    const result = await executeStoredProcedure(SINHVIEN_PROCEDURES.CREATE, {
      MASV: { type: sql.NVarChar(50), value: data.MASV },
      HO: { type: sql.NVarChar(100), value: data.HO },
      TEN: { type: sql.NVarChar(50), value: data.TEN },
      MALOP: { type: sql.NVarChar(50), value: data.MALOP },
      PHAI: { type: sql.Bit, value: data.PHAI },
      NGAYSINH: { type: sql.Date, value: data.NGAYSINH },
      DIACHI: { type: sql.NVarChar(200), value: data.DIACHI },
      DANGHIHOC: { type: sql.Bit, value: data.DANGHIHOC || false },
    });
    return result;
  }

  async update(maSV, data) {
    const result = await executeStoredProcedure(SINHVIEN_PROCEDURES.UPDATE, {
      MASV: { type: sql.NVarChar(50), value: maSV },
      HO: { type: sql.NVarChar(100), value: data.HO },
      TEN: { type: sql.NVarChar(50), value: data.TEN },
      MALOP: { type: sql.NVarChar(50), value: data.MALOP },
      PHAI: { type: sql.Bit, value: data.PHAI },
      NGAYSINH: { type: sql.Date, value: data.NGAYSINH },
      DIACHI: { type: sql.NVarChar(200), value: data.DIACHI },
      DANGHIHOC: { type: sql.Bit, value: data.DANGHIHOC },
    });
    return result;
  }

  async delete(maSV) {
    const result = await executeStoredProcedure(SINHVIEN_PROCEDURES.DELETE, {
      MASV: { type: sql.NVarChar(50), value: maSV },
    });
    return result;
  }

  async updateStatus(maSV, dangNghiHoc) {
    const result = await executeStoredProcedure(SINHVIEN_PROCEDURES.UPDATE_STATUS, {
      MASV: { type: sql.NVarChar(50), value: maSV },
      DANGHIHOC: { type: sql.Bit, value: dangNghiHoc },
    });
    return result;
  }

  async search(keyword) {
    const result = await executeStoredProcedure(SINHVIEN_PROCEDURES.SEARCH, {
      KEYWORD: { type: sql.NVarChar(100), value: keyword },
    });
    return result.recordset;
  }
}

module.exports = new SinhVienRepository();
