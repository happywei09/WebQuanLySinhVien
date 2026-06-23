/* ====================================
   MODULE GIANG VIEN (Ghi / Phục hồi)
   File: js/modules/giangvien.js
 ==================================== */

window.GiangVienModule = {
  state: {
    originalData: [],
    pendingOperations: {},
    history: [],
    khoaList: [],
    searchKeyword: '',
    isAddingRow: false,
    editingGVId: null,
    editingDraft: null,
    draftGV: {
      MAGV: '',
      HO: '',
      TEN: '',
      HOCVI: '',
      HOCHAM: '',
      CHUYENMON: '',
      MAKHOA: ''
    }
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
    this.tbody = document.querySelector('.giangvien-list-scroll table tbody');
    this.searchInput = document.getElementById('searchGV');
    this.btnSearch = document.getElementById('btnSearchGV');
    this.btnCommit = document.getElementById('btnCommitGV');
    this.btnUndo = document.getElementById('btnUndoGV');
    this.pendingStatus = document.getElementById('giangvienPendingStatus');

    if (!document.getElementById('modalGV')) {
      const modalHTML = `
      <div class="modal-overlay" id="modalGV">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="modalTitleGV">Thêm Giảng Viên</h3>
            <button class="btn-close" id="btnCloseModalGV">&times;</button>
          </div>
          <div class="modal-body">
            <form id="formGV">
              <div class="form-group">
                <label class="form-label required">Mã Giảng Viên</label>
                <input type="text" id="maGV" class="form-control" required placeholder="Ví dụ: GV01">
              </div>
              <div style="display: flex; gap: 16px;">
                <div class="form-group" style="flex: 2;">
                  <label class="form-label required">Họ và đệm</label>
                  <input type="text" id="hoGV" class="form-control" required placeholder="Ví dụ: Nguyễn Văn">
                </div>
                <div class="form-group" style="flex: 1;">
                  <label class="form-label required">Tên</label>
                  <input type="text" id="tenGV" class="form-control" required placeholder="Ví dụ: A">
                </div>
              </div>
              <div style="display: flex; gap: 16px;">
                <div class="form-group" style="flex: 1;">
                  <label class="form-label">Học vị</label>
                  <select id="hocviGV" class="form-control">
                    <option value=""> Không chọn </option>
                    <option value="Cử nhân">Cử nhân</option>
                    <option value="Thạc sĩ">Thạc sĩ</option>
                    <option value="Tiến sĩ">Tiến sĩ</option>
                  </select>
                </div>
                <div class="form-group" style="flex: 1;">
                  <label class="form-label">Học hàm</label>
                  <select id="hochamGV" class="form-control">
                    <option value=""> Không chọn </option>
                    <option value="Phó Giáo sư">Phó Giáo sư</option>
                    <option value="Giáo sư">Giáo sư</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Chuyên môn</label>
                <input type="text" id="chuyenmonGV" class="form-control" placeholder="Ví dụ: Hệ quản trị CSDL (không bắt buộc)">
              </div>
              <div class="form-group">
                <label class="form-label required">Khoa trực thuộc</label>
                <select id="khoaGV" class="form-control" required></select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btnCancelModalGV">Huỷ</button>
            <button class="btn btn-primary" id="btnSaveGV">Lưu tạm</button>
          </div>
        </div>
      </div>`;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    this.modal = document.getElementById('modalGV');
    this.form = document.getElementById('formGV');
    this.btnSave = document.getElementById('btnSaveGV');
    this.inputMa = document.getElementById('maGV');
    this.inputHo = document.getElementById('hoGV');
    this.inputTen = document.getElementById('tenGV');
    this.inputHocVi = document.getElementById('hocviGV');
    this.inputHocHam = document.getElementById('hochamGV');
    this.inputChuyenMon = document.getElementById('chuyenmonGV');
    this.selectKhoa = document.getElementById('khoaGV');
  },

  bindEvents() {
    const user = Auth.getUser();
    const isPGV = user && user.role === 'PGV';
    const btnAdd = document.getElementById('btnAddGV');

    if (btnAdd) {
      if (isPGV) {
        btnAdd.onclick = () => this.openModal();
      } else {
        btnAdd.style.display = 'none';
      }
    }

    if (!isPGV) {
      if (this.btnCommit) this.btnCommit.style.display = 'none';
      if (this.btnUndo) this.btnUndo.style.display = 'none';
    }

    document.getElementById('btnCloseModalGV').onclick = () => this.closeModal();
    document.getElementById('btnCancelModalGV').onclick = () => this.closeModal();
    this.btnSave.onclick = () => this.handleSaveDraftRow();

    if (this.btnCommit) this.btnCommit.onclick = () => this.handleCommit();
    if (this.btnUndo) this.btnUndo.onclick = () => this.handleUndo();

    if (this.btnSearch) {
      this.btnSearch.onclick = () => {
        const keyword = this.searchInput ? this.searchInput.value.trim() : '';
        this.loadData(keyword);
      };
    }
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => {
        this.debounce(() => {
          const keyword = this.searchInput.value.trim();
          this.loadData(keyword);
        });
      });
    }
  },

  async loadKhoaList() {
    try {
      const res = await API.get('/khoa');
      if (res.success) {
        this.state.khoaList = res.data || [];
        this.selectKhoa.innerHTML = '<option value="">-- Chọn Khoa --</option>' +
          this.state.khoaList.map(k => `<option value="${k.MAKHOA}">${k.MAKHOA} - ${k.TENKHOA}</option>`).join('');
      }
    } catch (e) {
      Toast.error('Không tải được danh sách khoa');
    }
  },

  async loadData(keyword = '') {
    if (this.hasPendingChanges() && keyword === this.state.searchKeyword) {
      this.renderTable();
      this.updateActionState();
      return;
    }

    if (this.hasPendingChanges()) {
      const ok = confirm('Bạn đang có thay đổi chưa ghi. Tải lại dữ liệu sẽ bỏ các thay đổi này. Tiếp tục?');
      if (!ok) return;
    }

    try {
      this.tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Đang tải...</td></tr>';
      this.state.searchKeyword = keyword;
      const endpoint = keyword ? `/giangvien/search?keyword=${encodeURIComponent(keyword)}` : '/giangvien';
      const res = await API.get(endpoint);
      if (res.success) {
        this.state.originalData = res.data || [];
        this.state.pendingOperations = {};
        this.state.history = [];
        this.renderTable();
      }
    } catch (error) {
      this.tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:red;">Lỗi kết nối API.</td></tr>';
      Toast.error(error.message);
    } finally {
      this.updateActionState();
    }
  },

  renderTable() {
    const data = this.getCurrentData();
    this.tbody.innerHTML = '';

    if (data.length === 0) {
      this.tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Không có dữ liệu</td></tr>';
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

      const pendingOp = this.state.pendingOperations[item.MAGV];
      const statusBadge = this.getStatusBadge(pendingOp);

      let actionContent = '';
      if (isPGV) {
        if (item._isDeleted) {
          actionContent = `<button class="btn btn-secondary btn-sm" onclick="window.GiangVienModule.handleCancelDelete('${item.MAGV}')">Huỷ xoá</button>`;
        } else {
          const safeHo = (item.HO || '').replace(/'/g, "\\'");
          const safeTen = (item.TEN || '').replace(/'/g, "\\'");
          const safeHocVi = (item.HOCVI || '').replace(/'/g, "\\'");
          const safeHocHam = (item.HOCHAM || '').replace(/'/g, "\\'");
          const safeChuyenMon = (item.CHUYENMON || '').replace(/'/g, "\\'");

          actionContent = `<button class="btn btn-info btn-sm" onclick="window.GiangVienModule.openModal('${item.MAGV}', '${safeHo}', '${safeTen}', '${safeHocVi}', '${safeHocHam}', '${safeChuyenMon}', '${item.MAKHOA}')">Sửa</button>
                           <button class="btn btn-danger btn-sm" onclick="window.GiangVienModule.handleDelete('${item.MAGV}')">Xoá</button>`;
        }
      } else {
        actionContent = `<span style="color: var(--text-muted); font-size: 13px;">Chỉ xem</span>`;
      }

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.MAGV}</td>
        <td>
          ${item.HO} ${item.TEN}
          ${statusBadge}
        </td>
        <td>${item.HOCVI || '-'}</td>
        <td>${item.HOCHAM || '-'}</td>
        <td>${item.CHUYENMON || '-'}</td>
        <td>${item.MAKHOA}</td>
        <td>
          <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
            ${actionContent}
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
      delete: 'Chờ xoá'
    };
    return `
      <span style="display:inline-block; margin-left:8px; padding:2px 8px; border-radius:999px; background:rgba(147,33,32,0.12); color:var(--primary-color); font-size:12px; font-weight:600;">
        ${labelMap[pendingOp.type] || 'Chờ ghi'}
      </span>
    `;
  },

  getCurrentData() {
    const map = new Map(this.state.originalData.map(item => [item.MAGV, { ...item }]));

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

    return Array.from(map.values()).sort((a, b) => a.MAGV.localeCompare(b.MAGV));
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
    if (this.btnCommit) this.btnCommit.disabled = count === 0;
    if (this.btnUndo) this.btnUndo.disabled = this.state.history.length === 0;
    if (this.pendingStatus) {
      this.pendingStatus.textContent = count > 0 ? `${count} thay đổi đang chờ ghi` : '';
    }
  },

  openModal(ma = '', ho = '', ten = '', hocvi = '', hocham = '', chuyenmon = '', khoa = '') {
    this.isEdit = !!ma;
    this.state.editingGVId = ma || null;
    document.getElementById('modalTitleGV').textContent = this.isEdit ? 'Sửa Giảng Viên' : 'Thêm Giảng Viên';

    this.inputMa.value = ma;
    this.inputMa.readOnly = this.isEdit;
    this.inputHo.value = ho;
    this.inputTen.value = ten;
    this.inputHocVi.value = hocvi;
    this.inputHocHam.value = hocham;
    this.inputChuyenMon.value = chuyenmon;
    this.selectKhoa.value = khoa;

    this.modal.classList.add('active');
    setTimeout(() => {
      if (this.isEdit) {
        this.inputHo.focus();
      } else {
        this.inputMa.focus();
      }
    }, 0);
  },

  closeModal() {
    this.modal.classList.remove('active');
    this.form.reset();
    this.state.editingGVId = null;
  },

  handleSaveDraftRow() {
    const ma = this.inputMa.value.trim();
    const ho = this.inputHo.value.trim();
    const ten = this.inputTen.value.trim();
    const hocvi = this.inputHocVi.value;
    const hocham = this.inputHocHam.value;
    const chuyenmon = this.inputChuyenMon.value.trim();
    const khoa = this.selectKhoa.value;

    if (!ma || !ho || !ten || !khoa) {
      Toast.warning('Vui lòng nhập đầy đủ thông tin bắt buộc (Mã GV, Họ tên, Khoa)');
      return;
    }

    const currentData = this.getCurrentData();
    this.pushHistory();

    const gvData = {
      MAGV: ma,
      HO: ho,
      TEN: ten,
      HOCVI: hocvi || null,
      HOCHAM: hocham || null,
      CHUYENMON: chuyenmon || null,
      MAKHOA: khoa
    };

    if (this.isEdit) {
      const originalItem = this.state.originalData.find(item => item.MAGV === ma);
      const existingPending = this.state.pendingOperations[ma];

      if (existingPending && existingPending.type === 'create') {
        this.state.pendingOperations[ma] = {
          ...existingPending,
          newValue: gvData
        };
      } else {
        this.state.pendingOperations[ma] = {
          type: 'update',
          key: ma,
          oldValue: originalItem ? { ...originalItem } : null,
          newValue: gvData
        };
      }

      // If reverted to original
      const pending = this.state.pendingOperations[ma];
      if (pending && pending.type === 'update' && pending.oldValue &&
          pending.oldValue.HO === ho &&
          pending.oldValue.TEN === ten &&
          pending.oldValue.HOCVI === gvData.HOCVI &&
          pending.oldValue.HOCHAM === gvData.HOCHAM &&
          pending.oldValue.CHUYENMON === gvData.CHUYENMON &&
          pending.oldValue.MAKHOA === khoa) {
        delete this.state.pendingOperations[ma];
      }
    } else {
      // Check duplicate ID
      const currentDataMap = new Map(currentData.map(item => [item.MAGV, item]));
      if (currentDataMap.has(ma)) {
        Toast.warning('Mã giảng viên đã tồn tại trong danh sách');
        this.state.history.pop();
        return;
      }

      this.state.pendingOperations[ma] = {
        type: 'create',
        key: ma,
        newValue: gvData
      };
    }

    this.closeModal();
    this.renderTable();
    this.updateActionState();
    Toast.success('Đã lưu tạm thay đổi giảng viên');
  },

  handleDelete(ma) {
    if (!confirm(`Bạn có chắc chắn muốn xoá giảng viên ${ma}?`)) return;

    const existingPending = this.state.pendingOperations[ma];
    this.pushHistory();

    if (existingPending && existingPending.type === 'create') {
      delete this.state.pendingOperations[ma];
    } else {
      const originalItem = this.state.originalData.find(item => item.MAGV === ma);
      if (!originalItem) {
        Toast.error('Không tìm thấy giảng viên để xoá');
        this.state.history.pop();
        return;
      }

      this.state.pendingOperations[ma] = {
        type: 'delete',
        key: ma,
        oldValue: { ...originalItem }
      };
    }

    this.renderTable();
    this.updateActionState();
    Toast.success('Đã đưa thao tác xoá giảng viên vào danh sách chờ ghi');
  },

  handleCancelDelete(ma) {
    this.pushHistory();
    delete this.state.pendingOperations[ma];
    this.renderTable();
    this.updateActionState();
    Toast.success('Đã huỷ thao tác xoá giảng viên');
  },

  handleUndo() {
    if (this.state.history.length === 0) {
      Toast.info('Không có thay đổi nào để phục hồi');
      return;
    }

    this.state.pendingOperations = this.state.history.pop();
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
          await API.post('/giangvien/create', op.newValue);
        } else if (op.type === 'update') {
          await API.put(`/giangvien/update/${op.key}`, op.newValue);
        } else if (op.type === 'delete') {
          await API.delete(`/giangvien/delete/${op.key}`);
        }
      }

      Toast.success('Đã ghi tất cả thay đổi thành công');
      await this.reloadAfterCommit();
    } catch (error) {
      Toast.error(`Ghi dữ liệu thất bại: ${error.message}`);
    } finally {
      if (this.btnCommit) {
        this.btnCommit.textContent = 'Ghi';
      }
      this.updateActionState();
    }
  },

  async reloadAfterCommit() {
    const keyword = this.state.searchKeyword;
    const endpoint = keyword ? `/giangvien/search?keyword=${encodeURIComponent(keyword)}` : '/giangvien';
    const res = await API.get(endpoint);
    this.state.originalData = res.success ? (res.data || []) : [];
    this.state.pendingOperations = {};
    this.state.history = [];
    this.renderTable();
    this.updateActionState();
  }
};

window.GiangVienModule.init();
