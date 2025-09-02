import { useState, useEffect, useCallback } from 'react';
import { AccountService } from '../services/accountService';
import {
  Account,
  CreateAccountRequest,
  UpdateAccountRequest,
  UpdateBalanceRequest,
  AccountListResponse,
} from '../types/account';

interface UseAccountsReturn {
  accounts: Account[];
  totalBalance: Record<string, number>;
  totalAccounts: number;
  isLoading: boolean;
  error: string | null;
  refetchAccounts: () => Promise<void>;
  createAccount: (accountData: CreateAccountRequest) => Promise<void>;
  updateAccount: (accountId: string, accountData: UpdateAccountRequest) => Promise<void>;
  updateBalance: (accountId: string, balanceData: UpdateBalanceRequest) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
}

/**
 * Hook to manage accounts data and operations
 * Handles fetching, creating, updating, and deleting accounts
 */
export const useAccounts = (): UseAccountsReturn => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState<Record<string, number>>({});
  const [totalAccounts, setTotalAccounts] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response: AccountListResponse = await AccountService.getAccounts();
      
      console.log('useAccounts fetchAccounts response:', response);
      
      setAccounts(response.accounts || []);
      setTotalBalance(response.total_balance_by_currency || {});
      setTotalAccounts(response.active_count || 0);
    } catch (err: any) {
      console.error('Error fetching accounts:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch accounts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAccount = useCallback(async (accountData: CreateAccountRequest) => {
    try {
      setError(null);
      await AccountService.createAccount(accountData);
      await fetchAccounts(); // Refresh the list
    } catch (err: any) {
      console.error('Error creating account:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to create account';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchAccounts]);

  const updateAccount = useCallback(async (accountId: string, accountData: UpdateAccountRequest) => {
    try {
      setError(null);
      await AccountService.updateAccount(accountId, accountData);
      await fetchAccounts(); // Refresh the list
    } catch (err: any) {
      console.error('Error updating account:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update account';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchAccounts]);

  const updateBalance = useCallback(async (accountId: string, balanceData: UpdateBalanceRequest) => {
    try {
      setError(null);
      await AccountService.updateBalance(accountId, balanceData);
      await fetchAccounts(); // Refresh the list
    } catch (err: any) {
      console.error('Error updating balance:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update balance';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchAccounts]);

  const deleteAccount = useCallback(async (accountId: string) => {
    try {
      setError(null);
      await AccountService.deleteAccount(accountId);
      await fetchAccounts(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting account:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to delete account';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [fetchAccounts]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    accounts,
    totalBalance,
    totalAccounts,
    isLoading,
    error,
    refetchAccounts: fetchAccounts,
    createAccount,
    updateAccount,
    updateBalance,
    deleteAccount,
  };
};

/**
 * Hook to get a single account by ID
 */
export const useAccount = (accountId: string | null) => {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccount = useCallback(async () => {
    if (!accountId) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await AccountService.getAccount(accountId);
      setAccount(response.account);
    } catch (err: any) {
      console.error('Error fetching account:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch account');
    } finally {
      setIsLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (accountId) {
      fetchAccount();
    }
  }, [fetchAccount, accountId]);

  return {
    account,
    isLoading,
    error,
    refetchAccount: fetchAccount,
  };
};
