window.DangKyModule = {
  async init() {
    this.tbody = document.querySelector('#pageContent tbody');
    await this.loadData();
  },
  async loadData() {
    try {
      this.tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Đang tải...</td></tr>';
      // Mặc định lấy sinh viên đang đăng nhập hoặc nhập mã (Giả sử N19DCCN001)
      const res = await API.get('/loptinchi'); // Tạm dùng API loptinchi chung để hiển thị danh sách
      if (res.success) {
        this.tbody.innerHTML = res.data.length === 0 
          ? '<tr><td colspan="6" style="text-align:center;">Không có lớp tín chỉ nào mở</td></tr>'
          : res.data.map((item) => `
            <tr>
              <td style="text-align:center;"><input type="checkbox"></td>
              <td>${item.MALTC}</td>
              <td>${item.TENMH || item.MAMH}</td>
              <td>${item.TENGV || item.MAGV}</td>
              <td>0</td>
              <td>${item.SOSVMIN}</td>
            </tr>`).join('');
      }
    } catch (error) { Toast.error(error.message); }
  }
};
window.DangKyModule.init();
