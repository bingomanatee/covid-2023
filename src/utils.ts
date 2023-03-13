export function isError(a: unknown): a is Error {
  return a instanceof Error;
}
