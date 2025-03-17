// utils/hooks.ts
import { useState, useEffect } from 'react';

/**
 * A hook that delays updating a value until a certain amount of time has passed
 * since the last change. Useful for reducing API calls on fast-changing values.
 * 
 * @param value The value to debounce
 * @param delay The delay in milliseconds (default: 500ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear the timeout if the value changes before the delay has passed
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * A hook that throttles a function to only be called at most once
 * in a specified time period.
 * 
 * @param fn The function to throttle
 * @param delay The delay in milliseconds (default: 500ms)
 * @returns The throttled function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const [lastCall, setLastCall] = useState(0);

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      fn(...args);
      setLastCall(now);
    }
  };
}

/**
 * A hook that returns a function that will only be called once per component mount.
 * 
 * @param fn The function to call once
 * @returns The function wrapped in useCallback
 */
export function useOnce<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => void {
  const [called, setCalled] = useState(false);

  return (...args: Parameters<T>) => {
    if (!called) {
      setCalled(true);
      fn(...args);
    }
  };
}