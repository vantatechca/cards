import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../utils/queryKeys';
import { Card } from '../types/card';
import { priceCard } from '../services/pricing/pricingEngine';
import * as priceCheckRepo from '../services/supabase/priceCheckRepository';

export function usePriceCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (card: Card) =>
      priceCard({
        card_id: card.id,
        card_name: card.card_name,
        set_name: card.set_name,
        collection_type: card.collection_type,
        card_number: card.card_number,
        edition: card.edition,
        condition_psa_estimate: card.condition_psa_estimate,
        ai_confidence_identification: card.ai_confidence_identification,
      }),
    onSuccess: (_, card) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pricing.card(card.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.detail(card.id) });
    },
  });
}

export function usePriceHistory(cardId: string) {
  return useQuery({
    queryKey: queryKeys.pricing.history(cardId),
    queryFn: () => priceCheckRepo.getPriceChecksForCard(cardId),
    enabled: !!cardId,
  });
}
