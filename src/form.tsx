import * as z from 'zod/mini'
import { Controller, useWatch, type UseFormReturn } from 'react-hook-form'
import { Input } from './components/ui/input'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from './components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select'
import { removeExt } from './utils/common'

const allowedExts = ['.jpg', '.png', '.bmp', '.svg', '.mp3'] as const

export type UploadFormSchema = z.infer<typeof UploadFormSchema>
export const UploadFormSchema = z.object({
  file: z.file('파일을 선택하세요.'),
  name: z.string(),
  ext: z.enum(allowedExts),
})

export interface UploadFormProps {
  form: UseFormReturn<UploadFormSchema>
}

export function UploadFormContent({ form }: UploadFormProps) {
  const file = useWatch({
    control: form.control,
    name: 'file',
  })

  return (
    <>
      <Controller
        name='file'
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>파일 선택</FieldLabel>
            <Input
              {...field}
              type='file'
              value={undefined}
              onChange={({ target: { files } }) =>
                files && form.setValue('file', files[0]!)
              }
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name='name'
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>업로드 이름</FieldLabel>
            <div className='flex gap-2'>
              <Input
                {...field}
                placeholder={file ? removeExt(file.name) : '업로드 이름 입력'}
              />
              <Controller
                name='ext'
                control={form.control}
                render={({ field }) => (
                  <Select {...field} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedExts.map((ext) => (
                        <SelectItem key={ext} value={ext}>
                          {ext}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {fieldState.invalid ? (
              <FieldError errors={[fieldState.error]} />
            ) : (
              <FieldDescription>
                이미 존재하는 업로드 이름은 사용할 수 없습니다.
              </FieldDescription>
            )}
          </Field>
        )}
      />
    </>
  )
}
