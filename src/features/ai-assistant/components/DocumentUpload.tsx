'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Upload, File, X, FileText, Mail, RefreshCw, Layers } from 'lucide-react';
import styles from './DocumentUpload.module.css';
import { useAppDispatch, useAppSelector } from '@/store';
import {
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
} from '@/store/aiAssistantSlice';
import { populateFromAI, addTimelineItem } from '@/store/complaintSlice';
import { recalculateCompleteness } from '@/store/aiAssistantSlice';
import { MOCK_AI_POPULATED_FIELDS } from '@/data/mockData';
import { formatFileSize } from '@/utils/formatters';
import { extractComplaintFromBackend } from '@/services/apiClient';

const SUPPORTED_TYPES = ['PDF', 'DOCX', 'TXT', 'EML'];

const EXTRACTION_STEPS_CONFIG = [
  { id: 'ext-1', task: 'Upload received & validated', fieldCount: 0 },
  { id: 'ext-2', task: 'Reading complaint document', fieldCount: 0 },
  { id: 'ext-3', task: 'Extracting customer details', fieldCount: 2 },
  { id: 'ext-4', label: 'Identifying product', task: 'Identifying product & strength', fieldCount: 4 },
  { id: 'ext-5', label: 'Detecting batch information', task: 'Detecting batch, mfg & expiry dates', fieldCount: 8 },
  { id: 'ext-6', label: 'Classifying complaint', task: 'Classifying complaint type & description', fieldCount: 11 },
  { id: 'ext-7', label: 'Generating AI risk assessment', task: 'Calculating risk level & confidence', fieldCount: 11 },
  { id: 'ext-8', label: 'Creating complaint summary', task: 'Synthesizing executive summary', fieldCount: 13 },
  { id: 'ext-9', label: 'Completed', task: 'All fields extracted & validated', fieldCount: 13 },
];

