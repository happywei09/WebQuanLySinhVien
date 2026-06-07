// ====================================
// SERVICE - DIEM (Điểm + Báo cáo)
// ====================================

const diemRepository = require("../repositories/diem.repository");

class DiemService {
  // ====================================
  // NHẬP ĐIỂM
  // ====================================

  async getDiemByLopTinChi(maLTC) {
    return diemRepository.getByLopTinChi(maLTC);
  }

  async getDiemBySinhVien(maSV) {
    return diemRepository.getBySinhVien(maSV);
  }

  async updateDiem(maLTC, maSV, data) {
    // Validate điểm 0-10
    this.validateDiem(data);
    return diemRepository.updateDiem(maLTC, maSV, data);
  }

  /**
   * Cập nhật hàng loạt điểm cho 1 lớp tín chỉ
   * @param {number} maLTC
   * @param {Array} diemList
   */
  async updateBatchDiem(maLTC, diemList) {
    // Validate từng dòng điểm
    for (const diem of diemList) {
      this.validateDiem(diem);
    }
    return diemRepository.updateBatch(maLTC, diemList);
  }

  /**
   * Validate điểm trong khoảng 0-10
   */
  validateDiem(data) {
    const fields = ["DIEM_CC", "DIEM_GK", "DIEM_CK"];
    for (const field of fields) {
      if (data[field] !== null && data[field] !== undefined) {
        const val = parseFloat(data[field]);
        if (isNaN(val) || val < 0 || val > 10) {
          throw new Error(`${field} phải nằm trong khoảng 0-10`);
        }
      }
    }
  }

  /**
   * Tính điểm tổng kết
   * Công thức: 0.1 * DIEM_CC + 0.3 * DIEM_GK + 0.6 * DIEM_CK
   */
  calculateDiemTongKet(diemCC, diemGK, diemCK) {
    if (diemCC == null || diemGK == null || diemCK == null) {
      return null;
    }
    return Math.round((0.1 * diemCC + 0.3 * diemGK + 0.6 * diemCK) * 100) / 100;
  }

  // ====================================
  // HỆ TÍN CHỈ (GPA, CPA, Quy đổi điểm)
  // ====================================

  /**
   * Quy đổi điểm hệ 10 sang hệ 4 và điểm chữ
   * @param {number} diem10
   * @returns {Object} { diem4, diemChu }
   */
  convertHe10ToHe4(diem10) {
    if (diem10 === null || diem10 === undefined) return { diem4: null, diemChu: null };
    if (diem10 >= 8.5) return { diem4: 4.0, diemChu: 'A' };
    if (diem10 >= 8.0) return { diem4: 3.5, diemChu: 'B+' };
    if (diem10 >= 7.0) return { diem4: 3.0, diemChu: 'B' };
    if (diem10 >= 6.5) return { diem4: 2.5, diemChu: 'C+' };
    if (diem10 >= 5.5) return { diem4: 2.0, diemChu: 'C' };
    if (diem10 >= 5.0) return { diem4: 1.5, diemChu: 'D+' };
    if (diem10 >= 4.0) return { diem4: 1.0, diemChu: 'D' };
    return { diem4: 0.0, diemChu: 'F' };
  }

  /**
   * Phân loại học lực dựa trên CPA
   */
  evaluateAcademicPerformance(cpa) {
    if (cpa === null) return 'Chưa có điểm';
    if (cpa >= 3.6) return 'Xuất sắc';
    if (cpa >= 3.2) return 'Giỏi';
    if (cpa >= 2.5) return 'Khá';
    if (cpa >= 2.0) return 'Trung bình';
    if (cpa >= 1.0) return 'Yếu';
    return 'Kém';
  }

