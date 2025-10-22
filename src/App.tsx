import { useCallback, useState } from 'react'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './components/ui/form'

import { CopyButton } from './components/copy-button'
import { Input } from './components/ui/input'
import { Button } from './components/ui/button'
import { Switch } from './components/ui/switch'
import { Spinner } from './components/ui/spinner'
import './style.css'

import { uploadToEntry } from './utils/upload'
import getShortenUrl from './utils/shorten-url'

z.config(z.locales.ko())

const allowedExts = [
  '.jpg',
  '.png',
  '.bmp',
  '.svg',
  '.mp3',
]

const isAllowedExt = (name: string) => !name || allowedExts.some(ext => ext != name && name.endsWith(ext))
const extError = `확장자는 ${allowedExts.join(', ')} 중 하나여야 합니다.`

const formSchema = z.object({
  file: z.file('파일을 선택하세요.'),
  name: z.string().refine(isAllowedExt, extError),
  gzip: z.boolean(),
})

type FormSchema = z.infer<typeof formSchema>

const App = () => {
  const [ progress, setProgress ] = useState(1)
  const [ shortenUrl, setShortenUrl ] = useState('')
  const [ error, setError ] = useState<unknown>()

  const isLoading = progress != 1

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      gzip: false,
    },
  })

  const file = form.watch('file')

  const upload = useCallback(async ({ file, name, gzip }: FormSchema) => {
    if (!name && !isAllowedExt(file.name)) return form.setError('name', {
      type: 'pattern',
      message: extError,
    })

    setProgress(0)

    try {
      setShortenUrl(await getShortenUrl(await uploadToEntry(file, name || undefined, gzip)))
      setError('')
    } catch (e) {
      setShortenUrl('')
      setError(e)
    }

    setProgress(1)
  }, [])

  return (
    <main className='w-96 p-4'>
      <h1 className='font-bold text-2xl mb-4 text-center'>Image Uploader</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(upload)} className='space-y-4'>
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
          <FormField
            control={form.control}
            name='gzip'
            render={({ field }) =>
              <FormItem className='relative'>
                <FormLabel>업로드 시 Gzip 압축</FormLabel>
                <FormDescription>업로드된 파일에는 영향을 주지 않습니다.</FormDescription>
                <FormControl className='absolute right-0'>
                  <Switch
                    {...field}
                    value={undefined}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            }
          />
          <div className='flex gap-3'>
            <Button type='submit' className='relative' disabled={isLoading}>
              <span className={`transition-opacity ${isLoading ? 'opacity-0' : ''}`}>업로드</span>
              <div className={`absolute inset-0 transition-opacity ${isLoading ? '' : 'opacity-0'}`}>
                <Spinner className='absolute inset-0 m-auto' />
              </div>
            </Button>
            {!shortenUrl || <>
              <Input readOnly value={shortenUrl} className='flex-1 font-mono text-sm' />
              <CopyButton type='button' value={shortenUrl} />
            </>}
            {!error || <>
              <Input readOnly value='오류가 발생했습니다' className='flex-1 text-red-500 text-sm' />
              <CopyButton type='button' value={error + ''} />
            </>}
          </div>
        </form>
      </Form>
    </main>
  )
}

export default App
