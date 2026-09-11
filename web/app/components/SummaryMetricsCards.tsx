"use client";

import React from "react";
import { SummaryMetrics } from "../../lib/api";

interface SummaryMetricsCardsProps {
  metrics: SummaryMetrics | null;
  loading: boolean;
}

export function SummaryMetricsCards({
  metrics,
  loading,
}: SummaryMetricsCardsProps) {
  if (loading || !metrics) {
    return (
      <div className="metrics-grid">
        <div className="metric-card skeleton" />
        <div className="metric-card skeleton" />
        <div className="metric-card skeleton" />
        <div className="metric-card skeleton" />
        <div className="metric-card skeleton" />
      </div>
    );
  }

  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <span className="metric-label">Active Goals</span>
        <span className="metric-value">{metrics.active_goals}</span>
        <span className="metric-subtext">
          {metrics.completed_goals} completed
        </span>
      </div>

      <div className="metric-card">
        <span className="metric-label">Pending Tasks</span>
        <span className="metric-value">
          {metrics.pending_tasks + metrics.in_progress_tasks}
        </span>
        <span className="metric-subtext">
          {metrics.in_progress_tasks} in progress
        </span>
      </div>

      <div className="metric-card">
        <span className="metric-label">Completed Tasks</span>
        <span className="metric-value">{metrics.done_tasks}</span>
        <span className="metric-subtext">of {metrics.total_tasks} total</span>
      </div>

      <div className="metric-card">
        <span className="metric-label">Applications</span>
        <span className="metric-value">{metrics.active_applications ?? 0}</span>
        <span className="metric-subtext">
          of {metrics.total_applications ?? 0} total active
        </span>
      </div>

      <div
        className={`metric-card ${
          metrics.overdue_tasks > 0 ? "metric-warning" : ""
        }`}
      >
        <span className="metric-label">Overdue</span>
        <span className="metric-value">{metrics.overdue_tasks}</span>
        <span className="metric-subtext">Requires attention</span>
      </div>
    </div>
  );
}
