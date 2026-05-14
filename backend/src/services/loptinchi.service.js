// ====================================
// SERVICE - LOPTINCHI
// ====================================

const loptinchiRepository = require("../repositories/loptinchi.repository");

class LopTinChiService {
  async getAllLopTinChi() {
    return loptinchiRepository.getAll();
  }

  async getLopTinChiById(maLTC) {
    const ltc = await loptinchiRepository.getById(maLTC);
    if (!ltc) throw new Error("Không tìm thấy lớp tín chỉ");
    return ltc;
  }

  async getLopTinChiByKhoa(maKhoa) {
    return loptinchiRepository.getByKhoa(maKhoa);
  }

  async getLopTinChiByNienKhoaHocKy(nienKhoa, hocKy) {
    return loptinchiRepository.getByNienKhoaHocKy(nienKhoa, hocKy);
  }

  async getLopTinChiByGiangVien(maGV) {
    return loptinchiRepository.getByGiangVien(maGV);
  }

  async createLopTinChi(data) {
    return loptinchiRepository.create(data);
  }

  async updateLopTinChi(maLTC, data) {
    await this.getLopTinChiById(maLTC);
    return loptinchiRepository.update(maLTC, data);
  }

  async deleteLopTinChi(maLTC) {
    await this.getLopTinChiById(maLTC);
    return loptinchiRepository.delete(maLTC);
  }

  async cancelLopTinChi(maLTC) {
    await this.getLopTinChiById(maLTC);
    return loptinchiRepository.cancel(maLTC);
  }

  async searchLopTinChi(keyword) {
    return loptinchiRepository.search(keyword);
  }
}

module.exports = new LopTinChiService();
