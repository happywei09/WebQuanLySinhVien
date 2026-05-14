window.LopModule = {
  async init() {
    this.tbody = document.querySelector('#pageContent tbody');
    await this.loadData();
  },
  async loadData() {
    try {
      this.tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Đang tải...</td></tr>';
      const res = await API.get('/lop');
      if (res.success) {
        this.tbody.innerHTML = res.data.length === 0 
          ? '<tr><td colspan="6" style="text-align:center;">Không có dữ liệu</td></tr>'
          : res.data.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.MALOP}</td>
              <td>${item.TENLOP}</td>
              <td>${item.KHOAHOC}</td>
              <td>${item.MAKHOA}</td>
              <td><button class="btn btn-secondary btn-sm">Sửa</button></td>
            </tr>`).join('');
      }
    } catch (error) { Toast.error(error.message); }
  }
};
window.LopModule.init();
