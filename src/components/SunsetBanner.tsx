import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils/cn'
import { PageContainer } from './PageContainer'

const announcementUrl = 'https://docs.seamlessprotocol.com'

export function SunsetBanner() {
  return (
    <div
      className={cn(
        'shrink-0 border-b',
        'border-[color-mix(in_srgb,var(--tag-warning-text)_30%,transparent)]',
        'bg-[var(--tag-warning-bg)]',
      )}
    >
      <PageContainer className="py-2.5 sm:py-3">
        <Alert
          type="warning"
          title={
            <>
              Seamless Protocol is winding down.{' '}
              <a
                href={announcementUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2 hover:opacity-90"
              >
                Read the announcement
              </a>
            </>
          }
          titleClassName="line-clamp-none min-h-0"
          className={cn('mb-0 rounded-none border-0 bg-transparent p-0 shadow-none')}
        >
          <AlertDescription
            className={cn(
              'text-[color-mix(in_srgb,var(--tag-warning-text)_88%,var(--tag-warning-bg)_12%)]',
              '[&_time]:font-medium [&_time]:text-[var(--tag-warning-text)] [&_time]:whitespace-nowrap',
            )}
          >
            <p>
              Removal of all assets from the platform is strongly recommended by{' '}
              <time dateTime="2026-06-30">June 30, 2026</time>. Once the UI is offline, recovering
              your assets will require manual contract interaction, though possible, it is complex
              and you will need to do so without support.
            </p>
          </AlertDescription>
        </Alert>
      </PageContainer>
    </div>
  )
}
