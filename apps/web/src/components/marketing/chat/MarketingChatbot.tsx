'use client';

import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Send, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { useDictionary, useLocale } from '@/lib/i18n/locale-context';
import { localizedHref } from '@/lib/i18n/paths';
import { cn } from '@/lib/utils';
import { useChatSpeech } from './useChatSpeech';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  navigate?: string;
}

interface ChatApiData {
  reply: string;
  navigate?: string;
  suggestions: string[];
}

let messageSerial = 0;
function nextId(prefix: string): string {
  messageSerial += 1;
  return `${prefix}-${messageSerial}`;
}

export function MarketingChatbot() {
  const locale = useLocale();
  const router = useRouter();
  const { common } = useDictionary();
  const copy = common.chatbot;
  const panelId = useId();
  const titleId = useId();
  const descId = useId();
  const inputId = useId();
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(copy.starterPrompts);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'greeting', role: 'assistant', content: copy.greeting },
  ]);

  const speech = useChatSpeech(locale === 'hi' ? 'hi' : 'en');

  useEffect(() => {
    setMessages([{ id: 'greeting', role: 'assistant', content: copy.greeting }]);
    setSuggestions(copy.starterPrompts);
  }, [copy.greeting, copy.starterPrompts]);

  useEffect(() => {
    const node = logRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, busy, speech.interim]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        launcherRef.current?.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const goTo = useCallback(
    (path: string) => {
      router.push(localizedHref(path, locale));
    },
    [locale, router],
  );

  const ask = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      speech.stopListening();
      setDraft('');
      const userMessage: ChatMessage = { id: nextId('user'), role: 'user', content: trimmed };
      setMessages((current) => [...current, userMessage]);
      setBusy(true);

      try {
        const history = [...messages, userMessage]
          .filter((item) => item.id !== 'greeting')
          .slice(-10)
          .map((item) => ({ role: item.role, content: item.content }));

        const response = await fetch('/api/v1/public/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            locale: locale === 'hi' ? 'hi' : 'en',
            history,
          }),
        });

        if (!response.ok) {
          throw new Error('chat-failed');
        }

        const body = (await response.json()) as { data?: ChatApiData };
        const data = body.data;
        if (!data?.reply) {
          throw new Error('empty-reply');
        }

        const assistant: ChatMessage = {
          id: nextId('assistant'),
          role: 'assistant',
          content: data.reply,
          navigate: data.navigate,
        };
        setMessages((current) => [...current, assistant]);
        if (data.suggestions?.length) {
          setSuggestions(data.suggestions);
        }
        if (speech.voiceReplies) {
          speech.speak(data.reply);
        }
        if (data.navigate) {
          const nextPath = data.navigate;
          window.setTimeout(() => goTo(nextPath), 400);
        }
      } catch {
        const fallback: ChatMessage = {
          id: nextId('error'),
          role: 'assistant',
          content: copy.error,
        };
        setMessages((current) => [...current, fallback]);
      } finally {
        setBusy(false);
      }
    },
    [busy, copy.error, goTo, locale, messages, speech],
  );

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(draft);
  }

  function onComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void ask(draft);
    }
  }

  function toggleMic() {
    if (speech.listening) {
      speech.stopListening();
      return;
    }
    const started = speech.startListening((transcript) => {
      setDraft(transcript);
      void ask(transcript);
    });
    if (!started) {
      setMessages((current) => [
        ...current,
        { id: nextId('voice'), role: 'assistant', content: copy.voiceUnsupported },
      ]);
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-[60] flex flex-col items-start gap-3">
      {open && (
        <section
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className="pointer-events-auto flex w-[min(24rem,calc(100vw-2rem))] max-h-[min(36rem,72vh)] flex-col overflow-hidden rounded-xl border border-zinc-700 bg-[#12121a] shadow-[0_16px_48px_rgb(0_0_0_/_0.45)]"
        >
          <header className="flex items-start justify-between gap-3 border-b border-zinc-800 px-4 py-3">
            <div>
              <h2 id={titleId} className="flex items-center gap-2 text-base font-semibold text-zinc-50">
                <Sparkles className="h-4 w-4 text-violet-300" aria-hidden="true" />
                {copy.title}
              </h2>
              <p id={descId} className="mt-1 text-sm text-zinc-300">
                {copy.subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                launcherRef.current?.focus();
              }}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-zinc-300 hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
              aria-label={copy.closeLabel}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>

          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-busy={busy}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'max-w-[92%] rounded-lg px-3 py-2 text-sm leading-relaxed',
                  message.role === 'user'
                    ? 'ml-auto bg-violet-700 text-white'
                    : 'bg-zinc-800 text-zinc-100',
                )}
                lang={locale === 'hi' ? 'hi' : 'en'}
              >
                <p>{message.content}</p>
                {message.navigate && (
                  <button
                    type="button"
                    onClick={() => goTo(message.navigate ?? '/')}
                    className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-violet-200 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                  >
                    {copy.openPage}
                  </button>
                )}
              </div>
            ))}
            {busy && (
              <p className="text-sm text-zinc-400" role="status">
                {copy.thinking}
              </p>
            )}
            {speech.listening && speech.interim && (
              <p className="text-sm italic text-zinc-400" role="status">
                {speech.interim}
              </p>
            )}
          </div>

          <div className="border-t border-zinc-800 px-4 py-2">
            <p className="sr-only">{copy.suggestionsLabel}</p>
            <ul className="flex flex-wrap gap-2" aria-label={copy.suggestionsLabel}>
              {suggestions.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => void ask(item)}
                    disabled={busy}
                    className="inline-flex min-h-11 items-center rounded-full border border-zinc-600 px-3 text-xs font-medium text-zinc-200 hover:border-violet-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 disabled:opacity-60"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={submitForm} className="border-t border-zinc-800 px-3 py-3">
            <label htmlFor={inputId} className="sr-only">
              {copy.inputLabel}
            </label>
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                id={inputId}
                rows={2}
                value={speech.listening && speech.interim ? speech.interim : draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onComposerKey}
                placeholder={copy.inputPlaceholder}
                disabled={busy}
                className="min-h-[2.75rem] flex-1 resize-none rounded-md border border-zinc-600 bg-[#07070c] px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
              />
              <button
                type="button"
                onClick={toggleMic}
                aria-pressed={speech.listening}
                aria-label={speech.listening ? copy.stopVoice : copy.startVoice}
                className={cn(
                  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300',
                  speech.listening
                    ? 'border-amber-400 bg-amber-950 text-amber-200'
                    : 'border-zinc-600 text-zinc-200 hover:bg-zinc-800',
                )}
              >
                {speech.listening ? (
                  <MicOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Mic className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-violet-600 text-white hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 disabled:opacity-50"
                aria-label={copy.send}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = !speech.voiceReplies;
                  speech.setVoiceReplies(next);
                  if (!next) speech.stopSpeaking();
                }}
                aria-pressed={speech.voiceReplies}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
              >
                {speech.voiceReplies ? (
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <VolumeX className="h-4 w-4" aria-hidden="true" />
                )}
                {speech.voiceReplies ? copy.voiceRepliesOn : copy.voiceRepliesOff}
              </button>
              {speech.speaking && (
                <button
                  type="button"
                  onClick={speech.stopSpeaking}
                  className="inline-flex min-h-11 items-center rounded-md px-2 text-xs font-medium text-amber-200 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                >
                  {copy.stopSpeaking}
                </button>
              )}
              {speech.listening && (
                <span className="text-xs font-medium text-amber-200" role="status">
                  {copy.listening}
                </span>
              )}
            </div>
          </form>
        </section>
      )}

      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="pointer-events-auto inline-flex h-14 min-w-14 items-center justify-center gap-2 rounded-full bg-violet-600 px-4 text-sm font-semibold text-white shadow-[0_8px_24px_rgb(124_58_237_/_0.45)] hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07070c]"
        aria-label={open ? copy.closeLabel : copy.launcherLabel}
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Sparkles className="h-5 w-5" aria-hidden="true" />}
        <span className="hidden sm:inline">{open ? copy.closeLabel : copy.title}</span>
      </button>
    </div>
  );
}
