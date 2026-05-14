// ====================================
// SERVICE - KHOA
// ====================================

const khoaRepository = require("../repositories/khoa.repository");

class KhoaService {
  async getAllKhoa() {
    return khoaRepository.getAll();
  }

  async getKhoaById(maKhoa) {
    const khoa = await khoaRepository.getById(maKhoa);
    if (!khoa) {
      throw new Error("Không tìm thấy khoa");
    }
    return khoa;
  }

  async createKhoa(data) {
    // TODO: Validate business rules nếu cần
    return khoaRepository.create(data);
  }

  async updateKhoa(maKhoa, data) {
    const existing = await khoaRepository.getById(maKhoa);
    if (!existing) {
      throw new Error("Không tìm thấy khoa để cập nhật");
    }
    return khoaRepository.update(maKhoa, data);
  }

  async deleteKhoa(maKhoa) {
    const existing = await khoaRepository.getById(maKhoa);
    if (!existing) {
      throw new Error("Không tìm thấy khoa để xoá");
    }
    return khoaRepository.delete(maKhoa);
  }

  async searchKhoa(keyword) {
    return khoaRepository.search(keyword);
  }
}

module.exports = new KhoaService();
