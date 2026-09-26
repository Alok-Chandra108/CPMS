import { describe, it, expect } from 'vitest';
import { calculatePasswordStrength } from '../passwordStrength';

describe('calculatePasswordStrength', () => {
  it('should handle empty password', () => {
    const result = calculatePasswordStrength('');
    expect(result).toEqual({ score: 0, label: '', color: '' });
  });

  it('should identify weak passwords', () => {
    // Score <= 2
    const result = calculatePasswordStrength('abc');
    expect(result.label).toBe('Weak');
    expect(result.color).toBe('bg-red-500');
  });

  it('should identify fair passwords', () => {
    // Score 3-4
    const result = calculatePasswordStrength('Password123'); // Length >= 8 (1), A-Z (1), a-z (1), 0-9 (1) -> score 4
    expect(result.label).toBe('Fair');
    expect(result.color).toBe('bg-amber-500');
  });

  it('should identify strong passwords', () => {
    // Score > 4
    const result = calculatePasswordStrength('Strong!Pass123'); // Length >= 12 (2), A-Z (1), a-z (1), 0-9 (1), special (1) -> score 6
    expect(result.label).toBe('Strong');
    expect(result.color).toBe('bg-green-500');
  });
});
