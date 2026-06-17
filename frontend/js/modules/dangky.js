window.DangKyModule = {
  async init() {
    this.tbody = document.querySelector('#pageContent tbody');
    this.selectNienKhoa = document.getElementById('regNienKhoa');
    this.selectHocKy = document.getElementById('regHocKy');
    this.btnSearch = document.getElementById('btnSearchLop');

    // Inject Register button
    this.btnRegister = document.createElement('button');
    this.btnRegister.className = 'btn btn-success';
    this.btnRegister.style.marginLeft = '8px';
    this.btnRegister.textContent = 'Đăng ký chọn';
    this.btnRegister.disabled = true;
    if (this.btnSearch && this.btnSearch.parentElement) {
      this.btnSearch.parentElement.appendChild(this.btnRegister);
    }

    this.bindEvents();
    await this.loadFilters();
    await this.loadStudentInfo();
  },

  bindEvents() {
    this.btnSearch && (this.btnSearch.onclick = () => this.searchLopTinChi());
    this.btnRegister && (this.btnRegister.onclick = () => this.registerSelected());
  },

  async loadFilters() {
    try {
      const filterRes = await API.get('/dashboard/filters');
      if (filterRes.success && filterRes.data) {
        const semesters = filterRes.data.semesters || [];
        const nienKhoas = [...new Set(semesters.map(s => s.NIENKHOA))].sort();
        
        this.selectNienKhoa.innerHTML = '<option value="">-- Chọn niên khóa --</option>';
        nienKhoas.forEach(nk => {
          this.selectNienKhoa.innerHTML += `<option value="${nk}">${nk}</option>`;
        });
      }
    } catch (error) {
      console.error('Không thể tải niên khóa đăng ký:', error);
    }
  },

  async loadStudentInfo() {
    const user = Auth.getUser();
    if (!user) return;

    const infoBox = document.getElementById('studentInfoBox');
    const nameDisp = document.getElementById('studentNameDisplay');
    const codeDisp = document.getElementById('studentCodeDisplay');
    const classDisp = document.getElementById('studentClassDisplay');

    if (!infoBox) return;

    if (user.role === 'SINHVIEN') {
      try {
        const res = await API.get(`/sinhvien/${user.username}`);
        if (res.success && res.data) {
          const sv = res.data;
          nameDisp.textContent = `${sv.HO} ${sv.TEN}`;
          codeDisp.textContent = sv.MASV;
          classDisp.textContent = sv.MALOP;
          infoBox.style.display = 'block';
        }
      } catch (error) {
        console.error('Không thể tải chi tiết sinh viên:', error);
        nameDisp.textContent = user.fullName;
        codeDisp.textContent = user.username;
        classDisp.textContent = 'N/A';
        infoBox.style.display = 'block';
      }
    } else {
      infoBox.style.display = 'none';
    }
  },

  async searchLopTinChi() {
    try {
      const nienKhoa = this.selectNienKhoa ? this.selectNienKhoa.value : '';
      const hocKy = this.selectHocKy ? this.selectHocKy.value : '';
      if (!nienKhoa || !hocKy) {
        Toast.warning('Vui lòng chọn niên khóa và học kỳ');
        return;
      }

      this.tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Đang tải...</td></tr>';
      const res = await API.get(`/loptinchi/filter?nienKhoa=${encodeURIComponent(nienKhoa)}&hocKy=${encodeURIComponent(hocKy)}`);
      if (!res.success) throw new Error(res.message || 'Lỗi tải lớp tín chỉ');

      const rows = res.data || [];
      if (rows.length === 0) {
        this.tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 20px;">Không có lớp tín chỉ nào mở</td></tr>';
        return;
      }

      // Render rows
      this.tbody.innerHTML = '';
      for (const item of rows) {
        const tr = document.createElement('tr');
        const malTC = item.MALTC;
        // fetch number of registered students (can be optimized)
        let regCount = '-';
        try {
          const r = await API.get(`/dangky/loptinchi/${malTC}`);
          regCount = r.success ? (r.data || []).length : '-';
        } catch (e) { regCount = '-'; }

        tr.innerHTML = `
          <td style="text-align:center;"><input type="checkbox" data-maltc="${malTC}"></td>
          <td>${malTC}</td>
          <td>${item.TENMH || item.MAMH}</td>
          <td>${item.TENGV || item.MAGV}</td>
          <td style="text-align:center;">${regCount}</td>
          <td style="text-align:center;">${item.SOSVTOITHIEU || ''}</td>
        `;
        this.tbody.appendChild(tr);
      }

      // Enable register button only for SinhVien role
      const user = window.Auth && Auth.getUser ? Auth.getUser() : null;
      this.btnRegister.disabled = !(user && user.role === 'SINHVIEN');
    } catch (error) {
      this.tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">Lỗi: ${error.message}</td></tr>`;
      Toast.error(error.message);
    }
  },

  async registerSelected() {
    try {
      const user = window.Auth && Auth.getUser ? Auth.getUser() : null;
      if (!user || user.role !== 'SINHVIEN') {
        Toast.error('Chức năng chỉ dành cho Sinh viên');
        return;
      }

      const inputs = Array.from(this.tbody.querySelectorAll('input[type="checkbox"][data-maltc]:checked'));
      if (inputs.length === 0) {
        Toast.info('Vui lòng chọn ít nhất một lớp để đăng ký');
        return;
      }

      const results = { success: [], failed: [] };
      for (const cb of inputs) {
        const malTC = cb.dataset.maltc;
        try {
          await API.post('/dangky/create', { MALTC: parseInt(malTC), MASV: user.username });
          results.success.push(malTC);
        } catch (err) {
          results.failed.push({ malTC, message: err.message });
        }
      }

      if (results.success.length) Toast.success(`Đăng ký thành công: ${results.success.join(', ')}`);
      if (results.failed.length) {
        console.error('Failed registrations', results.failed);
        Toast.error(`Một số đăng ký thất bại: ${results.failed.map(f => f.malTC + ':' + f.message).join('; ')}`);
      }

      // Refresh list to update counts
      this.searchLopTinChi();
    } catch (error) {
      Toast.error(error.message || 'Lỗi khi đăng ký');
    }
  }
};

window.DangKyModule.init();
