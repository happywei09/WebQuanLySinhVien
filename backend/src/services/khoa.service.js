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

  formatTenKhoa(str) {
    if (!str) return "";
    return str
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  async createKhoa(data) {
    if (!data.MAKHOA || !data.TENKHOA) {
      throw new Error("Mã khoa và tên khoa không được để trống");
    }

    const ma = data.MAKHOA.trim();
    const ten = this.formatTenKhoa(data.TENKHOA);
    data.MAKHOA = ma;
    data.TENKHOA = ten;

    const allKhoa = await khoaRepository.getAll();
    
    // Check trùng mã khoa
    if (allKhoa.some((k) => k.MAKHOA.trim().toLowerCase() === ma.toLowerCase())) {
      throw new Error(`Mã khoa "${ma}" đã tồn tại!`);
    }

    // Check trùng tên khoa
    if (allKhoa.some((k) => k.TENKHOA.trim().toLowerCase() === ten.toLowerCase())) {
      throw new Error(`Tên khoa "${ten}" đã tồn tại!`);
    }

    return khoaRepository.create(data);
  }

  async updateKhoa(maKhoa, data) {
    const existing = await khoaRepository.getById(maKhoa);
    if (!existing) {
      throw new Error("Không tìm thấy khoa để cập nhật");
    }

    if (!data.TENKHOA) {
      throw new Error("Tên khoa không được để trống");
    }

    const ten = this.formatTenKhoa(data.TENKHOA);
    data.TENKHOA = ten;

    const allKhoa = await khoaRepository.getAll();

    // Check trùng tên khoa (ngoại trừ khoa hiện tại)
    if (allKhoa.some((k) => k.MAKHOA.trim() !== maKhoa.trim() && k.TENKHOA.trim().toLowerCase() === ten.toLowerCase())) {
      throw new Error(`Tên khoa "${ten}" đã tồn tại!`);
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
