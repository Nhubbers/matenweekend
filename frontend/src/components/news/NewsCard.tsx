import { formatRelativeTime } from '@/lib/utils';
import type { News } from '@/types';

interface NewsCardProps {
    news: News;
}

export function NewsCard({ news }: NewsCardProps) {
    return (
        <article className="card bg-base-200 p-4">
            <h3 className="font-bold text-lg">{news.title}</h3>
            <p className="text-sm text-base-content/70 mb-2">
                {formatRelativeTime(news.created)}
            </p>
            {news.body && (
                <div
                    className="prose prose-sm max-w-none text-base-content/90"
                    dangerouslySetInnerHTML={{ __html: news.body }}
                />
            )}
        </article>
    );
}
