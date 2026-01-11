import { PageContainer } from '@/components/layout';
import { RankingList } from '@/components/ranking';
import { useRanking } from '@/hooks/useRanking';
import { nl } from '@/lib/translations';

export function RankingPage() {
    const { rankings, loading, error, refetch } = useRanking();

    return (
        <PageContainer onRefresh={refetch}>
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>🏆</span> {nl.ranking}
            </h1>
            <RankingList rankings={rankings} loading={loading} error={error} />
        </PageContainer>
    );
}
