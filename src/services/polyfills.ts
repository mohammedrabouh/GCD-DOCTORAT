/**
 * Ensure Promise.try (ES2025) is available for pdfjs-dist v6+ across all runtimes.
 */
const promiseObj = Promise as unknown as {
  try?: <T, A extends unknown[]>(fn: (...args: A) => T | PromiseLike<T>, ...args: A) => Promise<T>;
};

if (typeof promiseObj.try !== 'function') {
  promiseObj.try = function <T, A extends unknown[]>(
    fn: (...args: A) => T | PromiseLike<T>,
    ...args: A
  ): Promise<T> {
    return new Promise<T>((resolve) => {
      resolve(fn(...args));
    });
  };
}
