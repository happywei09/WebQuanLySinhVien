/* ====================================
   SIDEBAR & ROUTING
   File: js/sidebar.js
==================================== */

const MENU_ITEMS = [
  { id: 'dashboard', title: 'Tổng quan', icon: '🏠', roles: ['PGV', 'KHOA', 'SINHVIEN'], file: 'dashboard.html' },
  { id: 'khoa', title: 'Quản lý Khoa', icon: '🏛️', roles: ['PGV', 'KHOA'], file: 'khoa.html' },
  { id: 'lop', title: 'Quản lý Lớp', icon: '🏫', roles: ['PGV', 'KHOA'], file: 'lop.html' },
  { id: 'sinhvien', title: 'Quản lý Sinh viên', icon: '🎓', roles: ['PGV', 'KHOA'], file: 'sinhvien.html' },
  { id: 'giangvien', title: 'Quản lý Giảng viên', icon: '👨‍🏫', roles: ['PGV', 'KHOA'], file: 'giangvien.html' },
  { id: 'monhoc', title: 'Quản lý Môn học', icon: '📚', roles: ['PGV', 'KHOA'], file: 'monhoc.html' },
  { id: 'loptinchi', title: 'Lớp Tín Chỉ', icon: '📋', roles: ['PGV', 'KHOA'], file: 'loptinchi.html' },
  { id: 'dangky', title: 'Đăng ký Tín chỉ', icon: '✍️', roles: ['PGV', 'KHOA', 'SINHVIEN'], file: 'dangky.html' },
  { id: 'nhapdiem', title: 'Nhập Điểm', icon: '📝', roles: ['PGV', 'KHOA'], file: 'nhapdiem.html' },
  { id: 'reports', title: 'Báo cáo Thống kê', icon: '📊', roles: ['PGV', 'KHOA'], file: 'reports.html' }
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
        html += `
          <div class="menu-item" data-id="${item.id}" data-file="${item.file}">
            <div class="menu-icon">${item.icon}</div>
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
