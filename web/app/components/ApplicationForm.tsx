"use client";

import { useState, useEffect } from "react";
import { createApplication, updateApplication, JobApplication } from "../../lib/api";

interface ApplicationFormProps {
  application?: JobApplication | null;
  onSave: () => void;
  onClose: () => void;
}

export default function ApplicationForm({ application, onSave, onClose }: ApplicationFormProps) {
  const [company, setCompany] = useState(application?.company ?? "");
  const [role, setRole] = useState(application?.role ?? "");
  const [status, setStatus] = useState<JobApplication["status"]>(application?.status ?? "applied");
  const [location, setLocation] = useState(application?.location ?? "");
  const [jobUrl, setJobUrl] = useState(application?.job_url ?? "");
  const [salaryRange, setSalaryRange] = useState(application?.salary_range ?? "");
  const [appliedAt, setAppliedAt] = useState(application?.applied_at ?? "");
  const [notes, setNotes] = useState(application?.notes ?? "");
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
      const payload = {
        company,
        role,
        status,
        location: location || undefined,
        job_url: jobUrl || undefined,
        salary_range: salaryRange || undefined,
        applied_at: appliedAt || undefined,
        notes: notes || undefined,
      };
      if (application) {
        await updateApplication(application.id, payload);
      } else {
        await createApplication(payload);
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="app-form-title">
      <div className="modal">
        <h2 className="modal__title" id="app-form-title">
          {application ? "Edit Application" : "Add Application"}
        </h2>
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="comp">Company *</label>
              <input id="comp" value={company} onChange={(e) => setCompany(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="role">Role *</label>
              <input id="role" value={role} onChange={(e) => setRole(e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value as JobApplication["status"])}>
              <option value="applied">Applied</option>
              <option value="screening">Screening</option>
              <option value="interviewing">Interviewing</option>
              <option value="offered">Offered</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="url">Job URL</label>
            <input id="url" type="url" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} />
          </div>
          <div className="modal__actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Saving…" : application ? "Save" : "Add"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
