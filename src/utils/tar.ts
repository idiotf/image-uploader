const encoder = new TextEncoder

function writeString(buffer: Uint8Array, input: string, offset: number, length?: number) {
  const encoded = encoder.encode(input).subarray(0, length)
  buffer.set(encoded, offset)
}

interface FileWithStream extends Omit<File, 'stream'> {
  stream: ReadableStream<Uint8Array<ArrayBuffer>>
}

export const createTar = (fileList: File[]) => new ReadableStream<Uint8Array<ArrayBuffer>>({
  async start(controller) {
    const filesWithStream: FileWithStream[] = fileList.map(file => Object.assign(file, {
      stream: file.stream(),
    }))

    for (const file of filesWithStream) {
      const header = new Uint8Array(512)

      writeString(header, file.name, 0, 100)
      writeString(header, '0000777\0', 100)
      writeString(header, '0000000\0', 108)
      writeString(header, '0000000\0', 116)
      writeString(header, file.size.toString(8).padStart(11, '0'), 124, 12)
      writeString(header, (file.lastModified / 1000 | 0).toString(8).padStart(11, '0'), 136, 12)
      writeString(header, '        ', 148)
      writeString(header, '0', 156)
      writeString(header, 'ustar', 257)
      writeString(header, '00', 263)

      let sum = 0
      for (const data of header) sum += data
      writeString(header, sum.toString(8).padStart(6, '0') + '\0 ', 148, 8)

      controller.enqueue(header)

      const reader = file.stream.getReader()

      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        controller.enqueue(value)
      }

      controller.enqueue(new Uint8Array((512 - (file.size % 512)) % 512))
    }

    controller.enqueue(new Uint8Array(1024))
    controller.close()
  },
})
