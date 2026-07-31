'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { Bot, User } from 'lucide-react';
import styles from './ChatAssistant.module.css';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  sendMessage,
  startStreaming,
  appendStreamChunk,
  finalizeStream,
  setInputValue,
  getAiResponse,
} from '@/store/chatSlice';
import { applyComplaintPatch } from '@/store/complaintSlice';
import { setCustomRiskAssessment, recalculateCompleteness } from '@/store/aiAssistantSlice';
import { sendChatMessageToBackend } from '@/services/apiClient';
import { formatRelativeTime } from '@/utils/formatters';

function ChatMessage({
  role,
  content,
  timestamp,
  isStreaming,
}: {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}) {
  const isAssistant = role === 'assistant';

  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (/^\d+\.\s/.test(line)) {
        return <p key={i} className={styles.listItem} dangerouslySetInnerHTML={{ __html: formatted }} />;
      }
      if (/^[✓✗⚠]\s/.test(line)) {
        return <p key={i} className={styles.checkItem} dangerouslySetInnerHTML={{ __html: formatted }} />;
      }
      if (!line.trim()) return <br key={i} />;
      return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div className={`${styles.message} ${isAssistant ? styles.messageAssistant : styles.messageUser}`}>
      <div className={`${styles.avatar} ${isAssistant ? styles.avatarAi : styles.avatarUser}`}>
        {isAssistant ? <Bot size={13} /> : <User size={13} />}
      </div>
      <div className={styles.bubble}>
        <div className={`${styles.bubbleContent} ${isStreaming ? styles.streaming : ''}`}>
          {renderContent(content)}
        </div>
        <span className={styles.timestamp}>{formatRelativeTime(timestamp)}</span>
      </div>
    </div>
  );
}

