import React, { useState, useRef, useEffect, useCallback } from 'react';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { useToast } from '../context/ToastContext';
import api, { apiUrl, authHeaders } from '../api/client';
import { Trash } from '../components/ui/icons';

const SUGGESTED_PROMPTS = [
  'What should I eat for dinner?',
  'Replace chicken with another protein source.',
  'I missed my workout. What should I do?',
  'How can I increase my protein intake?',
  'How am I doing on my goal?',
  'What can I do to recover faster after leg day?'
];

const timeOf = (iso) =>
  (iso ? new Date(iso) : new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Renders **bold** inside a line as <strong>, without using raw HTML.
function InlineText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4
      ? <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
      : <React.Fragment key={i}>{part}</React.Fragment>
  );
}

// Minimal markdown: paragraphs, "-"/"*" bullets, numbered lists, headings and bold.
function FormattedMessage({ text }) {
  const blocks = [];
  let list = null;

  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  text.split('\n').forEach((raw) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    if (bullet || numbered) {
      const type = bullet ? 'ul' : 'ol';
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push(bullet ? bullet[1] : numbered[2]);
      return;
    }
    flushList();
    if (line.trim()) blocks.push({ type: 'p', text: line.replace(/^#+\s*/, '') });
  });
  flushList();

  return (
    <div className="space-y-2">
      {blocks.map((b, i) => {
        if (b.type === 'p') return <p key={i}><InlineText text={b.text} /></p>;
        const Tag = b.type;
        return (
          <Tag key={i} className={`pl-5 space-y-1 ${b.type === 'ul' ? 'list-disc' : 'list-decimal'}`}>
            {b.items.map((item, j) => <li key={j}><InlineText text={item} /></li>)}
          </Tag>
        );
      })}
    </div>
  );
}

export default function AskReppView() {
  const { showToast } = useToast();

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [clearing, setClearing] = useState(false);
  const chatEndRef = useRef(null);
  const abortRef = useRef(null);

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.get('/chat/history');
      setConversationId(res?.conversationId || null);
      setMessages((res?.messages || []).map(m => ({ id: m.id, sender: m.sender, text: m.text, time: timeOf(m.createdAt) })));
    } catch (err) {
      showToast(err.message || 'Failed to load chat history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateLastAi = (updater) =>
    setMessages(prev => {
      const next = [...prev];
      const idx = next.length - 1;
      if (idx >= 0 && next[idx].sender === 'ai') next[idx] = updater(next[idx]);
      return next;
    });

  const handleSend = async (textToSend) => {
    const text = (textToSend ?? inputText).trim();
    if (!text || isStreaming) return;

    setInputText('');
    setMessages(prev => [
      ...prev,
      { id: `u-${Date.now()}`, sender: 'user', text, time: timeOf() },
      { id: `a-${Date.now()}`, sender: 'ai', text: '', time: timeOf(), pending: true }
    ]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(apiUrl('/chat/stream'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: JSON.stringify({ message: text, conversationId }),
        signal: controller.signal
      });

      if (!res.ok || !res.body) {
        let msg = `Request failed (${res.status})`;
        try {
          const data = await res.json();
          msg = data?.details?.[0]?.message || data?.error || msg;
        } catch { /* not JSON */ }
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const handleEvent = (raw) => {
        const dataLine = raw.split('\n').find(l => l.startsWith('data:'));
        if (!dataLine) return;
        let evt;
        try { evt = JSON.parse(dataLine.slice(5).trim()); } catch { return; }
        if (evt.chunk) updateLastAi(m => ({ ...m, text: m.text + evt.chunk, pending: false }));
        if (evt.error) updateLastAi(m => ({ ...m, text: evt.error, pending: false, isError: true }));
        if (evt.done) {
          if (evt.conversationId) setConversationId(evt.conversationId);
          updateLastAi(m => ({ ...m, id: evt.messageId || m.id, pending: false }));
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sep;
        while ((sep = buffer.indexOf('\n\n')) !== -1) {
          handleEvent(buffer.slice(0, sep));
          buffer = buffer.slice(sep + 2);
        }
      }
      if (buffer.trim()) handleEvent(buffer);
    } catch (err) {
      if (err.name === 'AbortError') {
        updateLastAi(m => ({ ...m, text: m.text ? `${m.text}\n\n(Stopped.)` : 'Stopped.', pending: false }));
      } else {
        updateLastAi(m => ({ ...m, text: err.message || 'Something went wrong. Please try again.', pending: false, isError: true }));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => abortRef.current?.abort();

  const handleClear = async () => {
    if (!window.confirm('Clear your whole conversation with the coach?')) return;
    setClearing(true);
    try {
      await api.delete('/chat/clear');
      await loadHistory();
      showToast('Conversation cleared.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to clear chat', 'error');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="bg-surface border border-line rounded-sm p-6 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              <span>Ask REPP: AI fitness coach</span>
              <span className="text-[10px] font-bold bg-brand text-on-brand px-2 py-0.5 rounded-sm">Live</span>
            </h2>
            <p className="text-xs text-muted">Knows your goals, today's meals, water and workout, plus your diet preferences and injuries.</p>
          </div>
        </div>
        <button
          onClick={handleClear}
          disabled={clearing || isStreaming || messages.length <= 1}
          className="px-3 py-2 bg-subtle hover:bg-subtle-hover border border-line rounded-sm text-xs font-semibold text-muted hover:text-ink transition cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {clearing ? null : <Trash className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Clear chat</span>
        </button>
      </div>

      {/* Suggested prompts */}
      <div className="shrink-0 space-y-2">
        <span className="text-[11px] font-bold text-muted uppercase flex items-center gap-1.5">
           Suggested Coach Prompts:
        </span>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              disabled={isStreaming}
              className="text-xs bg-surface hover:bg-subtle text-ink border border-line hover:border-brand px-3.5 py-1.5 rounded-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 bg-surface border border-line rounded-sm p-6 overflow-y-auto space-y-4" aria-live="polite">
        {loadingHistory ? (
          <div className="space-y-4" role="status" aria-label="Loading conversation">
            <div className="skeleton h-16 w-2/3" />
            <div className="skeleton h-10 w-1/2 ml-auto" />
            <div className="skeleton h-20 w-3/4" />
          </div>
        ) : (
          messages.map((m) => {
            const isAI = m.sender === 'ai';
            return (
              <div key={m.id} className={`flex items-start gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
                <span className={`w-12 shrink-0 pt-1 text-xs font-bold ${isAI ? 'text-brand' : 'text-muted text-right'}`}>
                  {isAI ? 'REPP' : 'You'}
                </span>

                <div
                  className={`max-w-2xl p-4 rounded-sm text-sm leading-relaxed space-y-1 ${
                    isAI
                      ? m.isError
                        ? 'bg-subtle border border-danger text-danger'
                        : 'bg-subtle border border-line text-ink'
                      : 'bg-brand text-on-brand font-semibold'
                  }`}
                >
                  {m.pending ? (
                    <span className="flex items-center gap-2 text-muted">
                       Coach REPP is thinking...
                    </span>
                  ) : isAI ? (
                    <FormattedMessage text={m.text} />
                  ) : (
                    <p className="whitespace-pre-line">{m.text}</p>
                  )}
                  <div className={`text-[9px] font-mono text-right ${isAI ? 'text-muted' : 'text-on-brand'}`}>
                    {m.time}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 space-y-3">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            maxLength={2000}
            placeholder="Ask REPP about meals, workouts, protein, recovery or your progress..."
            className="flex-1 bg-white border border-line-strong focus:border-brand rounded-sm px-5 py-3.5 text-sm text-ink focus:outline-none"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStop}
              className="px-6 py-3.5 bg-subtle border border-line hover:border-danger text-ink font-bold text-xs rounded-sm transition cursor-pointer flex items-center gap-2"
            >
              
              <span className="hidden sm:inline">Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-6 py-3.5 bg-brand hover:bg-brand-hover text-on-brand font-bold text-xs rounded-sm transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              
              <span className="hidden sm:inline">Send</span>
            </button>
          )}
        </form>

        <MedicalDisclaimer compact={true} />
      </div>
    </div>
  );
}
