// ============================================================
// QCMS — Redux Store
// ============================================================

import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import complaintReducer from './complaintSlice';
import aiAssistantReducer from './aiAssistantSlice';
import chatReducer from './chatSlice';

export const store = configureStore({
  reducer: {
    complaint: complaintReducer,
    aiAssistant: aiAssistantReducer,
    chat: chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Allow file objects in state during upload simulation
        ignoredPaths: ['aiAssistant.uploadedFile'],
      },
    }),
});

// ─── Typed Hooks ─────────────────────────────────────────────

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
