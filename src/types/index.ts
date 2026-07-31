// ============================================================
// QCMS — Core TypeScript Types
// Prepared for FastAPI + LangGraph + Groq + Supabase integration
// ============================================================

// ─── Enums & Literals ───────────────────────────────────────

export type ComplaintLifecycleStatus =
  | 'pending_triage'
  | 'under_review'
  | 'investigation'
  | 'closed';

export type FormState =
  | 'empty'
  | 'ai_populated'
  | 'user_edited'
  | 'validated'
  | 'saved';

export type UploadState =
  | 'idle'
  | 'uploading'
  | 'extracting'
  | 'ai_reasoning'
  | 'completed'
  | 'error';

export type RiskAssessmentState =
  | 'waiting'
  | 'analyzing'
  | 'classified'
  | 'updated';

export type ChatState =
  | 'empty'
  | 'thinking'
  | 'streaming'
  | 'complete';

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
export type SeverityLevel = 'critical' | 'major' | 'minor' | 'observation';
export type PriorityLevel = 'urgent' | 'high' | 'normal' | 'low';
export type ComplaintSource =
  | 'customer_call'
  | 'email'
  | 'distributor'
  | 'regulatory_body'
  | 'field_representative'
  | 'online_portal';
export type ComplaintType =
  | 'product_defect'
  | 'packaging_issue'
  | 'adverse_event'
  | 'labeling_error'
  | 'contamination'
  | 'storage_complaint'
  | 'other';

// ─── Field with AI Metadata ──────────────────────────────────

export interface AiFieldMeta {
  isAiFilled: boolean;
  confidence: number; // 0–100
  isDirty: boolean;   // user has edited after AI fill
  isConfirmed: boolean;
}

export type AiField<T = string> = {
  value: T;
  meta: AiFieldMeta;
};

// ─── Complaint Form Fields ───────────────────────────────────

export interface ComplaintFormFields {
  // Section 1 — Origin & Customer Details
  complaintSource: AiField<ComplaintSource | ''>;
  customerName: AiField<string>;

  // Section 2 — Product & Batch Identification
  productName: AiField<string>;
  productStrength: AiField<string>;
  batchLotNumber: AiField<string>;
  manufacturingDate: AiField<string>;
  expiryDate: AiField<string>;
  quantityAffected: AiField<string>;

  // Section 3 — Complaint Details
  complaintType: AiField<ComplaintType | ''>;
  complaintDate: AiField<string>;
  complaintDescription: AiField<string>;

  // Section 4 — Initial Assessment & Priority
  initialSeverity: AiField<SeverityLevel | ''>;
  priority: AiField<PriorityLevel | ''>;
}

// ─── Activity Timeline Item ──────────────────────────────────

export interface ActivityItem {
  id: string;
  timestamp: string; // e.g., "09:12" or ISO
  title: string;
  description?: string;
  type: 'upload' | 'extraction' | 'risk' | 'edit' | 'validate' | 'save' | 'status';
  actor?: string; // 'AI Assistant' or 'User'
}

// ─── Complaint (Saved Entity) ────────────────────────────────

export interface Complaint {
  id: string;
  complaintNumber: string;
  lifecycleStatus: ComplaintLifecycleStatus;
  formState: FormState;
  fields: ComplaintFormFields;
  createdAt: string;
  updatedAt: string;
}

// ─── Extraction Progress ─────────────────────────────────────

export interface ExtractionStep {
  id: string;
  label: string;
  status: 'pending' | 'extracting' | 'done' | 'failed';
  confidence?: number;
  value?: string;
  subLabel?: string;
}

export interface ExtractionResult {
  fieldKey: keyof ComplaintFormFields;
  value: string;
  confidence: number;
}

// ─── Risk Assessment & Explainability ────────────────────────

export interface ContributingFactor {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
}

export interface RiskAssessment {
  riskLevel: RiskLevel;
  confidence: number; // 0–100
  severity: SeverityLevel;
  suggestedActions: string[];
  complaintSummary: string;
  rationale: string;
  reasoningBullets: string[];
  topContributingFactors: ContributingFactor[];
  assessedAt: string;
}

// ─── Completeness Checker ────────────────────────────────────

export interface CompletenessItem {
  id: string;
  label: string;
  fieldKey: keyof ComplaintFormFields;
  isComplete: boolean;
  isRequired: boolean;
}

// ─── Chat ────────────────────────────────────────────────────

export type ChatMessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface SuggestedPrompt {
  id: string;
  label: string;
  prompt: string;
}

// ─── Upload ──────────────────────────────────────────────────

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  pageCount?: number;
  uploadedAt: string;
}

// ─── Validation Result for Save Gate ─────────────────────────

export interface ValidationItem {
  field: string;
  label: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errorsCount: number;
  warningsCount: number;
  validatedAt: string;
  items: ValidationItem[];
}

// ─── Alert / Notification ────────────────────────────────────

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AppAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  autoDismiss?: boolean;
}

// ─── Store Shape ─────────────────────────────────────────────

export interface ComplaintState {
  current: Complaint;
  formState: FormState;
  isSaving: boolean;
  savedAt: string | null;
  validationErrors: Partial<Record<keyof ComplaintFormFields, string>>;
  validationResult: ValidationResult | null;
  isValidated: boolean;
  showValidationModal: boolean;
  timeline: ActivityItem[];
  alerts: AppAlert[];
}

export interface AIAssistantState {
  uploadState: UploadState;
  uploadProgress: number;
  uploadedFile: UploadedFile | null;
  pastedText: string;
  extractionSteps: ExtractionStep[];
  extractionResults: ExtractionResult[];
  currentExtractionTask: string;
  extractedFieldsCount: number;
  totalFieldsToExtract: number;
  riskAssessmentState: RiskAssessmentState;
  riskAssessment: RiskAssessment | null;
  completenessItems: CompletenessItem[];
  completenessPercentage: number;
}

export interface ChatSliceState {
  chatState: ChatState;
  messages: ChatMessage[];
  currentStreamText: string;
  suggestedPrompts: SuggestedPrompt[];
  inputValue: string;
}
