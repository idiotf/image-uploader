import project from './project.json'
import { createTar } from './tar'

function streamToBlob(stream: ReadableStream, init?: ResponseInit) {
  return new Response(stream, init).blob()
}

export async function uploadToEntry(file: File, name = file.name, gzip = false) {
  const tar = createTar([
    new File([file], `temp/${name}`, file),
    new File([JSON.stringify(project)], 'temp/project.json', {
      lastModified: file.lastModified,
    }),
  ])

  const stream = gzip ? tar.pipeThrough(new CompressionStream('gzip')) : tar

  const body = new FormData
  body.set('project', await streamToBlob(stream, {
    headers: {
      'Content-Type': 'application/x-entryapp',
    },
  }))

  await fetch('https://entry-cdn.pstatic.net/rest/project/upload', {
    method: 'POST',
    body,
  })

  return `https://playentry.org/uploads/${name}`
}
