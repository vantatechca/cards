import { NavigatorScreenParams } from '@react-navigation/native';
import { Card } from './card';
import { CardIdentificationResult, ConditionGradingResult } from './ai';

// Bottom tab param lists
export type CollectionStackParamList = {
  CollectionGrid: undefined;
  CardDetail: { cardId: string };
  CardEdit: { cardId: string };
};

export type ScanStackParamList = {
  Camera: undefined;
  Confirmation: {
    frontUri: string;
    backUri?: string;
    identification?: CardIdentificationResult;
    grading?: ConditionGradingResult;
  };
};

export type DashboardStackParamList = {
  Dashboard: undefined;
  SellDecision: undefined;
};

export type SearchStackParamList = {
  Search: undefined;
  CardDetail: { cardId: string };
  CardEdit: { cardId: string };
};

export type SettingsStackParamList = {
  Settings: undefined;
  BatchReprice: undefined;
};

// Root
export type RootTabParamList = {
  CollectionTab: NavigatorScreenParams<CollectionStackParamList>;
  ScanTab: NavigatorScreenParams<ScanStackParamList>;
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  SearchTab: NavigatorScreenParams<SearchStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

export type RootStackParamList = {
  Lock: undefined;
  Onboarding: undefined;
  Main: NavigatorScreenParams<RootTabParamList>;
};
