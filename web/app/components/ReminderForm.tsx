"use client";

import { useState, useEffect } from "react";
import { createApplicationReminder, ApplicationReminder } from "../../lib/api";

interface ReminderFormProps {
  applicationId: string;
  onSave: () => void;
  onClose: () => void;
}

export default function ReminderForm({ applicationId, onSave, onClose }: ReminderFormProps) {
  const [reminderType, setReminderType] = useState("follow_up");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createApplicationReminder(applicationId, {
        reminder_type: reminderType,
        due_date: new Date(dueDate).toISOString(),
        notes: notes || undefined,
      });
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="reminder-form-title">
      <div className="modal modal--sm">
        <h2 className="modal__title" id="reminder-form-title">Add Reminder</h2>
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="rem-type">Type</label>
            <select id="rem-type" value={reminderType} onChange={(e) => setReminderType(e.target.value)}>
              <option value="follow_up">Follow Up</option>
              <option value="interview_prep">Interview Prep</option>
              <option value="deadline">Deadline</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="rem-date">Due Date & Time *</label>
            <input id="rem-date" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="rem-notes">Notes</label>
            <textarea id="rem-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="modal__actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving…" : "Set Reminder"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
