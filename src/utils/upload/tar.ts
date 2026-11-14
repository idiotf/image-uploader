import { pack } from 'tar-stream'

function asError(e: unknown) {
  return e instanceof Error ? e : Error(String(e))
}

export function createTar(fileList: File[], signal?: AbortSignal) {
  const tar = pack({ signal })

  ;(async () => {
    for (const file of fileList) {
      const stream = tar.entry({
        name: file.name,
        size: file.size,
        mtime: new Date(file.lastModified),
      })

      const reader = file.stream().getReader()
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) {
            stream.end(null)
            break
          }

          if (!stream.write(value)) {
            await new Promise<void>((resolve) => stream.once('drain', resolve))
          }
        }
      } catch (e) {
        reader.cancel(e).catch(() => {})
        stream.destroy(asError(e))
        throw e
      } finally {
        reader.releaseLock()
      }
    }

    tar.finalize()
  })()

  return new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(controller) {
      function onData(chunk: unknown) {
        controller.enqueue(chunk as Uint8Array<ArrayBuffer>)
        if (controller.desiredSize !== null && controller.desiredSize <= 0) {
          tar.pause()
        }
      }

      function onEnd() {
        cleanup()
        controller.close()
      }

      function onError(e: Error) {
        cleanup()
        controller.error(e)
      }

      function cleanup() {
        tar.off('data', onData)
        tar.off('end', onEnd)
        tar.off('error', onError)
      }

      tar.on('data', onData)
      tar.once('end', onEnd)
      tar.once('error', onError)

      tar.pause()
    },

    pull() {
      tar.resume()
    },

    cancel(reason) {
      tar.destroy(asError(reason))
    },
  })
}
