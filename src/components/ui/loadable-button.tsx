import { cn } from 'cn'
import { Button } from './button'
import { Spinner } from './spinner'

export interface LoadableButtonProps extends React.ComponentProps<
  typeof Button
> {
  loading?: boolean | undefined
}

export function LoadableButton({
  loading,
  disabled,
  className,
  children,
  ...props
}: LoadableButtonProps) {
  return (
    <Button
      className={cn('relative', className)}
      disabled={disabled || loading}
      {...props}
    >
      <span className={cn('transition-opacity', loading && 'opacity-0')}>
        {children}
      </span>
      <div
        className={cn(
          'absolute inset-0 transition-opacity',
          loading || 'opacity-0',
        )}
      >
        <Spinner className='absolute inset-0 m-auto' />
      </div>
    </Button>
  )
}
