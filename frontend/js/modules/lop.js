window.LopModule = {
  async init() {
    this.tbody = document.querySelector('#pageContent tbody');
    this.bindEvents();
    await this.loadData();
  },
  bindEvents() {
    const user = Auth.getUser();
    const isPGV = user && user.role === 'PGV';
    const btnAdd = document.getElementById('btnAddLop');
    if (btnAdd) {
      if (isPGV) {
        // Trong dự án thật sẽ bind event mở Modal thêm lớp
        btnAdd.onclick = () => Toast.info('Chức năng thêm lớp của PGV');
      } else {
        btnAdd.style.display = 'none';
      }
    }
  },
  async loadData() {
    try {
      this.tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Đang tải...</td></tr>';
      const res = await API.get('/lop');
      if (res.success) {
        const user = Auth.getUser();
        const isPGV = user && user.role === 'PGV';
        
        this.tbody.innerHTML = res.data.length === 0 
          ? '<tr><td colspan="6" style="text-align:center;">Không có dữ liệu</td></tr>'
          : res.data.map((item, index) => {
            const actionBtn = isPGV
              ? `<button class="btn btn-secondary btn-sm">Sửa</button>`
              : `<span style="color: var(--text-muted); font-size: 13px;">Chỉ xem</span>`;
            return `
            <tr>
              <td>${index + 1}</td>
              <td>${item.MALOP}</td>
              <td>${item.TENLOP}</td>
              <td>${item.KHOAHOC}</td>
              <td>${item.MAKHOA}</td>
              <td>${actionBtn}</td>
            </tr>`;
          }).join('');
      }
    } catch (error) { Toast.error(error.message); }
  }
};
window.LopModule.init();
