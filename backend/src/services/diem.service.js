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
    const ltc = await this.assertCanAccessLopTinChi(user, maLTC);
    if (this.isFutureSemester(ltc.NIENKHOA, ltc.HOCKY)) {
      throw new Error("Không thể nhập hoặc sửa điểm cho lớp tín chỉ thuộc học kỳ tương lai");
    }
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
    const ltc = await this.assertCanAccessLopTinChi(user, maLTC);
    if (this.isFutureSemester(ltc.NIENKHOA, ltc.HOCKY)) {
      throw new Error("Không thể nhập hoặc sửa điểm cho lớp tín chỉ thuộc học kỳ tương lai");
    }
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

  /**
   * Kiểm tra xem học kỳ target có phải là tương lai hay không
   */
  isFutureSemester(nienKhoa, hocKy) {
    if (!nienKhoa || !hocKy) return false;

    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    let currentNK = "";
    let currentHK = 1;

    if (month >= 8 && month <= 12) {
      currentNK = `${year}-${year + 1}`;
      currentHK = 1;
    } else if (month >= 1 && month <= 6) {
      currentNK = `${year - 1}-${year}`;
      currentHK = 2;
    } else if (month === 7) {
      currentNK = `${year - 1}-${year}`;
      currentHK = 3;
    }

    const partsCur = currentNK.split('-').map(Number);
    const partsTarget = nienKhoa.split('-').map(Number);
    if (partsCur.length < 2 || partsTarget.length < 2) return false;

    const startYearCur = partsCur[0];
    const startYearTarget = partsTarget[0];

    if (startYearTarget > startYearCur) {
      return true;
    }
    if (startYearTarget < startYearCur) {
      return false;
    }

    return Number(hocKy) > Number(currentHK);
  }
}

module.exports = new DiemService();
