/**
 * Basic type validation tests
 */

import {
  StylePattern,
  StylePatternCategory,
  StylingApproach,
  InteractiveState,
  Breakpoint,
  ValidationResult
} from '../types';

describe('Component Style Import Types', () => {
  test('StylePattern type is correctly defined', () => {
    const pattern: StylePattern = {
      id: 'test-pattern',
      name: 'Test Pattern',
      category: 'glass-morphism',
      description: 'A test pattern',
      properties: {
        background: 'rgba(255, 255, 255, 0.68)',
        backdropFilter: 'blur(14px)'
      },
      metadata: {
        sourceComponent: 'TestComponent',
        visualEffect: 'Glass effect',
        usageNotes: 'Use for glass cards'
      }
    };

    expect(pattern.id).toBe('test-pattern');
    expect(pattern.category).toBe('glass-morphism');
  });

  test('ValidationResult type is correctly defined', () => {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  test('StylePatternCategory includes all expected values', () => {
    const categories: StylePatternCategory[] = [
      'glass-morphism',
      'button',
      'header',
      'surface',
      'interactive',
      'responsive'
    ];

    expect(categories).toHaveLength(6);
  });

  test('StylingApproach includes all expected values', () => {
    const approaches: StylingApproach[] = [
      'css-module',
      'tailwind',
      'styled-component',
      'inline'
    ];

    expect(approaches).toHaveLength(4);
  });

  test('InteractiveState includes all expected values', () => {
    const states: InteractiveState[] = [
      'base',
      'hover',
      'active',
      'focus',
      'focus-visible',
      'disabled'
    ];

    expect(states).toHaveLength(6);
  });

  test('Breakpoint includes all expected values', () => {
    const breakpoints: Breakpoint[] = [
      'mobile',
      'tablet',
      'desktop'
    ];

    expect(breakpoints).toHaveLength(3);
  });
});
