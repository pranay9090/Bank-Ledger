import api from './api';

export const transactionService = {
  /**
   * Fetches real ledger entries / transactions for the authenticated client.
   * Sorts newest first.
   * @param {string} [accountId] - Optional specific account filter
   * @returns {Promise<Array<any>>}
   */
  async getTransactions(accountId) {
    const params = accountId ? { accountId } : {};
    const response = await api.get('/api/transactions', { params });
    const list = response.data?.transactions || response.data || [];
    // Ensure newest first sorting
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /**
   * Alias for getTransactions
   */
  async getLedgerEntries(accountId) {
    return this.getTransactions(accountId);
  },

  /**
   * Executes an atomic, double-entry transfer transaction between accounts.
   * @param {Object} params
   * @param {string} params.fromAccount - Sender Account ID
   * @param {string} params.toAccount - Recipient Account ID
   * @param {number|string} params.amount - Amount in INR
   * @param {string} params.idempotencyKey - Unique idempotency key UUID
   * @returns {Promise<{ message: string, Transaction: object }>}
   */
  async createTransfer({ fromAccount, toAccount, amount, idempotencyKey }) {
    const response = await api.post('/api/transactions', {
      fromAccount,
      toAccount,
      amount: Number(amount),
      idempotencyKey,
    });
    return response.data;
  },
};

export default transactionService;
