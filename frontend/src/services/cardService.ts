import { 
  Card, 
  CreateCardRequest, 
  UpdateCardRequest,
  CardListResponse,
  CardResponse,
  CardTransaction,
  CardPayment 
} from '../types/card';
import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

// =============================================================================
// CARD SERVICE
// =============================================================================

export const cardService = {
  // Get all cards for the authenticated user
  getCards: async (params?: {
    status?: string;
    type?: string;
  }): Promise<CardListResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.status) {
      queryParams.append('status', params.status);
    }
    if (params?.type) {
      queryParams.append('type', params.type);
    }
    
    const url = queryParams.toString() 
      ? `/cards?${queryParams.toString()}` 
      : '/cards';
      
    const response = await apiGet<CardListResponse>(url);
    return response.data;
  },

  // Get a specific card by ID
  getCard: async (cardId: string): Promise<Card> => {
    const response = await apiGet<CardResponse>(`/cards/${cardId}`);
    return response.data.card;
  },

  // Create a new card
  createCard: async (cardData: CreateCardRequest): Promise<Card> => {
    const response = await apiPost<CardResponse>('/cards', cardData);
    return response.data.card;
  },

  // Update an existing card
  updateCard: async (cardId: string, cardData: UpdateCardRequest): Promise<Card> => {
    const response = await apiPut<CardResponse>(`/cards/${cardId}`, cardData);
    return response.data.card;
  },

  // Delete a card
  deleteCard: async (cardId: string): Promise<void> => {
    await apiDelete(`/cards/${cardId}`);
  },

  // Add a transaction to a card
  addTransaction: async (cardId: string, transaction: CardTransaction): Promise<{
    message: string;
    new_balance: number;
  }> => {
    const response = await apiPost(`/cards/${cardId}/transactions`, transaction);
    return response.data;
  },

  // Make a payment towards a card
  makePayment: async (cardId: string, payment: CardPayment): Promise<{
    message: string;
    payment_amount: number;
    new_balance: number;
  }> => {
    const response = await apiPost(`/cards/${cardId}/payment`, payment);
    return response.data;
  }
};

export default cardService;
