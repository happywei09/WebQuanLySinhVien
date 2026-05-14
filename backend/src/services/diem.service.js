// ====================================
// SERVICE - DIEM (Điểm + Báo cáo)
// ====================================

const diemRepository = require("../repositories/diem.repository");

class DiemService {
  // ====================================
  // NHẬP ĐIỂM
  // ====================================

  async getDiemByLopTinChi(maLTC) {
    return diemRepository.getByLopTinChi(maLTC);
  }

  async getDiemBySinhVien(maSV) {
    return diemRepository.getBySinhVien(maSV);
  }

  async updateDiem(maLTC, maSV, data) {
    // Validate điểm 0-10
    this.validateDiem(data);
    return diemRepository.updateDiem(maLTC, maSV, data);
  }

  /**
   * Cập nhật hàng loạt điểm cho 1 lớp tín chỉ
   * @param {number} maLTC
   * @param {Array} diemList
   */
  async updateBatchDiem(maLTC, diemList) {
    // Validate từng dòng điểm
    for (const diem of diemList) {
      this.validateDiem(diem);
    }
    return diemRepository.updateBatch(maLTC, diemList);
  }

  /**
   * Validate điểm trong khoảng 0-10
   */
  validateDiem(data) {
    const fields = ["DIEM_CC", "DIEM_GK", "DIEM_CK"];
    for (const field of fields) {
      if (data[field] !== null && data[field] !== undefined) {
        const val = parseFloat(data[field]);
        if (isNaN(val) || val < 0 || val > 10) {
          throw new Error(`${field} phải nằm trong khoảng 0-10`);
        }
      }
    }
  }

  /**
   * Tính điểm tổng kết
   * Công thức: 0.1 * DIEM_CC + 0.3 * DIEM_GK + 0.6 * DIEM_CK
   */
  calculateDiemTongKet(diemCC, diemGK, diemCK) {
    if (diemCC == null || diemGK == null || diemCK == null) {
      return null;
    }
    return Math.round((0.1 * diemCC + 0.3 * diemGK + 0.6 * diemCK) * 100) / 100;
  }

  // ====================================
  // BÁO CÁO
  // ====================================

  async reportBangDiemMonHoc(maLTC) {
    return diemRepository.reportBangDiemMonHoc(maLTC);
  }

  async reportPhieuDiem(maSV) {
    return diemRepository.reportPhieuDiem(maSV);
  }

  async reportBangDiemTongKet(maLop) {
    return diemRepository.reportBangDiemTongKet(maLop);
  }

  async reportDSSVDangKy(maLTC) {
    return diemRepository.reportDSSVDangKy(maLTC);
  }

  async reportDSLopTinChi(nienKhoa, hocKy) {
    return diemRepository.reportDSLopTinChi(nienKhoa, hocKy);
  }
}

module.exports = new DiemService();
