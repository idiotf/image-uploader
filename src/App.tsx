import { useCallback, useState } from 'react'

import { useForm, useWatch } from 'react-hook-form'
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select'

import { CopyButton } from './components/copy-button'
import { Input } from './components/ui/input'
import { Button } from './components/ui/button'
import { Switch } from './components/ui/switch'
import { Spinner } from './components/ui/spinner'
import './style.css'

import { uploadToEntry } from './utils/upload'

z.config(z.locales.ko())

const allowedExts = [
  '.jpg',
  '.png',
  '.bmp',
  '.svg',
  '.mp3',
] as const

const removeExt = (name: string) => name.replace(/\.[^.]+$/, '')

const formSchema = z.object({
  file: z.file('파일을 선택하세요.'),
  name: z.string(),
  ext: z.enum(allowedExts),
  gzip: z.boolean(),
})

type FormSchema = z.infer<typeof formSchema>

const App = () => {
  const [ progress, setProgress ] = useState(1)
  const [ shortenUrl, setShortenUrl ] = useState('')
  const [ errorMsg, setErrorMsg ] = useState('오류가 발생했습니다')
  const [ error, setError ] = useState<unknown>()

  const isLoading = progress != 1

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      ext: '.png',
      gzip: false,
    },
  })

  const file: File | undefined = useWatch({
    control: form.control,
    name: 'file',
  })

  const upload = useCallback(async ({ file, name, ext, gzip }: FormSchema) => {
    setProgress(0)

    try {
      setShortenUrl(await uploadToEntry(file, {
        name: `${name || removeExt(file.name)}${ext}`,
        gzip,
      }))
      setError('')
    } catch (e) {
      let unknownError = false

      if (e instanceof DOMException) {
        switch (e.name) {
          case 'NoModificationAllowedError':
            form.setError('name', { message: e.message })
            break

          case 'QuotaExceededError':
            form.setError('file', { message: e.message })
            break

          case 'TooManyRequestsError':
          case 'UnknownError':
            setShortenUrl('')
            setErrorMsg(e.message)
            setError(e)
            break

          default:
            unknownError = true
        }
      } else {
        unknownError = true
      }

      if (unknownError) {
        setShortenUrl('')
        setErrorMsg('오류가 발생했습니다')
        setError(e)
      }
    }

    setProgress(1)
  }, [form])

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
                  <div className='flex gap-2'>
                    <Input {...field} placeholder={file && removeExt(file.name)} />
                    <FormField
                      control={form.control}
                      name='ext'
                      render={({ field }) =>
                        <Select {...field} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {allowedExts.map(ext =>
                              <SelectItem key={ext} value={ext}>{ext}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      }
                    />
                  </div>
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
              <Input readOnly value={errorMsg} className='flex-1 text-red-500 text-sm' />
              <CopyButton type='button' value={error + ''} />
            </>}
          </div>
        </form>
      </Form>
    </main>
  )
}

export default App
