import { create } from 'zustand';
import { CardIdentificationResult, ConditionGradingResult } from '../types/ai';

type ScanStep = 'idle' | 'capturing' | 'uploading' | 'identifying' | 'grading' | 'confirming' | 'pricing' | 'saving' | 'done';

interface ScanState {
  step: ScanStep;
  frontUri: string | null;
  backUri: string | null;
  identification: CardIdentificationResult | null;
  grading: ConditionGradingResult | null;
  userEdits: Partial<CardIdentificationResult> | null;
  error: string | null;

  setStep: (step: ScanStep) => void;
  setFrontUri: (uri: string) => void;
  setBackUri: (uri: string | null) => void;
  setIdentification: (result: CardIdentificationResult) => void;
  setGrading: (result: ConditionGradingResult) => void;
  setUserEdits: (edits: Partial<CardIdentificationResult>) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  step: 'idle' as ScanStep,
  frontUri: null,
  backUri: null,
  identification: null,
  grading: null,
  userEdits: null,
  error: null,
};

export const useScanStore = create<ScanState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setFrontUri: (uri) => set({ frontUri: uri }),
  setBackUri: (uri) => set({ backUri: uri }),
  setIdentification: (result) => set({ identification: result }),
  setGrading: (result) => set({ grading: result }),
  setUserEdits: (edits) => set({ userEdits: edits }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
