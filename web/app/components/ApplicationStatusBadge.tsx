"use client";

type JobStatus = "applied" | "screening" | "interviewing" | "offered" | "rejected" | "withdrawn";

const LABELS: Record<JobStatus, string> = {
  applied: "Applied",
  screening: "Screening",
  interviewing: "Interviewing",
  offered: "Offered",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

interface ApplicationStatusBadgeProps {
  status: JobStatus;
}

export default function ApplicationStatusBadge({ status }: ApplicationStatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      {LABELS[status]}
    </span>
  );
}
