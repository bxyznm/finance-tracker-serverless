import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  CreateCardRequest, 
  UpdateCardRequest,
  CardTransaction,
  CardPayment 
} from '../types/card';
import { cardService } from '../services/cardService';

// =============================================================================
// CARDS HOOKS
// =============================================================================

// Query Keys
export const CARDS_QUERY_KEYS = {
  all: ['cards'] as const,
  lists: () => [...CARDS_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: any) => [...CARDS_QUERY_KEYS.lists(), filters] as const,
  details: () => [...CARDS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CARDS_QUERY_KEYS.details(), id] as const,
};

// Hook to get all cards
export const useCards = (params?: { status?: string; type?: string }) => {
  return useQuery({
    queryKey: CARDS_QUERY_KEYS.list(params),
    queryFn: () => cardService.getCards(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get a specific card
export const useCard = (cardId: string) => {
  return useQuery({
    queryKey: CARDS_QUERY_KEYS.detail(cardId),
    queryFn: () => cardService.getCard(cardId),
    enabled: !!cardId,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to create a new card
export const useCreateCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardData: CreateCardRequest) => cardService.createCard(cardData),
    onSuccess: (newCard) => {
      // Invalidate and refetch cards list
      queryClient.invalidateQueries({ queryKey: CARDS_QUERY_KEYS.lists() });
      
      // Add new card to cache
      queryClient.setQueryData(
        CARDS_QUERY_KEYS.detail(newCard.card_id),
        newCard
      );

      toast.success(`Card "${newCard.name}" created successfully!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to create card';
      toast.error(message);
    },
  });
};

// Hook to update a card
export const useUpdateCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, cardData }: { cardId: string; cardData: UpdateCardRequest }) =>
      cardService.updateCard(cardId, cardData),
    onSuccess: (updatedCard, variables) => {
      // Update card in cache
      queryClient.setQueryData(
        CARDS_QUERY_KEYS.detail(variables.cardId),
        updatedCard
      );

      // Invalidate cards list to ensure consistency
      queryClient.invalidateQueries({ queryKey: CARDS_QUERY_KEYS.lists() });

      toast.success(`Card "${updatedCard.name}" updated successfully!`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to update card';
      toast.error(message);
    },
  });
};

// Hook to delete a card
export const useDeleteCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) => cardService.deleteCard(cardId),
    onSuccess: (_, cardId) => {
      // Remove card from cache
      queryClient.removeQueries({ queryKey: CARDS_QUERY_KEYS.detail(cardId) });

      // Invalidate cards list
      queryClient.invalidateQueries({ queryKey: CARDS_QUERY_KEYS.lists() });

      toast.success('Card deleted successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to delete card';
      toast.error(message);
    },
  });
};

// Hook to add a transaction to a card
export const useAddCardTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, transaction }: { cardId: string; transaction: CardTransaction }) =>
      cardService.addTransaction(cardId, transaction),
    onSuccess: (response, variables) => {
      // Invalidate and refetch cards to update balances
      queryClient.invalidateQueries({ queryKey: CARDS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CARDS_QUERY_KEYS.detail(variables.cardId) });

      toast.success(`Transaction added. New balance: ${response.new_balance.toFixed(2)}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to add transaction';
      toast.error(message);
    },
  });
};

// Hook to make a payment towards a card
export const useCardPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, payment }: { cardId: string; payment: CardPayment }) =>
      cardService.makePayment(cardId, payment),
    onSuccess: (response, variables) => {
      // Invalidate and refetch cards to update balances
      queryClient.invalidateQueries({ queryKey: CARDS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CARDS_QUERY_KEYS.detail(variables.cardId) });

      toast.success(
        `Payment of $${response.payment_amount.toFixed(2)} processed. New balance: $${response.new_balance.toFixed(2)}`
      );
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to process payment';
      toast.error(message);
    },
  });
};

// Combined hook for all card operations
export const useCardOperations = () => {
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();
  const addTransaction = useAddCardTransaction();
  const makePayment = useCardPayment();

  return {
    createCard,
    updateCard,
    deleteCard,
    addTransaction,
    makePayment,
  };
};

// Utility hook for card statistics
export const useCardStats = () => {
  const { data: cardsData, isLoading } = useCards({ status: 'active' });

  if (isLoading || !cardsData) {
    return {
      totalCards: 0,
      totalDebt: {},
      totalAvailableCredit: {},
      cardsDueSoon: 0,
      expiredCards: 0,
      isLoading: true,
    };
  }

  const cardsDueSoon = cardsData.cards.filter(
    card => card.days_until_due && card.days_until_due <= 7
  ).length;

  const expiredCards = cardsData.cards.filter(card => card.is_expired).length;

  return {
    totalCards: cardsData.total_count,
    activeCards: cardsData.active_count,
    totalDebt: cardsData.total_debt_by_currency,
    totalAvailableCredit: cardsData.total_available_credit,
    cardsDueSoon,
    expiredCards,
    isLoading: false,
  };
};
