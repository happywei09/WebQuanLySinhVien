/* ====================================
   MODULE KHOA (CRUD Template)
   File: js/modules/khoa.js
==================================== */

window.KhoaModule = {
  state: {
    originalData: [],
    pendingOperations: {},
    history: [],
    searchKeyword: '',
    isAddingRow: false,
    editingKhoaId: null,
    editingDraft: null,
    draftKhoa: {
      MAKHOA: '',
      TENKHOA: ''
    }
  },

  async init() {
    this.cacheDOM();
    this.bindEvents();
    await this.loadData();
  },

  cacheDOM() {
    this.tbody = document.getElementById('tbodyKhoa');
    this.btnSearch = document.getElementById('btnSearchKhoa');
    this.btnCommit = document.getElementById('btnCommitKhoa');
    this.btnUndo = document.getElementById('btnUndoKhoa');
    this.searchInput = document.getElementById('searchKhoa');
    this.pendingStatus = document.getElementById('khoaPendingStatus');
    this.khoaModal = document.getElementById('khoaModal');
    this.khoaModalTitle = document.getElementById('khoaModalTitle');
    this.khoaFormMaKhoa = document.getElementById('khoaFormMaKhoa');
    this.khoaFormTenKhoa = document.getElementById('khoaFormTenKhoa');
    this.btnSaveKhoaModal = document.getElementById('btnSaveKhoaModal');
    this.btnCloseKhoaModal = document.getElementById('btnCloseKhoaModal');
    this.btnCancelKhoaModal = document.getElementById('btnCancelKhoaModal');
  },

  bindEvents() {
    const user = Auth.getUser();
    const isPGV = user && user.role === 'PGV';
    const btnAdd = document.getElementById('btnAddKhoa');
    if (btnAdd) {
      if (isPGV) {
        btnAdd.onclick = () => this.startAddRow();
      } else {
        btnAdd.style.display = 'none';
      }
    }
    if (this.btnSaveKhoaModal) this.btnSaveKhoaModal.onclick = () => this.handleSaveDraftRow();
    if (this.btnCloseKhoaModal) this.btnCloseKhoaModal.onclick = () => this.cancelAddRow();
    if (this.btnCancelKhoaModal) this.btnCancelKhoaModal.onclick = () => this.cancelAddRow();
    if (this.khoaModal) {
      this.khoaModal.addEventListener('click', (e) => {
        if (e.target === this.khoaModal) this.cancelAddRow();
      });
    }

    this.btnSearch.onclick = () => this.loadData();
    this.btnCommit.onclick = () => this.handleCommit();
    this.btnUndo.onclick = () => this.handleUndo();
  },

  async loadData() {
    const keyword = this.searchInput.value.trim();

    if (this.hasPendingChanges() && keyword === this.state.searchKeyword) {
      this.renderTable();
      this.updateActionState();
      return;
    }

    try {
      this.tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Đang tải...</td></tr>';
      
      if (this.hasPendingChanges()) {
        const ok = confirm('Bạn đang có thay đổi chưa ghi. Tải lại dữ liệu sẽ bỏ các thay đổi này. Tiếp tục?');
        if (!ok) return;
      }

      this.state.searchKeyword = keyword;
      const endpoint = keyword ? `/khoa/search?keyword=${keyword}` : '/khoa';
      
      const response = await API.get(endpoint);
      
      if (response.success) {
        this.state.originalData = response.data || [];
        this.state.pendingOperations = {};
        this.state.history = [];
        this.renderTable();
      }
    } catch (error) {
      this.tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Lỗi kết nối API. Hãy kiểm tra Backend.</td></tr>';
      Toast.error(error.message);
    } finally {
      this.updateActionState();
    }
  },

  renderTable() {
    const data = this.getCurrentData();
    this.tbody.innerHTML = '';

    if (data.length === 0 && !this.state.isAddingRow) {
      this.tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Không có dữ liệu</td></tr>';
      return;
    }

    const user = Auth.getUser();
    const isPGV = user && user.role === 'PGV';

    data.forEach((item, index) => {
      const tr = document.createElement('tr');
      const pendingOp = this.state.pendingOperations[item.MAKHOA];
      const statusBadge = this.getStatusBadge(pendingOp);
      const actionContent = isPGV 
        ? `<button class="btn btn-primary btn-sm" onclick="KhoaModule.startEditRow('${item.MAKHOA}')">Sửa</button>
           <button class="btn btn-danger btn-sm" onclick="KhoaModule.handleDelete('${item.MAKHOA}')">Xoá</button>`
        : `<span style="color: var(--text-muted); font-size: 13px;">Chỉ xem</span>`;

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.MAKHOA}</td>
        <td>
          ${item.TENKHOA}
          ${statusBadge}
        </td>
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
      <span style="display:inline-block; margin-left:8px; padding:2px 8px; border-radius:999px; background:rgba(59,130,246,0.12); color:var(--primary-color); font-size:12px; font-weight:600;">
        ${labelMap[pendingOp.type] || 'Chờ ghi'}
      </span>
    `;
  },

  getCurrentData() {
    const map = new Map(
      this.state.originalData.map(item => [item.MAKHOA, { ...item }])
    );

    Object.values(this.state.pendingOperations).forEach(op => {
      if (op.type === 'create' || op.type === 'update') {
        map.set(op.key, { ...op.newValue });
      } else if (op.type === 'delete') {
        map.delete(op.key);
      }
    });

    return Array.from(map.values()).sort((a, b) => a.MAKHOA.localeCompare(b.MAKHOA));
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
    const btnAdd = document.getElementById('btnAddKhoa');
    if (btnAdd) {
      btnAdd.disabled = this.state.isAddingRow || !!this.state.editingKhoaId;
    }
    this.pendingStatus.textContent = count > 0 ? `${count} thay đổi đang chờ ghi` : '';
  },

  startAddRow() {
    if (this.state.isAddingRow || this.state.editingKhoaId) {
      this.khoaFormMaKhoa?.focus();
      return;
    }

    this.state.isAddingRow = true;
    this.state.draftKhoa = { MAKHOA: '', TENKHOA: '' };
    if (this.khoaModalTitle) this.khoaModalTitle.textContent = 'Thêm khoa mới';
    if (this.khoaFormMaKhoa) this.khoaFormMaKhoa.value = '';
    if (this.khoaFormTenKhoa) this.khoaFormTenKhoa.value = '';
    this.khoaModal?.classList.add('active');
    setTimeout(() => this.khoaFormMaKhoa?.focus(), 0);
    this.updateActionState();
  },

  closeAddModal() {
    this.khoaModal?.classList.remove('active');
  },

  cancelAddRow() {
    this.state.isAddingRow = false;
    this.state.editingKhoaId = null;
    this.state.editingDraft = null;
    this.state.draftKhoa = { MAKHOA: '', TENKHOA: '' };
    if (this.khoaFormMaKhoa) this.khoaFormMaKhoa.readOnly = false;
    this.closeAddModal();
    this.renderTable();
    this.updateActionState();
  },

  startEditRow(ma) {
    if (this.state.isAddingRow) return;
    const item = this.getCurrentData().find(x => x.MAKHOA === ma);
    if (!item) {
      Toast.error('Không tìm thấy khoa để sửa');
      return;
    }
    this.state.editingKhoaId = ma;
    this.state.editingDraft = { MAKHOA: ma, TENKHOA: item.TENKHOA || '' };
    
    if (this.khoaModalTitle) this.khoaModalTitle.textContent = 'Sửa thông tin khoa';
    if (this.khoaFormMaKhoa) {
      this.khoaFormMaKhoa.value = ma;
      this.khoaFormMaKhoa.readOnly = true;
    }
    if (this.khoaFormTenKhoa) {
      this.khoaFormTenKhoa.value = item.TENKHOA || '';
    }
    this.khoaModal?.classList.add('active');
    setTimeout(() => this.khoaFormTenKhoa?.focus(), 0);
    this.updateActionState();
  },

  async handleSaveDraftRow() {
    if (this.state.editingKhoaId) {
      const ma = this.state.editingKhoaId;
      const ten = this.khoaFormTenKhoa ? this.khoaFormTenKhoa.value.trim() : '';

      if (!ten) {
        Toast.warning('Vui lòng nhập đầy đủ thông tin');
        return;
      }

      const originalItem = this.state.originalData.find(item => item.MAKHOA === ma);
      const existingPending = this.state.pendingOperations[ma];

      if (existingPending && existingPending.type === 'delete') {
        Toast.warning('Khoa này đang chờ xoá, không thể sửa');
        return;
      }

      this.pushHistory();

      if (existingPending && existingPending.type === 'create') {
        this.state.pendingOperations[ma] = {
          ...existingPending,
          newValue: { MAKHOA: ma, TENKHOA: ten }
        };
      } else {
        this.state.pendingOperations[ma] = {
          type: 'update',
          key: ma,
          oldValue: originalItem ? { ...originalItem } : { MAKHOA: ma, TENKHOA: '' },
          newValue: { MAKHOA: ma, TENKHOA: ten }
        };
      }

      const pending = this.state.pendingOperations[ma];
      if (pending && pending.type === 'update' && pending.oldValue && pending.oldValue.TENKHOA === ten) {
        delete this.state.pendingOperations[ma];
      }

      this.state.editingKhoaId = null;
      this.state.editingDraft = null;
      if (this.khoaFormMaKhoa) this.khoaFormMaKhoa.readOnly = false;
      this.closeAddModal();
      this.renderTable();
      this.updateActionState();
      Toast.success('Đã đưa thay đổi vào danh sách chờ ghi');
      return;
    }

    if (this.khoaFormMaKhoa) this.state.draftKhoa.MAKHOA = this.khoaFormMaKhoa.value;
    if (this.khoaFormTenKhoa) this.state.draftKhoa.TENKHOA = this.khoaFormTenKhoa.value;

    const ma = this.state.draftKhoa.MAKHOA.trim();
    const ten = this.state.draftKhoa.TENKHOA.trim();

    if (!ma || !ten) {
      Toast.warning('Vui lòng nhập đầy đủ thông tin khoa mới');
      return;
    }

    const currentDataMap = new Map(this.getCurrentData().map(item => [item.MAKHOA, item]));
    if (currentDataMap.has(ma)) {
      Toast.warning('Mã khoa đã tồn tại trong danh sách hiện tại');
      return;
    }

    this.pushHistory();
    this.state.pendingOperations[ma] = {
      type: 'create',
      key: ma,
      newValue: { MAKHOA: ma, TENKHOA: ten }
    };

    this.state.isAddingRow = false;
    this.state.draftKhoa = { MAKHOA: '', TENKHOA: '' };
    this.closeAddModal();
    this.renderTable();
    this.updateActionState();
    Toast.success('Đã thêm bản ghi vào danh sách chờ ghi');
  },

  async handleDelete(ma) {
    if (!confirm(`Bạn có chắc chắn muốn xoá khoa ${ma}?`)) return;

    try {
      const existingPending = this.state.pendingOperations[ma];
      if (existingPending && existingPending.type === 'delete') {
        Toast.info('Khoa này đã nằm trong danh sách chờ xoá');
        return;
      }

      this.pushHistory();

      if (existingPending && existingPending.type === 'create') {
        delete this.state.pendingOperations[ma];
      } else {
        const originalItem = this.state.originalData.find(item => item.MAKHOA === ma);
        if (!originalItem) {
          Toast.error('Không tìm thấy khoa để xoá');
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
      Toast.success('Đã đưa thao tác xoá vào danh sách chờ ghi');
    } catch (error) {
      Toast.error(error.message);
    }
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
          await API.post('/khoa/create', op.newValue);
        } else if (op.type === 'update') {
          await API.put(`/khoa/update/${op.key}`, { TENKHOA: op.newValue.TENKHOA });
        } else if (op.type === 'delete') {
          await API.delete(`/khoa/delete/${op.key}`);
        }
      }

      Toast.success('Đã ghi tất cả thay đổi thành công');
      await this.reloadAfterCommit();
    } catch (error) {
      Toast.error(`Ghi dữ liệu thất bại: ${error.message}`);
    } finally {
      this.btnCommit.textContent = 'Ghi';
      this.updateActionState();
    }
  },

  async reloadAfterCommit() {
    const keyword = this.state.searchKeyword;
    const endpoint = keyword ? `/khoa/search?keyword=${keyword}` : '/khoa';
    const response = await API.get(endpoint);
    this.state.originalData = response.success ? (response.data || []) : [];
    this.state.pendingOperations = {};
    this.state.history = [];
    this.state.isAddingRow = false;
    this.state.editingKhoaId = null;
    this.state.editingDraft = null;
    this.state.draftKhoa = { MAKHOA: '', TENKHOA: '' };
    this.renderTable();
    this.updateActionState();
  },

  escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};

// Expose to global for onclick events

window.KhoaModule.init();
