// ====================================
// SERVICE - LOPTINCHI
// ====================================

const loptinchiRepository = require("../repositories/loptinchi.repository");
const { getCurrentSemester, getNextSemester, isSameSemester, isSemesterAfter } = require("../utils/academic.helper");

class LopTinChiService {
  validateSemesterConstraint(nienKhoa, hocKy) {
    const currentSem = getCurrentSemester();
    const targetSem = { nienKhoa, hocKy };

    if (!isSemesterAfter(targetSem, currentSem)) {
      throw new Error(
        `Chỉ cho phép mở lớp tín chỉ ở các học kỳ trong tương lai (sau học kỳ hiện tại ${currentSem.nienKhoa} - Học kỳ ${currentSem.hocKy})`
      );
    }
  }

  async getAllLopTinChi() {
    return loptinchiRepository.getAll();
  }

  async getLopTinChiForUser(user) {
    if (user && user.role === 'KHOA' && user.maKhoa) {
      return loptinchiRepository.getByKhoa(user.maKhoa);
    }

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
    if (data.NIENKHOA && data.HOCKY) {
      this.validateSemesterConstraint(data.NIENKHOA, data.HOCKY);
    }
    return loptinchiRepository.create(data);
  }

  async updateLopTinChi(maLTC, data) {
    const existing = await this.getLopTinChiById(maLTC);
    const updatedNienKhoa = data.NIENKHOA !== undefined ? data.NIENKHOA : existing.NIENKHOA;
    const updatedHocKy = data.HOCKY !== undefined ? data.HOCKY : existing.HOCKY;
    
    // Chỉ kiểm tra ràng buộc thời gian nếu có sự thay đổi thực tế về Niên khóa hoặc Học kỳ
    const isSemesterChanged = (data.NIENKHOA !== undefined && data.NIENKHOA !== existing.NIENKHOA) ||
                              (data.HOCKY !== undefined && Number(data.HOCKY) !== Number(existing.HOCKY));

    if (isSemesterChanged && updatedNienKhoa && updatedHocKy) {
      this.validateSemesterConstraint(updatedNienKhoa, updatedHocKy);
    }
    
    const result = await loptinchiRepository.update(maLTC, data);

    if (data.HUYLOP !== undefined) {
      if (data.HUYLOP) {
        await loptinchiRepository.cancel(maLTC);
      } else {
        await loptinchiRepository.restore(maLTC);
      }
    }

    return result;
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
