// ====================================
// SERVICE - LOPTINCHI
// ====================================

const loptinchiRepository = require("../repositories/loptinchi.repository");
const { getCurrentSemester, isSemesterAfter } = require("../utils/academic.helper");

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



  async createLopTinChi(data) {
    if (data.NIENKHOA && data.HOCKY) {
      this.validateSemesterConstraint(data.NIENKHOA, data.HOCKY);
    }
    return loptinchiRepository.create(data);
  }

  async checkClassHasGrades(maLTC) {
    const diemRepository = require("../repositories/diem.repository");
    const studentsGrades = await diemRepository.getByLopTinChi(maLTC);
    if (!studentsGrades || studentsGrades.length === 0) return false;

    return studentsGrades.some(
      (student) =>
        (student.DIEM_CC !== null && student.DIEM_CC !== undefined) ||
        (student.DIEM_GK !== null && student.DIEM_GK !== undefined) ||
        (student.DIEM_CK !== null && student.DIEM_CK !== undefined)
    );
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

    if (data.HUYLOP !== undefined && data.HUYLOP) {
      const hasGrades = await this.checkClassHasGrades(maLTC);
      if (hasGrades) {
        throw new Error("Không thể hủy lớp tín chỉ này vì đã có sinh viên có điểm");
      }
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
    const hasGrades = await this.checkClassHasGrades(maLTC);
    if (hasGrades) {
      throw new Error("Không thể hủy lớp tín chỉ này vì đã có sinh viên có điểm");
    }
    return loptinchiRepository.cancel(maLTC);
  }


}

module.exports = new LopTinChiService();
