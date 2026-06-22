/* ====================================
   SIDEBAR & ROUTING
   File: js/sidebar.js
==================================== */

const MENU_ITEMS = [
  { id: 'dashboard', title: 'Tổng quan', icon: 'assets/images/(1).png', roles: ['PGV', 'KHOA', 'SINHVIEN'], file: 'dashboard.html' },
  { id: 'khoa', title: 'Quản lý Khoa', icon: 'assets/images/(2).png', roles: ['PGV', 'KHOA'], file: 'khoa.html' },
  { id: 'lop', title: 'Quản lý Lớp', icon: 'assets/images/(3).png', roles: ['PGV', 'KHOA'], file: 'lop.html' },
  { id: 'giangvien', title: 'Quản lý Giảng viên', icon: 'assets/images/(5).png', roles: ['PGV', 'KHOA'], file: 'giangvien.html' },
  { id: 'monhoc', title: 'Quản lý Môn học', icon: 'assets/images/(6).png', roles: ['PGV', 'KHOA'], file: 'monhoc.html' },
  { id: 'loptinchi', title: 'Lớp Tín Chỉ', icon: 'assets/images/(7).png', roles: ['PGV', 'KHOA'], file: 'loptinchi.html' },
  { id: 'dangky', title: 'Đăng ký Tín chỉ', icon: 'assets/images/(8).png', roles: ['SINHVIEN'], file: 'dangky.html' },
  { id: 'phieudiem', title: 'Phiếu Điểm Cá Nhân', icon: 'assets/images/11.png', roles: ['SINHVIEN'], file: 'phieudiem.html' },
  { id: 'nhapdiem', title: 'Nhập Điểm', icon: 'assets/images/(9).png', roles: ['PGV', 'KHOA'], file: 'nhapdiem.html' },
  { id: 'reports', title: 'Báo cáo Thống kê', icon: 'assets/images/(10).png', roles: ['PGV', 'KHOA'], file: 'reports.html' },
  { id: 'taikhoan', title: 'Quản lý Tài khoản', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-icon-svg" style="width:20px;height:20px;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>', roles: ['PGV', 'KHOA'], file: 'taikhoan.html' },
  { id: 'doimatkhau', title: 'Đổi mật khẩu', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="sidebar-icon-svg" style="width:20px;height:20px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>', roles: ['PGV', 'KHOA', 'SINHVIEN'], file: 'doimatkhau.html' }
];

class Sidebar {
  static init(userRole) {
    if (!userRole) return;

    const menuContainer = document.getElementById('sidebarMenu');
    if (!menuContainer) return;

    let html = '<div class="menu-group">';

    MENU_ITEMS.forEach(item => {
      // Chỉ hiển thị menu mà user có quyền truy cập
      if (item.roles.includes(userRole)) {
        const isImg = item.icon.startsWith('assets/');
        const iconHtml = isImg ? `<img src="${item.icon}" alt="${item.title}" class="sidebar-icon-img" />` : item.icon;
        html += `
          <div class="menu-item" data-id="${item.id}" data-file="${item.file}">
            <div class="menu-icon">${iconHtml}</div>
            <span>${item.title}</span>
          </div>
        `;
      }
    });

    html += '</div>';
    menuContainer.innerHTML = html;

    // Attach click events
    const items = menuContainer.querySelectorAll('.menu-item');
    items.forEach(el => {
      el.addEventListener('click', () => {
        // Remove active class
        items.forEach(i => i.classList.remove('active'));
        // Add active class
        el.classList.add('active');

        // Load page content
        const file = el.getAttribute('data-file');
        this.loadPage(file, el.innerText);
      });
    });

    // Default load dashboard
    if (items.length > 0) items[0].click();
  }

  static async loadPage(filename, title) {
    const pageContent = document.getElementById('pageContent');
    if (!pageContent) return;

    try {
      pageContent.innerHTML = Utils.getSpinner();

      // Update breadcrumb & title
      // The real implementation would fetch HTML partials

      const response = await fetch(`pages/${filename}`);
      if (!response.ok) throw new Error('Cannot load page');

      const html = await response.text();
      pageContent.innerHTML = html;

      // FIX: Thực thi các script trong đoạn HTML được inject
      const scripts = pageContent.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });

      // Dispatch custom event để báo trang đã được load
      const event = new CustomEvent('pageLoaded', { detail: { pageId: filename.split('.')[0] } });
      document.dispatchEvent(event);

    } catch (error) {
      pageContent.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; color: var(--danger-color); padding: 50px;">
            <h3>Lỗi tải trang</h3>
            <p>${error.message}. Xin vui lòng tạo file pages/${filename} trước.</p>
          </div>
        </div>
      `;
    }
  }
}

window.Sidebar = Sidebar;
