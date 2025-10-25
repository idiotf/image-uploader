import project from './project.json'
import getShortenUrl from './shorten-url'
import { createTar } from './tar'

function streamToBlob(stream: ReadableStream, init?: ResponseInit) {
  return new Response(stream, init).blob()
}

function withSignal<T>(promise: Promise<T>, signal: AbortSignal) {
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason)

    const onAbort = () => reject(signal.reason)

    signal.addEventListener('abort', onAbort, { once: true })
    promise.finally(() => signal.removeEventListener('abort', onAbort)).then(resolve, reject)
  })
}

function handleRejection<T>(promise: Promise<T>) {
  promise.catch(() => {})
  return promise
}

interface UploadInit {
  name?: string
  gzip?: boolean
  signal?: AbortSignal
}

export async function uploadToEntry(file: File, init: UploadInit = {}) {
  const {
    name = file.name,
    gzip = false,
  } = init

  const controller = new AbortController
  const signal = init.signal ? AbortSignal.any([controller.signal, init.signal]) : controller.signal

  const isExistingName = handleRejection(fetch(`https://entry-cdn.pstatic.net/uploads/${name}`, {
    method: 'HEAD',
    signal,
  }).then(({ ok }) => {
    if (ok) controller.abort(new DOMException('이미 존재하는 업로드 이름입니다.', 'NoModificationAllowedError'))
    return ok
  }))

  const shortenUrl = handleRejection(getShortenUrl(`https://playentry.org/uploads/${name}`, { signal }))

  const tar = createTar([
    new File([file], `temp/${name}`, file),
    new File([JSON.stringify(project)], 'temp/project.json', {
      lastModified: file.lastModified,
    }),
  ])

  const stream = gzip ? tar.pipeThrough(new CompressionStream('gzip')) : tar

  const body = new FormData
  body.set('project', await withSignal(streamToBlob(stream, {
    headers: {
      'Content-Type': 'application/x-entryapp',
    },
  }), signal))

  await fetch('https://entry-cdn.pstatic.net/rest/project/upload', {
    method: 'POST',
    body,
    signal,
  })

  await isExistingName
  signal.throwIfAborted()

  return shortenUrl
}
