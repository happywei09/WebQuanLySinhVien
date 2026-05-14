// ====================================
// SERVICE - LOP
// ====================================

const lopRepository = require("../repositories/lop.repository");

class LopService {
  async getAllLop() {
    return lopRepository.getAll();
  }

  async getLopById(maLop) {
    const lop = await lopRepository.getById(maLop);
    if (!lop) throw new Error("Không tìm thấy lớp");
    return lop;
  }

  async getLopByKhoa(maKhoa) {
    return lopRepository.getByKhoa(maKhoa);
  }

  async createLop(data) {
    return lopRepository.create(data);
  }

  async updateLop(maLop, data) {
    await this.getLopById(maLop);
    return lopRepository.update(maLop, data);
  }

  async deleteLop(maLop) {
    await this.getLopById(maLop);
    return lopRepository.delete(maLop);
  }

  async searchLop(keyword) {
    return lopRepository.search(keyword);
  }
}

module.exports = new LopService();
