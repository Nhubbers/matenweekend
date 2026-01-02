import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNews } from '@/hooks/useNews';
import { EditNewsModal } from './EditNewsModal';
import { formatRelativeTime } from '@/lib/utils';
import type { News } from '@/types';

interface NewsCardProps {
    news: News;
}

export function NewsCard({ news }: NewsCardProps) {
    const { user, isAdmin } = useAuth();
    const { updateNews } = useNews();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const isAuthor = user?.id === news.author || isAdmin;

    const handleUpdate = async (title: string, body: string) => {
        try {
            setLoading(true);
            await updateNews(news.id, title, body);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update news:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <article className="card bg-base-200 p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg">{news.title}</h3>
                        <p className="text-sm text-base-content/70 mb-2">
                            {formatRelativeTime(news.created)}
                        </p>
                    </div>
                    {isAuthor && (
                        <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => setIsEditing(true)}
                        >
                            ✏️
                        </button>
                    )}
                </div>
                {news.body && (
                    <div
                        className="prose prose-sm max-w-none text-base-content/90"
                        dangerouslySetInnerHTML={{ __html: news.body }}
                    />
                )}
            </article>

            {isEditing && (
                <EditNewsModal
                    isOpen={isEditing}
                    initialTitle={news.title}
                    initialBody={news.body}
                    onSubmit={handleUpdate}
                    onClose={() => setIsEditing(false)}
                    isLoading={loading}
                />
            )}
        </>
    );
}
