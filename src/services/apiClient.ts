// ============================================================
// QCMS — Frontend API Client (FastAPI Integration)
// ============================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function extractComplaintFromBackend(formDataOrText: FormData | { text: string }) {
  try {
    let response;
    if (formDataOrText instanceof FormData) {
      response = await fetch(`${API_BASE_URL}/complaints/extract`, {
        method: 'POST',
        body: formDataOrText,
      });
    } else {
      const body = new URLSearchParams();
      body.append('text', formDataOrText.text);
      response = await fetch(`${API_BASE_URL}/complaints/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('FastAPI backend unreachable, using client pipeline fallback:', error);
    return null;
  }
}

export async function validateComplaintWithBackend(fields: Record<string, unknown>) {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('FastAPI validation fallback:', error);
    return null;
  }
}

export async function saveComplaintToBackend(payload: Record<string, unknown>) {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('FastAPI save fallback:', error);
    return null;
  }
}

export async function sendChatMessageToBackend(payload: Record<string, unknown>) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('FastAPI chat fallback:', error);
    return null;
  }
}
