import { createFileRoute } from '@tanstack/react-router'
import { PageContainer } from '@/components/PageContainer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useActiveProposals } from '@/features/governance/hooks/useActiveProposals'

export const Route = createFileRoute('/governance')({
  component: GovernancePage,
})

function GovernancePage() {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useActiveProposals()

  // Flatten all pages and filter for active proposals
  const activeProposals =
    data?.pages.flatMap((page) =>
      page.proposals.filter((proposal) => proposal.status === 'active'),
    ) || []

  return (
    <PageContainer padded={false} className="py-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Governance</h1>
        <p className="text-muted-foreground mt-2">Participate in Seamless Protocol governance</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Proposals</CardTitle>
            <CardDescription>
              View active governance proposals that are currently open for voting
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-muted-foreground">Loading proposals...</p>}

            {error && <p className="text-red-500">Error loading proposals: {error.message}</p>}

            {activeProposals.length === 0 && !isLoading && (
              <p className="text-muted-foreground">No active proposals</p>
            )}

            {activeProposals.length > 0 && (
              <div className="space-y-4">
                {activeProposals.map((proposal) => (
                  <Card key={proposal.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">Proposal {proposal.onchainId}</h3>
                        <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          {proposal.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {proposal.metadata.description.substring(0, 100)}...
                      </p>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Created: {new Date(proposal.createdAt).toLocaleDateString()}</span>
                        <span>Quorum: {Number(proposal.quorum) / 1e18} SEAM</span>
                      </div>
                      {proposal.voteStats && proposal.voteStats.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="text-xs font-medium text-muted-foreground">
                            Vote Results:
                          </div>
                          <div className="flex gap-4 text-xs">
                            {proposal.voteStats.map((vote) => (
                              <div key={vote.type} className="flex items-center gap-1">
                                <span className="capitalize">{vote.type}:</span>
                                <span className="font-medium">{vote.percent}%</span>
                                <span className="text-muted-foreground">
                                  ({vote.votersCount} voters)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {hasNextPage && (
                  <div className="text-center pt-4">
                    <button
                      type="button"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isFetchingNextPage ? (
                        <Skeleton className="h-4 w-24" />
                      ) : (
                        'Load More Proposals'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
