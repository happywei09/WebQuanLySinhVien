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
    await this.loadLopTinChi();
    this.toggleDependentControls();
  },

  cacheDOM() {
    this.inputNienKhoa = document.getElementById('inputNienKhoa');
    this.selectHocKy = document.getElementById('selectHocKy');
    this.selectMonHoc = document.getElementById('selectMonHoc');
    this.selectNhom = document.getElementById('selectNhom');
    this.btnStart = document.getElementById('btnStartDiem');
    this.btnLoad = document.getElementById('btnStartDiem');
    this.btnSave = document.getElementById('btnSaveAllDiem');
    this.btnRefresh = document.getElementById('btnRefreshDiem');
    this.btnReset = document.getElementById('btnResetFilter');
    this.tbody = document.getElementById('tbodyDiem');
    this.card = document.getElementById('bangDiemCard');
    this.warning = document.getElementById('unsavedWarning');
    this.summary = document.getElementById('selectionSummary');
  },

  bindEvents() {
    this.selectHocKy.addEventListener('change', () => {
      this.state.selectedHocKy = this.selectHocKy.value;
      this.toggleDependentControls();
      this.renderMonHocOptions();
    });

    this.inputNienKhoa.addEventListener('input', () => {
      this.state.selectedNienKhoa = this.inputNienKhoa.value.trim();
      this.toggleDependentControls();
      this.renderMonHocOptions();
    });

    this.selectMonHoc.addEventListener('change', () => {
      this.state.selectedMonHoc = this.selectMonHoc.value;
      this.renderNhomOptions();
    });

    this.selectNhom.addEventListener('change', () => {
      this.state.selectedNhom = this.selectNhom.value;
      this.updateSelectionSummary();
      this.toggleDependentControls();
    });

    this.btnStart.addEventListener('click', () => this.loadDanhSachSinhVien());
    this.btnRefresh.addEventListener('click', () => this.loadDanhSachSinhVien());
    this.btnSave.addEventListener('click', () => this.saveAll());
    this.btnReset.addEventListener('click', () => this.resetFilters());

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
        this.renderMonHocOptions();
      }
    } catch (error) {
      Toast.error('Không thể tải danh sách lớp tín chỉ');
    }
  },

  toggleDependentControls() {
    const hasNienKhoa = !!this.inputNienKhoa.value.trim();
    const hasHocKy = !!this.selectHocKy.value;
    this.selectMonHoc.disabled = !(hasNienKhoa && hasHocKy);
    this.selectNhom.disabled = !this.selectMonHoc.value;
    this.btnStart.disabled = !(hasNienKhoa && hasHocKy && this.selectMonHoc.value && this.selectNhom.value);
    this.btnRefresh.disabled = !this.state.currentLTC;
    this.btnSave.disabled = !this.state.hasUnsavedChanges;
  },

  normalizeText(value) {
    return String(value || '').trim().toLowerCase();
  },

  renderMonHocOptions() {
    const nienKhoa = this.normalizeText(this.inputNienKhoa.value);
    const hocKy = this.selectHocKy.value;

    this.selectMonHoc.innerHTML = '<option value="">-- Chọn môn học --</option>';
    this.selectNhom.innerHTML = '<option value="">-- Chọn nhóm --</option>';
    this.selectNhom.disabled = true;
    this.state.selectedMonHoc = '';
    this.state.selectedNhom = '';

    if (!nienKhoa || !hocKy) {
      this.toggleDependentControls();
      return;
    }

    const uniqueSubjects = new Map();
    this.state.lopTinChiList
      .filter(item => this.normalizeText(item.NIENKHOA) === nienKhoa && String(item.HOCKY) === String(hocKy) && !item.HUYLOP)
      .forEach(item => {
        if (!uniqueSubjects.has(item.MAMH)) {
          uniqueSubjects.set(item.MAMH, item.TENMH || item.MAMH);
        }
      });

    uniqueSubjects.forEach((tenMH, mamh) => {
      this.selectMonHoc.innerHTML += `<option value="${mamh}">${tenMH}</option>`;
    });

    this.toggleDependentControls();
  },

  renderNhomOptions() {
    const nienKhoa = this.normalizeText(this.inputNienKhoa.value);
    const hocKy = this.selectHocKy.value;
    const mamh = this.selectMonHoc.value;

    this.selectNhom.innerHTML = '<option value="">-- Chọn nhóm --</option>';
    this.state.selectedNhom = '';

    if (!nienKhoa || !hocKy || !mamh) {
      this.toggleDependentControls();
      return;
    }

    const groups = this.state.lopTinChiList
      .filter(item => this.normalizeText(item.NIENKHOA) === nienKhoa && String(item.HOCKY) === String(hocKy) && item.MAMH === mamh && !item.HUYLOP)
      .sort((a, b) => Number(a.NHOM) - Number(b.NHOM));

    groups.forEach(item => {
      this.selectNhom.innerHTML += `<option value="${item.NHOM}">Nhóm ${item.NHOM}</option>`;
    });

    this.toggleDependentControls();
  },

  getSelectedLopTinChi() {
    const nienKhoa = this.normalizeText(this.inputNienKhoa.value);
    const hocKy = this.selectHocKy.value;
    const mamh = this.selectMonHoc.value;
    const nhom = this.selectNhom.value;

    if (!nienKhoa || !hocKy || !mamh || !nhom) return null;

    return this.state.lopTinChiList.find(item =>
      this.normalizeText(item.NIENKHOA) === nienKhoa &&
      String(item.HOCKY) === String(hocKy) &&
      item.MAMH === mamh &&
      String(item.NHOM) === String(nhom) &&
      !item.HUYLOP
    ) || null;
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

    this.inputNienKhoa.value = '';
    this.selectHocKy.value = '';
    this.selectMonHoc.innerHTML = '<option value="">-- Chọn môn học --</option>';
    this.selectNhom.innerHTML = '<option value="">-- Chọn nhóm --</option>';
    this.selectMonHoc.disabled = true;
    this.selectNhom.disabled = true;
    this.state.selectedNienKhoa = '';
    this.state.selectedHocKy = '';
    this.state.selectedMonHoc = '';
    this.state.selectedNhom = '';
    this.state.currentLTC = null;
    this.state.danhSachDiem = [];
    this.state.editedDiem = {};
    this.updateUnsavedState(false);
    this.card.style.display = 'none';
    this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">Chọn thông tin và bấm Bắt đầu để tải danh sách sinh viên</td></tr>';
    this.summary.textContent = '';
    this.toggleDependentControls();
  },

  async loadDanhSachSinhVien() {
    const ltc = this.getSelectedLopTinChi();
    if (!ltc) {
      this.card.style.display = 'block';
      this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color: var(--text-muted);">Vui lòng chọn đủ Niên khóa, Học kỳ, Môn học và Nhóm</td></tr>';
      Toast.warning('Vui lòng chọn đủ Niên khóa, Học kỳ, Môn học và Nhóm');
      return;
    }

    if (this.state.hasUnsavedChanges) {
      if (!confirm('Bạn có thay đổi chưa lưu. Làm mới sẽ mất dữ liệu chưa lưu. Tiếp tục?')) {
        return;
      }
    }

    try {
      this.card.style.display = 'block';
      this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Đang tải...</td></tr>';

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

  renderTable() {
    this.tbody.innerHTML = '';

    if (this.state.danhSachDiem.length === 0) {
      this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Chưa có sinh viên đăng ký lớp này. Vẫn có thể nhập điểm khi lớp có sinh viên đăng ký.</td></tr>';
      return;
    }

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
          <input type="number" step="0.1" min="0" max="10" class="inline-input" data-sv="${sv.MASV}" data-field="DIEM_CC" value="${cc}">
        </td>
        <td style="text-align: center;">
          <input type="number" step="0.1" min="0" max="10" class="inline-input" data-sv="${sv.MASV}" data-field="DIEM_GK" value="${gk}">
        </td>
        <td style="text-align: center;">
          <input type="number" step="0.1" min="0" max="10" class="inline-input" data-sv="${sv.MASV}" data-field="DIEM_CK" value="${ck}">
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
      this.warning.textContent = '';
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
