import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Providers } from './providers'
import { Input } from './components/ui/input'
import { CopyButton } from './components/ui/copy-button'
import { LoadableButton } from './components/ui/loadable-button'
import { UploadFormContent, UploadFormSchema } from './form'

import { removeExt } from './utils/common'
import { uploadToEntry } from './utils/upload'

export default function App() {
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [error, setError] = useState<unknown>()

  const form = useForm({
    resolver: zodResolver(UploadFormSchema),
    defaultValues: {
      name: '',
      ext: '.png',
    },
  })

  const handleUploadError = useCallback(
    (e: unknown) => {
      if (e instanceof DOMException) {
        switch (e.name) {
          case 'NoModificationAllowedError':
            form.setError('name', { message: e.message })
            return

          case 'QuotaExceededError':
            form.setError('file', { message: e.message })
            return

          case 'TooManyRequestsError':
          case 'UnknownError':
            setUploadedUrl('')
            setErrorMsg(e.message)
            setError(e)
            return
        }
      }

      setUploadedUrl('')
      setErrorMsg('오류가 발생했습니다')
      setError(e)
    },
    [form],
  )

  const upload = useCallback(
    async ({ file, name, ext }: UploadFormSchema) => {
      setUploading(true)

      try {
        const uploadedUrl = await uploadToEntry(file, {
          name: (name || removeExt(file.name)) + ext,
          gzip: file.type === 'image/svg+xml',
        })

        setUploadedUrl(uploadedUrl)
        setError('')
      } catch (e) {
        handleUploadError(e)
      }

      setUploading(false)
    },
    [handleUploadError],
  )

  return (
    <Providers>
      <main className='w-96 p-4'>
        <h1 className='mb-4 text-center text-2xl font-bold'>Image Uploader</h1>
        <form onSubmit={form.handleSubmit(upload)} className='space-y-4'>
          <UploadFormContent form={form} />
          <div className='flex gap-3'>
            <LoadableButton type='submit' loading={uploading}>
              업로드
            </LoadableButton>
            {!uploadedUrl || (
              <>
                <Input
                  readOnly
                  value={uploadedUrl}
                  className='flex-1 font-mono text-sm'
                />
                <CopyButton type='button' value={uploadedUrl} />
              </>
            )}
            {!error || (
              <>
                <Input
                  readOnly
                  value={errorMsg}
                  className='flex-1 text-sm text-red-500'
                />
                <CopyButton type='button' value={String(error)} />
              </>
            )}
          </div>
        </form>
      </main>
    </Providers>
  )
}
