// ====================================
// SERVICE - GIANGVIEN
// ====================================

const giangvienRepository = require("../repositories/giangvien.repository");

class GiangVienService {
  async getAllGiangVien() {
    return giangvienRepository.getAll();
  }

  async getGiangVienById(maGV) {
    const gv = await giangvienRepository.getById(maGV);
    if (!gv) throw new Error("Không tìm thấy giảng viên");
    return gv;
  }

  async getGiangVienByKhoa(maKhoa) {
    return giangvienRepository.getByKhoa(maKhoa);
  }

  async createGiangVien(data) {
    return giangvienRepository.create(data);
  }

  async updateGiangVien(maGV, data) {
    await this.getGiangVienById(maGV);
    return giangvienRepository.update(maGV, data);
  }

  async deleteGiangVien(maGV) {
    await this.getGiangVienById(maGV);
    return giangvienRepository.delete(maGV);
  }

  async searchGiangVien(keyword) {
    return giangvienRepository.search(keyword);
  }
}

module.exports = new GiangVienService();
