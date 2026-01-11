import { PageContainer } from '@/components/layout';
import { NewsList } from '@/components/news';
import { useNews } from '@/hooks/useNews';

export function HomePage() {
    const { news, loading, error, refetch } = useNews();

    return (
        <PageContainer onRefresh={refetch}>
            <NewsList news={news} loading={loading} error={error} />
        </PageContainer>
    );
}
