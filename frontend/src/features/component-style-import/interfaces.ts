/**
 * Interface definitions for Component Style Import feature
 */

import {
  StylePattern,
  ExtractedStyles,
  StylePatternCategory,
  StylingApproach,
  InteractiveState,
  StyleCustomization,
  StyleApplicationResult,
  ValidationResult,
  Breakpoint
} from './types';
import { CSSProperties } from 'react';

/**
 * Style Extractor Interface
 */
export interface StyleExtractor {
  /**
   * Extract all style patterns from a source component
   */
  extractFromComponent(
    componentPath: string,
    stylePath?: string
  ): Promise<ExtractedStyles>;

  /**
   * Extract a specific pattern by name
   */
  extractPattern(
    componentPath: string,
    patternName: string
  ): Promise<StylePattern | null>;

  /**
   * Identify all available patterns without full extraction
   */
  identifyPatterns(componentPath: string): Promise<string[]>;
}

/**
 * Style Repository Interface
 */
export interface StyleRepository {
  /**
   * Store extracted patterns
   */
  store(styles: ExtractedStyles): Promise<void>;

  /**
   * Retrieve a pattern by ID
   */
  getPattern(id: string): Promise<StylePattern | null>;

  /**
   * Get all patterns in a category
   */
  getPatternsByCategory(category: StylePatternCategory): Promise<StylePattern[]>;

  /**
   * Convert pattern to specific styling approach
   */
  convertPattern(
    pattern: StylePattern,
    approach: StylingApproach
  ): string;

  /**
   * Get pattern dependencies
   */
  getDependencies(patternId: string): Promise<StylePattern[]>;
}

/**
 * Application Utilities Interface
 */
export interface StyleApplicationUtilities {
  /**
   * Apply glass-card styling
   */
  applyGlassCard(
    customization?: Partial<StyleCustomization>
  ): StyleApplicationResult;

  /**
   * Generate footer button classes
   */
  applyFooterButton(
    active: boolean,
    withBorder: boolean,
    customization?: Partial<StyleCustomization>
  ): StyleApplicationResult;

  /**
   * Apply header styling
   */
  applyHeader(
    transparency?: number,
    blurLevel?: number
  ): StyleApplicationResult;

  /**
   * Apply glass-surface styling
   */
  applyGlassSurface(
    customization?: Partial<StyleCustomization>
  ): StyleApplicationResult;

  /**
   * Apply any pattern by ID
   */
  applyPattern(
    patternId: string,
    state?: InteractiveState,
    customization?: Partial<StyleCustomization>
  ): StyleApplicationResult;

  /**
   * Validate style application
   */
  validate(
    pattern: StylePattern,
    appliedStyles: CSSProperties
  ): ValidationResult;
}

/**
 * Format Generators
 */
export interface CSSModuleGenerator {
  generate(pattern: StylePattern): string;
  generateWithVariants(pattern: StylePattern): string;
}

export interface TailwindGenerator {
  generate(pattern: StylePattern): string;
  generateUtilityClasses(pattern: StylePattern): string[];
}

export interface StyledComponentGenerator {
  generate(pattern: StylePattern): string;
  generateWithProps(pattern: StylePattern): string;
}

export interface InlineStyleGenerator {
  generate(pattern: StylePattern): CSSProperties;
  generateWithState(
    pattern: StylePattern,
    state: InteractiveState
  ): CSSProperties;
}
