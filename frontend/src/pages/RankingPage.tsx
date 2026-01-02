import { PageContainer } from '@/components/layout';
import { RankingList } from '@/components/ranking';
import { nl } from '@/lib/translations';

export function RankingPage() {
    return (
        <PageContainer>
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>🏆</span> {nl.ranking}
            </h1>
            <RankingList />
        </PageContainer>
    );
}
