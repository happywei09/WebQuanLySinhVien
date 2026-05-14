// ====================================
// SERVICE - DANGKY
// ====================================

const dangkyRepository = require("../repositories/dangky.repository");

class DangKyService {
  async getAllDangKy() {
    return dangkyRepository.getAll();
  }

  async getDangKyByLopTinChi(maLTC) {
    return dangkyRepository.getByLopTinChi(maLTC);
  }

  async getDangKyBySinhVien(maSV) {
    return dangkyRepository.getBySinhVien(maSV);
  }

  async createDangKy(data) {
    return dangkyRepository.create(data);
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
