/**
 * Runs `callback` once the page has loaded and the main thread is idle, so
 * code for later interactions never competes with the first paint. Returns a
 * cleanup that cancels it if it hasn't run yet.
 */
export function onIdle(callback: () => unknown) {
  let idleId: number | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const schedule = () => {
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(() => callback(), {
        timeout: 2000,
      });
    } else {
      timeoutId = setTimeout(callback, 200);
    }
  };

  if (document.readyState === "complete") {
    schedule();
  } else {
    window.addEventListener("load", schedule, {
      once: true,
    });
  }

  return () => {
    window.removeEventListener("load", schedule);
    if (idleId !== undefined) window.cancelIdleCallback(idleId);
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  };
}
