/* ====================================
   DASHBOARD LOGIC
   File: js/dashboard.js
==================================== */

document.addEventListener('pageLoaded', async (e) => {
  if (e.detail.pageId === 'dashboard') {
    console.log("Dashboard loaded");

    // Tải chỉ số thống kê tổng quan
    async function loadDashboardStats() {
      // Hiển thị trạng thái đang tải dữ liệu
      const ids = ['statTotalStudents', 'statOpenClasses', 'statTotalClasses', 'statTotalRegistrations'];
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '...';
      });

      try {
        const url = `/dashboard/stats?maKhoa=ALL&nienKhoa=ALL&hocKy=ALL`;
        const response = await API.get(url);
        
        if (response && response.success) {
          const { stats } = response.data;

          // Cập nhật lên các thẻ số liệu
          const totalStudentsEl = document.getElementById('statTotalStudents');
          const openClassesEl = document.getElementById('statOpenClasses');
          const totalClassesEl = document.getElementById('statTotalClasses');
          const totalRegistrationsEl = document.getElementById('statTotalRegistrations');

          if (totalStudentsEl) totalStudentsEl.textContent = Number(stats.totalStudents || 0).toLocaleString('vi-VN');
          if (openClassesEl) openClassesEl.textContent = Number(stats.openClasses || 0).toLocaleString('vi-VN');
          if (totalClassesEl) totalClassesEl.textContent = Number(stats.totalClasses || 0).toLocaleString('vi-VN');
          if (totalRegistrationsEl) totalRegistrationsEl.textContent = Number(stats.totalRegistrations || 0).toLocaleString('vi-VN');
        }
      } catch (error) {
        console.error('Lỗi tải dữ liệu thống kê:', error);
        ids.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.textContent = 'Lỗi';
        });
      }
    }

    // Chạy khởi tạo
    await loadDashboardStats();
  }
});
