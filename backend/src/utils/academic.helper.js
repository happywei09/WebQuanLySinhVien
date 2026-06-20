/**
 * Lấy Niên khóa và Học kỳ hiện tại dựa trên thời gian máy chủ (Server Time)
 * Quy ước:
 * - Tháng 8 -> Tháng 12: Học kỳ 1 của năm học hiện tại (năm nay - năm sau).
 * - Tháng 1 -> Tháng 6: Học kỳ 2 của năm học trước (năm trước - năm nay).
 * - Tháng 7: Học kỳ 3 (Hè) của năm học trước (năm trước - năm nay).
 * 
 * @param {Date} date 
 * @returns {{ nienKhoa: string, hocKy: number }}
 */
function getCurrentSemester(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-indexed (1-12)

  let nienKhoa = "";
  let hocKy = 1;

  if (month >= 8 && month <= 12) {
    nienKhoa = `${year}-${year + 1}`;
    hocKy = 1;
  } else if (month >= 1 && month <= 6) {
    nienKhoa = `${year - 1}-${year}`;
    hocKy = 2;
  } else if (month === 7) {
    nienKhoa = `${year - 1}-${year}`;
    hocKy = 3;
  }

  return { nienKhoa, hocKy };
}

/**
 * Lấy học kỳ tiếp theo của một học kỳ cho trước.
 * Quy trình chuyển kỳ:
 * - (Năm_A - Năm_B, HK 1) -> (Năm_A - Năm_B, HK 2)
 * - (Năm_A - Năm_B, HK 2) -> (Năm_A - Năm_B, HK 3)
 * - (Năm_A - Năm_B, HK 3) -> (Năm_B - Năm_B+1, HK 1)
 * 
 * @param {string} nienKhoa - Định dạng "YYYY-YYYY"
 * @param {number} hocKy 
 * @returns {{ nienKhoa: string, hocKy: number } | null}
 */
function getNextSemester(nienKhoa, hocKy) {
  if (!nienKhoa) return null;
  const years = nienKhoa.split("-").map(Number);
  if (years.length !== 2) return null;
  const [startYear, endYear] = years;

  if (hocKy === 1) {
    return { nienKhoa: `${startYear}-${endYear}`, hocKy: 2 };
  } else if (hocKy === 2) {
    return { nienKhoa: `${startYear}-${endYear}`, hocKy: 3 };
  } else if (hocKy === 3) {
    return { nienKhoa: `${startYear + 1}-${endYear + 1}`, hocKy: 1 };
  }
  return null;
}

/**
 * So sánh 2 học kỳ xem có trùng khớp hay không.
 * Trả về true nếu trùng, false nếu khác.
 */
function isSameSemester(sem1, sem2) {
  if (!sem1 || !sem2) return false;
  
  const nk1 = String(sem1.nienKhoa || sem1.NIENKHOA || "").trim();
  const nk2 = String(sem2.nienKhoa || sem2.NIENKHOA || "").trim();
  const hk1 = Number(sem1.hocKy || sem1.HOCKY || 0);
  const hk2 = Number(sem2.hocKy || sem2.HOCKY || 0);

  return nk1 === nk2 && hk1 === hk2;
}

/**
 * So sánh 2 học kỳ xem sem1 có xảy ra sau sem2 hay không.
 */
function isSemesterAfter(sem1, sem2) {
  if (!sem1 || !sem2) return false;

  const nk1 = String(sem1.nienKhoa || sem1.NIENKHOA || "").trim();
  const nk2 = String(sem2.nienKhoa || sem2.NIENKHOA || "").trim();
  const hk1 = Number(sem1.hocKy || sem1.HOCKY || 0);
  const hk2 = Number(sem2.hocKy || sem2.HOCKY || 0);

  const years1 = nk1.split("-").map(Number);
  const years2 = nk2.split("-").map(Number);

  if (years1.length !== 2 || years2.length !== 2) return false;

  const startYear1 = years1[0];
  const startYear2 = years2[0];

  if (startYear1 > startYear2) {
    return true;
  } else if (startYear1 === startYear2) {
    return hk1 > hk2;
  }
  return false;
}

module.exports = {
  getCurrentSemester,
  getNextSemester,
  isSameSemester,
  isSemesterAfter
};
