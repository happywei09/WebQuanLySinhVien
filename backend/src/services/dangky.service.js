// ====================================
// SERVICE - DANGKY
// ====================================

const dangkyRepository = require("../repositories/dangky.repository");
const loptinchiRepository = require("../repositories/loptinchi.repository");
const { getCurrentSemester, getNextSemester, isSameSemester } = require("../utils/academic.helper");

class DangKyService {


  async getDangKyByLopTinChi(maLTC) {
    return dangkyRepository.getByLopTinChi(maLTC);
  }

  async getDangKyBySinhVien(maSV) {
    return dangkyRepository.getBySinhVien(maSV);
  }

  async createDangKy(data) {
    // Validate input
    if (!data || !data.MALTC || !data.MASV) {
      throw new Error("Thiếu thông tin đăng ký (MALTC hoặc MASV)");
    }

    // 1) Check LTC exists
    const ltc = await loptinchiRepository.getById(data.MALTC);
    if (!ltc) {
      throw new Error("Lớp tín chỉ không tồn tại");
    }

    // 1.5) Chặn đăng ký lớp ngoài học kỳ kế tiếp (Tính theo Server Time)
    const currentSem = getCurrentSemester();
    const nextSem = getNextSemester(currentSem.nienKhoa, currentSem.hocKy);
    if (!isSameSemester(ltc, nextSem)) {
      throw new Error(`Chỉ cho phép đăng ký lớp tín chỉ ở học kỳ kế tiếp (${nextSem ? `${nextSem.nienKhoa} - Học kỳ ${nextSem.hocKy}` : "N/A"})`);
    }

    // 2) Prevent registration to cancelled class
    if (ltc.HUYLOP) {
      throw new Error("Lớp tín chỉ đã bị huỷ, không thể đăng ký");
    }

    // 3) Prevent duplicate active registration
    const currentRegs = await dangkyRepository.getByLopTinChi(data.MALTC);
    const exists = currentRegs.some(r => {
      const existingMasv = (r.MASV || '').toString().trim().toUpperCase();
      const newMasv = (data.MASV || '').toString().trim().toUpperCase();
      return existingMasv === newMasv;
    });
    if (exists) {
      throw new Error("Sinh viên đã đăng ký lớp này");
    }

    // 4) Create registration (SP will INSERT or UPDATE if needed)
    return dangkyRepository.create({
      MALTC: data.MALTC,
      MASV: data.MASV,
      DIEM_CC: data.DIEM_CC || null,
      DIEM_GK: data.DIEM_GK || null,
      DIEM_CK: data.DIEM_CK || null,
      HUYDANGKY: false,
    });
  }

  async updateDangKy(maLTC, maSV, data) {
    return dangkyRepository.update(maLTC, maSV, data);
  }

  async deleteDangKy(maLTC, maSV) {
    return dangkyRepository.delete(maLTC, maSV);
  }

  async cancelDangKy(maLTC, maSV) {
    return dangkyRepository.cancel(maLTC, maSV);
  }
}

module.exports = new DangKyService();
