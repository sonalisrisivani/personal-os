"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  label: string;
  value: string;
  group?: string;
  color?: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export default function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  const selectedCount = selectedValues.length;
  const isActive = selectedCount > 0 || open;

  return (
    <div className="multi-select" ref={dropdownRef} style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        className={`filter-tab${selectedCount > 0 ? " filter-tab--active" : ""}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span>{label}</span>
        {selectedCount > 0 ? (
          <span
            style={{
              background: "rgba(255, 255, 255, 0.28)",
              color: "inherit",
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "1px 6px",
              borderRadius: "99px",
              lineHeight: 1.2,
            }}
          >
            {selectedCount}
          </span>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.65, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
            minWidth: "220px",
            maxWidth: "280px",
            maxHeight: "300px",
            overflowY: "auto",
            zIndex: 100,
            padding: "8px",
          }}
        >
          {options.length === 0 ? (
            <div style={{ padding: "12px", fontSize: "0.82rem", color: "var(--text-faint)", textAlign: "center", fontStyle: "italic" }}>
              No goals or projects yet
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 6px 8px", borderBottom: "1px solid var(--border-soft)", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-faint)" }}>
                  Filter by Source
                </span>
                {selectedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      fontSize: "0.74rem",
                      cursor: "pointer",
                      padding: 0,
                      textDecoration: "underline",
                    }}
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {options.map((opt) => {
                  const isSelected = selectedValues.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 8px",
                        cursor: "pointer",
                        borderRadius: "7px",
                        fontSize: "0.82rem",
                        transition: "background 0.12s",
                        background: isSelected ? "var(--border-soft)" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "var(--bg)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isSelected ? "var(--border-soft)" : "transparent";
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(opt.value)}
                        style={{ cursor: "pointer", accentColor: opt.color || "var(--accent)", width: "14px", height: "14px", margin: 0 }}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
                        {opt.color && (
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: opt.color, flexShrink: 0 }} />
                        )}
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: isSelected ? 600 : 400 }}>
                          {opt.label}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
