// ============================================================
// QCMS — Mock Data & Initial State
// ============================================================

import type {
  Complaint,
  AIAssistantState,
  ChatSliceState,
  ExtractionStep,
  CompletenessItem,
  SuggestedPrompt,
  RiskAssessment,
  ComplaintFormFields,
  ActivityItem,
} from '@/types';

function emptyField<T>(value: T) {
  return {
    value,
    meta: { isAiFilled: false, confidence: 0, isDirty: false, isConfirmed: false },
  };
}

export const INITIAL_TIMELINE: ActivityItem[] = [
  {
    id: 'act-0',
    timestamp: '09:00',
    title: 'Complaint session initialized',
    description: 'New complaint entry created in Pending Triage state.',
    type: 'status',
    actor: 'User',
  },
];

export const INITIAL_COMPLAINT_FIELDS: ComplaintFormFields = {
  complaintSource: emptyField(''),
  customerName: emptyField(''),
  productName: emptyField(''),
  productStrength: emptyField(''),
  batchLotNumber: emptyField(''),
  manufacturingDate: emptyField(''),
  expiryDate: emptyField(''),
  quantityAffected: emptyField(''),
  complaintType: emptyField(''),
  complaintDate: emptyField(''),
  complaintDescription: emptyField(''),
  initialSeverity: emptyField(''),
  priority: emptyField(''),
};

export const INITIAL_COMPLAINT: Complaint = {
  id: '',
  complaintNumber: 'QCM-2026-0',
  lifecycleStatus: 'pending_triage',
  formState: 'empty',
  fields: INITIAL_COMPLAINT_FIELDS,
  createdAt: '2026-07-30T09:00:00Z',
  updatedAt: '2026-07-30T09:00:00Z',
};

export const MOCK_AI_POPULATED_FIELDS: ComplaintFormFields = {
  complaintSource: {
    value: 'email',
    meta: { isAiFilled: true, confidence: 94, isDirty: false, isConfirmed: false },
  },
  customerName: {
    value: 'MedCare Distributors Pvt. Ltd.',
    meta: { isAiFilled: true, confidence: 96, isDirty: false, isConfirmed: false },
  },
  productName: {
    value: 'Amoxicillin Trihydrate',
    meta: { isAiFilled: true, confidence: 98, isDirty: false, isConfirmed: false },
  },
  productStrength: {
    value: '500 mg / Capsule',
    meta: { isAiFilled: true, confidence: 91, isDirty: false, isConfirmed: false },
  },
  batchLotNumber: {
    value: 'AMX-2026-B047',
    meta: { isAiFilled: true, confidence: 99, isDirty: false, isConfirmed: false },
  },
  manufacturingDate: {
    value: '2026-01-15',
    meta: { isAiFilled: true, confidence: 87, isDirty: false, isConfirmed: false },
  },
  expiryDate: {
    value: '2028-01-14',
    meta: { isAiFilled: true, confidence: 85, isDirty: false, isConfirmed: false },
  },
  quantityAffected: {
    value: '240 units',
    meta: { isAiFilled: true, confidence: 88, isDirty: false, isConfirmed: false },
  },
  complaintType: {
    value: 'product_defect',
    meta: { isAiFilled: true, confidence: 92, isDirty: false, isConfirmed: false },
  },
  complaintDate: {
    value: '2026-07-28',
    meta: { isAiFilled: true, confidence: 97, isDirty: false, isConfirmed: false },
  },
  complaintDescription: {
    value:
      'Customer reports discoloration and unusual odor in batch AMX-2026-B047. Approximately 240 capsules across 12 blister packs exhibit a brownish tint, significantly deviating from the white standard. Additionally, an atypical musty smell was noted upon opening sealed cartons. Products were stored under recommended conditions (15–25°C, <60% RH). Customer requests immediate investigation and replacement shipment.',
    meta: { isAiFilled: true, confidence: 93, isDirty: false, isConfirmed: false },
  },
  initialSeverity: {
    value: 'major',
    meta: { isAiFilled: true, confidence: 89, isDirty: false, isConfirmed: false },
  },
  priority: {
    value: 'high',
    meta: { isAiFilled: true, confidence: 86, isDirty: false, isConfirmed: false },
  },
};

