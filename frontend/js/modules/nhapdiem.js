/* ====================================
   MODULE NHẬP ĐIỂM
   File: js/modules/nhapdiem.js
==================================== */

window. = {
  state: {
    currentLTC: null,
    danhSachDiem: [],     // Dữ liệu gốc từ server
    editedDiem: {},       // Dữ liệu đã thay đổi (chưa lưu) { MASV: { DIEM_CC, DIEM_GK, DIEM_CK } }
    hasUnsavedChanges: false
  },

  async init() {
    this.cacheDOM();
    this.bindEvents();
    await this.loadLopTinChi();
  },

  cacheDOM() {
    this.selectLTC = document.getElementById('selectLopTinChi');
    this.btnLoad = document.getElementById('btnLoadDanhSach');
    this.btnSave = document.getElementById('btnSaveAllDiem');
    this.btnRefresh = document.getElementById('btnRefreshDiem');
    this.tbody = document.getElementById('tbodyDiem');
    this.card = document.getElementById('bangDiemCard');
    this.warning = document.getElementById('unsavedWarning');
  },

  bindEvents() {
    this.btnLoad.addEventListener('click', () => this.loadDanhSachSinhVien());
    this.btnRefresh.addEventListener('click', () => this.loadDanhSachSinhVien());
    this.btnSave.addEventListener('click', () => this.saveAll());

    // Cảnh báo khi người dùng rời trang mà chưa lưu
    window.addEventListener('beforeunload', (e) => {
      if (this.state.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    // Lắng nghe event khi chuyển trang qua sidebar.js
    document.addEventListener('pageLoaded', (e) => {
      if (e.detail.pageId !== 'nhapdiem' && this.state.hasUnsavedChanges) {
        if (!confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời đi?')) {
          // Logic để cancel routing trong một SPA xịn sẽ phức tạp hơn,
          // Ở đây ta chỉ cảnh báo đơn giản.
        }
      }
    });
  },

  async loadLopTinChi() {
    try {
      // Mock API call - Thực tế sẽ gọi API.get('/loptinchi')
      // const res = await API.get('/loptinchi');
      const mockData = [
        { MALTC: 1, MAMH: 'INT1306', TENMH: 'Cơ sở dữ liệu', NHOM: 1, HOCKY: 1, NIENKHOA: '2023-2024' },
        { MALTC: 2, MAMH: 'INT1408', TENMH: 'Lập trình Web', NHOM: 2, HOCKY: 1, NIENKHOA: '2023-2024' }
      ];

      this.selectLTC.innerHTML = '<option value="">-- Chọn một lớp tín chỉ --</option>';
      mockData.forEach(ltc => {
        this.selectLTC.innerHTML += `<option value="${ltc.MALTC}">[${ltc.MALTC}] ${ltc.MAMH} - Nhóm ${ltc.NHOM} (HK${ltc.HOCKY} ${ltc.NIENKHOA})</option>`;
      });
    } catch (error) {
      Toast.error('Không thể tải danh sách lớp tín chỉ');
    }
  },

  async loadDanhSachSinhVien() {
    const maLTC = this.selectLTC.value;
    if (!maLTC) {
      Toast.warning('Vui lòng chọn lớp tín chỉ');
      return;
    }

    if (this.state.hasUnsavedChanges) {
      if (!confirm('Bạn có thay đổi chưa lưu. Làm mới sẽ mất dữ liệu chưa lưu. Tiếp tục?')) {
        return;
      }
    }

    try {
      this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Đang tải...</td></tr>';
      this.card.style.display = 'block';

      // Mock API call - Thực tế gọi API.get(`/diem/loptinchi/${maLTC}`)
      // const res = await API.get(`/diem/loptinchi/${maLTC}`);
      const mockDiem = [
        { MASV: 'N20DCCN001', HOTEN: 'Nguyễn Văn A', DIEM_CC: 8.5, DIEM_GK: 7.0, DIEM_CK: 8.0 },
        { MASV: 'N20DCCN002', HOTEN: 'Trần Thị B', DIEM_CC: null, DIEM_GK: null, DIEM_CK: null }
      ];

      this.state.currentLTC = maLTC;
      this.state.danhSachDiem = mockDiem;
      this.state.editedDiem = {};
      this.updateUnsavedState(false);
      this.renderTable();
      
    } catch (error) {
      this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;">Lỗi tải dữ liệu</td></tr>';
      Toast.error(error.message);
    }
  },

  renderTable() {
    this.tbody.innerHTML = '';
    
    if (this.state.danhSachDiem.length === 0) {
      this.tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Chưa có sinh viên đăng ký lớp này</td></tr>';
      return;
    }

    this.state.danhSachDiem.forEach((sv, index) => {
      // Lấy dữ liệu đã edit nếu có, nếu không dùng dữ liệu gốc
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

    // Lắng nghe sự kiện thay đổi điểm
    const inputs = this.tbody.querySelectorAll('.inline-input');
    inputs.forEach(input => {
      input.addEventListener('change', (e) => this.handleDiemChange(e.target));
      input.addEventListener('keyup', (e) => this.handleDiemChange(e.target)); // Update real-time for calculation
    });
  },

  handleDiemChange(input) {
    const maSV = input.dataset.sv;
    const field = input.dataset.field;
    let val = input.value.trim();

    // Validate 0-10
    if (val !== '') {
      const num = parseFloat(val);
      if (isNaN(num) || num < 0 || num > 10) {
        input.classList.add('is-invalid');
        return;
      }
    }
    
    input.classList.remove('is-invalid');

    // Lưu vào edited state
    if (!this.state.editedDiem[maSV]) {
      this.state.editedDiem[maSV] = {};
    }
    
    this.state.editedDiem[maSV][field] = val === '' ? null : parseFloat(val);
    this.updateUnsavedState(true);

    // Tính lại điểm TK ngay lập tức trên UI
    const row = input.closest('tr');
    const cc = row.querySelector('[data-field="DIEM_CC"]').value;
    const gk = row.querySelector('[data-field="DIEM_GK"]').value;
    const ck = row.querySelector('[data-field="DIEM_CK"]').value;
    
    const diemTK = Utils.calcDiemTongKet(cc, gk, ck);
    document.getElementById(`tk_${maSV}`).textContent = diemTK !== '' ? diemTK : '-';
  },

  updateUnsavedState(isUnsaved) {
    this.state.hasUnsavedChanges = isUnsaved;
    if (isUnsaved) {
      this.warning.innerHTML = '⚠️ Có thay đổi chưa lưu';
      this.warning.style.color = 'var(--warning-color)';
    } else {
      this.warning.innerHTML = '';
    }
  },

  async saveAll() {
    if (!this.state.hasUnsavedChanges) {
      Toast.info('Không có thay đổi nào để lưu');
      return;
    }

    // Lọc ra các điểm bị lỗi validation
    const invalidInputs = this.tbody.querySelectorAll('.is-invalid');
    if (invalidInputs.length > 0) {
      Toast.error('Vui lòng sửa các ô điểm không hợp lệ (0-10) trước khi lưu');
      return;
    }

    try {
      this.btnSave.disabled = true;
      this.btnSave.innerHTML = 'Đang lưu...';

      // Chuyển format để gửi lên API
      const diemList = Object.keys(this.state.editedDiem).map(maSV => {
        return {
          MASV: maSV,
          ...this.state.editedDiem[maSV]
        };
      });

      // API Call
      // await API.put('/diem/update-batch', { maLTC: this.state.currentLTC, diemList });

      // Giả lập delay
      await new Promise(r => setTimeout(r, 1000));

      Toast.success('Đã lưu bảng điểm thành công');
      this.updateUnsavedState(false);
      
      // Merge dữ liệu đã sửa vào dữ liệu gốc
      this.state.danhSachDiem = this.state.danhSachDiem.map(sv => {
        if (this.state.editedDiem[sv.MASV]) {
          return { ...sv, ...this.state.editedDiem[sv.MASV] };
        }
        return sv;
      });
      
      this.state.editedDiem = {};

    } catch (error) {
      Toast.error(error.message || 'Lỗi khi lưu bảng điểm');
    } finally {
      this.btnSave.disabled = false;
      this.btnSave.innerHTML = '💾 Lưu tất cả thay đổi';
    }
  }
};

// Khởi tạo module
window..init();
