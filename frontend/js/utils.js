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
}

window.Utils = Utils;