export const MOCK_RISK_ASSESSMENT: RiskAssessment = {
  riskLevel: 'high',
  confidence: 87,
  severity: 'major',
  topContributingFactors: [
    {
      factor: 'Physical Attribute Deviation',
      impact: 'high',
      description: 'Dual discoloration & atypical odor indicates active chemical degradation or contamination.',
    },
    {
      factor: 'Batch Scale Impact',
      impact: 'high',
      description: '240 units across 12 blister packs confirms batch-level quality impact.',
    },
    {
      factor: 'Critical Formulation Category',
      impact: 'medium',
      description: 'Oral antibiotic formulation poses systemic efficacy & safety risks if degraded.',
    },
    {
      factor: 'Storage Compliance Verified',
      impact: 'low',
      description: 'Confirmed label-compliant storage (15–25°C), eliminating distributor mishandling.',
    },
  ],
  reasoningBullets: [
    'Discoloration (brownish tint) combined with odor deviation in an antibiotic product indicates active chemical degradation or cross-contamination.',
    'Affected quantity (240 capsules across 12 packs) confirms a batch manufacturing or stability issue rather than an isolated single-unit failure.',
    'Customer confirmed storage compliance according to label recommendations (15–25°C), ruling out improper handling at the distribution center.',
    'Risk model assigned 87% confidence rating based on historical OOS resolution trends for beta-lactam stability failures.',
  ],
  suggestedActions: [
    'Initiate batch recall evaluation under SOP-QA-031',
    'Quarantine remaining inventory from batch AMX-2026-B047',
    'Notify QA Head and Regulatory Affairs within 24 hours',
    'Collect retained samples for OOS testing',
    'Issue acknowledgement to customer within 2 business days',
  ],
  complaintSummary:
    'Distributor-reported quality complaint involving discoloration and odor deviation in 240 units of Amoxicillin Trihydrate 500 mg (Batch AMX-2026-B047). Storage compliance confirmed. Immediate QMS investigation triggered.',
  rationale:
    'Dual sensory defect (color + odor) in a finished oral solid dosage batch elevates severity to Major and Risk Level to High under GMP Annex 16 guidelines.',
  assessedAt: '2026-07-30T09:00:00Z',
};

export const MOCK_EXTRACTION_STEPS: ExtractionStep[] = [
  { id: 'ext-1', label: 'Upload received', subLabel: 'File validated & ingested', status: 'pending' },
  { id: 'ext-2', label: 'Reading complaint document', subLabel: 'Parsing text & metadata', status: 'pending' },
  { id: 'ext-3', label: 'Extracting customer details', subLabel: 'Name & source channel', status: 'pending' },
  { id: 'ext-4', label: 'Identifying product', subLabel: 'Product name & strength', status: 'pending' },
  { id: 'ext-5', label: 'Detecting batch information', subLabel: 'Batch lot, Mfg & Expiry dates', status: 'pending' },
  { id: 'ext-6', label: 'Classifying complaint', subLabel: 'Type, date & description', status: 'pending' },
  { id: 'ext-7', label: 'Generating AI risk assessment', subLabel: 'Multi-factor severity scoring', status: 'pending' },
  { id: 'ext-8', label: 'Creating complaint summary', subLabel: 'Synthesizing concise overview', status: 'pending' },
  { id: 'ext-9', label: 'Completed', subLabel: 'All fields populated & verified', status: 'pending' },
];

