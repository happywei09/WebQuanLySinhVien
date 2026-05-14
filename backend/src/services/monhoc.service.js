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
    return monhocRepository.create(data);
  }

  async updateMonHoc(maMH, data) {
    await this.getMonHocById(maMH);
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
