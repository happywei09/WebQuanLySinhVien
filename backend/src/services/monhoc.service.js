// ====================================
// SERVICE - MONHOC
// ====================================

const monhocRepository = require("../repositories/monhoc.repository");

class MonHocService {
  async getAllMonHoc() {
    return monhocRepository.getAll();
  }

  async getMonHocById(maMH) {
    const mh = await monhocRepository.getById(maMH);
    if (!mh) throw new Error("Không tìm thấy môn học");
    return mh;
  }

  async createMonHoc(data) {
    // Kiểm tra số tiết: ít nhất 1 trong 2 phải > 0
    if (Number(data.SOTIET_LT) === 0 && Number(data.SOTIET_TH) === 0) {
      throw new Error("Số tiết lý thuyết và thực hành không thể đồng thời bằng 0");
    }
    // Kiểm tra trùng tên môn học
    const allMH = await monhocRepository.getAll();
    const duplicate = allMH.find(mh => mh.TENMH.trim().toLowerCase() === data.TENMH.trim().toLowerCase());
    if (duplicate) {
      throw new Error(`Tên môn học "${data.TENMH}" đã tồn tại (Mã: ${duplicate.MAMH})`);
    }
    return monhocRepository.create(data);
  }

  async updateMonHoc(maMH, data) {
    await this.getMonHocById(maMH);
    // Kiểm tra số tiết: ít nhất 1 trong 2 phải > 0
    if (Number(data.SOTIET_LT) === 0 && Number(data.SOTIET_TH) === 0) {
      throw new Error("Số tiết lý thuyết và thực hành không thể đồng thời bằng 0");
    }
    // Kiểm tra trùng tên môn học (loại trừ chính nó)
    const allMH = await monhocRepository.getAll();
    const duplicate = allMH.find(mh => mh.TENMH.trim().toLowerCase() === data.TENMH.trim().toLowerCase() && mh.MAMH !== maMH);
    if (duplicate) {
      throw new Error(`Tên môn học "${data.TENMH}" đã tồn tại (Mã: ${duplicate.MAMH})`);
    }
    return monhocRepository.update(maMH, data);
  }

  async deleteMonHoc(maMH) {
    await this.getMonHocById(maMH);
    return monhocRepository.delete(maMH);
  }

  async searchMonHoc(keyword) {
    return monhocRepository.search(keyword);
  }
}

module.exports = new MonHocService();
