// ====================================
// REPOSITORY - DIEM (Điểm + Báo cáo)
// ====================================

const { executeStoredProcedure, sql } = require("../database/connection");
const DIEM_PROCEDURES = require("../database/procedures/diem.procedure");

class DiemRepository {
  // ====================================
  // NHẬP ĐIỂM
  // ====================================

  async getByLopTinChi(maLTC) {
    const result = await executeStoredProcedure(DIEM_PROCEDURES.GET_BY_LTC, {
      MALTC: { type: sql.Int, value: maLTC },
    });
    return result.recordset;
  }

  async getBySinhVien(maSV) {
    const result = await executeStoredProcedure(DIEM_PROCEDURES.GET_BY_SV, {
      MASV: { type: sql.NVarChar(50), value: maSV },
    });
    return result.recordset;
  }

  async updateDiem(maLTC, maSV, data) {
    const result = await executeStoredProcedure(DIEM_PROCEDURES.UPDATE, {
      MALTC: { type: sql.Int, value: maLTC },
      MASV: { type: sql.NVarChar(50), value: maSV },
      DIEM_CC: { type: sql.Float, value: data.DIEM_CC },
      DIEM_GK: { type: sql.Float, value: data.DIEM_GK },
      DIEM_CK: { type: sql.Float, value: data.DIEM_CK },
    });
    return result;
  }

  /**
   * Cập nhật hàng loạt điểm cho 1 lớp tín chỉ
   * @param {number} maLTC
   * @param {Array} diemList - [ { MASV, DIEM_CC, DIEM_GK, DIEM_CK }, ... ]
   */
  async updateBatch(maLTC, diemList) {
    const jsonList = JSON.stringify(diemList);
    const result = await executeStoredProcedure("SP_UPDATE_DIEM_BATCH", {
      MALTC: { type: sql.Int, value: maLTC },
      DIEM_LIST: { type: sql.NVarChar(sql.MAX), value: jsonList }
    });
    return result;
  }

  // ====================================
  // BÁO CÁO
  // ====================================

  async reportBangDiemMonHoc(maLTC) {
    const result = await executeStoredProcedure(
      DIEM_PROCEDURES.REPORT_BANGDIEM_MONHOC,
      { MALTC: { type: sql.Int, value: maLTC } }
    );
    return result.recordset;
  }

  async reportPhieuDiem(maSV) {
    const result = await executeStoredProcedure(
      DIEM_PROCEDURES.REPORT_PHIEUDIEM,
      { MASV: { type: sql.NVarChar(50), value: maSV } }
    );
    return result.recordset;
  }

  async reportBangDiemTongKet(maLop) {
    const result = await executeStoredProcedure(
      DIEM_PROCEDURES.REPORT_BANGDIEM_TONGKET,
      { MALOP: { type: sql.NVarChar(50), value: maLop } }
    );
    return result.recordset;
  }

  async reportDSSVDangKy(maLTC) {
    const result = await executeStoredProcedure(
      DIEM_PROCEDURES.REPORT_DSSV_DANGKY,
      { MALTC: { type: sql.Int, value: maLTC } }
    );
    return result.recordset;
  }

  async reportDSLopTinChi(nienKhoa, hocKy) {
    const result = await executeStoredProcedure(
      DIEM_PROCEDURES.REPORT_DS_LOPTINCHI,
      {
        NIENKHOA: { type: sql.NVarChar(50), value: nienKhoa },
        HOCKY: { type: sql.Int, value: hocKy },
      }
    );
    return result.recordset;
  }
}

module.exports = new DiemRepository();
