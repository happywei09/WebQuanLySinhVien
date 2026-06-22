/* ====================================
   STUDENT DASHBOARD LOGIC
   File: js/dashboard_sinhvien.js
==================================== */

document.addEventListener('pageLoaded', async (e) => {
  if (e.detail.pageId === 'dashboard_sinhvien') {
    console.log("Student Dashboard loaded");

    const user = Auth.getUser();
    if (!user || user.role !== 'SINHVIEN') {
      console.warn("User is not a student, redirecting or blocking...");
      return;
    }

    const lblName = document.getElementById('studentName');
    const lblCode = document.getElementById('studentCode');
    const lblClass = document.getElementById('studentClass');
    const lblSemesterText = document.getElementById('currentSemesterText');

    const statGPA = document.getElementById('statGPA');
    const statPassed = document.getElementById('statPassed');
    const statRegistered = document.getElementById('statRegistered');
    const tblStudentClasses = document.getElementById('tblStudentClasses');

    const btnQuickRegister = document.getElementById('btnQuickRegister');
    const btnQuickGrades = document.getElementById('btnQuickGrades');

    // Cài đặt chuyển hướng nhanh qua sidebar
    if (btnQuickRegister) {
      btnQuickRegister.addEventListener('click', () => {
        const item = document.querySelector('.menu-item[data-id="dangky"]');
        if (item) item.click();
      });
    }
    if (btnQuickGrades) {
      btnQuickGrades.addEventListener('click', () => {
        const item = document.querySelector('.menu-item[data-id="phieudiem"]');
        if (item) item.click();
      });
    }

    // 1. Tải thông tin cá nhân sinh viên
    async function loadStudentInfo() {
      try {
        const res = await API.get(`/sinhvien/${user.username}`);
        if (res.success && res.data) {
          const sv = res.data;
          if (lblName) lblName.textContent = `${sv.HO} ${sv.TEN}`;
          if (lblCode) lblCode.textContent = sv.MASV;
          if (lblClass) lblClass.textContent = sv.MALOP;
        } else {
          throw new Error(res.message || "Không thể tải thông tin sinh viên");
        }
      } catch (error) {
        console.error("Lỗi load thông tin sinh viên:", error);
        if (lblName) lblName.textContent = user.fullName || user.username;
        if (lblCode) lblCode.textContent = user.username;
        if (lblClass) lblClass.textContent = "N/A";
      }
    }

    // 2. Tải phiếu điểm của sinh viên để tính trung bình và môn đạt
    async function loadAcademicStats() {
      try {
        const res = await API.get(`/diem/report/phieu-diem/${user.username}`);
        if (res.success && res.data) {
          const transcript = res.data || [];
          
          // Lọc ra các môn học đã có điểm hợp lệ
          const gradedSubjects = transcript.filter(t => t.DIEM !== null && t.DIEM !== undefined && t.DIEM !== '');
          
          let avgGPA = 0;
          let passedCount = 0;

          if (gradedSubjects.length > 0) {
            const totalScore = gradedSubjects.reduce((sum, item) => sum + parseFloat(item.DIEM), 0);
            avgGPA = (totalScore / gradedSubjects.length).toFixed(2);
            
            // Tính số môn qua môn (Thường điểm hết môn >= 4.0 là đạt)
            passedCount = gradedSubjects.filter(item => parseFloat(item.DIEM) >= 4.0).length;
          }

          if (statGPA) statGPA.textContent = gradedSubjects.length > 0 ? avgGPA : '0.00';
          if (statPassed) statPassed.textContent = `${passedCount} / ${gradedSubjects.length}`;
        } else {
          if (statGPA) statGPA.textContent = '0.00';
          if (statPassed) statPassed.textContent = '0 / 0';
        }
      } catch (error) {
        console.error("Lỗi tính toán điểm học tập:", error);
        if (statGPA) statGPA.textContent = 'Lỗi';
        if (statPassed) statPassed.textContent = 'Lỗi';
      }
    }

    // Helper to calculate current semester based on current date
    function getCurrentSemester() {
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
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

    // 3. Tải danh sách lớp tín chỉ đã đăng ký học kỳ hiện tại
    async function loadRegisteredClasses() {
      if (tblStudentClasses) {
        tblStudentClasses.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">
              Đang tải danh sách lớp tín chỉ...
            </td>
          </tr>
        `;
      }

      try {
        const res = await API.get(`/dangky/sinhvien/${user.username}`);
        if (res.success && res.data) {
          const allRegistrations = res.data || [];
          const currentSem = getCurrentSemester();
          
          if (lblSemesterText) {
            lblSemesterText.textContent = `HK ${currentSem.hocKy} - Năm học ${currentSem.nienKhoa}`;
          }

          if (allRegistrations.length === 0) {
            if (statRegistered) statRegistered.textContent = '0';
            if (tblStudentClasses) {
              tblStudentClasses.innerHTML = `
                <tr>
                  <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    Chưa đăng ký lớp tín chỉ nào
                  </td>
                </tr>
              `;
            }
            return;
          }

          // Lọc ra các lớp thuộc học kỳ hiện tại
          const currentClasses = allRegistrations.filter(c => 
            String(c.NIENKHOA).trim() === String(currentSem.nienKhoa).trim() && 
            Number(c.HOCKY) === Number(currentSem.hocKy)
          );

          if (statRegistered) statRegistered.textContent = currentClasses.length.toString();

          // Sắp xếp các lớp theo Mã LTC giảm dần (mới nhất lên đầu)
          currentClasses.sort((a, b) => b.MALTC - a.MALTC);

          if (tblStudentClasses) {
            if (currentClasses.length === 0) {
              tblStudentClasses.innerHTML = `
                <tr>
                  <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    Không có lớp tín chỉ đăng ký cho kỳ này
                  </td>
                </tr>
              `;
            } else {
              tblStudentClasses.innerHTML = '';
              currentClasses.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                  <td style="text-align: center; font-weight: 600;">${item.MALTC}</td>
                  <td style="font-weight: 600;">${item.TENMH || item.MAMH}</td>
                  <td style="text-align: center;">${item.NHOM}</td>
                  <td>${item.TENGV || item.MAGV}</td>
                  <td style="text-align: center; font-size: 13px; color: var(--text-muted);">HK ${item.HOCKY}</td>
                  <td style="text-align: center;">
                    <span class="badge-registered-ltc">Đã đăng ký</span>
                  </td>
                `;
                tblStudentClasses.appendChild(tr);
              });
            }
          }
        }
      } catch (error) {
        console.error("Lỗi tải lớp tín chỉ đã đăng ký:", error);
        if (statRegistered) statRegistered.textContent = 'Lỗi';
        if (tblStudentClasses) {
          tblStudentClasses.innerHTML = `
            <tr>
              <td colspan="6" style="text-align: center; color: var(--danger-color); padding: 30px;">
                ❌ Gặp lỗi khi tải dữ liệu từ máy chủ. Vui lòng thử lại!
              </td>
            </tr>
          `;
        }
      }
    }

    // Thực thi tuần tự các hàm load dữ liệu
    await loadStudentInfo();
    await loadAcademicStats();
    await loadRegisteredClasses();
  }
});
