import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../utils/queryKeys';
import { Card, CollectionType } from '../types/card';
import * as cardRepo from '../services/supabase/cardRepository';

export function useCards(collectionType?: CollectionType) {
  return useQuery({
    queryKey: queryKeys.cards.list(collectionType),
    queryFn: () => cardRepo.getCards(collectionType),
  });
}

export function useCard(id: string) {
  return useQuery({
    queryKey: queryKeys.cards.detail(id),
    queryFn: () => cardRepo.getCardById(id),
    enabled: !!id,
  });
}

export function useSearchCards(query: string) {
  return useQuery({
    queryKey: queryKeys.cards.search(query),
    queryFn: () => cardRepo.searchCards(query),
    enabled: query.length >= 2,
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Card>) => cardRepo.createCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.summary.all });
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Card> }) =>
      cardRepo.updateCard(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.all });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cardRepo.deleteCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.summary.all });
    },
  });
}

export function useDeleteAllCards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cardRepo.deleteAllCards(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.summary.all });
    },
  });
}
