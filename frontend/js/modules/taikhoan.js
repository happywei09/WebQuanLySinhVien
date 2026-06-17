/* ====================================
   MODULE QUẢN LÝ TÀI KHOẢN
   File: js/modules/taikhoan.js
==================================== */

window.TaiKhoanModule = {
  state: {
    nhanVienList: [],
    accountsList: []
  },

  async init() {
    this.cacheDOM();
    this.bindEvents();
    
    // Đang tải dữ liệu ban đầu
    await Promise.all([
      this.loadNhanVien(),
      this.loadAccounts()
    ]);
  },

  cacheDOM() {
    this.form = document.getElementById('createAccountForm');
    this.selectNhanVien = document.getElementById('accNhanVien');
    this.inputMaNV = document.getElementById('accMaNV');
    this.inputUsername = document.getElementById('accUsername');
    this.inputPassword = document.getElementById('accPassword');
    this.selectRole = document.getElementById('accRole');
    
    this.btnCreate = document.getElementById('btnCreateAccount');
    this.btnDelete = document.getElementById('btnDeleteAccount');
    this.btnExit = document.getElementById('btnExit');
    this.btnRefresh = document.getElementById('btnRefreshAccounts');
    
    this.tableBody = document.getElementById('accountsTableBody');
  },

  bindEvents() {
    // Khi chọn nhân viên, tự động điền MãNV
    this.selectNhanVien.addEventListener('change', (e) => {
      const maNV = e.target.value;
      this.inputMaNV.value = maNV;
      
      // Gợi ý luôn tên tài khoản dựa trên MãNV
      if (maNV) {
        this.inputUsername.value = maNV.toLowerCase();
      } else {
        this.inputUsername.value = '';
      }
    });

    // Sự kiện nút Tạo
    this.btnCreate.addEventListener('click', () => this.handleCreate());

    // Sự kiện nút Xóa (từ Form)
    this.btnDelete.addEventListener('click', () => {
      const username = this.inputUsername.value.trim();
      if (!username) {
        Toast.warning('Vui lòng chọn nhân viên hoặc nhập Tên tài khoản để xóa');
        return;
      }
      this.handleDelete(username);
    });

    // Nút Thoát
    this.btnExit.addEventListener('click', () => {
      // Click vào mục Tổng quan ở Sidebar
      const dashboardItem = document.querySelector('.menu-item[data-id="dashboard"]');
      if (dashboardItem) {
        dashboardItem.click();
      }
    });

    // Nút làm mới bảng
    this.btnRefresh.addEventListener('click', () => this.loadAccounts());
  },

  async loadNhanVien() {
    try {
      this.selectNhanVien.innerHTML = '<option value="">-- Đang tải nhân viên --</option>';
      const res = await API.get('/accounts/nhanvien');
      if (res.success && res.data) {
        this.state.nhanVienList = res.data;
        
        let html = '<option value="">-- Chọn nhân viên --</option>';
        res.data.forEach(nv => {
          html += `<option value="${nv.maNV}">${nv.hoTen} (${nv.maNV})</option>`;
        });
        this.selectNhanVien.innerHTML = html;
      }
    } catch (error) {
      console.error('Không thể tải giảng viên/nhân viên:', error);
      Toast.error('Lỗi khi tải danh sách nhân viên');
      this.selectNhanVien.innerHTML = '<option value="">-- Lỗi tải dữ liệu --</option>';
    }
  },

  async loadAccounts() {
    try {
      this.tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">Đang tải...</td></tr>';
      const res = await API.get('/accounts');
      if (res.success && res.data) {
        this.state.accountsList = res.data;
        this.renderTable();
      }
    } catch (error) {
      console.error('Không thể tải danh sách tài khoản:', error);
      this.tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger-color); padding: 20px;">Lỗi: ${error.message}</td></tr>`;
    }
  },

  renderTable() {
    const list = this.state.accountsList;
    if (list.length === 0) {
      this.tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Chưa có tài khoản nào được tạo</td></tr>';
      return;
    }

    this.tableBody.innerHTML = '';
    list.forEach((acc, idx) => {
      const tr = document.createElement('tr');
      
      // Xác định badge màu sắc cho từng Nhóm quyền
      let roleClass = 'badge-secondary';
      if (acc.ROLE === 'PGV') roleClass = 'badge-danger';
      else if (acc.ROLE === 'KHOA') roleClass = 'badge-primary';
      else if (acc.ROLE === 'SV' || acc.ROLE === 'SINHVIEN') roleClass = 'badge-success';

      tr.innerHTML = `
        <td style="text-align: center;">${idx + 1}</td>
        <td style="font-weight: 500;">${acc.FULLNAME}</td>
        <td style="font-family: monospace; font-size: 13px;">${acc.USERNAME}</td>
        <td style="text-align: center;">
          <span class="badge ${roleClass}" style="padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
            ${acc.ROLE}
          </span>
        </td>
        <td style="text-align: center;">
          <span style="display: inline-flex; align-items: center; gap: 6px; color: ${acc.STATUS === 'Hoạt động' ? '#10b981' : '#ef4444'}; font-weight: 500;">
            <span style="width: 6px; height: 6px; border-radius: 50%; background-color: ${acc.STATUS === 'Hoạt động' ? '#10b981' : '#ef4444'}; display: inline-block;"></span>
            ${acc.STATUS}
          </span>
        </td>
        <td style="text-align: center;">
          <button class="btn btn-danger btn-sm-delete" data-username="${acc.USERNAME}" style="padding: 4px 8px; font-size: 12px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; background-color: rgba(239, 68, 68, 0.1); color: var(--danger-color); border: 1px solid rgba(239, 68, 68, 0.2);">
            🗑️ Xóa
          </button>
        </td>
      `;
      this.tableBody.appendChild(tr);
    });

    // Lắng nghe sự kiện nút xóa tại dòng
    const deleteButtons = this.tableBody.querySelectorAll('.btn-sm-delete');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const username = e.currentTarget.dataset.username;
        this.handleDelete(username);
      });
    });
  },

  async handleCreate() {
    const nhanVienIndex = this.selectNhanVien.selectedIndex;
    if (nhanVienIndex <= 0) {
      Toast.warning('Vui lòng chọn nhân viên');
      return;
    }

    const fullName = this.selectNhanVien.options[nhanVienIndex].text.split('(')[0].trim();
    const username = this.inputUsername.value.trim();
    const password = this.inputPassword.value.trim();
    const role = this.selectRole.value;

    if (!username || !password || !role) {
      Toast.warning('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    if (password.length < 3) {
      Toast.warning('Mật khẩu tối thiểu phải 3 ký tự');
      return;
    }

    try {
      this.btnCreate.disabled = true;
      this.btnCreate.innerHTML = 'Đang xử lý...';

      const res = await API.post('/accounts', {
        fullName,
        username,
        password,
        role,
        maNV: this.inputMaNV.value.trim()
      });

      if (res.success) {
        Toast.success(res.message || 'Tạo tài khoản thành công!');
        this.form.reset();
        this.inputMaNV.value = '';
        await this.loadAccounts();
      } else {
        Toast.error(res.message || 'Lỗi khi tạo tài khoản');
      }
    } catch (error) {
      console.error(error);
      Toast.error(error.message || 'Lỗi kết nối máy chủ');
    } finally {
      this.btnCreate.disabled = false;
      this.btnCreate.innerHTML = '➕ Tạo tài khoản';
    }
  },

  async handleDelete(username) {
    const currentUser = Auth.getUser();
    if (currentUser && currentUser.username.toLowerCase() === username.toLowerCase()) {
      Toast.error('Không thể xóa tài khoản hiện tại bạn đang đăng nhập');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${username}" đăng nhập chương trình?\nThao tác này sẽ xóa Login và User tương ứng khỏi SQL Server!`)) {
      return;
    }

    try {
      const res = await API.delete(`/accounts/${encodeURIComponent(username)}`);
      if (res.success) {
        Toast.success(res.message || 'Xóa tài khoản thành công');
        // Nếu tên tài khoản xóa trùng với form đang điền thì xóa form
        if (this.inputUsername.value.trim() === username) {
          this.form.reset();
          this.inputMaNV.value = '';
        }
        await this.loadAccounts();
      } else {
        Toast.error(res.message || 'Lỗi khi xóa tài khoản');
      }
    } catch (error) {
      console.error(error);
      Toast.error(error.message || 'Lỗi kết nối máy chủ');
    }
  }
};

// Khởi chạy Module
window.TaiKhoanModule.init();
