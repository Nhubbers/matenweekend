import { PageContainer } from '@/components/layout';
import { NewsList } from '@/components/news';

export function HomePage() {
    return (
        <PageContainer>
            <NewsList />
        </PageContainer>
    );
}
