import { useCallback, useState } from 'react'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './components/ui/form'

import { CopyButton } from './components/copy-button'
import { Input } from './components/ui/input'
import { Button } from './components/ui/button'
import './style.css'

import { uploadToEntry } from './utils/upload'
import getShortenUrl from './utils/shorten-url'

z.config(z.locales.ko())

const formSchema = z.object({
  file: z.file('파일을 선택하세요.'),
  name: z.string(),
})

type FormSchema = z.infer<typeof formSchema>

const App = () => {
  const [ shortenUrl, setShortenUrl ] = useState('')
  const [ error, setError ] = useState<unknown>()

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  })

  const file = form.watch('file')

  const upload = useCallback(async ({ file, name }: FormSchema) => {
    try {
      setShortenUrl(await getShortenUrl(await uploadToEntry(file, name || undefined)))
      setError('')
    } catch (e) {
      setShortenUrl('')
      setError(e)
    }
  }, [])

  return (
    <main className='w-96 p-4'>
      <h1 className='font-bold text-2xl mb-4 text-center'>Image Uploader</h1>
      <Form {...form}>
        <form action={() => {}} onSubmit={form.handleSubmit(upload)} className='space-y-4'>
          <FormField
            control={form.control}
            name='file'
            render={({ field }) =>
              <FormItem>
                <FormLabel>파일 선택</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type='file'
                    value={undefined}
                    onChange={({ target: { files } }) => files && form.setValue('file', files[0]!)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            }
          />
          <FormField
            control={form.control}
            name='name'
            render={({ field }) =>
              <FormItem>
                <FormLabel>업로드 이름</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={file?.name} />
                </FormControl>
                <FormMessage />
              </FormItem>
            }
          />
          <div className='flex gap-3'>
            <Button type='submit'>업로드</Button>
            {!shortenUrl || <>
              <Input readOnly value={shortenUrl} className='flex-1 font-mono text-sm' />
              <CopyButton value={shortenUrl} />
            </>}
            {!error || <>
              <Input readOnly value='오류가 발생했습니다' className='flex-1 text-red-500 text-sm' />
              <CopyButton value={error + ''} />
            </>}
          </div>
        </form>
      </Form>
    </main>
  )
}

export default App
