import api from './api';

export const authService = {
  /**
   * Register a new client account
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ message: string, user: object, token: string }>}
   */
  async register(name, email, password) {
    const response = await api.post('/api/auth/register', {
      name,
      email,
      password,
    });
    return response.data;
  },

  /**
   * Authenticate existing client credentials
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ message: string, user: object, token: string }>}
   */
  async login(email, password) {
    const response = await api.post('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  /**
   * Terminate current client session
   * @returns {Promise<{ message: string }>}
   */
  async logout() {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },
};

export default authService;