export const MOCK_COMPLETENESS_ITEMS: CompletenessItem[] = [
  { id: 'ci-1', label: 'Customer Name', fieldKey: 'customerName', isComplete: false, isRequired: true },
  { id: 'ci-2', label: 'Complaint Source', fieldKey: 'complaintSource', isComplete: false, isRequired: true },
  { id: 'ci-3', label: 'Product Name', fieldKey: 'productName', isComplete: false, isRequired: true },
  { id: 'ci-4', label: 'Batch Number', fieldKey: 'batchLotNumber', isComplete: false, isRequired: true },
  { id: 'ci-5', label: 'Complaint Date', fieldKey: 'complaintDate', isComplete: false, isRequired: true },
  { id: 'ci-6', label: 'Description', fieldKey: 'complaintDescription', isComplete: false, isRequired: true },
  { id: 'ci-7', label: 'Severity', fieldKey: 'initialSeverity', isComplete: false, isRequired: true },
  { id: 'ci-8', label: 'Expiry Date', fieldKey: 'expiryDate', isComplete: false, isRequired: false },
  { id: 'ci-9', label: 'Quantity Affected', fieldKey: 'quantityAffected', isComplete: false, isRequired: false },
];

export const MOCK_CHAT_MESSAGES = [
  {
    id: 'msg-sys-1',
    role: 'assistant' as const,
    content:
      'Hello! I\'m your AI Complaint Assistant. Ask me anything about this complaint, risk level, missing details, or suggested SOP investigation steps.',
    timestamp: '09:00',
  },
];

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { id: 'sp-1', label: 'Summarize complaint', prompt: 'Summarize this complaint in 2-3 sentences.' },
  { id: 'sp-2', label: 'Why High Risk?', prompt: 'Why is this complaint classified as High Risk?' },
  { id: 'sp-3', label: 'What info is missing?', prompt: 'What information is missing or incomplete?' },
  { id: 'sp-4', label: 'Suggest investigation steps', prompt: 'What SOP investigation steps are recommended?' },
  { id: 'sp-5', label: 'Explain the severity', prompt: 'Explain the severity classification rationale.' },
];

export const INITIAL_AI_ASSISTANT_STATE: AIAssistantState = {
  uploadState: 'idle',
  uploadProgress: 0,
  uploadedFile: null,
  pastedText: '',
  extractionSteps: MOCK_EXTRACTION_STEPS,
  extractionResults: [],
  currentExtractionTask: 'Awaiting document upload...',
  extractedFieldsCount: 0,
  totalFieldsToExtract: 8,
  riskAssessmentState: 'waiting',
  riskAssessment: null,
  completenessItems: MOCK_COMPLETENESS_ITEMS,
  completenessPercentage: 0,
};

export const INITIAL_CHAT_STATE: ChatSliceState = {
  chatState: 'empty',
  messages: MOCK_CHAT_MESSAGES,
  currentStreamText: '',
  suggestedPrompts: SUGGESTED_PROMPTS,
  inputValue: '',
};

export const COMPLAINT_SOURCE_OPTIONS = [
  { value: 'customer_call', label: 'Customer Call' },
  { value: 'email', label: 'Email' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'regulatory_body', label: 'Regulatory Body' },
  { value: 'field_representative', label: 'Field Representative' },
  { value: 'online_portal', label: 'Online Portal' },
];

export const COMPLAINT_TYPE_OPTIONS = [
  { value: 'product_defect', label: 'Product Defect' },
  { value: 'packaging_issue', label: 'Packaging Issue' },
  { value: 'adverse_event', label: 'Adverse Event' },
  { value: 'labeling_error', label: 'Labeling Error' },
  { value: 'contamination', label: 'Contamination' },
  { value: 'storage_complaint', label: 'Storage Complaint' },
  { value: 'other', label: 'Other' },
];

export const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
  { value: 'observation', label: 'Observation' },
];

export const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

export const LIFECYCLE_STATUS_CONFIG = {
  pending_triage: { label: 'Pending Triage', color: 'warning' as const },
  under_review: { label: 'Under Review', color: 'info' as const },
  investigation: { label: 'Investigation', color: 'primary' as const },
  closed: { label: 'Closed', color: 'success' as const },
};
