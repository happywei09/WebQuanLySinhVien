/* ====================================
   AUTHENTICATION LOGIC
   File: js/auth.js
==================================== */

class AuthManager {
  static async login(username, password) {
    try {
      const response = await window.API.post('/auth/login', { username, password });
      
      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
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
}

window.Auth = AuthManager;
