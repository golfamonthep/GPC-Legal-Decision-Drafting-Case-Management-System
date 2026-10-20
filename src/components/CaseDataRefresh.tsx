'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { shouldRefreshCaseView } from '@/lib/caseRefresh';

export function CaseDataRefresh({ enabled, initialRevision }: { enabled: boolean; initialRevision: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const previousRevision = useRef<string | null>(initialRevision);

  useEffect(() => {
    if (!enabled) return;
    if (previousRevision.current === null && initialRevision !== null) previousRevision.current = initialRevision;
    let active = true;
    let checking = false;
    const baselines = new WeakMap<HTMLFormElement, string>();
    // FormData omits unnamed and disabled controls; both occur in the case status form.
    const formState = (form: HTMLFormElement) => JSON.stringify(
      [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea')]
        .map((field, index) => {
          const value = field instanceof HTMLInputElement && field.type === 'file'
            ? [...(field.files ?? [])].map(file => `${file.name}:${file.size}:${file.lastModified}`)
            : field instanceof HTMLInputElement && (field.type === 'checkbox' || field.type === 'radio')
              ? field.checked
              : field.value;
          return [index, field.name, value];
        }),
    );
    const capture = (form: HTMLFormElement) => { if (!baselines.has(form)) baselines.set(form, formState(form)); };
    const forms = () => [...document.querySelectorAll<HTMLFormElement>('form')];
    forms().forEach(capture);
    const dirty = () => forms().some(form => { capture(form); return baselines.get(form) !== formState(form); });
    const onFocus = (event: FocusEvent) => {
      const form = (event.target as Element | null)?.closest?.('form');
      if (form instanceof HTMLFormElement) capture(form);
    };
    const refresh = () => {
      if (/\/cases\/[^/]+\/(?:edit|update)$/.test(pathname)) window.location.reload();
      else router.refresh();
    };
    const check = async () => {
      if (!active || checking || document.hidden) return;
      checking = true;
      try {
        const response = await fetch('/api/cases/revision', { cache: 'no-store' });
        if (!response.ok) return;
        const { revision } = await response.json();
        if (!active || typeof revision !== 'string') return;
        if (shouldRefreshCaseView(previousRevision.current, revision, dirty())) refresh();
        if (dirty()) return;
        previousRevision.current = revision;
      } catch { /* A transient revision check must not replace the visible page with zeros. */ }
      finally { checking = false; }
    };
    const onVisibility = () => { if (!document.hidden) void check(); };
    const onLocalSave = () => {
      refresh();
      // Wait for controlled fields to render the canonical values returned by the server.
      window.requestAnimationFrame(() => {
        if (!active) return;
        forms().forEach(form => baselines.set(form, formState(form)));
        void check();
      });
    };
    const onExternalChange = () => { refresh(); void check(); };
    document.addEventListener('focusin', onFocus, true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('gpc:case-saved', onLocalSave);
    const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('gpc-case-updates');
    if (channel) channel.onmessage = onExternalChange;
    const timer = window.setInterval(() => { void check(); }, 30_000);
    void check();
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener('focusin', onFocus, true);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('gpc:case-saved', onLocalSave);
      channel?.close();
    };
  }, [enabled, initialRevision, pathname, router]);
  return null;
}

export function notifyCaseChanged() {
  window.dispatchEvent(new Event('gpc:case-saved'));
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel('gpc-case-updates');
    channel.postMessage('changed');
    channel.close();
  }
}
