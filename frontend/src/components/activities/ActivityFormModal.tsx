import { useState, useRef, useEffect } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/contexts/AuthContext';
import { pb } from '@/lib/pocketbase';
import { nl } from '@/lib/translations';
import { formatDateForInput } from '@/lib/utils';
import type { Activity, User } from '@/types';

interface ActivityFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'create' | 'edit';
    activity?: Activity; // Required in 'edit' mode
    onSuccess?: (activity?: Activity) => void;
}

export function ActivityFormModal({ isOpen, onClose, mode, activity, onSuccess }: ActivityFormModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const { createActivity, updateActivity } = useActivities();
    const { isAdmin, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        creator: '',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Fetch users if admin
    useEffect(() => {
        if (isOpen && isAdmin) {
            const fetchUsers = async () => {
                try {
                    const result = await pb.collection('users').getFullList<User>({
                        sort: 'name',
                    });
                    setUsers(result);
                } catch (err) {
                    console.error('Failed to fetch users:', err);
                }
            };
            fetchUsers();
        }
    }, [isOpen, isAdmin]);

    // Initialize/Reset form data based on mode & activity
    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && activity) {
                setFormData({
                    title: activity.title,
                    description: activity.description,
                    start_time: formatDateForInput(activity.start_time),
                    end_time: activity.end_time ? formatDateForInput(activity.end_time) : '',
                    creator: activity.creator,
                });
            } else {
                setFormData({
                    title: '',
                    description: '',
                    start_time: '',
                    end_time: '',
                    creator: user?.id || '',
                });
            }
            setImageFile(null);
            setImagePreview(null);
            setError(null);
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen, mode, activity, user]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const start = new Date(formData.start_time);
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        // Date validation rules
        if (mode === 'create' && start < tomorrow) {
            setError('Activiteit moet minimaal morgen plaatsvinden');
            setLoading(false);
            return;
        }

        if (formData.end_time && new Date(formData.end_time) <= start) {
            setError('Eindtijd moet na starttijd liggen');
            setLoading(false);
            return;
        }

        try {
            if (mode === 'create') {
                const newAct = await createActivity({
                    ...formData,
                    start_time: start.toISOString(),
                    end_time: formData.end_time ? new Date(formData.end_time).toISOString() : undefined,
                    points_participant: 5,
                    points_creator: 5,
                    points_organizer_per_participant: 2,
                    max_participants: 0,
                    image: imageFile || undefined,
                    creator: isAdmin ? formData.creator : undefined,
                });
                onSuccess?.(newAct);
            } else if (mode === 'edit' && activity) {
                const updated = await updateActivity(activity.id, {
                    ...formData,
                    start_time: start.toISOString(),
                    end_time: formData.end_time ? new Date(formData.end_time).toISOString() : undefined,
                    image: imageFile || undefined,
                    creator: isAdmin ? formData.creator : undefined,
                });
                onSuccess?.(updated);
            }
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <dialog ref={dialogRef} className="modal" onClose={handleClose}>
            <div className="modal-box max-w-md rounded-2xl shadow-2xl p-6">
                <form method="dialog">
                    <button
                        className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                        onClick={handleClose}
                    >
                        ✕
                    </button>
                </form>

                <h3 className="font-bold text-lg mb-4 text-primary-content">
                    {mode === 'create' ? nl.newActivity : nl.editActivity}
                </h3>

                {error && (
                    <div className="alert alert-error mb-4 rounded-xl py-2 px-3">
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-bold">{nl.title} *</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full rounded-xl"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            maxLength={200}
                        />
                    </div>

                    {isAdmin && (
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-bold">{nl.organizer} *</span>
                            </label>
                            <select
                                className="select select-bordered w-full rounded-xl"
                                value={formData.creator}
                                onChange={(e) => setFormData({ ...formData, creator: e.target.value })}
                                required
                            >
                                <option value="" disabled>{nl.selectUser}</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name || u.email}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-bold">{nl.description} *</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered h-24 rounded-xl"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            maxLength={2000}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-bold">{nl.dateTime} *</span>
                            </label>
                            <input
                                type="datetime-local"
                                className="input input-bordered w-full rounded-xl"
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-bold">Eindtijd</span>
                            </label>
                            <input
                                type="datetime-local"
                                className="input input-bordered w-full rounded-xl"
                                value={formData.end_time}
                                min={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-bold">
                                {mode === 'create' ? nl.image : 'Afbeelding wijzigen (optioneel)'}
                            </span>
                        </label>
                        <input
                            type="file"
                            className="file-input file-input-bordered w-full rounded-xl"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        {imagePreview && (
                            <div className="mt-2">
                                <p className="text-xs mb-1 font-semibold text-base-content/70">
                                    {mode === 'create' ? 'Voorbeeld:' : 'Nieuwe afbeelding voorbeeld:'}
                                </p>
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-32 object-cover rounded-xl border border-base-300"
                                />
                            </div>
                        )}
                    </div>

                    <div className="modal-action gap-2 pt-2">
                        <button type="button" className="btn btn-ghost rounded-xl" onClick={handleClose}>
                            {nl.cancel}
                        </button>
                        <button type="submit" className="btn btn-primary rounded-xl px-6" disabled={loading}>
                            {loading ? (
                                <span className="loading loading-spinner loading-sm" />
                            ) : mode === 'create' ? (
                                nl.create
                            ) : (
                                nl.save
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={handleClose}>close</button>
            </form>
        </dialog>
    );
}
