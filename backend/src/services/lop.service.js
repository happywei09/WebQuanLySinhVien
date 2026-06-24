// ====================================
// SERVICE - LOP
// ====================================

const lopRepository = require("../repositories/lop.repository");

class LopService {

  async getLopForUser(user) {
    if (user && user.role === "KHOA" && user.maKhoa) {
      return lopRepository.getByKhoa(user.maKhoa);
    }
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
    if (data.KHOAHOC) {
      const startYear = parseInt(data.KHOAHOC.split("-")[0]);
      const currentYear = new Date().getFullYear();
      if (!isNaN(startYear) && startYear < currentYear) {
        throw new Error(`Khóa học khi tạo lớp phải bắt đầu từ năm hiện tại (${currentYear}) trở đi`);
      }
    }
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

  async searchLop(keyword, user = null) {
    const data = await lopRepository.search(keyword);
    if (user && user.role === "KHOA" && user.maKhoa) {
      return data.filter(item => (item.MAKHOA || "").trim() === user.maKhoa.trim());
    }
    return data;
  }
}

module.exports = new LopService();
