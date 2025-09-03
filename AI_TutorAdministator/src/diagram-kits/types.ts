import React from "react";

export type FieldNumber = {
  type: "number";
  label: string;
  min?: number;
  max?: number;
  step?: number;
  default?: number;
};

export type FieldBoolean = {
  type: "boolean";
  label: string;
  default?: boolean;
};

export type FieldText = {
  type: "text";
  label: string;
  default?: string;
};

export type FieldSelect = {
  type: "select";
  label: string;
  options: { label: string; value: string | number }[];
  default?: string | number;
};

export type FieldDef = FieldNumber | FieldBoolean | FieldText | FieldSelect;

export type Config = {
  /** Human name shown in UI (optional) */
  title?: string;
  /** Ordered list of fields for param UI */
  fields: Record<string, FieldDef>;
  /** Named presets */
  presets?: { label: string; params: Record<string, any> }[];
  /** Optional defaults if no preset chosen */
  defaults?: Record<string, any>;
};

export type DiagramModule = {
  default: React.ComponentType<any>;
  config?: Config;
};
