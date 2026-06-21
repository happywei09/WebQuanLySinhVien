/* ====================================
   MODULE NHẬP ĐIỂM
   File: js/modules/nhapdiem.js
==================================== */

window.NhapDiemModule = {
  state: {
    currentLTC: null,
    danhSachDiem: [],
    editedDiem: {},
    hasUnsavedChanges: false,
    selectedNienKhoa: "",
    selectedHocKy: "",
    selectedMonHoc: "",
    selectedNhom: "",
    lopTinChiList: [],
  },

  async init() {
    this.cacheDOM();
    this.bindEvents();

    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    let currentNK = "";
    let currentHK = "";

    if (month >= 8 && month <= 12) {
      currentNK = `${year}-${year + 1}`;
      currentHK = "1";
    } else if (month >= 1 && month <= 6) {
      currentNK = `${year - 1}-${year}`;
      currentHK = "2";
    } else if (month === 7) {
      currentNK = `${year - 1}-${year}`;
      currentHK = "3";
    }

    if (this.inputNienKhoa) {
      this.inputNienKhoa.value = currentNK;
      this.state.selectedNienKhoa = currentNK;
    }
    if (this.selectHocKy) {
      this.selectHocKy.value = currentHK;
      this.state.selectedHocKy = currentHK;
    }

    await this.loadLopTinChi();
    this.loadDanhSachLopTinChi();
    this.toggleDependentControls();
  },

  cacheDOM() {
    this.inputNienKhoa = document.getElementById('inputNienKhoa');
    this.selectHocKy = document.getElementById('selectHocKy');
    this.selectMonHoc = document.getElementById('selectMonHoc');
    this.selectNhom = document.getElementById('selectNhom');
    this.btnSave = document.getElementById('btnSaveAllDiem');
    this.btnRefresh = document.getElementById('btnRefreshGradeSheet');
    this.btnReset = document.getElementById('btnResetFilter');
    this.tbody = document.getElementById('tbodyDiem');
    this.card = document.getElementById('bangDiemCard');
    this.warning = document.getElementById('unsavedWarning');
    this.summary = document.getElementById('selectionSummary');

    this.btnBackToLopList = document.getElementById('btnBackToLopList');
    this.danhSachLopCard = document.getElementById('danhSachLopCard');
    this.tbodyLopTinChi = document.getElementById('tbodyLopTinChi');
  },

  bindEvents() {
    this.selectHocKy.addEventListener('change', () => {
      this.state.selectedHocKy = this.selectHocKy.value;
      this.toggleDependentControls();
      this.renderMonHocOptions();
      this.loadDanhSachLopTinChi();
    });

    this.inputNienKhoa.addEventListener('change', () => {
      this.state.selectedNienKhoa = this.inputNienKhoa.value;
      this.toggleDependentControls();
      this.renderMonHocOptions();
      this.loadDanhSachLopTinChi();
    });

    this.selectMonHoc.addEventListener('change', () => {
      this.state.selectedMonHoc = this.selectMonHoc.value;
      this.renderNhomOptions();
      this.loadDanhSachLopTinChi();
    });

    this.selectNhom.addEventListener('change', () => {
      this.state.selectedNhom = this.selectNhom.value;
      this.toggleDependentControls();
      this.loadDanhSachLopTinChi();
    });

    this.btnRefresh.addEventListener('click', () => this.state.currentLTC && this.selectLopForDiem(this.state.currentLTC));
    this.btnSave.addEventListener('click', () => this.saveAll());
    this.btnReset.addEventListener('click', () => this.resetFilters());
    if (this.btnBackToLopList) {
      this.btnBackToLopList.addEventListener('click', () => this.showLopList());
    }

    window.addEventListener('beforeunload', (e) => {
      if (this.state.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    document.addEventListener('pageLoaded', (e) => {
      if (e.detail.pageId !== 'nhapdiem' && this.state.hasUnsavedChanges) {
        if (!confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời đi?')) {
          // Chỉ cảnh báo, không chặn điều hướng SPA ở bản hiện tại.
        }
      }
    });
  },

  async loadLopTinChi() {
    try {
      const res = await API.get('/loptinchi');
      if (res.success) {
        this.state.lopTinChiList = res.data || [];
        this.renderNienKhoaOptions();
        this.renderMonHocOptions();
      }
    } catch (error) {
      Toast.error('Không thể tải danh sách lớp tín chỉ');
    }
  },

  toggleDependentControls() {
    this.selectMonHoc.disabled = false;
    this.selectNhom.disabled = false;
    this.btnRefresh.disabled = !this.state.currentLTC;
    this.btnSave.disabled = !this.state.hasUnsavedChanges;
  },

  normalizeText(value) {
    return String(value || '').trim().toLowerCase();
  },

  renderNienKhoaOptions() {
    const uniqueNK = [...new Set(this.state.lopTinChiList.map(item => item.NIENKHOA))]
      .filter(Boolean)
      .sort((a, b) => {
        const yA = parseInt(a.split('-')[0]);
        const yB = parseInt(b.split('-')[0]);
        return yA - yB;
      });

    this.inputNienKhoa.innerHTML = '<option value="">Tất cả Niên khóa</option>' +
      uniqueNK.map(nk => `<option value="${nk}">${nk}</option>`).join('');

    const targetVal = this.state.selectedNienKhoa;
    if (targetVal && uniqueNK.includes(targetVal)) {
      this.inputNienKhoa.value = targetVal;
    } else {
      this.state.selectedNienKhoa = this.inputNienKhoa.value;
    }
  },

  renderMonHocOptions() {
    const nienKhoa = this.normalizeText(this.inputNienKhoa.value);
    const hocKy = this.selectHocKy.value;

    this.selectMonHoc.innerHTML = '<option value="">Tất cả Môn học</option>';
    const prevSubject = this.selectMonHoc.value;

    const uniqueSubjects = new Map();
    let filtered = this.state.lopTinChiList;
    if (nienKhoa) {
      filtered = filtered.filter(item => this.normalizeText(item.NIENKHOA) === nienKhoa);
    }
    if (hocKy) {
      filtered = filtered.filter(item => String(item.HOCKY) === String(hocKy));
    }

    filtered.filter(item => !item.HUYLOP).forEach(item => {
      if (!uniqueSubjects.has(item.MAMH)) {
        uniqueSubjects.set(item.MAMH, item.TENMH || item.MAMH);
      }
    });

    uniqueSubjects.forEach((tenMH, mamh) => {
      this.selectMonHoc.innerHTML += `<option value="${mamh}">${tenMH}</option>`;
    });

    if (prevSubject && uniqueSubjects.has(prevSubject)) {
      this.selectMonHoc.value = prevSubject;
      this.state.selectedMonHoc = prevSubject;
    } else {
      this.state.selectedMonHoc = this.selectMonHoc.value;
    }

    this.renderNhomOptions();
    this.toggleDependentControls();
  },

  renderNhomOptions() {
    const nienKhoa = this.normalizeText(this.inputNienKhoa.value);
    const hocKy = this.selectHocKy.value;
    const mamh = this.selectMonHoc.value;

    this.selectNhom.innerHTML = '<option value="">Tất cả Nhóm</option>';
    const prevNhom = this.selectNhom.value;

    let filtered = this.state.lopTinChiList;
    if (nienKhoa) {
      filtered = filtered.filter(item => this.normalizeText(item.NIENKHOA) === nienKhoa);
    }
    if (hocKy) {
      filtered = filtered.filter(item => String(item.HOCKY) === String(hocKy));
    }
    if (mamh) {
      filtered = filtered.filter(item => item.MAMH === mamh);
    }

    const uniqueGroups = [...new Set(filtered.filter(item => !item.HUYLOP).map(item => Number(item.NHOM)))]
      .sort((a, b) => a - b);

    uniqueGroups.forEach(nhom => {
      this.selectNhom.innerHTML += `<option value="${nhom}">Nhóm ${nhom}</option>`;
    });

    if (prevNhom && uniqueGroups.map(String).includes(String(prevNhom))) {
      this.selectNhom.value = prevNhom;
      this.state.selectedNhom = prevNhom;
    } else {
      this.state.selectedNhom = this.selectNhom.value;
    }

    this.toggleDependentControls();
  },

  getSelectedLopTinChi() {
    if (this.state.currentLTC) {
      return this.state.lopTinChiList.find(item => item.MALTC === this.state.currentLTC) || null;
    }
    return null;
  },

  updateSelectionSummary() {
    const ltc = this.getSelectedLopTinChi();
    if (!ltc) {
      this.summary.textContent = '';
      return;
    }
    this.summary.textContent = `Niên khóa: ${ltc.NIENKHOA} | Học kỳ: ${ltc.HOCKY} | Môn học: ${ltc.TENMH || ltc.MAMH} | Nhóm: ${ltc.NHOM}`;
  },

  resetFilters() {
    if (this.state.hasUnsavedChanges && !confirm('Bạn có thay đổi chưa lưu. Đặt lại sẽ mất dữ liệu hiện tại. Tiếp tục?')) {
      return;
    }

    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    let currentNK = "";
    let currentHK = "";

    if (month >= 8 && month <= 12) {
      currentNK = `${year}-${year + 1}`;
      currentHK = "1";
    } else if (month >= 1 && month <= 6) {
      currentNK = `${year - 1}-${year}`;
      currentHK = "2";
    } else if (month === 7) {
      currentNK = `${year - 1}-${year}`;
      currentHK = "3";
    }

    this.inputNienKhoa.value = currentNK;
    this.selectHocKy.value = currentHK;
    this.selectMonHoc.innerHTML = '<option value="">-- Chọn môn học --</option>';
    this.selectNhom.innerHTML = '<option value="">-- Chọn nhóm --</option>';
    this.selectMonHoc.disabled = true;
    this.selectNhom.disabled = true;
    this.state.selectedNienKhoa = currentNK;
    this.state.selectedHocKy = currentHK;
    this.state.selectedMonHoc = '';
    this.state.selectedNhom = '';
    this.state.currentLTC = null;
    this.state.danhSachDiem = [];
    this.state.editedDiem = {};
    this.updateUnsavedState(false);
    this.card.style.display = 'none';
    if (this.danhSachLopCard) {
      this.danhSachLopCard.style.display = 'none';
    }
    this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">Vui lòng chọn thông tin để xem lớp tín chỉ</td></tr>';
    this.summary.textContent = '';
    this.renderMonHocOptions();
    this.toggleDependentControls();
    this.loadDanhSachLopTinChi();
  },

  async loadDanhSachLopTinChi() {
    if (!this.state.lopTinChiList || this.state.lopTinChiList.length === 0) return;

    if (this.state.hasUnsavedChanges) {
      if (!confirm('Bạn có thay đổi chưa lưu. Tiếp tục sẽ mất dữ liệu chưa lưu. Tiếp tục?')) {
        return;
      }
    }

    try {
      this.card.style.display = 'none';
      this.danhSachLopCard.style.display = 'block';
      this.tbodyLopTinChi.innerHTML = '<tr><td colspan="8" style="text-align:center;">Đang tải...</td></tr>';

      const nienKhoa = this.normalizeText(this.inputNienKhoa.value);
      const hocKy = this.selectHocKy.value;
      const selectedMonHoc = this.selectMonHoc.value;
      const selectedNhom = this.selectNhom.value;

      let filteredClasses = this.state.lopTinChiList.filter(item => !item.HUYLOP);

      if (nienKhoa) {
        filteredClasses = filteredClasses.filter(item => this.normalizeText(item.NIENKHOA) === nienKhoa);
      }
      if (hocKy) {
        filteredClasses = filteredClasses.filter(item => String(item.HOCKY) === String(hocKy));
      }

      if (selectedMonHoc) {
        filteredClasses = filteredClasses.filter(item => item.MAMH === selectedMonHoc);
      }
      if (selectedNhom) {
        filteredClasses = filteredClasses.filter(item => String(item.NHOM) === String(selectedNhom));
      }

      if (filteredClasses.length === 0) {
        this.tbodyLopTinChi.innerHTML = '<tr><td colspan="8" style="text-align:center; color: var(--text-muted);">Không tìm thấy lớp tín chỉ nào</td></tr>';
        return;
      }

      this.tbodyLopTinChi.innerHTML = '';
      filteredClasses.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="text-align: center;">${index + 1}</td>
          <td style="text-align: center; font-weight: 500;">${item.MALTC}</td>
          <td style="font-weight: 600;">${item.TENMH || item.MAMH}</td>
          <td style="text-align: center;">${item.NHOM}</td>
          <td>${item.TENGV || item.MAGV}</td>
          <td style="text-align: center;">${item.SOSVMIN || item.SOSVTOITHIEU || ''}</td>
          <td style="text-align: center;">
            <span style="display: inline-flex; align-items: center; justify-content: center; background-color: rgba(16,185,129,0.12); color: var(--success-color); padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; border: 1px solid rgba(16,185,129,0.25);">Đang mở</span>
          </td>
          <td style="text-align: center;">
            <button class="btn btn-primary btn-sm" style="white-space: nowrap; padding: 6px 14px; font-size: 13px;" onclick="window.NhapDiemModule.selectLopForDiem(${item.MALTC})">Nhập điểm</button>
          </td>
        `;
        this.tbodyLopTinChi.appendChild(tr);
      });

    } catch (error) {
      this.tbodyLopTinChi.innerHTML = '<tr><td colspan="8" style="text-align:center;color:red;">Lỗi tải dữ liệu</td></tr>';
      Toast.error('Không thể tải danh sách lớp tín chỉ');
    }
  },

  async selectLopForDiem(maLTC) {
    if (this.state.hasUnsavedChanges) {
      if (!confirm('Bạn có thay đổi chưa lưu. Thay đổi lớp sẽ mất dữ liệu chưa lưu. Tiếp tục?')) {
        return;
      }
    }

    const ltc = this.state.lopTinChiList.find(item => item.MALTC === maLTC);
    if (!ltc) {
      Toast.error('Không tìm thấy lớp tín chỉ');
      return;
    }

    try {
      this.card.style.display = 'block';
      this.tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Đang tải...</td></tr>';
      this.danhSachLopCard.style.display = 'none';

      const res = await API.get(`/diem/loptinchi/${ltc.MALTC}`);
      if (!res.success) {
        throw new Error(res.message || 'Không thể tải danh sách điểm');
      }

      this.state.currentLTC = ltc.MALTC;
      this.state.danhSachDiem = (res.data || []).map(item => ({
        MASV: item.MASV,
        HOTEN: item.HOTEN || `${item.HO || ''} ${item.TEN || ''}`.trim(),
        DIEM_CC: item.DIEM_CC,
        DIEM_GK: item.DIEM_GK,
        DIEM_CK: item.DIEM_CK,
      }));
      this.state.editedDiem = {};
      this.updateUnsavedState(false);
      this.updateSelectionSummary();
      this.renderTable();
      this.card.style.display = 'block';
      this.btnRefresh.disabled = false;
    } catch (error) {
      this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;">Lỗi tải dữ liệu</td></tr>';
      Toast.error(error.message || 'Không thể tải danh sách sinh viên');
    }
  },

  showLopList() {
    if (this.state.hasUnsavedChanges && !confirm('Bạn có thay đổi chưa lưu. Quay lại sẽ mất dữ liệu chưa lưu. Tiếp tục?')) {
      return;
    }
    this.card.style.display = 'none';
    this.danhSachLopCard.style.display = 'block';
    this.state.currentLTC = null;
    this.state.danhSachDiem = [];
    this.state.editedDiem = {};
    this.updateUnsavedState(false);
    this.toggleDependentControls();
  },

  renderTable() {
    this.tbody.innerHTML = '';

    if (this.state.danhSachDiem.length === 0) {
      this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Chưa có sinh viên đăng ký lớp này. Vẫn có thể nhập điểm khi lớp có sinh viên đăng ký.</td></tr>';
      return;
    }

    const ltc = this.getSelectedLopTinChi();
    const isFuture = ltc ? Utils.isFutureSemester(ltc.NIENKHOA, ltc.HOCKY) : false;

    this.state.danhSachDiem.forEach((sv, index) => {
      const edited = this.state.editedDiem[sv.MASV] || {};
      const cc = edited.DIEM_CC !== undefined ? edited.DIEM_CC : (sv.DIEM_CC !== null ? sv.DIEM_CC : '');
      const gk = edited.DIEM_GK !== undefined ? edited.DIEM_GK : (sv.DIEM_GK !== null ? sv.DIEM_GK : '');
      const ck = edited.DIEM_CK !== undefined ? edited.DIEM_CK : (sv.DIEM_CK !== null ? sv.DIEM_CK : '');
      const diemTK = Utils.calcDiemTongKet(cc, gk, ck);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${sv.MASV}</td>
        <td>${sv.HOTEN}</td>
        <td style="text-align: center;">
          <input type="number" step="0.1" min="0" max="10" class="inline-input" data-sv="${sv.MASV}" data-field="DIEM_CC" value="${cc}" ${isFuture ? 'disabled' : ''}>
        </td>
        <td style="text-align: center;">
          <input type="number" step="0.1" min="0" max="10" class="inline-input" data-sv="${sv.MASV}" data-field="DIEM_GK" value="${gk}" ${isFuture ? 'disabled' : ''}>
        </td>
        <td style="text-align: center;">
          <input type="number" step="0.1" min="0" max="10" class="inline-input" data-sv="${sv.MASV}" data-field="DIEM_CK" value="${ck}" ${isFuture ? 'disabled' : ''}>
        </td>
        <td style="text-align: center; font-weight: bold; color: var(--primary-color);" id="tk_${sv.MASV}">
          ${diemTK !== '' ? diemTK : '-'}
        </td>
      `;
      this.tbody.appendChild(tr);
    });

    const inputs = this.tbody.querySelectorAll('.inline-input');
    inputs.forEach(input => {
      input.addEventListener('change', (e) => this.handleDiemChange(e.target));
      input.addEventListener('keyup', (e) => this.handleDiemChange(e.target));
    });

    this.toggleDependentControls();
  },

  handleDiemChange(input) {
    const maSV = input.dataset.sv;
    const field = input.dataset.field;
    const val = input.value.trim();

    if (val !== '') {
      const num = parseFloat(val);
      if (isNaN(num) || num < 0 || num > 10) {
        input.classList.add('is-invalid');
        return;
      }
    }

    input.classList.remove('is-invalid');

    if (!this.state.editedDiem[maSV]) {
      this.state.editedDiem[maSV] = {};
    }

    this.state.editedDiem[maSV][field] = val === '' ? null : parseFloat(val);
    this.updateUnsavedState(true);

    const row = input.closest('tr');
    const cc = row.querySelector('[data-field="DIEM_CC"]').value;
    const gk = row.querySelector('[data-field="DIEM_GK"]').value;
    const ck = row.querySelector('[data-field="DIEM_CK"]').value;
    const diemTK = Utils.calcDiemTongKet(cc, gk, ck);
    document.getElementById(`tk_${maSV}`).textContent = diemTK !== '' ? diemTK : '-';
  },

  updateUnsavedState(isUnsaved) {
    this.state.hasUnsavedChanges = isUnsaved;
    this.btnSave.disabled = !isUnsaved;
    if (isUnsaved) {
      this.warning.textContent = '⚠️ Có thay đổi chưa lưu';
      this.warning.style.color = 'var(--warning-color)';
    } else {
      const ltc = this.getSelectedLopTinChi();
      const isFuture = ltc ? Utils.isFutureSemester(ltc.NIENKHOA, ltc.HOCKY) : false;
      if (isFuture) {
        this.warning.textContent = '🔒 Lớp thuộc học kỳ tương lai. Chỉ xem, không thể nhập/sửa điểm.';
        this.warning.style.color = 'var(--danger-color)';
      } else {
        this.warning.textContent = '';
      }
    }
  },

  async saveAll() {
    if (!this.state.hasUnsavedChanges) {
      Toast.info('Không có thay đổi nào để lưu');
      return;
    }

    const invalidInputs = this.tbody.querySelectorAll('.is-invalid');
    if (invalidInputs.length > 0) {
      Toast.error('Vui lòng sửa các ô điểm không hợp lệ (0-10) trước khi lưu');
      return;
    }

    try {
      this.btnSave.disabled = true;
      this.btnSave.innerHTML = 'Đang lưu...';

      const diemList = Object.keys(this.state.editedDiem).map(maSV => ({
        MASV: maSV,
        ...this.state.editedDiem[maSV]
      }));

      await API.put('/diem/update-batch', { maLTC: this.state.currentLTC, diemList });

      Toast.success('Đã lưu bảng điểm thành công');
      this.updateUnsavedState(false);

      this.state.danhSachDiem = this.state.danhSachDiem.map(sv => {
        if (this.state.editedDiem[sv.MASV]) {
          return { ...sv, ...this.state.editedDiem[sv.MASV] };
        }
        return sv;
      });

      this.state.editedDiem = {};
      this.renderTable();
    } catch (error) {
      Toast.error(error.message || 'Lỗi khi lưu bảng điểm');
    } finally {
      this.btnSave.disabled = !this.state.hasUnsavedChanges;
      this.btnSave.innerHTML = '💾 Lưu tất cả thay đổi';
    }
  }
};

window.NhapDiemModule.init();
