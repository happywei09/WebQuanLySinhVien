// ====================================
// SERVICE - SINHVIEN
// ====================================

const sinhvienRepository = require("../repositories/sinhvien.repository");

class SinhVienService {
  async getAllSinhVien() {
    return sinhvienRepository.getAll();
  }

  async getSinhVienById(maSV) {
    const sv = await sinhvienRepository.getById(maSV);
    if (!sv) throw new Error("Không tìm thấy sinh viên");
    return sv;
  }

  async getSinhVienByLop(maLop) {
    return sinhvienRepository.getByLop(maLop);
  }

  async getSinhVienByKhoa(maKhoa) {
    return sinhvienRepository.getByKhoa(maKhoa);
  }

  async createSinhVien(data) {
    return sinhvienRepository.create(data);
  }

  async updateSinhVien(maSV, data) {
    await this.getSinhVienById(maSV);
    return sinhvienRepository.update(maSV, data);
  }

  async deleteSinhVien(maSV) {
    await this.getSinhVienById(maSV);
    return sinhvienRepository.delete(maSV);
  }

  async updateStatus(maSV, dangNghiHoc) {
    await this.getSinhVienById(maSV);
    return sinhvienRepository.updateStatus(maSV, dangNghiHoc);
  }

  async searchSinhVien(keyword) {
    return sinhvienRepository.search(keyword);
  }
}

module.exports = new SinhVienService();
