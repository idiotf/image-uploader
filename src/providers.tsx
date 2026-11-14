import { TooltipProvider } from './components/ui/tooltip'

export type ProvidersProps = React.PropsWithChildren

export function Providers({ children }: ProvidersProps) {
  return <TooltipProvider>{children}</TooltipProvider>
}
