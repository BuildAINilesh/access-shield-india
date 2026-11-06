'use client';

import { useEffect, useState, type ComponentType } from 'react';

type ChatbotComponent = ComponentType;

function scheduleIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(callback, { timeout: 2500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, 1200);
  return () => window.clearTimeout(id);
}

/**
 * Loads the marketing assistant after first paint so hero/LCP is not competing
 * with speech APIs and the chat panel bundle.
 */
export function MarketingChatbotLazy() {
  const [Chatbot, setChatbot] = useState<ChatbotComponent | null>(null);

  useEffect(() => {
    const cancel = scheduleIdle(() => {
      void import('./MarketingChatbot').then((mod) => {
        setChatbot(() => mod.MarketingChatbot);
      });
    });
    return cancel;
  }, []);

  if (!Chatbot) {
    return null;
  }

  return <Chatbot />;
}
