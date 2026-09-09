"use client";

import React from "react";

type FloatInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
};

type FloatTextareaProps = {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
};

type FloatSelectProps = {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  required?: boolean;
};

export function FloatInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
}: FloatInputProps) {
  return (
    <div className={`float-field ${value ? "is-filled" : ""}`}>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        placeholder=" "
        className="float-input"
        autoComplete="off"
      />
      <label htmlFor={id} className="float-label">
        {label}
      </label>
    </div>
  );
}

export function FloatTextarea({
  id,
  label,
  value,
  onChange,
  rows = 3,
}: FloatTextareaProps) {
  return (
    <div className={`float-field float-field-area ${value ? "is-filled" : ""}`}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder=" "
        className="float-input float-textarea"
      />
      <label htmlFor={id} className="float-label">
        {label}
      </label>
    </div>
  );
}

export function FloatSelect({
  id,
  label,
  value,
  onChange,
  children,
  required,
}: FloatSelectProps) {
  return (
    <div className="float-field is-filled">
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className="float-input"
      >
        {children}
      </select>
      <label htmlFor={id} className="float-label">
        {label}
      </label>
    </div>
  );
}
