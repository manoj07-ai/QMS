// ============================================================
// QCMS — Chat Redux Slice
// ============================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ChatSliceState, ChatMessage } from '@/types';
import { INITIAL_CHAT_STATE } from '@/data/mockData';
import { v4 as uuidv4 } from 'uuid';

// Mock AI streaming responses keyed by prompt intent
const MOCK_AI_RESPONSES: Record<string, string> = {
  summarize: `This complaint involves **MedCare Distributors Pvt. Ltd.** reporting discoloration and unusual odor in **240 units** of Amoxicillin Trihydrate 500 mg, Batch AMX-2026-B047. Affected capsules show a brownish tint and a musty smell. Storage conditions were reportedly compliant. The complaint was received via email on July 28, 2026.`,
  high_risk: `This complaint is classified as **High Risk** for the following reasons:\n\n1. **Multi-attribute deviation** — Both color and odor are affected, suggesting a systematic quality failure rather than isolated cosmetic variation.\n2. **Scale of impact** — 240 units across 12 blister packs indicates a batch-level issue, not isolated unit defects.\n3. **Product category** — Amoxicillin is a critical antibiotic; potency or purity degradation could pose patient safety risks.\n4. **Storage compliance** — The customer confirmed proper storage, eliminating mishandling as a cause and pointing to manufacturing or stability failure.`,
  missing: `The following information appears incomplete or missing:\n\n✓ **Customer Name** — Provided\n✓ **Product Name & Batch** — Provided\n⚠ **Quantity Affected** — Provided but should include SKU unit type\n⚠ **Manufacturing Date** — AI-extracted; requires user confirmation\n✗ **Regulatory Status** — Not specified (whether product is under active regulatory review)\n✗ **Distribution Channel** — Not captured (region/territory of distribution)\n\nRecommend collecting distribution details and confirming all AI-extracted dates before saving.`,
  default: `I can help you analyze this complaint, review risk classifications, check for missing information, or explain QMS workflow steps. What would you like to know?`,
};

function getAiResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('summarize') || lower.includes('summary')) return MOCK_AI_RESPONSES.summarize;
  if (lower.includes('high risk') || lower.includes('why')) return MOCK_AI_RESPONSES.high_risk;
  if (lower.includes('missing') || lower.includes('incomplete')) return MOCK_AI_RESPONSES.missing;
  return MOCK_AI_RESPONSES.default;
}

const chatSlice = createSlice({
  name: 'chat',
  initialState: INITIAL_CHAT_STATE,
  reducers: {
    setInputValue(state, action: PayloadAction<string>) {
      state.inputValue = action.payload;
    },

    sendMessage(state, action: PayloadAction<string>) {
      const text = action.payload.trim();
      if (!text) return;

      // Add user message
      state.messages.push({
        id: uuidv4(),
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      });

      state.inputValue = '';
      state.chatState = 'thinking';
      state.currentStreamText = '';
    },

    startStreaming(state, action: PayloadAction<string>) {
      // The full response text is determined outside
      state.chatState = 'streaming';
      state.currentStreamText = action.payload;
    },

    appendStreamChunk(state, action: PayloadAction<string>) {
      state.currentStreamText += action.payload;
    },

    finalizeStream(state) {
      if (state.currentStreamText) {
        state.messages.push({
          id: uuidv4(),
          role: 'assistant',
          content: state.currentStreamText,
          timestamp: new Date().toISOString(),
        });
        state.currentStreamText = '';
      }
      state.chatState = 'complete';
    },

    clearChat(state) {
      state.messages = INITIAL_CHAT_STATE.messages;
      state.chatState = 'empty';
      state.currentStreamText = '';
      state.inputValue = '';
    },
  },
});

export const {
  setInputValue,
  sendMessage,
  startStreaming,
  appendStreamChunk,
  finalizeStream,
  clearChat,
} = chatSlice.actions;

export { getAiResponse };
export default chatSlice.reducer;
