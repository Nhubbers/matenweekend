import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pb } from '@/lib/pocketbase';
import type { News } from '@/types';

export function useNews() {
    const queryClient = useQueryClient();

    const { data: news = [], isLoading: loading, error, refetch } = useQuery<News[]>({
        queryKey: ['news'],
        queryFn: async () => {
            return await pb.collection('news').getFullList<News>({
                sort: '-created',
                expand: 'author',
            });
        },
    });

    const createNews = async (title: string, body: string) => {
        const newsItem = await pb.collection('news').create<News>({
            title,
            body,
            author: pb.authStore.record?.id,
        });
        await queryClient.invalidateQueries({ queryKey: ['news'] });
        return newsItem;
    };

    const updateNews = async (id: string, title: string, body: string) => {
        const updated = await pb.collection('news').update<News>(id, { title, body });
        await queryClient.invalidateQueries({ queryKey: ['news'] });
        return updated;
    };

    const deleteNews = async (id: string) => {
        await pb.collection('news').delete(id);
        await queryClient.invalidateQueries({ queryKey: ['news'] });
    };

    return {
        news,
        loading,
        error: error ? error.message : null,
        refetch: async () => {
            await refetch();
        },
        createNews,
        updateNews,
        deleteNews,
    };
}
