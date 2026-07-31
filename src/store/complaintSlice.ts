// ============================================================
// QCMS — Complaint Redux Slice
// ============================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  ComplaintState,
  ComplaintFormFields,
  ComplaintLifecycleStatus,
  AppAlert,
  AiFieldMeta,
  ActivityItem,
  ValidationResult,
  ValidationItem,
} from '@/types';
import {
  INITIAL_COMPLAINT,
  MOCK_AI_POPULATED_FIELDS,
  INITIAL_TIMELINE,
} from '@/data/mockData';
import { v4 as uuidv4 } from 'uuid';

const initialState: ComplaintState = {
  current: INITIAL_COMPLAINT,
  formState: 'empty',
  isSaving: false,
  savedAt: null,
  validationErrors: {},
  validationResult: null,
  isValidated: false,
  showValidationModal: false,
  timeline: INITIAL_TIMELINE,
  alerts: [],
};

const REQUIRED_FIELDS: { key: keyof ComplaintFormFields; label: string }[] = [
  { key: 'customerName', label: 'Customer Name' },
  { key: 'complaintSource', label: 'Complaint Source' },
  { key: 'productName', label: 'Product Name' },
  { key: 'batchLotNumber', label: 'Batch / Lot Number' },
  { key: 'complaintDate', label: 'Complaint Date' },
  { key: 'complaintDescription', label: 'Complaint Description' },
  { key: 'initialSeverity', label: 'Initial Severity' },
];

