/* ====================================
   CHANGE PASSWORD MODULE
   File: js/modules/doimatkhau.js
==================================== */

window.ChangePasswordModule = {
  init() {
    this.cacheDOM();
    this.bindEvents();
  },

  cacheDOM() {
    this.form = document.getElementById('changePasswordForm');
    this.inputOld = document.getElementById('oldPassword');
    this.inputNew = document.getElementById('newPassword');
    this.inputConfirm = document.getElementById('confirmPassword');
    this.btnSubmit = document.getElementById('btnChangePassword');
  },

  bindEvents() {
    this.btnSubmit.addEventListener('click', () => this.handleSubmit());
  },

  async handleSubmit() {
    const oldPassword = this.inputOld.value;
    const newPassword = this.inputNew.value;
    const confirmPassword = this.inputConfirm.value;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return Toast.warning('Vui lòng điền đầy đủ các ô mật khẩu');
    }

    if (newPassword.length < 3) {
      return Toast.warning('Mật khẩu mới phải có tối thiểu 3 ký tự');
    }

    if (newPassword !== confirmPassword) {
      return Toast.warning('Xác nhận mật khẩu mới không trùng khớp');
    }

    try {
      this.btnSubmit.disabled = true;
      
      const res = await API.post('/auth/change-password', {
        oldPassword,
        newPassword
      });

      if (res.success) {
        Toast.success('Đổi mật khẩu tài khoản thành công!');
        this.form.reset();
      } else {
        Toast.error(res.message || 'Thay đổi mật khẩu không thành công');
      }
    } catch (error) {
      console.error(error);
      Toast.error(error.message || 'Lỗi xảy ra khi gửi yêu cầu lên máy chủ');
    } finally {
      this.btnSubmit.disabled = false;
    }
  }
};

if (document.getElementById('changePasswordForm')) {
  window.ChangePasswordModule.init();
} else {
  document.addEventListener('pageLoaded', (e) => {
    if (e.detail.pageId === 'doimatkhau') window.ChangePasswordModule.init();
  });
}
