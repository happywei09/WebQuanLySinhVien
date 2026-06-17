window.LopModule = {
  state: {
    originalData: [],
    pendingOperations: {},
    history: [],
    isAddingRow: false,
    editingLopId: null,
    editingDraft: null,
    draftLop: {
      MALOP: '',
      TENLOP: '',
      KHOAHOC: '',
      MAKHOA: ''
    },
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
    currentDetailLop: null
  },

  async init() {
    this.cacheDOM();
    this.bindEvents();
    await this.loadData();
  },

  cacheDOM() {
    this.tbody = document.getElementById('tbodyLop');
    this.searchLop = document.getElementById('searchLop');
    this.filterKhoaHoc = document.getElementById('filterKhoaHoc');
    this.filterKhoa = document.getElementById('filterKhoa');
    this.btnAdd = document.getElementById('btnAddLop');
    this.btnCommit = document.getElementById('btnCommitLop');
    this.btnUndo = document.getElementById('btnUndoLop');
    this.pendingStatus = document.getElementById('lopPendingStatus');

    this.detailModal = document.getElementById('modalLopDetail');
    this.detailMaLop = document.getElementById('detailMaLop');
    this.detailTenLop = document.getElementById('detailTenLop');
    this.detailKhoaHoc = document.getElementById('detailKhoaHoc');
    this.detailMaKhoa = document.getElementById('detailMaKhoa');
    this.detailTbody = document.getElementById('tbodyLopDetail');
    this.btnAddStudentInClass = document.getElementById('btnAddStudentInClass');
    this.btnUndoStudentInClass = document.getElementById('btnUndoStudentInClass');
    this.btnCommitStudentInClass = document.getElementById('btnCommitStudentInClass');
    this.studentInClassPendingStatus = document.getElementById('studentInClassPendingStatus');
  },

  bindEvents() {
    const user = Auth.getUser();
    const isPGV = user && user.role === 'PGV';

    if (this.btnAdd) {
      if (isPGV) {
        this.btnAdd.onclick = () => this.startAddRow();
      } else {
        this.btnAdd.style.display = 'none';
      }
    }

    this.btnCommit.onclick = () => this.handleCommit();
    this.btnUndo.onclick = () => this.handleUndo();
    document.getElementById('btnCloseModalLopDetail').onclick = () => this.closeDetailModal();
    document.getElementById('btnCloseFooterModalLopDetail').onclick = () => this.closeDetailModal();
    this.btnAddStudentInClass.onclick = () => this.startAddStudentRow();
    this.btnUndoStudentInClass.onclick = () => this.handleUndoDetailStudent();
    this.btnCommitStudentInClass.onclick = () => this.handleCommitDetailStudents();

    if (this.searchLop) {
      this.searchLop.addEventListener('input', () => this.renderTable());
    }
    if (this.filterKhoaHoc) {
      this.filterKhoaHoc.addEventListener('change', () => this.renderTable());
    }
    if (this.filterKhoa) {
      this.filterKhoa.addEventListener('change', () => this.renderTable());
    }
  },

  async loadData() {
    try {
      this.tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Dang tai...</td></tr>';
      const res = await API.get('/lop');
      if (res.success) {
        this.state.originalData = res.data || [];
        this.state.pendingOperations = {};
        this.state.history = [];
        this.state.isAddingRow = false;
        this.state.draftLop = { MALOP: '', TENLOP: '', KHOAHOC: '', MAKHOA: '' };
        this.initFilterOptions();
        this.renderTable();
      }
    } catch (error) {
      this.tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Loi tai du lieu lop hoc</td></tr>';
      Toast.error(error.message);
    } finally {
      this.updateActionState();
    }
  },

  initFilterOptions() {
    const data = this.getCurrentData();

    if (this.filterKhoaHoc) {
      const current = this.filterKhoaHoc.value || 'ALL';
      this.filterKhoaHoc.innerHTML = '<option value="ALL">Tat ca Khoa hoc</option>';
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
      const current = this.filterKhoa.value || 'ALL';
      this.filterKhoa.innerHTML = '<option value="ALL">Tat ca Khoa</option>';
      const distinctKhoa = [...new Set(data.map(item => item.MAKHOA).filter(Boolean))].sort();
      distinctKhoa.forEach(k => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = k;
        this.filterKhoa.appendChild(opt);
      });
      this.filterKhoa.value = distinctKhoa.includes(current) ? current : 'ALL';
    }
  },

  getCurrentData() {
    const map = new Map(this.state.originalData.map(item => [item.MALOP, { ...item }]));

    Object.values(this.state.pendingOperations).forEach(op => {
      if (op.type === 'create' || op.type === 'update') {
        map.set(op.key, { ...op.newValue });
      } else if (op.type === 'delete') {
        map.delete(op.key);
      }
    });

    return Array.from(map.values()).sort((a, b) => a.MALOP.localeCompare(b.MALOP));
  },

  getFilteredData() {
    const keyword = this.searchLop ? this.searchLop.value.trim().toLowerCase() : '';
    const selectedKhoaHoc = this.filterKhoaHoc ? this.filterKhoaHoc.value : 'ALL';
    const selectedKhoa = this.filterKhoa ? this.filterKhoa.value : 'ALL';

    return this.getCurrentData().filter(item => {
      const matchesSearch =
        !keyword ||
        (item.MALOP && item.MALOP.toLowerCase().includes(keyword)) ||
        (item.TENLOP && item.TENLOP.toLowerCase().includes(keyword));

      const matchesKhoaHoc = selectedKhoaHoc === 'ALL' || item.KHOAHOC === selectedKhoaHoc;
      const matchesKhoa = selectedKhoa === 'ALL' || item.MAKHOA === selectedKhoa;

      return matchesSearch && matchesKhoaHoc && matchesKhoa;
    });
  },

  renderTable() {
    const data = this.getFilteredData();
    this.tbody.innerHTML = '';

    if (data.length === 0 && !this.state.isAddingRow) {
      this.tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 20px;">Khong tim thay lop hoc nao khop voi dieu kien loc</td></tr>';
      return;
    }

    const user = Auth.getUser();
    const isPGV = user && user.role === 'PGV';

    data.forEach((item, index) => {
      if (this.state.editingLopId === item.MALOP) {
        this.renderEditingLopRow(index + 1, item);
        return;
      }

      const tr = document.createElement('tr');
      const pendingOp = this.state.pendingOperations[item.MALOP];
      const statusBadge = this.getStatusBadge(pendingOp);
      const actionBtn = isPGV
        ? `<button class="btn btn-secondary btn-sm" onclick="LopModule.startEditLopRow('${this.escapeJs(item.MALOP)}')">Sua</button>
           <button class="btn btn-danger btn-sm" onclick="LopModule.handleDelete('${this.escapeJs(item.MALOP)}')">Xoa</button>`
        : `<span style="color: var(--text-muted); font-size: 13px;">Chi xem</span>`;

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
        <td>${actionBtn}</td>
      `;
      this.tbody.appendChild(tr);
    });

    if (isPGV && this.state.isAddingRow) {
      this.renderDraftRow(data.length + 1);
    }
  },

  renderEditingLopRow(index, item) {
    const draft = this.state.editingDraft || {
      MALOP: item.MALOP,
      TENLOP: item.TENLOP || '',
      KHOAHOC: item.KHOAHOC || '',
      MAKHOA: item.MAKHOA || ''
    };

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index}</td>
      <td>${item.MALOP}</td>
      <td><input type="text" id="editTenLopInline" class="form-control" value="${this.escapeHtml(draft.TENLOP)}"></td>
      <td><input type="text" id="editKhoaHocInline" class="form-control" value="${this.escapeHtml(draft.KHOAHOC)}"></td>
      <td><input type="text" id="editMaKhoaInline" class="form-control" value="${this.escapeHtml(draft.MAKHOA)}"></td>
      <td>
        <button class="btn btn-primary btn-sm" id="btnConfirmEditLop">Xac nhan</button>
        <button class="btn btn-secondary btn-sm" id="btnCancelEditLop">Huy</button>
      </td>
    `;
    this.tbody.appendChild(tr);

    document.getElementById('editTenLopInline')?.addEventListener('input', (e) => {
      this.state.editingDraft.TENLOP = e.target.value;
    });
    document.getElementById('editKhoaHocInline')?.addEventListener('input', (e) => {
      this.state.editingDraft.KHOAHOC = e.target.value;
    });
    document.getElementById('editMaKhoaInline')?.addEventListener('input', (e) => {
      this.state.editingDraft.MAKHOA = e.target.value;
    });
    document.getElementById('btnConfirmEditLop')?.addEventListener('click', () => this.confirmEditLopRow());
    document.getElementById('btnCancelEditLop')?.addEventListener('click', () => this.cancelEditLopRow());
  },

  renderDraftRow(index) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index}</td>
      <td><input type="text" id="draftMaLop" class="form-control" placeholder="Ma lop" value="${this.escapeHtml(this.state.draftLop.MALOP)}"></td>
      <td><input type="text" id="draftTenLop" class="form-control" placeholder="Ten lop" value="${this.escapeHtml(this.state.draftLop.TENLOP)}"></td>
      <td><input type="text" id="draftKhoaHoc" class="form-control" placeholder="Khoa hoc" value="${this.escapeHtml(this.state.draftLop.KHOAHOC)}"></td>
      <td><input type="text" id="draftMaKhoa" class="form-control" placeholder="Ma khoa" value="${this.escapeHtml(this.state.draftLop.MAKHOA)}"></td>
      <td>
        <button class="btn btn-primary btn-sm" id="btnSaveDraftLop">Luu tam</button>
        <button class="btn btn-secondary btn-sm" id="btnCancelDraftLop">Huy</button>
      </td>
    `;
    this.tbody.appendChild(tr);

    document.getElementById('draftMaLop')?.addEventListener('input', (e) => {
      this.state.draftLop.MALOP = e.target.value;
    });
    document.getElementById('draftTenLop')?.addEventListener('input', (e) => {
      this.state.draftLop.TENLOP = e.target.value;
    });
    document.getElementById('draftKhoaHoc')?.addEventListener('input', (e) => {
      this.state.draftLop.KHOAHOC = e.target.value;
    });
    document.getElementById('draftMaKhoa')?.addEventListener('input', (e) => {
      this.state.draftLop.MAKHOA = e.target.value;
    });

    document.getElementById('btnSaveDraftLop')?.addEventListener('click', () => this.handleSaveDraftRow());
    document.getElementById('btnCancelDraftLop')?.addEventListener('click', () => this.cancelAddRow());
  },

  getStatusBadge(pendingOp) {
    if (!pendingOp) return '';
    const labelMap = {
      create: 'Cho them',
      update: 'Cho cap nhat',
      delete: 'Cho xoa'
    };
    return `<span style="display:inline-block; margin-left:8px; padding:2px 8px; border-radius:999px; background:rgba(59,130,246,0.12); color:var(--primary-color); font-size:12px; font-weight:600;">${labelMap[pendingOp.type] || 'Cho ghi'}</span>`;
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
    if (this.btnAdd) {
      this.btnAdd.disabled = this.state.isAddingRow || !!this.state.editingLopId;
    }
    this.pendingStatus.textContent = count > 0 ? `${count} thay doi dang cho ghi` : '';
  },

  startAddRow() {
    if (this.state.isAddingRow || this.state.editingLopId) return;
    this.state.isAddingRow = true;
    this.state.draftLop = { MALOP: '', TENLOP: '', KHOAHOC: '', MAKHOA: '' };
    this.renderTable();
    this.updateActionState();
  },

  cancelAddRow() {
    this.state.isAddingRow = false;
    this.state.draftLop = { MALOP: '', TENLOP: '', KHOAHOC: '', MAKHOA: '' };
    this.renderTable();
    this.updateActionState();
  },

  startEditLopRow(maLop) {
    if (this.state.isAddingRow) return;
    const item = this.getCurrentData().find(x => x.MALOP === maLop);
    if (!item) {
      Toast.error('Khong tim thay lop de sua');
      return;
    }

    this.state.editingLopId = maLop;
    this.state.editingDraft = {
      MALOP: item.MALOP,
      TENLOP: item.TENLOP || '',
      KHOAHOC: item.KHOAHOC || '',
      MAKHOA: item.MAKHOA || ''
    };
    this.renderTable();
    this.updateActionState();
  },

  cancelEditLopRow() {
    this.state.editingLopId = null;
    this.state.editingDraft = null;
    this.renderTable();
    this.updateActionState();
  },

  handleSaveDraftRow() {
    const payload = {
      MALOP: this.state.draftLop.MALOP.trim(),
      TENLOP: this.state.draftLop.TENLOP.trim(),
      KHOAHOC: this.state.draftLop.KHOAHOC.trim(),
      MAKHOA: this.state.draftLop.MAKHOA.trim()
    };

    if (!payload.MALOP || !payload.TENLOP || !payload.KHOAHOC || !payload.MAKHOA) {
      Toast.warning('Vui long nhap day du thong tin lop hoc');
      return;
    }

    const currentDataMap = new Map(this.getCurrentData().map(item => [item.MALOP, item]));
    if (currentDataMap.has(payload.MALOP)) {
      Toast.warning('Ma lop da ton tai trong danh sach hien tai');
      return;
    }

    this.pushHistory();
    this.state.pendingOperations[payload.MALOP] = {
      type: 'create',
      key: payload.MALOP,
      newValue: payload
    };

    this.state.isAddingRow = false;
    this.state.draftLop = { MALOP: '', TENLOP: '', KHOAHOC: '', MAKHOA: '' };
    this.initFilterOptions();
    this.renderTable();
    this.updateActionState();
    Toast.success('Da them ban ghi vao danh sach cho ghi');
  },

  async openDetailModal(maLop) {
    try {
      this.resetDetailStudentState();
      this.state.currentDetailLop = maLop;
      this.detailMaLop.textContent = maLop;
      this.detailTenLop.textContent = 'Dang tai...';
      this.detailKhoaHoc.textContent = 'Dang tai...';
      this.detailMaKhoa.textContent = 'Dang tai...';
      this.detailTbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Dang tai danh sach sinh vien...</td></tr>';
      this.detailModal.classList.add('active');
      this.updateDetailActionState();

      const [lopRes, svRes] = await Promise.all([
        API.get(`/lop/${encodeURIComponent(maLop)}`),
        API.get(`/sinhvien/lop/${encodeURIComponent(maLop)}`)
      ]);

      if (!lopRes.success) {
        throw new Error(lopRes.message || 'Khong the tai thong tin lop');
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
      this.detailTbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:red;">Loi: ${this.escapeHtml(error.message)}</td></tr>`;
      Toast.error(error.message);
    }
  },

  closeDetailModal() {
    this.detailModal.classList.remove('active');
    this.resetDetailStudentState();
  },

  resetDetailStudentState() {
    this.state.detailOriginalStudents = [];
    this.state.detailPendingOperations = {};
    this.state.detailHistory = [];
    this.state.detailIsAddingRow = false;
    this.state.detailDraftStudent = { MASV: '', HO: '', TEN: '', PHAI: false, NGAYSINH: '', DIACHI: '', DANGHIHOC: false };
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
        map.delete(op.key);
      }
    });

    return Array.from(map.values()).sort((a, b) => a.MASV.localeCompare(b.MASV));
  },

  renderDetailStudentTable() {
    const students = this.getCurrentDetailStudents();
    this.detailTbody.innerHTML = '';

    if (students.length === 0 && !this.state.detailIsAddingRow) {
      this.detailTbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Lop nay chua co sinh vien nao</td></tr>';
      this.updateDetailActionState();
      return;
    }

    students.forEach((sv, index) => {
      if (this.state.detailEditingStudentId === sv.MASV) {
        this.renderEditingStudentRow(index + 1, sv);
        return;
      }

      const pendingOp = this.state.detailPendingOperations[sv.MASV];
      const actionLabel = pendingOp?.type === 'delete' ? 'Cho xoa' : '';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${sv.MASV || ''}</td>
        <td>${sv.HO || ''}</td>
        <td>${sv.TEN || ''}</td>
        <td>${sv.PHAI ? 'Nu' : 'Nam'}</td>
        <td>${this.formatDateForDisplay(sv.NGAYSINH)}</td>
        <td>${sv.DIACHI || ''}</td>
        <td>${sv.DANGHIHOC ? 'Da nghi' : 'Dang hoc'}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="LopModule.startEditStudentRow('${this.escapeJs(sv.MASV)}')">Sua</button>
          <button class="btn btn-danger btn-sm" onclick="LopModule.handleDeleteStudentRow('${this.escapeJs(sv.MASV)}')">Xoa</button>
          ${actionLabel ? `<span style="margin-left:8px; font-size:12px; color:var(--danger-color); font-weight:600;">${actionLabel}</span>` : ''}
        </td>
      `;
      this.detailTbody.appendChild(tr);
    });

    if (this.state.detailIsAddingRow) {
      this.renderDraftStudentRow(students.length + 1);
    }

    this.updateDetailActionState();
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
    this.studentInClassPendingStatus.textContent = count > 0 ? `${count} thay doi sinh vien dang cho ghi` : '';
  },

  pushDetailHistory() {
    this.state.detailHistory.push(JSON.parse(JSON.stringify(this.state.detailPendingOperations)));
  },

  startAddStudentRow() {
    if (!this.state.currentDetailLop || this.state.detailIsAddingRow || this.state.detailEditingStudentId) return;
    this.state.detailIsAddingRow = true;
    this.state.detailDraftStudent = { MASV: '', HO: '', TEN: '', PHAI: false, NGAYSINH: '', DIACHI: '', DANGHIHOC: false };
    this.renderDetailStudentTable();
  },

  cancelAddStudentRow() {
    this.state.detailIsAddingRow = false;
    this.state.detailDraftStudent = { MASV: '', HO: '', TEN: '', PHAI: false, NGAYSINH: '', DIACHI: '', DANGHIHOC: false };
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
      Toast.warning('Vui long nhap day du thong tin sinh vien');
      return;
    }

    const currentMap = new Map(this.getCurrentDetailStudents().map(item => [item.MASV, item]));
    if (currentMap.has(payload.MASV)) {
      Toast.warning('Ma sinh vien da ton tai trong lop nay');
      return;
    }

    this.pushDetailHistory();
    this.state.detailPendingOperations[payload.MASV] = {
      type: 'create',
      key: payload.MASV,
      newValue: payload
    };

    this.state.detailIsAddingRow = false;
    this.state.detailDraftStudent = { MASV: '', HO: '', TEN: '', PHAI: false, NGAYSINH: '', DIACHI: '', DANGHIHOC: false };
    this.renderDetailStudentTable();
    Toast.success('Da them sinh vien vao danh sach cho ghi');
  },

  startEditStudentRow(maSV) {
    if (this.state.detailIsAddingRow) return;
    const sv = this.getCurrentDetailStudents().find(item => item.MASV === maSV);
    if (!sv) {
      Toast.error('Khong tim thay sinh vien de sua');
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
      Toast.warning('Vui long nhap day du ho va ten sinh vien');
      return;
    }

    const originalItem = this.state.detailOriginalStudents.find(item => item.MASV === payload.MASV);
    const existingPending = this.state.detailPendingOperations[payload.MASV];

    if (existingPending && existingPending.type === 'delete') {
      Toast.warning('Sinh vien nay dang cho xoa, khong the sua');
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
    Toast.success('Da xac nhan thay doi cua sinh vien');
  },

  handleDeleteStudentRow(maSV) {
    if (!confirm(`Ban co chac chan muon xoa sinh vien ${maSV} khoi danh sach nay?`)) return;

    const existingPending = this.state.detailPendingOperations[maSV];
    if (existingPending && existingPending.type === 'delete') {
      Toast.info('Sinh vien nay da nam trong danh sach cho xoa');
      return;
    }

    this.pushDetailHistory();

    if (existingPending && existingPending.type === 'create') {
      delete this.state.detailPendingOperations[maSV];
    } else {
      const originalItem = this.state.detailOriginalStudents.find(item => item.MASV === maSV);
      if (!originalItem) {
        this.state.detailHistory.pop();
        Toast.error('Khong tim thay sinh vien de xoa');
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
    Toast.success('Da dua thao tac xoa sinh vien vao danh sach cho ghi');
  },

  handleUndoDetailStudent() {
    if (this.state.detailHistory.length === 0) {
      Toast.info('Khong co thay doi nao de phuc hoi');
      return;
    }

    this.state.detailPendingOperations = this.state.detailHistory.pop();
    this.state.detailEditingStudentId = null;
    this.state.detailEditingDraft = null;
    this.state.detailIsAddingRow = false;
    this.state.detailDraftStudent = { MASV: '', HO: '', TEN: '', PHAI: false, NGAYSINH: '', DIACHI: '', DANGHIHOC: false };
    this.renderDetailStudentTable();
    Toast.success('Da phuc hoi thay doi sinh vien gan nhat');
  },

  async handleCommitDetailStudents() {
    const operations = Object.values(this.state.detailPendingOperations);
    if (operations.length === 0) {
      Toast.info('Khong co thay doi sinh vien nao de ghi');
      return;
    }

    try {
      this.btnCommitStudentInClass.disabled = true;
      this.btnCommitStudentInClass.textContent = 'Dang ghi...';

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
      Toast.success('Da ghi tat ca thay doi sinh vien thanh cong');
    } catch (error) {
      Toast.error(`Ghi du lieu sinh vien that bai: ${error.message}`);
    } finally {
      this.btnCommitStudentInClass.textContent = 'Ghi';
      this.updateDetailActionState();
    }
  },

  confirmEditLopRow() {
    const draft = this.state.editingDraft;
    if (!draft) return;

    const payload = {
      MALOP: draft.MALOP,
      TENLOP: String(draft.TENLOP || '').trim(),
      KHOAHOC: String(draft.KHOAHOC || '').trim(),
      MAKHOA: String(draft.MAKHOA || '').trim()
    };

    if (!payload.MALOP || !payload.TENLOP || !payload.KHOAHOC || !payload.MAKHOA) {
      Toast.warning('Vui long nhap day du thong tin lop hoc');
      return;
    }

    const originalItem = this.state.originalData.find(item => item.MALOP === payload.MALOP);
    const existingPending = this.state.pendingOperations[payload.MALOP];

    if (existingPending && existingPending.type === 'delete') {
      Toast.warning('Lop nay dang cho xoa, khong the sua');
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

    this.initFilterOptions();
    this.state.editingLopId = null;
    this.state.editingDraft = null;
    this.renderTable();
    this.updateActionState();
    Toast.success('Da dua thay doi vao danh sach cho ghi');
  },

  handleDelete(maLop) {
    if (!confirm(`Ban co chac chan muon xoa lop ${maLop}?`)) return;

    const existingPending = this.state.pendingOperations[maLop];
    if (existingPending && existingPending.type === 'delete') {
      Toast.info('Lop nay da nam trong danh sach cho xoa');
      return;
    }

    this.pushHistory();

    if (existingPending && existingPending.type === 'create') {
      delete this.state.pendingOperations[maLop];
    } else {
      const originalItem = this.state.originalData.find(item => item.MALOP === maLop);
      if (!originalItem) {
        this.state.history.pop();
        Toast.error('Khong tim thay lop de xoa');
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
    Toast.success('Da dua thao tac xoa vao danh sach cho ghi');
  },

  handleUndo() {
    if (this.state.history.length === 0) {
      Toast.info('Khong co thay doi nao de phuc hoi');
      return;
    }

    this.state.pendingOperations = this.state.history.pop();
    this.initFilterOptions();
    this.renderTable();
    this.updateActionState();
    Toast.success('Da phuc hoi thay doi gan nhat');
  },

  async handleCommit() {
    const operations = Object.values(this.state.pendingOperations);
    if (operations.length === 0) {
      Toast.info('Khong co thay doi nao de ghi');
      return;
    }

    try {
      this.btnCommit.disabled = true;
      this.btnCommit.textContent = 'Dang ghi...';

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

      Toast.success('Da ghi tat ca thay doi thanh cong');
      await this.loadData();
    } catch (error) {
      Toast.error(`Ghi du lieu that bai: ${error.message}`);
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
