import { useState } from 'react';
import { PageContainer } from '@/components/layout';
import { AdminActivityList, PointsForm, NewsManager } from '@/components/admin';
import { nl } from '@/lib/translations';
import { cn } from '@/lib/utils';

type AdminTab = 'activities' | 'points' | 'news';

const tabs: { value: AdminTab; label: string }[] = [
    { value: 'activities', label: nl.activities },
    { value: 'points', label: nl.points },
    { value: 'news', label: nl.news },
];

export function AdminPage() {
    const [activeTab, setActiveTab] = useState<AdminTab>('activities');

    return (
        <PageContainer>
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>⚙️</span> Admin Dashboard
            </h1>

            <div className="tabs tabs-boxed bg-base-200 mb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.value}
                        className={cn('tab', activeTab === tab.value && 'tab-active')}
                        onClick={() => setActiveTab(tab.value)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'activities' && <AdminActivityList />}
            {activeTab === 'points' && <PointsForm />}
            {activeTab === 'news' && <NewsManager />}
        </PageContainer>
    );
}
