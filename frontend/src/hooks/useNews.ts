import { useState, useCallback, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import type { News } from '@/types';

export function useNews() {
    const [news, setNews] = useState<News[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNews = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await pb.collection('news').getFullList<News>({
                sort: '-created',
                expand: 'author',
            });

            setNews(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch news');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    const createNews = async (title: string, body: string) => {
        const newsItem = await pb.collection('news').create<News>({
            title,
            body,
            author: pb.authStore.record?.id,
        });
        setNews((prev) => [newsItem, ...prev]);
        return newsItem;
    };

    const updateNews = async (id: string, title: string, body: string) => {
        const updated = await pb.collection('news').update<News>(id, { title, body });
        setNews((prev) => prev.map((n) => (n.id === id ? updated : n)));
        return updated;
    };

    const deleteNews = async (id: string) => {
        await pb.collection('news').delete(id);
        setNews((prev) => prev.filter((n) => n.id !== id));
    };

    return {
        news,
        loading,
        error,
        refetch: fetchNews,
        createNews,
        updateNews,
        deleteNews,
    };
}
