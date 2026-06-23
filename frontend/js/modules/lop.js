window.LopModule = {
  state: {
    originalData: [],
    pendingOperations: {},
    history: [],
    lopModalMode: null,
    lopModalEditingId: null,
    detailOriginalStudents: [],
    detailPendingOperations: {},
    detailHistory: [],
    detailIsAddingRow: false,
    detailDraftStudent: {
      MASV: '',
      HO: '',
      TEN: '',
      PHAI: false,
      NGAYSINH: '',
      DIACHI: '',
      DANGHIHOC: false
    },
    detailEditingStudentId: null,
    detailEditingDraft: null,
    currentDetailLop: null,
    khoaList: [], // Cache danh sách khoa từ API
    searchKeyword: ''
  },

  async init() {
    this.cacheDOM();
    this.bindEvents();
    await this.loadKhoaList();
    await this.loadData();
  },

  debounce(func, delay = 500) {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(func, delay);
  },

  cacheDOM() {
    this.tbody = document.getElementById('tbodyLop');
    this.searchLop = document.getElementById('searchLop');
    this.btnSearchLop = document.getElementById('btnSearchLop');
    this.filterKhoaHoc = document.getElementById('filterKhoaHoc');
    this.filterKhoa = document.getElementById('filterKhoa');
    this.btnAdd = document.getElementById('btnAddLop');
    this.btnCommit = document.getElementById('btnCommitLop');
    this.btnUndo = document.getElementById('btnUndoLop');
    this.pendingStatus = document.getElementById('lopPendingStatus');
    this.lopListCount = document.getElementById('lopListCount');

    // Modal Thêm / Sửa Lớp
    this.lopModal = document.getElementById('lopModal');
    this.lopModalTitle = document.getElementById('lopModalTitle');
    this.lopFormMaLop = document.getElementById('lopFormMaLop');
    this.lopFormTenLop = document.getElementById('lopFormTenLop');
    this.lopFormKhoaHoc = document.getElementById('lopFormKhoaHoc');
    this.lopFormSelectKhoa = document.getElementById('lopFormSelectKhoa');
    this.lopFormMaKhoa = document.getElementById('lopFormMaKhoa');
    this.btnSaveLopModal = document.getElementById('btnSaveLopModal');
    this.btnCloseLopModal = document.getElementById('btnCloseLopModal');
    this.btnCancelLopModal = document.getElementById('btnCancelLopModal');

    this.detailSection = document.getElementById('lopDetailSection');
    this.studentModal = document.getElementById('studentModal');
    this.studentModalTitle = document.getElementById('studentModalTitle');
    this.studentFormMasv = document.getElementById('studentFormMasv');
    this.studentFormHo = document.getElementById('studentFormHo');
    this.studentFormTen = document.getElementById('studentFormTen');
    this.studentFormPhai = document.getElementById('studentFormPhai');
    this.studentFormNgaySinh = document.getElementById('studentFormNgaySinh');
    this.studentFormDiaChi = document.getElementById('studentFormDiaChi');
    this.studentFormDangNghiHoc = document.getElementById('studentFormDangNghiHoc');
    this.btnSaveStudentModal = document.getElementById('btnSaveStudentModal');
    this.btnCloseStudentModal = document.getElementById('btnCloseStudentModal');
    this.btnCancelStudentModal = document.getElementById('btnCancelStudentModal');
    this.detailMaLop = document.getElementById('detailMaLop');
    this.detailTenLop = document.getElementById('detailTenLop');
    this.detailKhoaHoc = document.getElementById('detailKhoaHoc');
    this.detailMaKhoa = document.getElementById('detailMaKhoa');
    this.detailTbody = document.getElementById('tbodyLopDetail');
    this.btnAddStudentInClass = document.getElementById('btnAddStudentInClass');
    this.btnUndoStudentInClass = document.getElementById('btnUndoStudentInClass');
    this.btnCommitStudentInClass = document.getElementById('btnCommitStudentInClass');
    this.studentInClassPendingStatus = document.getElementById('studentInClassPendingStatus');
    this.searchStudentInClass = document.getElementById('searchStudentInClass');
  },

  bindEvents() {
    const user = Auth.getUser();
    const isPGV = user && user.role === 'PGV';

    if (this.btnAdd) {
      if (isPGV) {
        this.btnAdd.onclick = () => this.openLopModal('create');
      } else {
        this.btnAdd.style.display = 'none';
      }
    }

    // Bind modal Thêm/Sửa Lớp events
    if (this.btnSaveLopModal) this.btnSaveLopModal.onclick = () => this.saveLopModal();
    if (this.btnCloseLopModal) this.btnCloseLopModal.onclick = () => this.closeLopModal();
    if (this.btnCancelLopModal) this.btnCancelLopModal.onclick = () => this.closeLopModal();

    if (this.lopFormKhoaHoc) {
      this.lopFormKhoaHoc.onchange = () => {
        this.updateMaLopPrefix();
        this.updateTenLopPreview();
      };
    }
    if (this.lopFormTenLop) {
      this.lopFormTenLop.oninput = () => {
        this.updateTenLopPreview();
      };
    }
    if (this.lopFormSelectKhoa) {
      this.lopFormSelectKhoa.onchange = () => {
        if (this.lopFormMaKhoa) {
          this.lopFormMaKhoa.value = this.lopFormSelectKhoa.value;
        }
      };
    }

    this.btnCommit.onclick = () => this.handleCommit();
    this.btnUndo.onclick = () => this.handleUndo();
    if (this.btnAddStudentInClass) {
      if (isPGV) {
        this.btnAddStudentInClass.onclick = () => this.openStudentModal('create');
        this.btnUndoStudentInClass.style.display = 'inline-block';
        this.btnCommitStudentInClass.style.display = 'inline-block';
        this.btnAddStudentInClass.style.display = 'inline-block';
      } else {
        this.btnUndoStudentInClass.style.display = 'none';
        this.btnCommitStudentInClass.style.display = 'none';
        this.btnAddStudentInClass.style.display = 'none';
      }
    }
    if (this.btnUndoStudentInClass && isPGV) this.btnUndoStudentInClass.onclick = () => this.handleUndoDetailStudent();
    if (this.btnCommitStudentInClass && isPGV) this.btnCommitStudentInClass.onclick = () => this.handleCommitDetailStudents();
    if (this.btnSaveStudentModal) this.btnSaveStudentModal.onclick = () => this.saveStudentModal();
    if (this.btnCloseStudentModal) this.btnCloseStudentModal.onclick = () => this.closeStudentModal();
    if (this.btnCancelStudentModal) this.btnCancelStudentModal.onclick = () => this.closeStudentModal();

    if (this.btnSearchLop) {
      this.btnSearchLop.onclick = () => {
        const keyword = this.searchLop ? this.searchLop.value.trim() : '';
        this.loadData(keyword);
      };
    }
    if (this.searchLop) {
      this.searchLop.addEventListener('input', () => {
        this.debounce(() => {
          const keyword = this.searchLop.value.trim();
          this.loadData(keyword);
        });
      });
    }
    if (this.searchStudentInClass) {
      this.searchStudentInClass.addEventListener('input', () => this.renderDetailStudentTable());
    }
    if (this.filterKhoaHoc) {
      this.filterKhoaHoc.addEventListener('change', () => this.renderTable());
    }
    if (this.filterKhoa) {
      this.filterKhoa.addEventListener('change', () => this.renderTable());
    }
  },

  async loadData(keyword = '') {
    if (this.hasPendingChanges() && keyword === this.state.searchKeyword) {
      this.renderTable();
      this.updateActionState();
      return;
    }

    try {
      this.tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Đang tải...</td></tr>';
      if (this.hasPendingChanges()) {
        const ok = confirm('Bạn đang có thay đổi chưa ghi. Tải lại dữ liệu sẽ bỏ các thay đổi này. Tiếp tục?');
        if (!ok) return;
      }

      this.state.searchKeyword = keyword;
      const endpoint = keyword ? `/lop/search?keyword=${encodeURIComponent(keyword)}` : '/lop';
      const res = await API.get(endpoint);
      if (res.success) {
        this.state.originalData = res.data || [];
        this.state.pendingOperations = {};
        this.state.history = [];
        this.initFilterOptions();
        this.populateLopFormKhoaHocSelect();
        this.renderTable();
      }
    } catch (error) {
      this.tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Lỗi tải dữ liệu lớp học</td></tr>';
      Toast.error(error.message);
    } finally {
      this.updateActionState();
    }
  },

  async loadKhoaList() {
    try {
      const res = await API.get('/khoa');
      if (res.success) {
        this.state.khoaList = res.data || [];
      }
    } catch (error) {
      console.error('Lỗi tải danh sách khoa:', error);
    }
  },

  initFilterOptions() {
    const data = this.getCurrentData();

    if (this.filterKhoaHoc) {
      const current = this.filterKhoaHoc.value || 'ALL';
      this.filterKhoaHoc.innerHTML = '<option value="ALL">Tất cả Khóa học</option>';
      const distinctKhoaHoc = [...new Set(data.map(item => item.KHOAHOC).filter(Boolean))].sort();
      distinctKhoaHoc.forEach(kh => {
        const opt = document.createElement('option');
        opt.value = kh;
        opt.textContent = kh;
        this.filterKhoaHoc.appendChild(opt);
      });
      this.filterKhoaHoc.value = distinctKhoaHoc.includes(current) ? current : 'ALL';
    }

    if (this.filterKhoa) {
      const user = Auth.getUser();
      if (user && user.role === 'KHOA' && user.maKhoa) {
        const maKhoaValue = user.maKhoa.trim();
        this.filterKhoa.innerHTML = `<option value="${maKhoaValue}">${maKhoaValue}</option>`;
        this.filterKhoa.value = maKhoaValue;
        this.filterKhoa.disabled = true;
      } else {
        const current = this.filterKhoa.value || 'ALL';
        this.filterKhoa.innerHTML = '<option value="ALL">Tất cả Khoa</option>';
        const distinctKhoa = [...new Set(data.map(item => item.MAKHOA).filter(Boolean))].sort();
        distinctKhoa.forEach(k => {
          const opt = document.createElement('option');
          opt.value = k;
          opt.textContent = k;
          this.filterKhoa.appendChild(opt);
        });
        this.filterKhoa.value = distinctKhoa.includes(current) ? current : 'ALL';
        this.filterKhoa.disabled = false;
      }
    }
  },

  getCurrentData() {
    const map = new Map(this.state.originalData.map(item => [item.MALOP, { ...item }]));

    Object.values(this.state.pendingOperations).forEach(op => {
      if (op.type === 'create' || op.type === 'update') {
        map.set(op.key, { ...op.newValue });
      } else if (op.type === 'delete') {
        const item = map.get(op.key);
        if (item) {
          item._isDeleted = true;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.MALOP.localeCompare(b.MALOP));
  },

  getFilteredData() {
    const user = Auth.getUser();
    const selectedKhoaHoc = this.filterKhoaHoc ? this.filterKhoaHoc.value : 'ALL';
    const selectedKhoa = this.filterKhoa ? this.filterKhoa.value : 'ALL';

    return this.getCurrentData().filter(item => {
      const matchesKhoaHoc = selectedKhoaHoc === 'ALL' || item.KHOAHOC === selectedKhoaHoc;

      let matchesKhoa = false;
      if (user && user.role === 'KHOA' && user.maKhoa) {
        matchesKhoa = (item.MAKHOA || '').trim() === user.maKhoa.trim();
      } else {
        matchesKhoa = selectedKhoa === 'ALL' || item.MAKHOA === selectedKhoa;
      }

      return matchesKhoaHoc && matchesKhoa;
    });
  },

  renderTable() {
    const data = this.getFilteredData();
    this.tbody.innerHTML = '';

    if (this.lopListCount) {
      this.lopListCount.textContent = `${data.length} lớp`;
    }

    if (data.length === 0) {
      this.tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 20px;">Không tìm thấy lớp học nào khớp với điều kiện lọc</td></tr>';
      return;
    }

    const user = Auth.getUser();
    const isPGV = user && user.role === 'PGV';

    data.forEach((item, index) => {
      const tr = document.createElement('tr');
      if (item._isDeleted) {
        tr.style.opacity = '0.6';
        tr.style.backgroundColor = 'rgba(220, 53, 69, 0.05)';
      }
      const pendingOp = this.state.pendingOperations[item.MALOP];
      const statusBadge = this.getStatusBadge(pendingOp);

      let actionBtn = '';
      if (isPGV) {
        if (item._isDeleted) {
          actionBtn = `<button class="btn btn-secondary btn-sm" onclick="LopModule.handleCancelDelete('${this.escapeJs(item.MALOP)}')">Huỷ xoá</button>`;
        } else {
          actionBtn = `<button class="btn btn-info btn-sm" onclick="LopModule.openLopModal('edit','${this.escapeJs(item.MALOP)}')">Sửa</button>
                       <button class="btn btn-danger btn-sm" onclick="LopModule.handleDelete('${this.escapeJs(item.MALOP)}')">Xoá</button>`;
        }
      } else {
        actionBtn = `<span style="color: var(--text-muted); font-size: 13px;">Chỉ xem</span>`;
      }

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td style="font-weight: 600;">
          <button
            type="button"
            onclick="LopModule.openDetailModal('${this.escapeJs(item.MALOP)}')"
            style="background:none; border:none; padding:0; color:var(--primary-color); cursor:pointer; font:inherit; font-weight:600; text-decoration:underline;"
          >
            ${item.MALOP}
          </button>
        </td>
        <td>${item.TENLOP} ${statusBadge}</td>
        <td>${item.KHOAHOC}</td>
        <td>${item.MAKHOA}</td>
        <td>
          <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
            ${actionBtn}
          </div>
        </td>
      `;
      this.tbody.appendChild(tr);
    });
  },



  getStatusBadge(pendingOp) {
    if (!pendingOp) return '';
    const labelMap = {
      create: 'Chờ thêm',
      update: 'Chờ cập nhật',
      delete: 'Chờ xóa'
    };
    return `<span style="display:inline-block; margin-left:8px; padding:2px 8px; border-radius:999px; background:rgba(147,33,32,0.12); color:var(--primary-color); font-size:12px; font-weight:600;">${labelMap[pendingOp.type] || 'Chờ ghi'}</span>`;
  },

  hasPendingChanges() {
    return Object.keys(this.state.pendingOperations).length > 0;
  },

  snapshotPendingOperations() {
    return JSON.parse(JSON.stringify(this.state.pendingOperations));
  },

  pushHistory() {
    this.state.history.push(this.snapshotPendingOperations());
  },

  updateActionState() {
    const count = Object.keys(this.state.pendingOperations).length;
    this.btnCommit.disabled = count === 0;
    this.btnUndo.disabled = this.state.history.length === 0;
    this.pendingStatus.textContent = count > 0 ? `${count} thay đổi đang chờ ghi` : '';
  },

  populateLopFormKhoaHocSelect() {
    if (!this.lopFormKhoaHoc) return;
    const current = this.lopFormKhoaHoc.value;

    this.lopFormKhoaHoc.innerHTML = '<option value="">-- Chọn Khóa học --</option>';

    const years = new Set();
    // Sinh ra các khóa học chuẩn từ năm 2015-2019 đến 2035-2039
    for (let year = 2015; year <= 2035; year++) {
      years.add(`${year}-${year + 4}`);
    }

    // Quét thêm dữ liệu thực tế để đảm bảo không bỏ sót khóa học nào
    const data = this.getCurrentData();
    data.forEach(item => {
      if (item.KHOAHOC) {
        years.add(item.KHOAHOC);
      }
    });

    const sortedYears = Array.from(years).sort();
    sortedYears.forEach(kh => {
      const opt = document.createElement('option');
      opt.value = kh;
      opt.textContent = kh;
      this.lopFormKhoaHoc.appendChild(opt);
    });

    if (current && sortedYears.includes(current)) {
      this.lopFormKhoaHoc.value = current;
    }
  },

  updateMaLopPrefix() {
    if (this.state.lopModalMode !== 'create') return;
    if (!this.lopFormKhoaHoc || !this.lopFormMaLop) return;

    const khoaHoc = this.lopFormKhoaHoc.value;
    if (!khoaHoc) return;

    const startYear = khoaHoc.split('-')[0];
    if (!startYear || !/^\d{4}$/.test(startYear)) return;

    const prefix = 'D' + startYear.slice(-2); // VD: D19
    let currentMaLop = (this.lopFormMaLop.value || '').trim();

    // Nếu mã lớp hiện tại đã có dạng Dxx ở đầu, thay thế nó bằng prefix mới
    if (/^D\d{2}/i.test(currentMaLop)) {
      this.lopFormMaLop.value = currentMaLop.replace(/^D\d{2}/i, prefix);
    } else {
      // Nếu chưa có, hoặc trống, ghép tiền tố vào trước phần người dùng đã nhập
      this.lopFormMaLop.value = prefix + currentMaLop;
    }

    // Đưa con trỏ chuột tập trung vào ô nhập mã lớp và đặt ở cuối text
    this.lopFormMaLop.focus();
    const len = this.lopFormMaLop.value.length;
    this.lopFormMaLop.setSelectionRange(len, len);
  },

  populateLopFormKhoaSelect() {
    if (!this.lopFormSelectKhoa) return;
    const current = this.lopFormSelectKhoa.value;

    this.lopFormSelectKhoa.innerHTML = '<option value="">-- Chọn Khoa --</option>';

    this.state.khoaList.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k.MAKHOA;
      opt.textContent = k.TENKHOA;
      this.lopFormSelectKhoa.appendChild(opt);
    });

    if (current && this.state.khoaList.some(k => k.MAKHOA === current)) {
      this.lopFormSelectKhoa.value = current;
    }
  },

  updateTenLopPreview() {
    const previewEl = document.getElementById('lopFormTenLopPreview');
    if (!previewEl) return;

    if (!this.lopFormKhoaHoc || !this.lopFormTenLop) {
      previewEl.textContent = '';
      return;
    }

    const khoaHoc = this.lopFormKhoaHoc.value;
    const rawName = (this.lopFormTenLop.value || '').trim();

    if (!khoaHoc) {
      previewEl.textContent = '';
      return;
    }

    const startYear = khoaHoc.split('-')[0];
    if (!startYear || !/^\d{4}$/.test(startYear)) {
      previewEl.textContent = '';
      return;
    }

    // Làm sạch tên lớp: loại bỏ các hậu tố năm hiện có
    let cleanName = rawName;
    cleanName = cleanName.replace(new RegExp(`\\s+${startYear}$`), '');
    cleanName = cleanName.replace(/\s+\d{4}$/, '');

    if (cleanName) {
      previewEl.textContent = `Tên lớp đầy đủ: ${cleanName} ${startYear}`;
    } else {
      previewEl.textContent = `Tên lớp đầy đủ: [Tên lớp] ${startYear}`;
    }
  },

  // Modal Thêm / Sửa Lớp
  openLopModal(mode = 'create', maLop = '') {
    this.state.lopModalMode = mode;
    this.state.lopModalEditingId = maLop || null;

    const item = mode === 'edit' ? this.getCurrentData().find(x => x.MALOP === maLop) : null;

    if (mode === 'edit' && !item) {
      Toast.error('Không tìm thấy lớp để sửa');
      return;
    }

    if (this.lopModalTitle) {
      this.lopModalTitle.textContent = mode === 'edit' ? 'Sửa thông tin lớp' : 'Thêm lớp mới';
    }

    // Khởi tạo các tùy chọn khóa học và khoa trước
    this.populateLopFormKhoaHocSelect();
    this.populateLopFormKhoaSelect();

    if (this.lopFormMaLop) {
      this.lopFormMaLop.value = item?.MALOP || '';
      this.lopFormMaLop.disabled = mode === 'edit';
    }

    if (this.lopFormKhoaHoc) {
      this.lopFormKhoaHoc.value = item?.KHOAHOC || '';
    }

    if (this.lopFormTenLop) {
      let displayTenLop = item?.TENLOP || '';
      if (item?.KHOAHOC) {
        const startYear = item.KHOAHOC.split('-')[0];
        if (startYear && /^\d{4}$/.test(startYear)) {
          // Loại bỏ năm bắt đầu ở cuối để giao diện sửa không hiển thị lặp
          displayTenLop = displayTenLop.replace(new RegExp(`\\s+${startYear}$`), '');
          displayTenLop = displayTenLop.replace(/\s+\d{4}$/, '');
        }
      }
      this.lopFormTenLop.value = displayTenLop;
    }

    if (this.lopFormSelectKhoa) {
      this.lopFormSelectKhoa.value = item?.MAKHOA || '';
    }
    if (this.lopFormMaKhoa) {
      this.lopFormMaKhoa.value = item?.MAKHOA || '';
    }

    // Cập nhật nhãn xem trước ngay lập tức
    this.updateTenLopPreview();

    if (this.lopModal) this.lopModal.classList.add('active');
  },

  closeLopModal() {
    if (this.lopModal) this.lopModal.classList.remove('active');
    this.state.lopModalMode = null;
    this.state.lopModalEditingId = null;
  },

  saveLopModal() {
    if (this.state.lopModalMode === 'create') {
      this.saveCreateLop();
    } else {
      this.saveEditLop();
    }
  },

  saveCreateLop() {
    let rawTenLop = (this.lopFormTenLop?.value || '').trim();
    if (!rawTenLop) {
      Toast.warning('Vui lòng nhập đầy đủ thông tin lớp học');
      return;
    }

    const khoaHoc = (this.lopFormKhoaHoc?.value || '').trim();
    if (!khoaHoc) {
      Toast.warning('Vui lòng chọn khóa học');
      return;
    }

    const startYear = khoaHoc.split('-')[0];
    let formattedTenLop = rawTenLop;
    if (startYear && /^\d{4}$/.test(startYear)) {
      formattedTenLop = formattedTenLop.replace(new RegExp(`\\s+${startYear}$`), '');
      formattedTenLop = formattedTenLop.replace(/\s+\d{4}$/, '');
      formattedTenLop = `${formattedTenLop} ${startYear}`;
    }

    const payload = {
      MALOP: (this.lopFormMaLop?.value || '').trim(),
      TENLOP: formattedTenLop,
      KHOAHOC: khoaHoc,
      MAKHOA: (this.lopFormMaKhoa?.value || '').trim()
    };

    if (!payload.MALOP || !payload.TENLOP || !payload.KHOAHOC || !payload.MAKHOA) {
      Toast.warning('Vui lòng nhập đầy đủ thông tin lớp học');
      return;
    }

    const currentDataMap = new Map(this.getCurrentData().map(item => [item.MALOP, item]));
    if (currentDataMap.has(payload.MALOP)) {
      Toast.warning('Mã lớp đã tồn tại trong danh sách hiện tại');
      return;
    }

    this.pushHistory();
    this.state.pendingOperations[payload.MALOP] = {
      type: 'create',
      key: payload.MALOP,
      newValue: payload
    };

    this.closeLopModal();
    this.initFilterOptions();
    this.renderTable();
    this.updateActionState();
    Toast.success('Đã thêm bản ghi vào danh sách chờ ghi');
  },

  saveEditLop() {
    const maLop = this.state.lopModalEditingId;
    let rawTenLop = (this.lopFormTenLop?.value || '').trim();
    if (!rawTenLop) {
      Toast.warning('Vui lòng nhập đầy đủ thông tin lớp học');
      return;
    }

    const khoaHoc = (this.lopFormKhoaHoc?.value || '').trim();
    if (!khoaHoc) {
      Toast.warning('Vui lòng chọn khóa học');
      return;
    }

    const startYear = khoaHoc.split('-')[0];
    let formattedTenLop = rawTenLop;
    if (startYear && /^\d{4}$/.test(startYear)) {
      formattedTenLop = formattedTenLop.replace(new RegExp(`\\s+${startYear}$`), '');
      formattedTenLop = formattedTenLop.replace(/\s+\d{4}$/, '');
      formattedTenLop = `${formattedTenLop} ${startYear}`;
    }

    const payload = {
      MALOP: maLop,
      TENLOP: formattedTenLop,
      KHOAHOC: khoaHoc,
      MAKHOA: (this.lopFormMaKhoa?.value || '').trim()
    };

    if (!payload.MALOP || !payload.TENLOP || !payload.KHOAHOC || !payload.MAKHOA) {
      Toast.warning('Vui lòng nhập đầy đủ thông tin lớp học');
      return;
    }

    const originalItem = this.state.originalData.find(item => item.MALOP === payload.MALOP);
    const existingPending = this.state.pendingOperations[payload.MALOP];

    if (existingPending && existingPending.type === 'delete') {
      Toast.warning('Lớp này đang chờ xoá, không thể sửa');
      return;
    }

    this.pushHistory();

    if (existingPending && existingPending.type === 'create') {
      this.state.pendingOperations[payload.MALOP] = {
        ...existingPending,
        newValue: payload
      };
    } else {
      this.state.pendingOperations[payload.MALOP] = {
        type: 'update',
        key: payload.MALOP,
        oldValue: originalItem ? { ...originalItem } : null,
        newValue: payload
      };
    }

    // If update is same as original, remove the pending operation
    const pending = this.state.pendingOperations[payload.MALOP];
    if (
      pending &&
      pending.type === 'update' &&
      pending.oldValue &&
      pending.oldValue.TENLOP === payload.TENLOP &&
      pending.oldValue.KHOAHOC === payload.KHOAHOC &&
      pending.oldValue.MAKHOA === payload.MAKHOA
    ) {
      delete this.state.pendingOperations[payload.MALOP];
    }

    this.closeLopModal();
    this.initFilterOptions();
    this.renderTable();
    this.updateActionState();
    Toast.success('Đã đưa thay đổi vào danh sách chờ ghi');
  },

  async openDetailModal(maLop) {
    try {
      this.resetDetailStudentState();
      if (this.searchStudentInClass) {
        this.searchStudentInClass.value = '';
      }
      this.state.currentDetailLop = maLop;
      this.detailMaLop.textContent = maLop;
      this.detailTenLop.textContent = 'Đang tải...';
      this.detailKhoaHoc.textContent = 'Đang tải...';
      this.detailMaKhoa.textContent = 'Đang tải...';
      this.detailTbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Đang tải danh sách sinh viên...</td></tr>';
      if (this.detailSection) {
        this.detailSection.style.display = 'block';
        this.detailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      this.updateDetailActionState();

      const [lopRes, svRes] = await Promise.all([
        API.get(`/lop/${encodeURIComponent(maLop)}`),
        API.get(`/sinhvien/lop/${encodeURIComponent(maLop)}`)
      ]);

      if (!lopRes.success) {
        throw new Error(lopRes.message || 'Không thể tải thông tin lớp');
      }

      const lop = lopRes.data || {};
      this.detailMaLop.textContent = lop.MALOP || maLop;
      this.detailTenLop.textContent = lop.TENLOP || '-';
      this.detailKhoaHoc.textContent = lop.KHOAHOC || '-';
      this.detailMaKhoa.textContent = lop.MAKHOA || '-';

      this.state.detailOriginalStudents = svRes.success ? (svRes.data || []) : [];
      this.renderDetailStudentTable();
    } catch (error) {
      this.resetDetailStudentState();
      this.detailTenLop.textContent = '-';
      this.detailKhoaHoc.textContent = '-';
      this.detailMaKhoa.textContent = '-';
      this.detailTbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:red;">Lỗi: ${this.escapeHtml(error.message)}</td></tr>`;
      Toast.error(error.message);
    }
  },

  closeDetailModal() {
    if (this.detailSection) this.detailSection.style.display = 'none';
    this.resetDetailStudentState();
  },

  resetDetailStudentState() {
    this.state.detailOriginalStudents = [];
    this.state.detailPendingOperations = {};
    this.state.detailHistory = [];
    this.state.detailEditingStudentId = null;
    this.state.detailEditingDraft = null;
    this.state.currentDetailLop = null;
    this.updateDetailActionState();
  },

  getCurrentDetailStudents() {
    const map = new Map(this.state.detailOriginalStudents.map(item => [item.MASV, { ...item }]));

    Object.values(this.state.detailPendingOperations).forEach(op => {
      if (op.type === 'create' || op.type === 'update') {
        map.set(op.key, { ...op.newValue });
      } else if (op.type === 'delete') {
        const item = map.get(op.key);
        if (item) {
          item._isDeleted = true;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.MASV.localeCompare(b.MASV));
  },

  getFilteredDetailStudents() {
    const students = this.getCurrentDetailStudents();
    const query = this.searchStudentInClass ? this.searchStudentInClass.value.trim().toLowerCase() : '';
    if (!query) return students;

    return students.filter(sv => {
      const masv = (sv.MASV || '').toLowerCase();
      const ho = (sv.HO || '').toLowerCase();
      const ten = (sv.TEN || '').toLowerCase();
      const hoten = `${ho} ${ten}`.toLowerCase();
      return masv.includes(query) || ho.includes(query) || ten.includes(query) || hoten.includes(query);
    });
  },

  renderDetailStudentTable() {
    const students = this.getFilteredDetailStudents();
    this.detailTbody.innerHTML = '';

    if (students.length === 0 && !this.state.detailIsAddingRow) {
      const query = this.searchStudentInClass ? this.searchStudentInClass.value.trim() : '';
      this.detailTbody.innerHTML = query
        ? '<tr><td colspan="9" style="text-align:center; color: var(--text-muted);">Không tìm thấy sinh viên nào khớp với từ khóa tìm kiếm</td></tr>'
        : '<tr><td colspan="9" style="text-align:center;">Lớp này chưa có sinh viên nào</td></tr>';
      this.updateDetailActionState();
      return;
    }

    const user = Auth.getUser();
    const isPGV = user && user.role === 'PGV';

    students.forEach((sv, index) => {
      const pendingOp = this.state.detailPendingOperations[sv.MASV];
      const statusBadge = this.getStatusBadge(pendingOp);

      const actionLabel = pendingOp?.type === 'delete' ? 'Chờ xoá' : '';
      let actionContent = '';
      if (isPGV) {
        if (sv._isDeleted) {
          actionContent = `<button class="btn btn-secondary btn-sm" onclick="LopModule.handleCancelDeleteStudentRow('${this.escapeJs(sv.MASV)}')">Huỷ xoá</button>`;
        } else {
          actionContent = `<button class="btn btn-info btn-sm" onclick="LopModule.openStudentModal('edit','${this.escapeJs(sv.MASV)}')">Sửa</button>
                           <button class="btn btn-danger btn-sm" onclick="LopModule.handleDeleteStudentRow('${this.escapeJs(sv.MASV)}')">Xoá</button>
                           ${actionLabel ? `<span style="margin-left:8px; font-size:12px; color:var(--danger-color); font-weight:600;">${actionLabel}</span>` : ''}`;
        }
      } else {
        actionContent = `<span style="color: var(--text-muted); font-size: 13px;">Chỉ xem</span>`;
      }

      const tr = document.createElement('tr');
      if (sv._isDeleted) {
        tr.style.opacity = '0.6';
        tr.style.backgroundColor = 'rgba(220, 53, 69, 0.05)';
      }

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${sv.MASV || ''}</td>
        <td>${sv.HO || ''}</td>
        <td>${sv.TEN || ''} ${statusBadge}</td>
        <td>${sv.PHAI ? 'Nữ' : 'Nam'}</td>
        <td>${this.formatDateForDisplay(sv.NGAYSINH)}</td>
        <td>${sv.DIACHI || ''}</td>
        <td>${sv.DANGHIHOC ? 'Đã nghỉ' : 'Đang học'}</td>
        <td>
          <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
            ${actionContent}
          </div>
        </td>
      `;
      this.detailTbody.appendChild(tr);
    });

    if (this.state.detailIsAddingRow) {
      this.renderDraftStudentRow(students.length + 1);
    }

    this.updateDetailActionState();
  },


  openStudentModal(mode = 'create', maSV = '') {
    if (!this.state.currentDetailLop) {
      Toast.warning('Vui lòng chọn một lớp trước');
      return;
    }

    this.state.studentModalMode = mode;
    this.state.studentModalEditingId = maSV || null;
    const student = mode === 'edit' ? this.getCurrentDetailStudents().find(x => x.MASV === maSV) : null;
    this.studentModalTitle.textContent = mode === 'edit' ? 'Sửa sinh viên' : 'Thêm sinh viên';
    this.studentFormMasv.value = student?.MASV || '';
    this.studentFormHo.value = student?.HO || '';
    this.studentFormTen.value = student?.TEN || '';
    this.studentFormPhai.value = student?.PHAI ? '1' : '0';
    this.studentFormNgaySinh.value = this.formatDateForInput(student?.NGAYSINH || '');
    this.studentFormDiaChi.value = student?.DIACHI || '';
    this.studentFormDangNghiHoc.value = student?.DANGHIHOC ? '1' : '0';
    if (mode === 'edit') this.studentFormMasv.disabled = true; else this.studentFormMasv.disabled = false;
    this.studentModal.classList.add('active');
  },

  closeStudentModal() {
    this.studentModal.classList.remove('active');
  },

  saveStudentModal() {
    const payload = {
      MASV: String(this.studentFormMasv.value || '').trim(),
      HO: String(this.studentFormHo.value || '').trim(),
      TEN: String(this.studentFormTen.value || '').trim(),
      PHAI: this.studentFormPhai.value === '1',
      NGAYSINH: this.normalizeDateForApi(this.studentFormNgaySinh.value),
      DIACHI: String(this.studentFormDiaChi.value || '').trim(),
      DANGHIHOC: this.studentFormDangNghiHoc.value === '1',
      MALOP: this.state.currentDetailLop
    };

    if (!payload.MASV || !payload.HO || !payload.TEN) {
      Toast.warning('Vui lòng nhập đầy đủ thông tin sinh viên');
      return;
    }

    if (this.state.studentModalMode === 'create') {
      this.handleSaveDraftStudentRowFromPayload(payload);
    } else {
      this.confirmEditStudentRowFromPayload(payload);
    }
    this.closeStudentModal();
  },

  handleSaveDraftStudentRowFromPayload(payload) {
    const currentMap = new Map(this.getCurrentDetailStudents().map(item => [item.MASV, item]));
    if (currentMap.has(payload.MASV)) {
      Toast.warning('Mã sinh viên đã tồn tại trong lớp này');
      return;
    }
    this.pushDetailHistory();
    this.state.detailPendingOperations[payload.MASV] = { type: 'create', key: payload.MASV, newValue: payload };
    this.renderDetailStudentTable();
    Toast.success('Đã thêm sinh viên vào danh sách chờ ghi');
  },

  confirmEditStudentRowFromPayload(payload) {
    const originalItem = this.state.detailOriginalStudents.find(item => item.MASV === payload.MASV);
    this.pushDetailHistory();
    this.state.detailPendingOperations[payload.MASV] = { type: 'update', key: payload.MASV, oldValue: originalItem ? { ...originalItem } : null, newValue: payload };
    this.renderDetailStudentTable();
    Toast.success('Đã xác nhận thay đổi của sinh viên');
  },

  renderEditingStudentRow(index, sv) {
    const draft = this.state.detailEditingDraft || {
      MASV: sv.MASV,
      HO: sv.HO || '',
      TEN: sv.TEN || '',
      PHAI: !!sv.PHAI,
      NGAYSINH: this.formatDateForInput(sv.NGAYSINH),
      DIACHI: sv.DIACHI || '',
      DANGHIHOC: !!sv.DANGHIHOC
    };

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index}</td>
      <td>${sv.MASV}</td>
      <td><input type="text" id="editStudentHo" class="form-control" value="${this.escapeHtml(draft.HO)}"></td>
      <td><input type="text" id="editStudentTen" class="form-control" value="${this.escapeHtml(draft.TEN)}"></td>
      <td>
        <select id="editStudentPhai" class="form-control">
          <option value="0" ${draft.PHAI ? '' : 'selected'}>Nam</option>
          <option value="1" ${draft.PHAI ? 'selected' : ''}>Nu</option>
        </select>
      </td>
      <td><input type="date" id="editStudentNgaySinh" class="form-control" value="${this.escapeHtml(draft.NGAYSINH)}"></td>
      <td><input type="text" id="editStudentDiaChi" class="form-control" value="${this.escapeHtml(draft.DIACHI)}"></td>
      <td>
        <select id="editStudentDangNghiHoc" class="form-control">
          <option value="0" ${draft.DANGHIHOC ? '' : 'selected'}>Dang hoc</option>
          <option value="1" ${draft.DANGHIHOC ? 'selected' : ''}>Da nghi</option>
        </select>
      </td>
      <td>
        <button class="btn btn-primary btn-sm" id="btnConfirmEditStudent">Xac nhan</button>
        <button class="btn btn-secondary btn-sm" id="btnCancelEditStudent">Huy</button>
      </td>
    `;
    this.detailTbody.appendChild(tr);

    document.getElementById('editStudentHo')?.addEventListener('input', (e) => {
      this.state.detailEditingDraft.HO = e.target.value;
    });
    document.getElementById('editStudentTen')?.addEventListener('input', (e) => {
      this.state.detailEditingDraft.TEN = e.target.value;
    });
    document.getElementById('editStudentPhai')?.addEventListener('change', (e) => {
      this.state.detailEditingDraft.PHAI = e.target.value === '1';
    });
    document.getElementById('editStudentNgaySinh')?.addEventListener('change', (e) => {
      this.state.detailEditingDraft.NGAYSINH = e.target.value;
    });
    document.getElementById('editStudentDiaChi')?.addEventListener('input', (e) => {
      this.state.detailEditingDraft.DIACHI = e.target.value;
    });
    document.getElementById('editStudentDangNghiHoc')?.addEventListener('change', (e) => {
      this.state.detailEditingDraft.DANGHIHOC = e.target.value === '1';
    });
    document.getElementById('btnConfirmEditStudent')?.addEventListener('click', () => this.confirmEditStudentRow());
    document.getElementById('btnCancelEditStudent')?.addEventListener('click', () => this.cancelEditStudentRow());
  },

  renderDraftStudentRow(index) {
    const draft = this.state.detailDraftStudent;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index}</td>
      <td><input type="text" id="draftStudentMasv" class="form-control" placeholder="Ma SV" value="${this.escapeHtml(draft.MASV)}"></td>
      <td><input type="text" id="draftStudentHo" class="form-control" placeholder="Ho" value="${this.escapeHtml(draft.HO)}"></td>
      <td><input type="text" id="draftStudentTen" class="form-control" placeholder="Ten" value="${this.escapeHtml(draft.TEN)}"></td>
      <td>
        <select id="draftStudentPhai" class="form-control">
          <option value="0" ${draft.PHAI ? '' : 'selected'}>Nam</option>
          <option value="1" ${draft.PHAI ? 'selected' : ''}>Nu</option>
        </select>
      </td>
      <td><input type="date" id="draftStudentNgaySinh" class="form-control" value="${this.escapeHtml(draft.NGAYSINH)}"></td>
      <td><input type="text" id="draftStudentDiaChi" class="form-control" placeholder="Dia chi" value="${this.escapeHtml(draft.DIACHI)}"></td>
      <td>
        <select id="draftStudentDangNghiHoc" class="form-control">
          <option value="0" ${draft.DANGHIHOC ? '' : 'selected'}>Dang hoc</option>
          <option value="1" ${draft.DANGHIHOC ? 'selected' : ''}>Da nghi</option>
        </select>
      </td>
      <td>
        <button class="btn btn-primary btn-sm" id="btnSaveDraftStudent">Luu tam</button>
        <button class="btn btn-secondary btn-sm" id="btnCancelDraftStudent">Huy</button>
      </td>
    `;
    this.detailTbody.appendChild(tr);

    document.getElementById('draftStudentMasv')?.addEventListener('input', (e) => {
      this.state.detailDraftStudent.MASV = e.target.value;
    });
    document.getElementById('draftStudentHo')?.addEventListener('input', (e) => {
      this.state.detailDraftStudent.HO = e.target.value;
    });
    document.getElementById('draftStudentTen')?.addEventListener('input', (e) => {
      this.state.detailDraftStudent.TEN = e.target.value;
    });
    document.getElementById('draftStudentPhai')?.addEventListener('change', (e) => {
      this.state.detailDraftStudent.PHAI = e.target.value === '1';
    });
    document.getElementById('draftStudentNgaySinh')?.addEventListener('change', (e) => {
      this.state.detailDraftStudent.NGAYSINH = e.target.value;
    });
    document.getElementById('draftStudentDiaChi')?.addEventListener('input', (e) => {
      this.state.detailDraftStudent.DIACHI = e.target.value;
    });
    document.getElementById('draftStudentDangNghiHoc')?.addEventListener('change', (e) => {
      this.state.detailDraftStudent.DANGHIHOC = e.target.value === '1';
    });
    document.getElementById('btnSaveDraftStudent')?.addEventListener('click', () => this.handleSaveDraftStudentRow());
    document.getElementById('btnCancelDraftStudent')?.addEventListener('click', () => this.cancelAddStudentRow());
  },

  updateDetailActionState() {
    const count = Object.keys(this.state.detailPendingOperations).length;
    this.btnCommitStudentInClass.disabled = count === 0;
    this.btnUndoStudentInClass.disabled = this.state.detailHistory.length === 0;
    this.btnAddStudentInClass.disabled = this.state.detailIsAddingRow || !!this.state.detailEditingStudentId || !this.state.currentDetailLop;
    this.studentInClassPendingStatus.textContent = count > 0 ? `${count} thay đổi sinh viên đang chờ ghi` : '';
  },

  pushDetailHistory() {
    this.state.detailHistory.push(JSON.parse(JSON.stringify(this.state.detailPendingOperations)));
  },

  startAddStudentRow() {
    if (!this.state.currentDetailLop) return;
    this.openStudentModal('create');
  },

  cancelAddStudentRow() {
    this.renderDetailStudentTable();
  },

  handleSaveDraftStudentRow() {
    const payload = {
      MASV: this.state.detailDraftStudent.MASV.trim(),
      HO: this.state.detailDraftStudent.HO.trim(),
      TEN: this.state.detailDraftStudent.TEN.trim(),
      PHAI: !!this.state.detailDraftStudent.PHAI,
      NGAYSINH: this.normalizeDateForApi(this.state.detailDraftStudent.NGAYSINH),
      DIACHI: this.state.detailDraftStudent.DIACHI.trim(),
      DANGHIHOC: !!this.state.detailDraftStudent.DANGHIHOC,
      MALOP: this.state.currentDetailLop
    };

    if (!payload.MASV || !payload.HO || !payload.TEN || !payload.MALOP) {
      Toast.warning('Vui lòng nhập đầy đủ thông tin sinh viên');
      return;
    }

    const currentMap = new Map(this.getCurrentDetailStudents().map(item => [item.MASV, item]));
    if (currentMap.has(payload.MASV)) {
      Toast.warning('Mã sinh viên đã tồn tại trong lớp này');
      return;
    }

    this.pushDetailHistory();
    this.state.detailPendingOperations[payload.MASV] = {
      type: 'create',
      key: payload.MASV,
      newValue: payload
    };

    this.renderDetailStudentTable();
    Toast.success('Đã thêm sinh viên vào danh sách chờ ghi');
  },

  startEditStudentRow(maSV) {
    if (this.state.detailIsAddingRow) return;
    const sv = this.getCurrentDetailStudents().find(item => item.MASV === maSV);
    if (!sv) {
      Toast.error('Không tìm thấy sinh viên để sửa');
      return;
    }

    this.state.detailEditingStudentId = maSV;
    this.state.detailEditingDraft = {
      MASV: sv.MASV,
      HO: sv.HO || '',
      TEN: sv.TEN || '',
      PHAI: !!sv.PHAI,
      NGAYSINH: this.formatDateForInput(sv.NGAYSINH),
      DIACHI: sv.DIACHI || '',
      DANGHIHOC: !!sv.DANGHIHOC,
      MALOP: sv.MALOP || this.state.currentDetailLop
    };
    this.renderDetailStudentTable();
  },

  cancelEditStudentRow() {
    this.state.detailEditingStudentId = null;
    this.state.detailEditingDraft = null;
    this.renderDetailStudentTable();
  },

  confirmEditStudentRow() {
    const draft = this.state.detailEditingDraft;
    if (!draft) return;

    const payload = {
      MASV: draft.MASV,
      HO: String(draft.HO || '').trim(),
      TEN: String(draft.TEN || '').trim(),
      PHAI: !!draft.PHAI,
      NGAYSINH: this.normalizeDateForApi(draft.NGAYSINH),
      DIACHI: String(draft.DIACHI || '').trim(),
      DANGHIHOC: !!draft.DANGHIHOC,
      MALOP: this.state.currentDetailLop
    };

    if (!payload.HO || !payload.TEN) {
      Toast.warning('Vui lòng nhập đầy đủ họ và tên sinh viên');
      return;
    }

    const originalItem = this.state.detailOriginalStudents.find(item => item.MASV === payload.MASV);
    const existingPending = this.state.detailPendingOperations[payload.MASV];

    if (existingPending && existingPending.type === 'delete') {
      Toast.warning('Sinh viên này đang chờ xóa, không thể sửa');
      return;
    }

    this.pushDetailHistory();

    if (existingPending && existingPending.type === 'create') {
      this.state.detailPendingOperations[payload.MASV] = {
        ...existingPending,
        newValue: payload
      };
    } else {
      this.state.detailPendingOperations[payload.MASV] = {
        type: 'update',
        key: payload.MASV,
        oldValue: originalItem ? { ...originalItem } : null,
        newValue: payload
      };
    }

    const pending = this.state.detailPendingOperations[payload.MASV];
    if (
      pending &&
      pending.type === 'update' &&
      pending.oldValue &&
      pending.oldValue.HO === payload.HO &&
      pending.oldValue.TEN === payload.TEN &&
      !!pending.oldValue.PHAI === payload.PHAI &&
      this.normalizeDateForApi(pending.oldValue.NGAYSINH) === payload.NGAYSINH &&
      String(pending.oldValue.DIACHI || '') === payload.DIACHI &&
      !!pending.oldValue.DANGHIHOC === payload.DANGHIHOC &&
      pending.oldValue.MALOP === payload.MALOP
    ) {
      delete this.state.detailPendingOperations[payload.MASV];
    }

    this.state.detailEditingStudentId = null;
    this.state.detailEditingDraft = null;
    this.renderDetailStudentTable();
    Toast.success('Đã xác nhận thay đổi của sinh viên');
  },

  handleDeleteStudentRow(maSV) {
    if (!confirm(`Bạn có chắc chắn muốn xoá sinh viên ${maSV} khỏi danh sách này?`)) return;

    const existingPending = this.state.detailPendingOperations[maSV];
    if (existingPending && existingPending.type === 'delete') {
      Toast.info('Sinh viên này đã nằm trong danh sách chờ xoá');
      return;
    }

    this.pushDetailHistory();

    if (existingPending && existingPending.type === 'create') {
      delete this.state.detailPendingOperations[maSV];
    } else {
      const originalItem = this.state.detailOriginalStudents.find(item => item.MASV === maSV);
      if (!originalItem) {
        this.state.detailHistory.pop();
        Toast.error('Không tìm thấy sinh viên để xoá');
        return;
      }

      this.state.detailPendingOperations[maSV] = {
        type: 'delete',
        key: maSV,
        oldValue: { ...originalItem }
      };
    }

    if (this.state.detailEditingStudentId === maSV) {
      this.state.detailEditingStudentId = null;
      this.state.detailEditingDraft = null;
    }

    this.renderDetailStudentTable();
    Toast.success('Đã đưa thao tác xoá sinh viên vào danh sách chờ ghi');
  },

  handleCancelDeleteStudentRow(maSV) {
    this.pushDetailHistory();
    delete this.state.detailPendingOperations[maSV];
    this.renderDetailStudentTable();
    this.updateDetailActionState();
    Toast.success('Đã huỷ thao tác xoá sinh viên');
  },

  handleUndoDetailStudent() {
    if (this.state.detailHistory.length === 0) {
      Toast.info('Không có thay đổi nào để phục hồi');
      return;
    }

    this.state.detailPendingOperations = this.state.detailHistory.pop();
    this.state.detailEditingStudentId = null;
    this.state.detailEditingDraft = null;
    this.renderDetailStudentTable();
    Toast.success('Đã phục hồi thay đổi sinh viên gần nhất');
  },

  async handleCommitDetailStudents() {
    const operations = Object.values(this.state.detailPendingOperations);
    if (operations.length === 0) {
      Toast.info('Không có thay đổi sinh viên nào để ghi');
      return;
    }

    try {
      this.btnCommitStudentInClass.disabled = true;
      this.btnCommitStudentInClass.textContent = 'Đang ghi...';

      const sortedOperations = [
        ...operations.filter(op => op.type === 'create'),
        ...operations.filter(op => op.type === 'update'),
        ...operations.filter(op => op.type === 'delete')
      ];

      for (const op of sortedOperations) {
        if (op.type === 'create') {
          await API.post('/sinhvien/create', op.newValue);
        } else if (op.type === 'update') {
          await API.put(`/sinhvien/update/${op.key}`, {
            HO: op.newValue.HO,
            TEN: op.newValue.TEN,
            PHAI: op.newValue.PHAI,
            NGAYSINH: op.newValue.NGAYSINH,
            DIACHI: op.newValue.DIACHI,
            DANGHIHOC: op.newValue.DANGHIHOC,
            MALOP: op.newValue.MALOP
          });
        } else if (op.type === 'delete') {
          await API.delete(`/sinhvien/delete/${op.key}`);
        }
      }

      const svRes = await API.get(`/sinhvien/lop/${encodeURIComponent(this.state.currentDetailLop)}`);
      this.state.detailOriginalStudents = svRes.success ? (svRes.data || []) : [];
      this.state.detailPendingOperations = {};
      this.state.detailHistory = [];
      this.state.detailIsAddingRow = false;
      this.state.detailDraftStudent = { MASV: '', HO: '', TEN: '', PHAI: false, NGAYSINH: '', DIACHI: '', DANGHIHOC: false };
      this.state.detailEditingStudentId = null;
      this.state.detailEditingDraft = null;
      this.renderDetailStudentTable();
      Toast.success('Đã ghi tất cả thay đổi sinh viên thành công');
    } catch (error) {
      Toast.error(`Ghi dữ liệu sinh viên thất bại: ${error.message}`);
    } finally {
      this.btnCommitStudentInClass.textContent = 'Ghi';
      this.updateDetailActionState();
    }
  },

  handleDelete(maLop) {
    if (!confirm(`Bạn có chắc chắn muốn xoá lớp ${maLop}?`)) return;

    const existingPending = this.state.pendingOperations[maLop];
    if (existingPending && existingPending.type === 'delete') {
      Toast.info('Lớp này đã nằm trong danh sách chờ xóa');
      return;
    }

    this.pushHistory();

    if (existingPending && existingPending.type === 'create') {
      delete this.state.pendingOperations[maLop];
    } else {
      const originalItem = this.state.originalData.find(item => item.MALOP === maLop);
      if (!originalItem) {
        this.state.history.pop();
        Toast.error('Không tìm thấy lớp để xoá');
        return;
      }

      this.state.pendingOperations[maLop] = {
        type: 'delete',
        key: maLop,
        oldValue: { ...originalItem }
      };
    }

    this.initFilterOptions();
    this.renderTable();
    this.updateActionState();
    Toast.success('Đã đưa thao tác xoá vào danh sách chờ ghi');
  },

  handleCancelDelete(maLop) {
    this.pushHistory();
    delete this.state.pendingOperations[maLop];
    this.initFilterOptions();
    this.renderTable();
    this.updateActionState();
    Toast.success('Đã huỷ thao tác xoá lớp');
  },

  handleUndo() {
    if (this.state.history.length === 0) {
      Toast.info('Không có thay đổi nào để phục hồi');
      return;
    }

    this.state.pendingOperations = this.state.history.pop();
    this.initFilterOptions();
    this.renderTable();
    this.updateActionState();
    Toast.success('Đã phục hồi thay đổi gần nhất');
  },

  async handleCommit() {
    const operations = Object.values(this.state.pendingOperations);
    if (operations.length === 0) {
      Toast.info('Không có thay đổi nào để ghi');
      return;
    }

    try {
      this.btnCommit.disabled = true;
      this.btnCommit.textContent = 'Đang ghi...';

      const sortedOperations = [
        ...operations.filter(op => op.type === 'create'),
        ...operations.filter(op => op.type === 'update'),
        ...operations.filter(op => op.type === 'delete')
      ];

      for (const op of sortedOperations) {
        if (op.type === 'create') {
          await API.post('/lop/create', op.newValue);
        } else if (op.type === 'update') {
          await API.put(`/lop/update/${op.key}`, {
            TENLOP: op.newValue.TENLOP,
            KHOAHOC: op.newValue.KHOAHOC,
            MAKHOA: op.newValue.MAKHOA
          });
        } else if (op.type === 'delete') {
          await API.delete(`/lop/delete/${op.key}`);
        }
      }

      Toast.success('Đã ghi tất cả thay đổi thành công');
      this.state.pendingOperations = {};
      this.state.history = [];
      await this.loadData();
    } catch (error) {
      Toast.error(`Ghi dữ liệu thất bại: ${error.message}`);
    } finally {
      this.btnCommit.textContent = 'Ghi';
      this.updateActionState();
    }
  },

  escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  escapeJs(value) {
    return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  },

  formatDateForInput(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value).slice(0, 10);
    }
    return date.toISOString().slice(0, 10);
  },

  formatDateForDisplay(value) {
    const normalized = this.formatDateForInput(value);
    return normalized || '';
  },

  normalizeDateForApi(value) {
    return value ? String(value).slice(0, 10) : null;
  }
};

window.LopModule.init();
