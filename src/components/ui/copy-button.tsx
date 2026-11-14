import { useCallback, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Spinner } from './spinner'
import { Button } from './button'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

let textarea: HTMLTextAreaElement

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch (e) {
    console.warn(e)

    textarea ||= document.createElement('textarea')
    document.body.appendChild(textarea)

    textarea.value = text
    textarea.select()
    document.execCommand('copy')

    textarea.remove()
  }
}

export interface CopyButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  'value' | 'children'
> {
  value: string | (() => string | PromiseLike<string>)
}

export function CopyButton({ value, onClick, ...props }: CopyButtonProps) {
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = useCallback(async () => {
    if (!value) return

    try {
      setCopying(true)
      await copyText(typeof value == 'function' ? await value() : value)
    } finally {
      setCopying(false)
    }

    setCopied(true)
    setTimeout(setCopied, 2000, false)
  }, [value])

  const clickHandler = useCallback<NonNullable<CopyButtonProps['onClick']>>(
    (event) => {
      copyToClipboard()
      onClick?.(event)
    },
    [copyToClipboard, onClick],
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button {...props} onClick={clickHandler}>
          {copying ? <Spinner /> : copied ? <Check /> : <Copy />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? '복사됨' : '복사'}</TooltipContent>
    </Tooltip>
  )
}
