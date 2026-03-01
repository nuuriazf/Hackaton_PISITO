/**
 * Core type definitions for Component Style Import feature
 */

import { CSSProperties } from 'react';

// Style pattern categories
export type StylePatternCategory = 
  | 'glass-morphism'
  | 'button'
  | 'header'
  | 'surface'
  | 'interactive'
  | 'responsive';

// Styling approach
export type StylingApproach = 
  | 'css-module'
  | 'tailwind'
  | 'styled-component'
  | 'inline';

// Interactive states
export type InteractiveState = 
  | 'base'
  | 'hover'
  | 'active'
  | 'focus'
  | 'focus-visible'
  | 'disabled';

// Responsive breakpoints
export type Breakpoint = 
  | 'mobile'
  | 'tablet'
  | 'desktop';

// Style pattern definition
export interface StylePattern {
  id: string;
  name: string;
  category: StylePatternCategory;
  description: string;
  properties: CSSProperties;
  variants?: Record<InteractiveState, Partial<CSSProperties>>;
  responsive?: Record<Breakpoint, Partial<CSSProperties>>;
  dependencies?: string[]; // IDs of required patterns
  metadata: {
    sourceComponent: string;
    visualEffect: string;
    usageNotes: string;
  };
}

// Extracted style collection
export interface ExtractedStyles {
  patterns: StylePattern[];
  relationships: StyleRelationship[];
  metadata: {
    sourceComponent: string;
    extractedAt: string;
    version: string;
  };
}

// Relationship between patterns
export interface StyleRelationship {
  parentId: string;
  childId: string;
  type: 'requires' | 'enhances' | 'conflicts';
  description: string;
}

// Customization options
export interface StyleCustomization {
  colors?: Record<string, string>;
  spacing?: Record<string, string>;
  borderRadius?: Record<string, string>;
  backdropBlur?: string;
  transitionDuration?: string;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  property: string;
  value: string;
  message: string;
}

export interface ValidationWarning {
  property: string;
  message: string;
}

// Application result
export interface StyleApplicationResult {
  className?: string;
  style?: CSSProperties;
  validation: ValidationResult;
}
