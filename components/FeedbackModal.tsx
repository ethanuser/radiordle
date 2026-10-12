'use client';

import { useState } from 'react';
import Link from 'next/link';
import ModalShell from './ui/ModalShell';
import { submitFeedback } from '@/lib/feedback';
import { getOrCreatePlayerHash } from '@/lib/playerIdentity';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageContext?: string;
}

const CATEGORIES = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'content', label: 'Content Issue' },
  { value: 'other', label: 'Other' },
];

const COOLDOWN_KEY = 'radiordle_feedback_cooldown';
const COOLDOWN_MS = 60000; // 1 minute between submissions

// Dark-glass field styling shared by the select + textarea. Native <option>
// list items get explicit dark text so they stay readable in the OS dropdown.
const FIELD_CLASS =
  'w-full px-3 py-2.5 font-medium outline-none transition-colors ' +
  'bg-page-bg text-ink text-sm border border-rule-strong focus:border-ink';
const LABEL_CLASS = 'block report-label mb-1.5';

export default function FeedbackModal({ isOpen, onClose, pageContext }: FeedbackModalProps) {
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check client-side cooldown
    const lastSubmit = localStorage.getItem(COOLDOWN_KEY);
    if (lastSubmit && Date.now() - parseInt(lastSubmit) < COOLDOWN_MS) {
      setStatus('error');
      setErrorMessage('Please wait a moment before submitting again.');
      return;
    }

    if (!category) {
      setStatus('error');
      setErrorMessage('Please select a category.');
      return;
    }

    if (message.trim().length < 10) {
      setStatus('error');
      setErrorMessage('Message must be at least 10 characters.');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const fingerprint = await getOrCreatePlayerHash().catch(() => null);
      const result = await submitFeedback({
        category,
        message: message.trim(),
        pageContext,
        fingerprint,
      });

      if (!result.ok) {
        setStatus('error');
        setErrorMessage(result.error);
        return;
      }

      // Success
      localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
      setStatus('success');
      setCategory('');
      setMessage('');
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please try again.');
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setErrorMessage('');
    onClose();
  };

  return (
    <ModalShell onClose={handleClose} maxWidthClass="max-w-[460px]" ariaLabel="Send feedback">
      <h2 className="text-2xl sm:text-3xl font-semibold text-ink text-center mb-5">Send Feedback</h2>

      {status === 'success' ? (
        <div className="text-center">
          <div className="p-6 mb-5 border border-success border-l-4">
            <p className="text-xl font-semibold text-ink mb-1">Thank you</p>
            <p className="text-ink-muted">Your feedback has been submitted.</p>
          </div>
          <button
            onClick={handleClose}
            className="w-full px-6 h-10 font-semibold uppercase tracking-[0.06em] text-sm text-ink border border-rule-strong transition-colors hover:bg-surface"
          >
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Category Select */}
          <label className={LABEL_CLASS}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`${FIELD_CLASS} mb-4`}
            disabled={status === 'submitting'}
          >
            <option value="" className="text-gray-800">Select a category...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value} className="text-gray-800">
                {cat.label}
              </option>
            ))}
          </select>

          {/* Message Textarea */}
          <label className={LABEL_CLASS}>Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
            placeholder="Describe your feedback..."
            rows={5}
            className={`${FIELD_CLASS} resize-none placeholder:text-ink-faint`}
            disabled={status === 'submitting'}
          />
          <p className="text-ink-faint font-mono text-xs mt-1 text-right mb-3">{message.length}/1000</p>

          {/* Error Message */}
          {status === 'error' && errorMessage && (
            <div className="p-3 mb-4 border border-error bg-error/15">
              <p className="text-sm text-[#f3d2ce]">{errorMessage}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 h-10 font-semibold uppercase tracking-[0.06em] text-sm text-ink border border-rule-strong transition-colors hover:bg-surface"
              disabled={status === 'submitting'}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 h-10 font-semibold uppercase tracking-[0.06em] text-sm text-black bg-ink hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Sending...' : 'Submit'}
            </button>
          </div>

          {/* About Link */}
          <div className="mt-6 pt-4 border-t border-rule text-center">
            <Link
              href="/about"
              className="text-ink-muted hover:text-ink text-sm transition-colors"
              onClick={handleClose}
            >
              Learn more about Radiordle
            </Link>
          </div>
        </form>
      )}
    </ModalShell>
  );
}
