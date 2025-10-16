import { ChevronDown, ChevronRight, Code2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../../../components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../../../components/ui/collapsible'

interface ErrorDetailsToggleProps {
  technicalDetails?: string
  className?: string
}

export function ErrorDetailsToggle({ technicalDetails, className }: ErrorDetailsToggleProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!technicalDetails) {
    return null
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-xs text-muted-foreground hover:text-foreground"
        >
          <div className="flex items-center gap-2">
            <Code2 className="h-3 w-3" />
            <span>Technical Details</span>
          </div>
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="rounded-md bg-muted/50 p-3 text-xs font-mono text-muted-foreground max-h-48 overflow-y-auto overflow-x-auto text-left">
          <pre className="whitespace-pre-wrap break-all">{technicalDetails}</pre>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
