import api from './api';

export const accountService = {
  /**
   * Retrieves user's financial account and derives live balance.
   * Auto-provisions an account if none exists for the authenticated user.
   * @returns {Promise<{ _id: string, user: string, status: string, currency: string, balance: number }>}
   */
  async getAccount() {
    const response = await api.get('/api/account');
    let account = response.data.account;

    // Auto-provision if user does not have an active account yet
    if (!account) {
      const createRes = await api.post('/api/account');
      account = createRes.data.account;
    }

    // Derive live balance from ledger entries
    if (account?._id) {
      try {
        const balanceRes = await api.get(`/api/account/balance/${account._id}`);
        account.balance = Number(balanceRes.data.balance ?? 0);
      } catch {
        account.balance = 0;
      }
    } else if (account) {
      account.balance = 0;
    }

    return account;
  },

  /**
   * Manually creates a new account for the authenticated user
   */
  async createAccount() {
    const response = await api.post('/api/account');
    return response.data.account;
  },

  /**
   * Fetches real-time aggregated balance for a specific account ID
   * @param {string} accountId
   */
  async getAccountBalance(accountId) {
    const response = await api.get(`/api/account/balance/${accountId}`);
    return response.data;
  },
};

export default accountService;

