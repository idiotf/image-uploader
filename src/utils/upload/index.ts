import { createTar } from './tar'
import { streamToBlob, withSignal } from '../common'

export const errors = {
  uploadNameAlreadyExists: new DOMException(
    '이미 존재하는 업로드 이름입니다.',
    'NoModificationAllowedError',
  ),
  tooBigFileSize: new DOMException(
    '파일 용량이 너무 큽니다.',
    'QuotaExceededError',
  ),
  tooBigFileSize50MiB: new DOMException(
    '파일 용량은 50 MiB 미만이어야 합니다.',
    'QuotaExceededError',
  ),
  tooManyUploadRequests: new DOMException(
    '업로드 횟수가 너무 많습니다.',
    'TooManyRequestsError',
  ),
  unknownUploadError: new DOMException(
    '업로드를 실패했습니다.',
    'UnknownError',
  ),
}

async function checkExistingUpload(name: string, signal?: AbortSignal) {
  const res = await fetch(`https://entry-cdn.pstatic.net/uploads/${name}`, {
    method: 'HEAD',
    signal,
  })
  return res.ok
}

function createProjectStream(name: string, file: File, gzip?: boolean) {
  const tar = createTar([
    new File([file], `temp/${name}`, file),
    new File(['{}'], 'temp/project.json', {
      lastModified: file.lastModified,
    }),
  ])

  return gzip ? tar.pipeThrough(new CompressionStream('gzip')) : tar
}

async function createProjectFormData(
  stream: ReadableStream<Uint8Array<ArrayBuffer>>,
  signal?: AbortSignal,
) {
  const blobPromise = streamToBlob(stream, {
    headers: {
      'Content-Type': 'application/x-entryapp',
    },
  })

  const body = new FormData()
  body.set('project', await withSignal(blobPromise, signal))

  return body
}

async function uploadProjectFormData(body: FormData, signal?: AbortSignal) {
  await fetch('https://entry-cdn.pstatic.net/rest/project/upload', {
    mode: 'no-cors',
    method: 'POST',
    body,
    signal,
  })
}

export interface UploadInit {
  name?: string
  gzip?: boolean
  signal?: AbortSignal
}

export async function uploadToEntry(file: File, init: UploadInit = {}) {
  if (file.size >= 50 * 1024 * 1024) {
    throw errors.tooBigFileSize50MiB
  }

  const name = init.name || file.name
  const gzip = init.gzip

  const controller = new AbortController()
  const signal = init.signal
    ? AbortSignal.any([controller.signal, init.signal])
    : controller.signal

  const isExistingName = checkExistingUpload(name, signal).then((existing) => {
    if (existing) controller.abort(errors.uploadNameAlreadyExists)
    return existing
  })
  isExistingName.catch(() => {})

  const stream = createProjectStream(name, file, gzip)
  const body = await createProjectFormData(stream, signal)

  await isExistingName
  await uploadProjectFormData(body, signal)

  if (!(await checkExistingUpload(name, signal))) {
    throw errors.unknownUploadError
  }

  return `https://space.playentry.org/uploads/${name}`
}