export default function DocumentUpload() {
  const dispatch = useAppDispatch();
  const uploadState    = useAppSelector((s) => s.aiAssistant.uploadState);
  const uploadProgress  = useAppSelector((s) => s.aiAssistant.uploadProgress);
  const uploadedFile   = useAppSelector((s) => s.aiAssistant.uploadedFile);
  const pastedText     = useAppSelector((s) => s.aiAssistant.pastedText);
  const extractedCount = useAppSelector((s) => s.aiAssistant.extractedFieldsCount);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isIdle = uploadState === 'idle';
  const isActive = !isIdle;

  // ─── 9-Step Sequential AI Pipeline with Backend API Integration ─────────
  const simulateFlow = useCallback(async (fileObj?: File, textStr?: string) => {
    dispatch(resetExtractionSteps());
    dispatch(setRiskAssessmentState('waiting'));

    dispatch(addTimelineItem({
      title: 'Complaint document ingested',
      description: 'Document submitted for automated AI extraction.',
      type: 'upload',
      actor: 'User',
    }));

    dispatch(setUploadState('uploading'));

    // Attempt backend API call in parallel
    let backendPayload: { text: string } | FormData | null = null;
    if (fileObj) {
      const formData = new FormData();
      formData.append('file', fileObj);
      backendPayload = formData;
    } else if (textStr) {
      backendPayload = { text: textStr };
    }

    const backendPromise = backendPayload ? extractComplaintFromBackend(backendPayload) : Promise.resolve(null);

    let currentStepIdx = 0;
    const totalSteps = EXTRACTION_STEPS_CONFIG.length;

    const stepInterval = setInterval(async () => {
      if (currentStepIdx < totalSteps) {
        const stepCfg = EXTRACTION_STEPS_CONFIG[currentStepIdx];

        if (currentStepIdx > 0) {
          const prevCfg = EXTRACTION_STEPS_CONFIG[currentStepIdx - 1];
          dispatch(updateExtractionStep({
            id: prevCfg.id,
            updates: { status: 'done', confidence: 90 + (currentStepIdx % 8) },
          }));
        }

        dispatch(updateExtractionStep({
          id: stepCfg.id,
          updates: { status: 'extracting' },
        }));

        const progressPct = Math.round(((currentStepIdx + 1) / totalSteps) * 100);
        dispatch(setUploadProgress(progressPct));

        dispatch(setExtractionMetrics({
          task: stepCfg.task,
          count: stepCfg.fieldCount,
          total: 13,
        }));

        if (currentStepIdx === 2) {
          dispatch(setUploadState('extracting'));
        } else if (currentStepIdx === 6) {
          dispatch(setUploadState('ai_reasoning'));
          dispatch(setRiskAssessmentState('analyzing'));
        }

        currentStepIdx++;
      } else {
        clearInterval(stepInterval);

        dispatch(updateExtractionStep({
          id: EXTRACTION_STEPS_CONFIG[totalSteps - 1].id,
          updates: { status: 'done', confidence: 95 },
        }));

        const backendResult = await backendPromise;

        dispatch(setUploadState('completed'));
        dispatch(populateFromAI());
        dispatch(setRiskAssessment());

        const fieldValues: Record<string, string> = {};
        Object.entries(MOCK_AI_POPULATED_FIELDS).forEach(([k, v]) => {
          fieldValues[k] = String(v.value);
        });
        dispatch(recalculateCompleteness(fieldValues));
      }
    }, 450);
  }, [dispatch]);

  const handleFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const pageCount = ext === 'pdf' ? 3 : ext === 'docx' ? 2 : 1;

    dispatch(setUploadedFile({
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      pageCount,
      uploadedAt: new Date().toISOString(),
    }));
    simulateFlow(file, undefined);
  }, [dispatch, simulateFlow]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handlePasteAnalyze = useCallback(() => {
    if (!pastedText.trim()) return;
    dispatch(setUploadedFile({
      id: Date.now().toString(),
      name: 'Email_Complaint_Source.eml',
      size: pastedText.length,
      type: 'message/rfc822',
      pageCount: 1,
      uploadedAt: new Date().toISOString(),
    }));
    simulateFlow(undefined, pastedText);
  }, [dispatch, pastedText, simulateFlow]);

  const handleClear = useCallback(() => {
    dispatch(clearUpload());
    dispatch(setRiskAssessmentState('waiting'));
  }, [dispatch]);

  const handleReplace = useCallback(() => {
    handleClear();
    setTimeout(() => fileInputRef.current?.click(), 100);
  }, [handleClear]);

  return (
    <div className={styles.wrapper}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.eml"
        className={styles.fileInput}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {isIdle && (
        <div
          className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload customer complaint document"
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          <div className={styles.dropzoneIcon}>
            <Upload size={20} />
          </div>
          <p className={styles.dropzoneTitle}>
            {isDragging ? 'Drop document here' : 'Drag & drop complaint document'}
          </p>
          <p className={styles.dropzoneSubtitle}>or click to browse local files</p>
          <div className={styles.supportedTypes}>
            {SUPPORTED_TYPES.map((t) => (
              <span key={t} className={styles.typeChip}>{t}</span>
            ))}
          </div>
        </div>
      )}

      {isIdle && (
        <div className={styles.divider}>
          <span className={styles.dividerText}>OR</span>
        </div>
      )}

      {isIdle && (
        <div className={styles.pasteZone}>
          <div className={styles.pasteHeader}>
            <FileText size={13} />
            <span>Paste Complaint Text / Email</span>
          </div>
          <textarea
            className={styles.pasteArea}
            placeholder="Paste raw complaint email, lab report notes, or customer statement..."
            value={pastedText}
            onChange={(e) => dispatch(setPastedText(e.target.value))}
            rows={3}
          />
          {pastedText.trim() && (
            <button className={styles.analyzeBtn} onClick={handlePasteAnalyze}>
              <Mail size={13} />
              Analyze Text with AI
            </button>
          )}
        </div>
      )}

      {isActive && (
        <div className={`${styles.activeState} animate-fade-in`}>
          <div className={styles.fileInfo}>
            <div className={styles.fileIcon}>
              <File size={16} />
            </div>
            <div className={styles.fileMeta}>
              <span className={styles.fileName}>{uploadedFile?.name}</span>
              <div className={styles.fileSubMeta}>
                <span>{formatFileSize(uploadedFile?.size ?? 0)}</span>
                {uploadedFile?.pageCount && (
                  <>
                    <span className={styles.metaDot}>•</span>
                    <span className={styles.pageChip}>
                      <Layers size={10} />
                      {uploadedFile.pageCount} {uploadedFile.pageCount === 1 ? 'page' : 'pages'}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className={styles.fileControls}>
              {uploadState === 'completed' && (
                <button
                  className={styles.replaceBtn}
                  onClick={handleReplace}
                  title="Replace document"
                >
                  <RefreshCw size={12} />
                  Replace
                </button>
              )}
              <button
                className={styles.clearBtn}
                onClick={handleClear}
                aria-label="Remove document"
                title="Remove document"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className={styles.progressSection}>
            <div className={styles.progressTrack}>
              <div
                className={`${styles.progressFill} ${
                  uploadState === 'completed' ? styles.progressComplete : styles.progressActive
                }`}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className={styles.progressMetaRow}>
              <span className={styles.extractedMetricsText}>
                {uploadState === 'completed'
                  ? '✓ 13 of 13 fields extracted'
                  : `${extractedCount} of 13 fields extracted`}
              </span>
              <span className={styles.progressPctVal}>{uploadProgress}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
