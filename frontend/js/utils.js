/* ====================================
   UTILITIES
   File: js/utils.js
==================================== */

class Utils {
  /**
   * Tính điểm tổng kết
   * Điểm tổng kết = 0.1*CC + 0.3*GK + 0.6*CK
   */
  static calcDiemTongKet(cc, gk, ck) {
    if (cc === '' || cc == null || gk === '' || gk == null || ck === '' || ck == null) return '';
    const numCC = parseFloat(cc);
    const numGK = parseFloat(gk);
    const numCK = parseFloat(ck);
    if (isNaN(numCC) || isNaN(numGK) || isNaN(numCK)) return '';
    return Math.round((0.1 * numCC + 0.3 * numGK + 0.6 * numCK) * 100) / 100;
  }

  /**
   * Render loading spinner HTML
   */
  static getSpinner() {
    return `<div class="loading-overlay"><div class="spinner"></div></div>`;
  }

  /**
   * Kiểm tra học kỳ truyền vào có phải ở tương lai so với hiện tại hay không
   */
  static isFutureSemester(nienKhoa, hocKy) {
    if (!nienKhoa || !hocKy) return false;

    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    let currentNK = "";
    let currentHK = 1;

    if (month >= 8 && month <= 12) {
      currentNK = `${year}-${year + 1}`;
      currentHK = 1;
    } else if (month >= 1 && month <= 6) {
      currentNK = `${year - 1}-${year}`;
      currentHK = 2;
    } else if (month === 7) {
      currentNK = `${year - 1}-${year}`;
      currentHK = 3;
    }

    const partsCur = currentNK.split('-').map(Number);
    const partsTarget = nienKhoa.split('-').map(Number);
    if (partsCur.length < 2 || partsTarget.length < 2) return false;

    const startYearCur = partsCur[0];
    const startYearTarget = partsTarget[0];

    if (startYearTarget > startYearCur) {
      return true;
    }
    if (startYearTarget < startYearCur) {
      return false;
    }

    return Number(hocKy) > Number(currentHK);
  }
}

window.Utils = Utils;
