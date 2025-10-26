import React, { useCallback, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

export function CopyButton({ value, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const [ copied, setCopied ] = useState(false)

  const copyToClipboard = useCallback(() => {
    if (!value) return
    navigator.clipboard.writeText(value + '')

    setCopied(true)
    setTimeout(setCopied, 2000, false)
  }, [ value ])

  const clickHandler = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    copyToClipboard()
    onClick?.(event)
  }, [ copyToClipboard, onClick ])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button {...props} onClick={clickHandler}>
          {copied ? <Check /> : <Copy />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? '복사됨' : '복사'}</TooltipContent>
    </Tooltip>
  )
}
