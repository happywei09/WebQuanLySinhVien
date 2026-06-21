window.DangKyModule = {
  nextNK: '',
  nextHK: 1,
  selectedNK: '',
  selectedHK: 1,

  async init() {
    this.tbodyAvailable = document.getElementById('tbodyAvailable');
    this.tbodyRegistered = document.getElementById('tbodyRegistered');
    this.btnRegisterSelected = document.getElementById('btnRegisterSelected');
    this.registrationTitle = document.getElementById('registrationTitle');
    this.selectNienKhoa = document.getElementById('regNienKhoa');
    this.selectHocKy = document.getElementById('regHocKy');

    // Tự động tính học kỳ tiếp theo dựa trên thời gian hiện tại
    this.calculateNextSemester();

    // Mặc định học kỳ lựa chọn ban đầu là học kỳ tiếp theo
    this.selectedNK = this.nextNK;
    this.selectedHK = this.nextHK;

    this.bindEvents();
    await this.loadStudentInfo();
    await this.loadFilters();
    await this.loadData();
  },

  calculateNextSemester() {
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

    const years = currentNK.split("-").map(Number);
    const startYear = years[0];
    const endYear = years[1];
    
    this.nextNK = "";
    this.nextHK = 1;

    if (currentHK === 1) {
      this.nextNK = `${startYear}-${endYear}`;
      this.nextHK = 2;
    } else if (currentHK === 2) {
      this.nextNK = `${startYear}-${endYear}`;
      this.nextHK = 3;
    } else if (currentHK === 3) {
      this.nextNK = `${startYear + 1}-${endYear + 1}`;
      this.nextHK = 1;
    }

    this.updateTitle(this.nextNK, this.nextHK);
  },

  updateTitle(nienKhoa, hocKy) {
    if (this.registrationTitle) {
      this.registrationTitle.textContent = `Đăng ký Môn học Học kỳ ${hocKy} - Năm học ${nienKhoa}`;
    }
  },

  bindEvents() {
    if (this.btnRegisterSelected) {
      this.btnRegisterSelected.addEventListener('click', () => this.registerSelected());
    }
    if (this.selectNienKhoa) {
      this.selectNienKhoa.addEventListener('change', () => this.handleFilterChange());
    }
    if (this.selectHocKy) {
      this.selectHocKy.addEventListener('change', () => this.handleFilterChange());
    }
  },

  async loadFilters() {
    try {
      const filterRes = await API.get('/dashboard/filters');
      let nienKhoas = [];
      const hocKys = ["1", "2", "3"];

      if (filterRes.success && filterRes.data) {
        const semesters = filterRes.data.semesters || [];
        nienKhoas = [...new Set(semesters.map(s => s.NIENKHOA))];
      }

      // Đảm bảo niên khóa tiếp theo luôn có trong danh sách bộ lọc
      if (this.nextNK && !nienKhoas.includes(this.nextNK)) {
        nienKhoas.push(this.nextNK);
      }
      nienKhoas.sort();

      this.selectNienKhoa.innerHTML = nienKhoas.map(nk => `<option value="${nk}">${nk}</option>`).join('');
      this.selectHocKy.innerHTML = hocKys.map(hk => `<option value="${hk}">${hk}</option>`).join('');

      // Gán giá trị mặc định là kỳ tiếp theo
      this.selectNienKhoa.value = this.nextNK;
      this.selectHocKy.value = this.nextHK;
    } catch (error) {
      console.error('Không thể tải bộ lọc đăng ký:', error);
    }
  },

  async handleFilterChange() {
    const nk = this.selectNienKhoa.value;
    const hk = parseInt(this.selectHocKy.value);

    if (!nk || !hk) {
      Toast.warning('Vui lòng chọn đầy đủ niên khóa và học kỳ');
      return;
    }

    this.selectedNK = nk;
    this.selectedHK = hk;

    this.updateTitle(nk, hk);
    await this.loadData(nk, hk);
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

  async loadData(nienKhoa = this.selectedNK, hocKy = this.selectedHK) {
    await this.loadRegisteredClasses(nienKhoa, hocKy);
    await this.loadAvailableClasses(nienKhoa, hocKy);
  },

  async loadAvailableClasses(nienKhoa, hocKy) {
    try {
      this.tbodyAvailable.innerHTML = '<tr><td colspan="7" style="text-align:center;">Đang tải...</td></tr>';
      
      const res = await API.get(`/loptinchi/filter?nienKhoa=${encodeURIComponent(nienKhoa)}&hocKy=${encodeURIComponent(hocKy)}`);
      if (!res.success) throw new Error(res.message || 'Lỗi tải danh sách lớp mở');

      const rows = res.data || [];
      const isNextSemester = (String(nienKhoa).trim() === String(this.nextNK).trim() && Number(hocKy) === Number(this.nextHK));

      // Ẩn/Hiện nút đăng ký dựa vào kỳ chọn có phải là kỳ tiếp theo không
      if (this.btnRegisterSelected) {
        this.btnRegisterSelected.style.display = isNextSemester ? 'block' : 'none';
      }

      if (rows.length === 0) {
        this.tbodyAvailable.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--text-muted); padding: 20px;">Không có lớp tín chỉ nào mở cho kỳ này</td></tr>';
        return;
      }

      this.tbodyAvailable.innerHTML = '';
      for (const item of rows) {
        const tr = document.createElement('tr');
        const malTC = item.MALTC;
        
        let regCount = '-';
        try {
          const r = await API.get(`/dangky/loptinchi/${malTC}`);
          regCount = r.success ? (r.data || []).length : '-';
        } catch (e) { regCount = '-'; }

        // Cột chọn: nếu đã đăng ký thì hiện Đã đăng ký, nếu là kỳ sau thì cho checkbox, kỳ khác thì chỉ cho xem
        const isAlreadyRegistered = this.registeredLtcIds && this.registeredLtcIds.has(Number(malTC));
        
        let actionCol = "";
        if (isAlreadyRegistered) {
          actionCol = `<td style="text-align:center;"><span class="badge-registered-ltc">Đã đăng ký</span></td>`;
        } else if (isNextSemester) {
          actionCol = `<td style="text-align:center;"><input type="checkbox" class="custom-checkbox available-checkbox" data-maltc="${malTC}"></td>`;
        } else {
          actionCol = `<td style="text-align:center;"><span class="badge-viewonly-ltc">Chỉ xem</span></td>`;
        }

        tr.innerHTML = `
          ${actionCol}
          <td>${malTC}</td>
          <td style="font-weight: 600;">${item.TENMH || item.MAMH}</td>
          <td style="text-align:center;">${item.NHOM}</td>
          <td>${item.TENGV || item.MAGV}</td>
          <td style="text-align:center; font-weight: 700; color: var(--primary-color);">${regCount}</td>
          <td style="text-align:center;">${item.SOSVTOITHIEU || ''}</td>
        `;
        this.tbodyAvailable.appendChild(tr);
      }

      if (isNextSemester) {
        const checkboxes = this.tbodyAvailable.querySelectorAll('.available-checkbox');
        const updateButtonState = () => {
          const checked = this.tbodyAvailable.querySelectorAll('.available-checkbox:checked').length > 0;
          const user = Auth.getUser();
          this.btnRegisterSelected.disabled = !checked || !(user && user.role === 'SINHVIEN');
        };
        checkboxes.forEach(cb => cb.addEventListener('change', updateButtonState));
        updateButtonState();
      }

    } catch (error) {
      this.tbodyAvailable.innerHTML = `<tr><td colspan="7" style="text-align:center;color:red;">Lỗi: ${error.message}</td></tr>`;
      Toast.error(error.message);
    }
  },

  async loadRegisteredClasses(nienKhoa, hocKy) {
    try {
      this.tbodyRegistered.innerHTML = '<tr><td colspan="6" style="text-align:center;">Đang tải...</td></tr>';
      
      const user = Auth.getUser();
      if (!user || user.role !== 'SINHVIEN') {
        this.registeredLtcIds = new Set();
        this.tbodyRegistered.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 20px;">Đăng nhập bằng tài khoản Sinh viên để xem môn học đã đăng ký</td></tr>';
        return;
      }

      const res = await API.get(`/dangky/sinhvien/${user.username}`);
      if (!res.success) throw new Error(res.message || 'Lỗi tải danh sách lớp đã đăng ký');

      const registered = (res.data || []).filter(r => 
        String(r.NIENKHOA).trim() === String(nienKhoa).trim() && 
        Number(r.HOCKY) === Number(hocKy)
      );

      this.registeredLtcIds = new Set(registered.map(r => Number(r.MALTC)));

      const isNextSemester = (String(nienKhoa).trim() === String(this.nextNK).trim() && Number(hocKy) === Number(this.nextHK));

      if (registered.length === 0) {
        this.tbodyRegistered.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 20px;">Chưa đăng ký môn học nào trong học kỳ này</td></tr>';
        return;
      }

      this.tbodyRegistered.innerHTML = '';
      registered.forEach((item) => {
        const tr = document.createElement('tr');
        
        // Hủy đăng ký: chỉ cho phép ở học kỳ tiếp theo
        const actionCol = isNextSemester
          ? `<td style="text-align:center;"><button class="btn-cancel-ltc" onclick="window.DangKyModule.handleCancelRegistration(${item.MALTC})">Hủy</button></td>`
          : `<td style="text-align:center; color: var(--text-muted); font-size: 12px; font-weight: 500;">Không thể hủy</td>`;

        tr.innerHTML = `
          ${actionCol}
          <td>${item.MALTC}</td>
          <td style="font-weight: 600;">${item.TENMH || item.MAMH}</td>
          <td style="text-align:center;">${item.NHOM}</td>
          <td>${item.TENGV || item.MAGV}</td>
          <td style="text-align:center;"><span class="badge-registered-ltc">Đã đăng ký</span></td>
        `;
        this.tbodyRegistered.appendChild(tr);
      });

    } catch (error) {
      this.tbodyRegistered.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;">Lỗi: ${error.message}</td></tr>`;
    }
  },

  async handleCancelRegistration(maLTC) {
    const user = Auth.getUser();
    if (!user) return;

    if (!confirm(`Bạn có chắc chắn muốn hủy đăng ký lớp tín chỉ ${maLTC}?`)) {
      return;
    }

    try {
      const res = await API.put('/dangky/cancel', { maLTC, maSV: user.username });
      if (res.success) {
        Toast.success('Hủy đăng ký thành công');
        await this.loadData();
      } else {
        throw new Error(res.message || 'Lỗi khi hủy đăng ký');
      }
    } catch (error) {
      Toast.error(error.message);
    }
  },

  async registerSelected() {
    try {
      const user = Auth.getUser();
      if (!user || user.role !== 'SINHVIEN') {
        Toast.error('Chức năng chỉ dành cho Sinh viên');
        return;
      }

      const checkedBoxes = Array.from(this.tbodyAvailable.querySelectorAll('.available-checkbox:checked'));
      if (checkedBoxes.length === 0) {
        Toast.info('Vui lòng chọn ít nhất một lớp để đăng ký');
        return;
      }

      this.btnRegisterSelected.disabled = true;
      this.btnRegisterSelected.textContent = 'Đang đăng ký...';

      const results = { success: [], failed: [] };
      for (const cb of checkedBoxes) {
        const malTC = cb.dataset.maltc;
        try {
          const res = await API.post('/dangky/create', { MALTC: parseInt(malTC), MASV: user.username });
          if (res.success) {
            results.success.push(malTC);
          } else {
            results.failed.push({ malTC, message: res.message });
          }
        } catch (err) {
          results.failed.push({ malTC, message: err.message });
        }
      }

      if (results.success.length) {
        Toast.success(`Đăng ký thành công lớp: ${results.success.join(', ')}`);
      }
      if (results.failed.length) {
        Toast.error(`Một số đăng ký thất bại:\n${results.failed.map(f => `Lớp ${f.malTC}: ${f.message}`).join('\n')}`);
      }

      await this.loadData();
    } catch (error) {
      Toast.error(error.message || 'Lỗi khi đăng ký');
    } finally {
      this.btnRegisterSelected.textContent = 'Đăng ký môn đã chọn';
      const checked = this.tbodyAvailable.querySelectorAll('.available-checkbox:checked').length > 0;
      const user = Auth.getUser();
      this.btnRegisterSelected.disabled = !checked || !(user && user.role === 'SINHVIEN');
    }
  }
};

window.DangKyModule.init();
