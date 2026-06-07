/* ====================================
   DASHBOARD LOGIC
   File: js/dashboard.js
==================================== */

document.addEventListener('pageLoaded', async (e) => {
  if (e.detail.pageId === 'dashboard') {
    console.log("Dashboard loaded");

    const filterKhoa = document.getElementById('filterKhoa');
    const filterNienKhoa = document.getElementById('filterNienKhoa');
    const filterHocKy = document.getElementById('filterHocKy');
    const btnResetFilter = document.getElementById('btnResetFilter');

    // 1. Tải và điền dữ liệu vào bộ lọc
    async function loadFilters() {
      try {
        const response = await API.get('/dashboard/filters');
        if (response && response.success) {
          const { khoas, semesters } = response.data;

          // Gán danh sách Khoa
          if (filterKhoa) {
            filterKhoa.innerHTML = '<option value="ALL">Tất cả Khoa</option>';
            khoas.forEach(k => {
              const opt = document.createElement('option');
              opt.value = k.MAKHOA;
              opt.textContent = `${k.MAKHOA} - ${k.TENKHOA}`;
              filterKhoa.appendChild(opt);
            });
          }

          // Gán danh sách Niên khóa (lọc trùng lặp)
          if (filterNienKhoa) {
            filterNienKhoa.innerHTML = '<option value="ALL">Tất cả Niên khóa</option>';
            const nienKhoas = [...new Set(semesters.map(s => s.NIENKHOA))];
            nienKhoas.forEach(nk => {
              const opt = document.createElement('option');
              opt.value = nk;
              opt.textContent = nk;
              filterNienKhoa.appendChild(opt);
            });
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu bộ lọc:', error);
      }
    }

    // 2. Tải chỉ số thống kê & chi tiết tình trạng lớp học
    async function loadDashboardStats() {
      const maKhoa = filterKhoa ? filterKhoa.value : 'ALL';
      const nienKhoa = filterNienKhoa ? filterNienKhoa.value : 'ALL';
      const hocKy = filterHocKy ? filterHocKy.value : 'ALL';

      // Hiển thị trạng thái đang tải dữ liệu
      const ids = ['statTotalStudents', 'statOpenClasses', 'statTotalClasses', 'statTotalRegistrations'];
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '...';
      });

      const tblBody = document.getElementById('tblStatsDetail');
      if (tblBody) {
        tblBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">
              Đang tải danh sách lớp tín chỉ...
            </td>
          </tr>
        `;
      }

      try {
        const url = `/dashboard/stats?maKhoa=${encodeURIComponent(maKhoa)}&nienKhoa=${encodeURIComponent(nienKhoa)}&hocKy=${encodeURIComponent(hocKy)}`;
        const response = await API.get(url);
        
        if (response && response.success) {
          const { stats, classesDetail } = response.data;

          // Cập nhật lên các thẻ số liệu
          const totalStudentsEl = document.getElementById('statTotalStudents');
          const openClassesEl = document.getElementById('statOpenClasses');
          const totalClassesEl = document.getElementById('statTotalClasses');
          const totalRegistrationsEl = document.getElementById('statTotalRegistrations');

          if (totalStudentsEl) totalStudentsEl.textContent = Number(stats.totalStudents || 0).toLocaleString('vi-VN');
          if (openClassesEl) openClassesEl.textContent = Number(stats.openClasses || 0).toLocaleString('vi-VN');
          if (totalClassesEl) totalClassesEl.textContent = Number(stats.totalClasses || 0).toLocaleString('vi-VN');
          if (totalRegistrationsEl) totalRegistrationsEl.textContent = Number(stats.totalRegistrations || 0).toLocaleString('vi-VN');

          // Cập nhật bảng danh sách lớp
          if (tblBody) {
            if (classesDetail.length === 0) {
              tblBody.innerHTML = `
                <tr>
                  <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    Không tìm thấy lớp tín chỉ nào trong phạm vi lọc
                  </td>
                </tr>
              `;
            } else {
              tblBody.innerHTML = '';
              classesDetail.forEach(item => {
                const tr = document.createElement('tr');
                const isUnderEnrolled = item.SOSVDANGKY < item.SOSVTOITHIEU;
                
                const badgeHTML = isUnderEnrolled 
                  ? `<span style="background-color: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">⚠️ Thiếu sĩ số</span>`
                  : `<span style="background-color: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">✔ Đủ điều kiện</span>`;

                tr.innerHTML = `
                  <td style="font-weight: 600;">${item.MALTC}</td>
                  <td>${item.TENMH}</td>
                  <td style="text-align: center;">${item.NHOM}</td>
                  <td>${item.TEN_GV}</td>
                  <td style="text-align: center; font-weight: 500;">${item.SOSVTOITHIEU}</td>
                  <td style="text-align: center; font-weight: 700; color: ${isUnderEnrolled ? '#991b1b' : 'var(--success-color)'};">
                    ${item.SOSVDANGKY}
                  </td>
                  <td>${badgeHTML}</td>
                `;
                tblBody.appendChild(tr);
              });
            }
          }
        }
      } catch (error) {
        console.error('Lỗi tải dữ liệu thống kê:', error);
        ids.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.textContent = 'Lỗi';
        });
        if (tblBody) {
          tblBody.innerHTML = `
            <tr>
              <td colspan="7" style="text-align: center; color: var(--danger-color); padding: 30px; font-weight: 500;">
                ❌ Gặp lỗi khi tải dữ liệu từ máy chủ. Vui lòng kiểm tra lại!
              </td>
            </tr>
          `;
        }
      }
    }

    // Đăng ký các sự kiện thay đổi lựa chọn bộ lọc
    if (filterKhoa) filterKhoa.addEventListener('change', loadDashboardStats);
    if (filterNienKhoa) filterNienKhoa.addEventListener('change', loadDashboardStats);
    if (filterHocKy) filterHocKy.addEventListener('change', loadDashboardStats);

    // Đăng ký sự kiện nút Reset bộ lọc
    if (btnResetFilter) {
      btnResetFilter.addEventListener('click', () => {
        if (filterKhoa) filterKhoa.value = 'ALL';
        if (filterNienKhoa) filterNienKhoa.value = 'ALL';
        if (filterHocKy) filterHocKy.value = 'ALL';
        loadDashboardStats();
      });
    }

    // Chạy khởi tạo
    await loadFilters();
    await loadDashboardStats();
  }
});
