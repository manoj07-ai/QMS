// ============================================================
// QCMS — AI Assistant Redux Slice
// ============================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AIAssistantState, ExtractionStep, UploadedFile, RiskAssessment } from '@/types';
import { INITIAL_AI_ASSISTANT_STATE, MOCK_RISK_ASSESSMENT } from '@/data/mockData';

const initialState: AIAssistantState = INITIAL_AI_ASSISTANT_STATE;

const aiAssistantSlice = createSlice({
  name: 'aiAssistant',
  initialState,
  reducers: {
    // ─── Upload ──────────────────────────────────────────────
    setUploadState(state, action: PayloadAction<AIAssistantState['uploadState']>) {
      state.uploadState = action.payload;
    },
    setUploadProgress(state, action: PayloadAction<number>) {
      state.uploadProgress = Math.min(100, Math.max(0, action.payload));
    },
    setUploadedFile(state, action: PayloadAction<UploadedFile | null>) {
      state.uploadedFile = action.payload;
    },
    setPastedText(state, action: PayloadAction<string>) {
      state.pastedText = action.payload;
    },
    setExtractionMetrics(
      state,
      action: PayloadAction<{ task: string; count: number; total?: number }>
    ) {
      state.currentExtractionTask = action.payload.task;
      state.extractedFieldsCount = action.payload.count;
      if (action.payload.total !== undefined) {
        state.totalFieldsToExtract = action.payload.total;
      }
    },
    clearUpload(state) {
      state.uploadState = 'idle';
      state.uploadProgress = 0;
      state.uploadedFile = null;
      state.pastedText = '';
      state.extractionSteps = initialState.extractionSteps.map((s) => ({ ...s, status: 'pending' }));
      state.extractionResults = [];
      state.currentExtractionTask = 'Awaiting document upload...';
      state.extractedFieldsCount = 0;
      state.riskAssessmentState = 'waiting';
      state.riskAssessment = null;
    },

    // ─── Extraction Steps ─────────────────────────────────────
    updateExtractionStep(
      state,
      action: PayloadAction<{ id: string; updates: Partial<ExtractionStep> }>
    ) {
      const step = state.extractionSteps.find((s) => s.id === action.payload.id);
      if (step) {
        Object.assign(step, action.payload.updates);
      }
    },
    resetExtractionSteps(state) {
      state.extractionSteps = initialState.extractionSteps.map((s) => ({
        ...s,
        status: 'pending',
        confidence: undefined,
        value: undefined,
      }));
      state.extractionResults = [];
      state.currentExtractionTask = 'Initializing AI pipeline...';
      state.extractedFieldsCount = 0;
    },

    // ─── Risk Assessment ─────────────────────────────────────
    setRiskAssessmentState(
      state,
      action: PayloadAction<AIAssistantState['riskAssessmentState']>
    ) {
      state.riskAssessmentState = action.payload;
    },
    setRiskAssessment(state) {
      state.riskAssessment = MOCK_RISK_ASSESSMENT;
      state.riskAssessmentState = 'classified';
    },
    setCustomRiskAssessment(state, action: PayloadAction<RiskAssessment>) {
      state.riskAssessment = action.payload;
      state.riskAssessmentState = 'classified';
    },
    clearRiskAssessment(state) {
      state.riskAssessment = null;
      state.riskAssessmentState = 'waiting';
    },

    // ─── Completeness ─────────────────────────────────────────
    updateCompletenessItem(
      state,
      action: PayloadAction<{ id: string; isComplete: boolean }>
    ) {
      const item = state.completenessItems.find((i) => i.id === action.payload.id);
      if (item) {
        item.isComplete = action.payload.isComplete;
      }
      const required = state.completenessItems.filter((i) => i.isRequired);
      const complete = required.filter((i) => i.isComplete);
      state.completenessPercentage = Math.round((complete.length / required.length) * 100);
    },
    recalculateCompleteness(
      state,
      action: PayloadAction<Record<string, string>>
    ) {
      state.completenessItems = state.completenessItems.map((item) => ({
        ...item,
        isComplete: Boolean(action.payload[item.fieldKey]?.trim()),
      }));
      const required = state.completenessItems.filter((i) => i.isRequired);
      const complete = required.filter((i) => i.isComplete);
      state.completenessPercentage = required.length
        ? Math.round((complete.length / required.length) * 100)
        : 0;
    },
  },
});

export const {
  setUploadState,
  setUploadProgress,
  setUploadedFile,
  setPastedText,
  setExtractionMetrics,
  clearUpload,
  updateExtractionStep,
  resetExtractionSteps,
  setRiskAssessmentState,
  setRiskAssessment,
  setCustomRiskAssessment,
  clearRiskAssessment,
  updateCompletenessItem,
  recalculateCompleteness,
} = aiAssistantSlice.actions;

export default aiAssistantSlice.reducer;
