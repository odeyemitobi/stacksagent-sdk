/**
 * Represents a successful outcome.
 */
export interface Ok<T> {
  ok: true;
  value: T;
}

/**
 * Represents a failed outcome.
 */
export interface Err<E> {
  ok: false;
  error: E;
}

/**
 * Result type for expected failure paths.
 * Use this instead of throwing errors for expected failures.
 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Helper to construct an Ok result.
 */
export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });

/**
 * Helper to construct an Err result.
 */
export const err = <E>(error: E): Err<E> => ({ ok: false, error });
