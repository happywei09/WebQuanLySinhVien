// ====================================
// SERVICE - DIEM (Điểm + Báo cáo)
// ====================================

const diemRepository = require("../repositories/diem.repository");
const loptinchiRepository = require("../repositories/loptinchi.repository");

class DiemService {
  // ====================================
  // NHẬP ĐIỂM
  // ====================================

  async getDiemByLopTinChi(maLTC, user = null) {
    await this.assertCanAccessLopTinChi(user, maLTC);
    return diemRepository.getByLopTinChi(maLTC);
  }

  async getDiemBySinhVien(maSV) {
    return diemRepository.getBySinhVien(maSV);
  }

  async updateDiem(maLTC, maSV, data, user = null) {
    await this.assertCanAccessLopTinChi(user, maLTC);
    // Validate điểm 0-10
    this.validateDiem(data);
    return diemRepository.updateDiem(maLTC, maSV, data);
  }

  /**
   * Cập nhật hàng loạt điểm cho 1 lớp tín chỉ
   * @param {number} maLTC
   * @param {Array} diemList
   */
  async updateBatchDiem(maLTC, diemList, user = null) {
    await this.assertCanAccessLopTinChi(user, maLTC);
    // Validate từng dòng điểm
    for (const diem of diemList) {
      this.validateDiem(diem);
    }
    return diemRepository.updateBatch(maLTC, diemList);
  }

  async assertCanAccessLopTinChi(user, maLTC) {
    const ltc = await loptinchiRepository.getById(maLTC);
    if (!ltc) {
      throw new Error("Không tìm thấy lớp tín chỉ");
    }

    if (!user) {
      throw new Error("Chưa xác thực người dùng");
    }

    if (user.role === "PGV") {
      return ltc;
    }

    if (user.role === "KHOA") {
      const maKhoaLTC = (ltc.MAKHOA || "").trim();
      const maKhoaUser = (user.maKhoa || "").trim();
      if (!maKhoaUser || maKhoaLTC !== maKhoaUser) {
        throw new Error("Bạn không có quyền thao tác với lớp tín chỉ này");
      }
      return ltc;
    }

    throw new Error("Bạn không có quyền thao tác với chức năng này");
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