  /**
   * Tính GPA (Trung bình học kỳ) và CPA (Trung bình tích lũy)
   * @param {Array} diemList - Danh sách điểm (có SOTC_LT, SOTC_TH, HOCKY, NIENKHOA)
   */
  calculateAcademicStats(diemList) {
    let totalCPA_Credits = 0;
    let totalCPA_Points = 0;
    let tinChiTichLuy = 0; // Môn >= D mới được tính tích lũy

    // Dùng object để lấy điểm cao nhất nếu học lại
    const monHocMap = {};

    // Group by HocKy - NienKhoa for GPA
    const semesters = {};

    diemList.forEach(diem => {
      // Calculate final score
      const diemKTHP = this.calculateDiemTongKet(diem.DIEM_CC, diem.DIEM_GK, diem.DIEM_CK);
      const converted = this.convertHe10ToHe4(diemKTHP);
      diem.DIEM_KTHP = diemKTHP;
      diem.DIEM_HE4 = converted.diem4;
      diem.DIEM_CHU = converted.diemChu;

      // Handle missing credits by defaulting to 0
      const sotc = (diem.SOTC_LT || 0) + (diem.SOTC_TH || 0);
      diem.SOTC = sotc;

      if (diemKTHP !== null) {
        // Group by Semester
        const semKey = `${diem.NIENKHOA}_${diem.HOCKY}`;
        if (!semesters[semKey]) {
          semesters[semKey] = {
            nienKhoa: diem.NIENKHOA,
            hocKy: diem.HOCKY,
            totalPoints: 0,
            totalCredits: 0
          };
        }
        semesters[semKey].totalPoints += converted.diem4 * sotc;
        semesters[semKey].totalCredits += sotc;

        // For CPA: take highest score if studied multiple times
        if (!monHocMap[diem.MAMH] || monHocMap[diem.MAMH].diem4 < converted.diem4) {
          monHocMap[diem.MAMH] = {
            diem4: converted.diem4,
            sotc: sotc,
            passed: converted.diem4 >= 1.0 // >= D is passed
          };
        }
      }
    });

    // Calculate CPA and Accumulated Credits
    for (const mamh in monHocMap) {
      const mh = monHocMap[mamh];
      totalCPA_Points += mh.diem4 * mh.sotc;
      totalCPA_Credits += mh.sotc;
      if (mh.passed) {
        tinChiTichLuy += mh.sotc;
      }
    }

    const cpa = totalCPA_Credits > 0 ? Math.round((totalCPA_Points / totalCPA_Credits) * 100) / 100 : null;
    const hocLuc = this.evaluateAcademicPerformance(cpa);

    // Calculate GPA per semester
    const gpaPerSemester = Object.values(semesters).map(sem => {
      return {
        nienKhoa: sem.nienKhoa,
        hocKy: sem.hocKy,
        gpa: sem.totalCredits > 0 ? Math.round((sem.totalPoints / sem.totalCredits) * 100) / 100 : null,
        credits: sem.totalCredits
      };
    });

    return {
      diemList,
      cpa,
      tinChiTichLuy,
      hocLuc,
      gpaPerSemester
    };
  }

  // ====================================
  // BÁO CÁO
  // ====================================

  async reportBangDiemMonHoc(maLTC) {
    const list = await diemRepository.reportBangDiemMonHoc(maLTC);
    // Bổ sung quy đổi điểm hệ 4 và điểm chữ vào báo cáo
    return list.map(item => {
      const diemKTHP = this.calculateDiemTongKet(item.DIEM_CC, item.DIEM_GK, item.DIEM_CK);
      const converted = this.convertHe10ToHe4(diemKTHP);
      return {
        ...item,
        DIEM_KTHP: diemKTHP,
        DIEM_HE4: converted.diem4,
        DIEM_CHU: converted.diemChu
      };
    });
  }

  async reportPhieuDiem(maSV) {
    const records = await diemRepository.reportPhieuDiem(maSV);
    // Tính toán CPA, GPA và trả về kèm danh sách điểm
    return this.calculateAcademicStats(records);
  }

  async reportBangDiemTongKet(maLop) {
    return diemRepository.reportBangDiemTongKet(maLop);
  }

  async reportDSSVDangKy(maLTC) {
    return diemRepository.reportDSSVDangKy(maLTC);
  }

  async reportDSLopTinChi(nienKhoa, hocKy) {
    return diemRepository.reportDSLopTinChi(nienKhoa, hocKy);
  }
}

module.exports = new DiemService();
