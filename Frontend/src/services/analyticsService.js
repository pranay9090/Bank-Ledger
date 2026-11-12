import api from './api';

export const analyticsService = {
  /**
   * Fetches high-level executive analytics overview
   * @returns {Promise<{ totalCredits: number, totalDebits: number, totalTransactions: number, creditCount: number, debitCount: number }>}
   */
  async getOverview() {
    const response = await api.get('/api/analytics/overview');
    return response.data?.data || response.data;
  },

  /**
   * Fetches monthly credit and debit totals
   * @returns {Promise<Array<{ month: string, credits: number, debits: number }>>}
   */
  async getMonthly() {
    const response = await api.get('/api/analytics/monthly');
    return response.data?.data || response.data || [];
  },

  /**
   * Fetches daily breakdown for a given date range
   * @param {string} startDate YYYY-MM-DD
   * @param {string} endDate YYYY-MM-DD
   * @returns {Promise<Array<{ date?: string, month?: string, credits: number, debits: number }>>}
   */
  async getDaily(startDate, endDate) {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await api.get('/api/analytics/daily', { params });
    const list = response.data?.data || response.data || [];
    // Normalize date property in case backend returned 'month' or 'date'
    return list.map((item) => ({
      ...item,
      date: item.date || item.month,
    }));
  },

  /**
   * Fetches chronological account statement with running balance
   * @param {string} accountId
   * @returns {Promise<Array<{ date: string, type: 'CREDIT'|'DEBIT', amount: number, balanceAfter: number }>>}
   */
  async getAccountStatement(accountId) {
    const response = await api.get(`/api/analytics/accounts/${accountId}`);
    return response.data?.data || response.data || [];
  },
};

export default analyticsService;