export default function ChatAssistant() {
  const dispatch = useAppDispatch();
  const messages = useAppSelector((s) => s.chat.messages);
  const chatState = useAppSelector((s) => s.chat.chatState);
  const streamText = useAppSelector((s) => s.chat.currentStreamText);
  const inputValue = useAppSelector((s) => s.chat.inputValue);
  const suggestedPrompts = useAppSelector((s) => s.chat.suggestedPrompts);

  const complaintFields = useAppSelector((s) => s.complaint.current.fields);
  const riskAssessment = useAppSelector((s) => s.aiAssistant.riskAssessment);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText, chatState]);

  const handleSend = useCallback(async (text?: string) => {
    const txt = (text ?? inputValue).trim();
    if (!txt || chatState === 'thinking' || chatState === 'streaming') return;

    dispatch(sendMessage(txt));

    const currentContext: Record<string, string> = {};
    Object.entries(complaintFields).forEach(([k, v]) => {
      currentContext[k] = String(v.value);
    });

    const backendPayload = {
      query: txt,
      complaint_context: currentContext,
      risk_context: riskAssessment || {},
      chat_history: messages.map((m) => ({ id: m.id, role: m.role, content: m.content, timestamp: m.timestamp })),
    };

    const backendRes = await sendChatMessageToBackend(backendPayload);

    if (backendRes && backendRes.content) {
      if (backendRes.mode === 'edit' && backendRes.updated_frontend_fields) {
        dispatch(applyComplaintPatch({
          updatedFields: backendRes.updated_frontend_fields,
          activityTitle: backendRes.activity_item?.title,
          activityDescription: backendRes.activity_item?.description,
        }));

        if (backendRes.recalculated_risk) {
          dispatch(setCustomRiskAssessment(backendRes.recalculated_risk));
        }

        const updatedFieldsMap = { ...currentContext, ...backendRes.updated_frontend_fields };
        dispatch(recalculateCompleteness(updatedFieldsMap));
      }

      const fullResponse = backendRes.content;
      const words = fullResponse.split(' ');
      let wordIdx = 0;

      dispatch(startStreaming(''));
      const streamInterval = setInterval(() => {
        if (wordIdx < words.length) {
          dispatch(appendStreamChunk((wordIdx === 0 ? '' : ' ') + words[wordIdx]));
          wordIdx++;
        } else {
          clearInterval(streamInterval);
          setTimeout(() => dispatch(finalizeStream()), 150);
        }
      }, 30);
    } else {
      const lower = txt.toLowerCase();
      let fallbackText = getAiResponse(txt);

      if (lower.includes('change batch') || lower.includes('batch number')) {
        const match = txt.match(/batch\s+(?:number\s+)?to\s+([A-Za-z0-9\-]+)/i);
        const newBatch = match ? match[1] : 'AMX-2026-B099';
        dispatch(applyComplaintPatch({
          updatedFields: { batchLotNumber: newBatch },
          activityTitle: 'Pharma Complaint AI updated Batch Number',
          activityDescription: `Updated Batch Number to "${newBatch}" via AI Chat command.`
        }));
        dispatch(recalculateCompleteness({ ...currentContext, batchLotNumber: newBatch }));
        fallbackText = `I updated the Batch Number to ${newBatch}. All other complaint information has been preserved.`;
      } else if (lower.includes('quantity') || lower.includes('units')) {
        const match = txt.match(/(\d+\s*units|\d+)/i);
        const newQty = match ? match[1] : '500 units';
        const formattedQty = newQty.includes('units') ? newQty : `${newQty} units`;
        dispatch(applyComplaintPatch({
          updatedFields: { quantityAffected: formattedQty },
          activityTitle: 'Pharma Complaint AI updated Quantity Affected',
          activityDescription: `Updated Quantity Affected to "${formattedQty}" via AI Chat command.`
        }));
        dispatch(recalculateCompleteness({ ...currentContext, quantityAffected: formattedQty }));
        fallbackText = `I updated the Quantity Affected to ${formattedQty}. All other complaint information has been preserved.`;
      } else if (lower.includes('customer name') || lower.includes('customer')) {
        const match = txt.match(/customer\s+(?:name\s+)?to\s+([^.]+)/i) || txt.match(/customer\s+name\s+should\s+be\s+([^.]+)/i);
        const newCust = match ? match[1].trim() : 'Apollo Pharmacy';
        dispatch(applyComplaintPatch({
          updatedFields: { customerName: newCust },
          activityTitle: 'Pharma Complaint AI updated Customer Name',
          activityDescription: `Updated Customer Name to "${newCust}" via AI Chat command.`
        }));
        dispatch(recalculateCompleteness({ ...currentContext, customerName: newCust }));
        fallbackText = `I updated the Customer Name to ${newCust}. All other complaint information has been preserved.`;
      }

      const words = fallbackText.split(' ');
      let wordIdx = 0;

      dispatch(startStreaming(''));
      const streamInterval = setInterval(() => {
        if (wordIdx < words.length) {
          dispatch(appendStreamChunk((wordIdx === 0 ? '' : ' ') + words[wordIdx]));
          wordIdx++;
        } else {
          clearInterval(streamInterval);
          setTimeout(() => dispatch(finalizeStream()), 150);
        }
      }, 30);
    }
  }, [chatState, complaintFields, dispatch, inputValue, messages, riskAssessment]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = chatState === 'thinking' || chatState === 'streaming';

  return (
    <div className={styles.wrapper}>
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}><Bot size={14} /></div>
          <div>
            <p className={styles.headerTitle}>Pharma Complaint AI Chat Assistant</p>
            <p className={styles.headerSub}>Ask QA questions or request field edits</p>
          </div>
        </div>
        <div className={styles.stateIndicator}>
          {chatState === 'thinking'  && <><span className={styles.thinkingDot} />Thinking</>}
          {chatState === 'streaming' && <><span className={styles.streamingDot} />Streaming</>}
          {chatState === 'complete'  && <><span className={styles.readyDot} />Ready</>}
          {chatState === 'empty'     && <><span className={styles.readyDot} />Ready</>}
        </div>
      </div>

      {/* ─── Messages ───────────────────────────────────────── */}
      <div className={styles.messages}>
        {messages.map((msg) => (
          <ChatMessage key={msg.id} {...msg} />
        ))}

        {chatState === 'thinking' && (
          <div className={`${styles.message} ${styles.messageAssistant} animate-fade-in`}>
            <div className={`${styles.avatar} ${styles.avatarAi}`}><Bot size={13} /></div>
            <div className={styles.bubble}>
              <div className={styles.thinkingBubble}>
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        {chatState === 'streaming' && streamText && (
          <ChatMessage
            role="assistant"
            content={streamText}
            timestamp={new Date().toISOString()}
            isStreaming
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Suggested Prompts ──────────────────────────────── */}
      {(messages.length <= 1) && (
        <div className={styles.prompts}>
          {suggestedPrompts.map((p) => (
            <button
              key={p.id}
              className={styles.promptBtn}
              onClick={() => handleSend(p.prompt)}
              disabled={isDisabled}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* ─── Input Area ─────────────────────────────────────── */}
      <div className={styles.inputArea}>
        <textarea
          className={styles.input}
          placeholder="Ask questions or edit fields (e.g. 'Change batch number to AMX-2026-B099')..."
          value={inputValue}
          onChange={(e) => dispatch(setInputValue(e.target.value))}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          rows={1}
        />
        <button
          className={`${styles.sendBtn} ${isDisabled ? styles.sendBtnDisabled : ''}`}
          onClick={() => handleSend()}
          disabled={isDisabled || !inputValue.trim()}
          aria-label="Send message"
        >
          {isDisabled ? (
            <span className={styles.spinner} />
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* ─── Quick Prompts ──────────────────────────────────── */}
      {messages.length > 1 && (
        <div className={styles.quickPrompts}>
          {suggestedPrompts.map((p) => (
            <button
              key={p.id}
              className={styles.quickPromptBtn}
              onClick={() => handleSend(p.prompt)}
              disabled={isDisabled}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