function getFormattedTime(): string {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const complaintSlice = createSlice({
  name: 'complaint',
  initialState,
  reducers: {
    addTimelineItem(
      state,
      action: PayloadAction<Omit<ActivityItem, 'id' | 'timestamp'>>
    ) {
      state.timeline.unshift({
        id: uuidv4(),
        timestamp: getFormattedTime(),
        ...action.payload,
      });
    },

    updateField<K extends keyof ComplaintFormFields>(
      state: ComplaintState,
      action: PayloadAction<{ key: K; value: ComplaintFormFields[K]['value'] }>
    ) {
      const { key, value } = action.payload;
      const field = state.current.fields[key] as { value: unknown; meta: AiFieldMeta };
      const previousValue = field.value;
      field.value = value;

      if (field.meta.isAiFilled && !field.meta.isConfirmed) {
        if (!field.meta.isDirty) {
          field.meta.isDirty = true;
          state.timeline.unshift({
            id: uuidv4(),
            timestamp: getFormattedTime(),
            title: `User edited ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
            description: `Modified from AI value "${previousValue}" to "${value}".`,
            type: 'edit',
            actor: 'User',
          });
        }
      }

      if (state.formState === 'empty' || state.formState === 'ai_populated') {
        state.formState = field.meta.isAiFilled && !field.meta.isDirty ? 'ai_populated' : 'user_edited';
      } else if (state.formState !== 'saved') {
        state.formState = 'user_edited';
      }

      state.isValidated = false;
      state.validationResult = null;
      delete state.validationErrors[key];
      state.current.updatedAt = new Date().toISOString();
    },

    applyComplaintPatch(
      state,
      action: PayloadAction<{
        updatedFields: Record<string, string>;
        activityTitle?: string;
        activityDescription?: string;
      }>
    ) {
      const { updatedFields, activityTitle, activityDescription } = action.payload;

      Object.entries(updatedFields).forEach(([feKey, val]) => {
        const key = feKey as keyof ComplaintFormFields;
        if (key in state.current.fields) {
          state.current.fields[key] = {
            value: val as never,
            meta: {
              isAiFilled: true,
              isDirty: true,
              isConfirmed: false,
              confidence: 95,
            },
          };
        }
      });

      state.formState = 'user_edited';
      state.current.updatedAt = new Date().toISOString();

      const title = activityTitle || `AI updated ${Object.keys(updatedFields).length} field(s)`;
      const description = activityDescription || `Updated values: ${JSON.stringify(updatedFields)}`;

      state.timeline.unshift({
        id: uuidv4(),
        timestamp: getFormattedTime(),
        title,
        description,
        type: 'edit',
        actor: 'AI Assistant',
      });
    },

    confirmAiField(state, action: PayloadAction<keyof ComplaintFormFields>) {
      const field = state.current.fields[action.payload] as { value: unknown; meta: AiFieldMeta };
      field.meta.isConfirmed = true;
      field.meta.isDirty = false;
    },

    populateFromAI(state) {
      state.current.fields = MOCK_AI_POPULATED_FIELDS;
      state.formState = 'ai_populated';
      state.current.updatedAt = new Date().toISOString();
      state.timeline.unshift({
        id: uuidv4(),
        timestamp: getFormattedTime(),
        title: 'AI extraction completed',
        description: '13 complaint fields automatically populated with confidence scores.',
        type: 'extraction',
        actor: 'AI Assistant',
      });
    },

    setLifecycleStatus(state, action: PayloadAction<ComplaintLifecycleStatus>) {
      const oldStatus = state.current.lifecycleStatus;
      state.current.lifecycleStatus = action.payload;
      if (oldStatus !== action.payload) {
        state.timeline.unshift({
          id: uuidv4(),
          timestamp: getFormattedTime(),
          title: `Status changed to ${action.payload.replace('_', ' ').toUpperCase()}`,
          description: `Updated status from ${oldStatus}.`,
          type: 'status',
          actor: 'User',
        });
      }
    },

    runValidationGate(state) {
      const errors: Partial<Record<keyof ComplaintFormFields, string>> = {};
      const validationItems: ValidationItem[] = [];

      for (const item of REQUIRED_FIELDS) {
        const field = state.current.fields[item.key] as { value: string; meta: AiFieldMeta };
        if (!field.value || String(field.value).trim() === '') {
          errors[item.key] = `${item.label} is required`;
          validationItems.push({
            field: item.key,
            label: item.label,
            message: `${item.label} must be specified before saving.`,
            type: 'error',
          });
        } else {
          validationItems.push({
            field: item.key,
            label: item.label,
            message: field.meta.isAiFilled && !field.meta.isDirty
              ? `Populated by AI (${field.meta.confidence}% confidence)`
              : field.meta.isDirty
              ? 'User modified & verified'
              : 'User entered & verified',
            type: 'info',
          });
        }
      }

      const expiry = state.current.fields.expiryDate;
      if (!expiry.value) {
        validationItems.push({
          field: 'expiryDate',
          label: 'Expiry Date',
          message: 'Expiry date is missing. Recommended for batch recall processing.',
          type: 'warning',
        });
      }

      const errorsCount = Object.keys(errors).length;
      const warningsCount = validationItems.filter((i) => i.type === 'warning').length;
      const isValid = errorsCount === 0;

      const result: ValidationResult = {
        isValid,
        errorsCount,
        warningsCount,
        validatedAt: new Date().toISOString(),
        items: validationItems,
      };

      state.validationErrors = errors;
      state.validationResult = result;
      state.isValidated = isValid;
      state.showValidationModal = true;

      if (isValid) {
        state.formState = 'validated';
        state.timeline.unshift({
          id: uuidv4(),
          timestamp: getFormattedTime(),
          title: 'Validation passed',
          description: 'All 7 mandatory QMS quality rules passed successfully.',
          type: 'validate',
          actor: 'QMS Engine',
        });
      } else {
        state.timeline.unshift({
          id: uuidv4(),
          timestamp: getFormattedTime(),
          title: 'Validation failed',
          description: `${errorsCount} error(s) prevented complaint submission.`,
          type: 'validate',
          actor: 'QMS Engine',
        });
      }
    },

    closeValidationModal(state) {
      state.showValidationModal = false;
    },

    startSave(state) {
      state.isSaving = true;
    },

    saveSuccess(state) {
      state.isSaving = false;
      state.formState = 'saved';
      state.showValidationModal = false;
      state.savedAt = new Date().toISOString();
      state.current.id = state.current.id || uuidv4();
      state.current.complaintNumber = state.current.complaintNumber.endsWith('-0')
        ? `QCM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
        : state.current.complaintNumber;

      state.timeline.unshift({
        id: uuidv4(),
        timestamp: getFormattedTime(),
        title: 'Complaint saved',
        description: `Complaint ${state.current.complaintNumber} permanently logged to QMS repository.`,
        type: 'save',
        actor: 'User',
      });

      state.alerts.push({
        id: uuidv4(),
        type: 'success',
        title: 'Complaint Logged Successfully',
        message: `Complaint ${state.current.complaintNumber} has been logged and assigned to Quality Assurance.`,
        autoDismiss: true,
      });
    },

    saveFailure(state, action: PayloadAction<string>) {
      state.isSaving = false;
      state.alerts.push({
        id: uuidv4(),
        type: 'error',
        title: 'Save Failed',
        message: action.payload,
        autoDismiss: false,
      });
    },

    resetForm(state) {
      state.current = { ...INITIAL_COMPLAINT, id: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      state.formState = 'empty';
      state.isSaving = false;
      state.savedAt = null;
      state.validationErrors = {};
      state.validationResult = null;
      state.isValidated = false;
      state.showValidationModal = false;
      state.timeline = [
        {
          id: uuidv4(),
          timestamp: getFormattedTime(),
          title: 'Form reset',
          description: 'Complaint form cleared to default state.',
          type: 'status',
          actor: 'User',
        },
      ];
    },

    addAlert(state, action: PayloadAction<Omit<AppAlert, 'id'>>) {
      state.alerts.push({ ...action.payload, id: uuidv4() });
    },

    dismissAlert(state, action: PayloadAction<string>) {
      state.alerts = state.alerts.filter((a) => a.id !== action.payload);
    },
  },
});

export const {
  addTimelineItem,
  updateField,
  applyComplaintPatch,
  confirmAiField,
  populateFromAI,
  setLifecycleStatus,
  runValidationGate,
  closeValidationModal,
  startSave,
  saveSuccess,
  saveFailure,
  resetForm,
  addAlert,
  dismissAlert,
} = complaintSlice.actions;

export default complaintSlice.reducer;
