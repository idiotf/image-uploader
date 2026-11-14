export function removeExt(name: string) {
  return name.replace(/\.[^.]+$/, '')
}

export function streamToBlob(stream: ReadableStream, init?: ResponseInit) {
  return new Response(stream, init).blob()
}

export function withSignal<T, TPromise extends PromiseLike<T>>(
  promise: PromiseLike<T> & TPromise,
  signal: AbortSignal | undefined,
  onAbort?: (reason: unknown, originalPromise: TPromise) => void,
) {
  return new Promise<T>((resolve, reject) => {
    if (!signal) return resolve(promise)

    const handleAbort = () => {
      try {
        onAbort?.(signal.reason, promise)
        reject(signal.reason)
      } catch (e) {
        reject(SuppressedError(e, signal.reason))
      }
    }

    if (signal.aborted) return queueMicrotask(handleAbort)
    signal.addEventListener('abort', handleAbort, { once: true })

    promise.then(
      (value) => {
        resolve(value)
        signal.removeEventListener('abort', handleAbort)
      },
      (reason) => {
        reject(reason)
        signal.removeEventListener('abort', handleAbort)
      },
    )
  })
}
