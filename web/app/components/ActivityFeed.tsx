"use client";

import React from "react";
import { ActivityEvent } from "../../lib/api";

interface ActivityFeedProps {
  activities: ActivityEvent[];
  loading: boolean;
}

function getEventIcon(eventType: string) {
  if (eventType.startsWith("goal")) return "🎯";
  if (eventType === "task.completed") return "✅";
  if (eventType.startsWith("task")) return "📋";
  return "⚡";
}

function formatRelativeTime(dateString: string) {
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  } catch {
    return dateString;
  }
}

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  return (
    <section className="activity-section" aria-labelledby="activity-heading">
      <div className="section-header">
        <h2 id="activity-heading">Recent Activity</h2>
      </div>

      {loading ? (
        <div className="activity-loading">Loading activity feed...</div>
      ) : activities.length === 0 ? (
        <p className="empty-msg">No activity recorded yet.</p>
      ) : (
        <ul className="activity-list">
          {activities.map((act) => (
            <li key={act.id} className="activity-item">
              <span className="activity-icon" aria-hidden="true">
                {getEventIcon(act.event_type)}
              </span>
              <div className="activity-details">
                <p className="activity-title">{act.title}</p>
                <time className="activity-time" dateTime={act.created_at}>
                  {formatRelativeTime(act.created_at)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
