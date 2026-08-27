export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

export function ok<T, E = never>(value: T): Result<T, E> {
  return { ok: true, value };
}

export function fail<T = never, E = Error>(error: E): Result<T, E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok === true;
}

export function isFail<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return result.ok === false;
}
