"use client";

import { useState } from "react";

export type RendererField = {
  id: string;
  label: string;
  type: string;
  required: boolean | null;
  placeholder: string | null;
  options: string[] | null;
  conditionFieldId: string | null;
  conditionOperator: string | null;
  conditionValue: string | null;
};

export function isFieldVisible(
  field: RendererField,
  formData: Record<string, unknown>
): boolean {
  if (!field.conditionFieldId) return true;
  const sourceValue = formData[field.conditionFieldId];
  if (field.conditionOperator === "equals")
    return sourceValue === field.conditionValue;
  if (field.conditionOperator === "not_equals")
    return sourceValue !== field.conditionValue;
  return true;
}

export function FieldInput({
  field,
  value,
  onChange,
}: {
  field: RendererField;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const inputClass =
    "w-full bg-input-bg border border-transparent rounded-xl py-3 px-4 outline-none focus:bg-surface focus:border-border-input transition-all text-sm font-medium";

  switch (field.type) {
    case "short_text":
      return (
        <input
          type="text"
          required={!!field.required}
          placeholder={field.placeholder ?? ""}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );

    case "long_text":
      return (
        <textarea
          required={!!field.required}
          placeholder={field.placeholder ?? ""}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className={`${inputClass} resize-none`}
        />
      );

    case "email":
      return (
        <input
          type="email"
          required={!!field.required}
          placeholder={field.placeholder ?? ""}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );

    case "phone":
      return (
        <input
          type="tel"
          required={!!field.required}
          placeholder={field.placeholder ?? ""}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );

    case "url":
      return (
        <input
          type="url"
          required={!!field.required}
          placeholder={field.placeholder ?? ""}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );

    case "number":
      return (
        <input
          type="number"
          required={!!field.required}
          placeholder={field.placeholder ?? ""}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );

    case "date":
      return (
        <input
          type="date"
          required={!!field.required}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );

    case "rating":
      return (
        <RatingInput
          value={value as number}
          onChange={onChange}
          required={!!field.required}
        />
      );

    case "single_select":
      return (
        <div className="space-y-2">
          {(field.options as string[])?.map((opt) => (
            <label
              key={opt}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                value === opt
                  ? "border-accent bg-accent/5"
                  : "border-border-card hover:border-border-input"
              }`}
            >
              <input
                type="radio"
                name={field.id}
                required={!!field.required}
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="accent-accent"
              />
              <span className="text-sm font-medium text-heading">{opt}</span>
            </label>
          ))}
        </div>
      );

    case "multi_select": {
      const selected = (value as string[]) ?? [];
      return (
        <div className="space-y-2">
          {(field.options as string[])?.map((opt) => (
            <label
              key={opt}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                selected.includes(opt)
                  ? "border-accent bg-accent/5"
                  : "border-border-card hover:border-border-input"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selected, opt]);
                  } else {
                    onChange(selected.filter((s) => s !== opt));
                  }
                }}
                className="accent-accent"
              />
              <span className="text-sm font-medium text-heading">{opt}</span>
            </label>
          ))}
        </div>
      );
    }

    default:
      return (
        <input
          type="text"
          placeholder={field.placeholder ?? ""}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );
  }
}

function RatingInput({
  value,
  onChange,
  required,
}: {
  value: number | undefined;
  onChange: (val: unknown) => void;
  required: boolean;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="p-1 transition-transform hover:scale-110"
        >
          <StarIcon
            className="w-7 h-7"
            filled={star <= (hovered || (value ?? 0))}
          />
        </button>
      ))}
      {required && !value && (
        <input
          type="text"
          required
          value=""
          onChange={() => {}}
          className="w-0 h-0 opacity-0 absolute"
          tabIndex={-1}
        />
      )}
    </div>
  );
}

function StarIcon({
  className,
  filled,
}: {
  className?: string;
  filled: boolean;
}) {
  if (filled) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`${className} text-amber-400`}
      >
        <path
          fillRule="evenodd"
          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={`${className} text-slate-300`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
      />
    </svg>
  );
}
