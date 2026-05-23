/* ====================================
   AUTHENTICATION LOGIC
   File: js/auth.js
==================================== */

class AuthManager {
  static async login(username, password, serverId = 'server1') {
    try {
      const response = await window.API.post('/auth/login', {
        username,
        password,
        serverId,
      });
      
      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        // Lưu serverId để các request tiếp theo sử dụng
        localStorage.setItem('serverId', response.data.user.serverId || serverId);
        return response.data;
      }
      throw new Error('Đăng nhập thất bại');
    } catch (error) {
      throw error;
    }
  }

  static logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('serverId');
    window.location.href = 'login.html';
  }

  static checkAuth() {
    const token = localStorage.getItem('token');
    const isLoginPage = window.location.pathname.includes('login.html');

    if (!token && !isLoginPage) {
      window.location.href = 'login.html';
    } else if (token && isLoginPage) {
      window.location.href = 'index.html';
    }
  }

  static getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  static getServerId() {
    return localStorage.getItem('serverId') || 'server1';
  }
}

window.Auth = AuthManager;
