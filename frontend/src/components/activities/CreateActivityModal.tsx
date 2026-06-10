import { useState, useRef, useEffect } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { useAuth } from '@/contexts/AuthContext';
import { pb } from '@/lib/pocketbase';
import { nl } from '@/lib/translations';
import type { User } from '@/types';

interface CreateActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateActivityModal({ isOpen, onClose, onSuccess }: CreateActivityModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const { createActivity } = useActivities();
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

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({ ...prev, creator: user?.id || '' }));
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen, user]);

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

        if (start < tomorrow) {
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
            await createActivity({
                ...formData,
                start_time: new Date(formData.start_time).toISOString(),
                end_time: formData.end_time ? new Date(formData.end_time).toISOString() : undefined,
                points_participant: 5,
                points_creator: 5,
                points_organizer_per_participant: 2,
                max_participants: 0,
                image: imageFile || undefined,
                creator: isAdmin ? formData.creator : undefined,
            });

            // Reset form
            setFormData({
                title: '',
                description: '',
                start_time: '',
                end_time: '',
                creator: user?.id || '',
            });
            setImageFile(null);
            setImagePreview(null);

            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create activity');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <dialog ref={dialogRef} className="modal" onClose={handleClose}>
            <div className="modal-box max-w-md">
                <form method="dialog">
                    <button
                        className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                        onClick={handleClose}
                    >
                        ✕
                    </button>
                </form>

                <h3 className="font-bold text-lg mb-4">{nl.newActivity}</h3>

                {error && (
                    <div className="alert alert-error mb-4">
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">{nl.title} *</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            maxLength={200}
                        />
                    </div>

                    {isAdmin && (
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Organisator *</span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={formData.creator}
                                onChange={(e) => setFormData({ ...formData, creator: e.target.value })}
                                required
                            >
                                <option value="" disabled>Selecteer een organisator</option>
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
                            <span className="label-text">{nl.description} *</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered h-24"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            maxLength={2000}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">{nl.dateTime} *</span>
                            </label>
                            <input
                                type="datetime-local"
                                className="input input-bordered w-full"
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Eindtijd</span>
                            </label>
                            <input
                                type="datetime-local"
                                className="input input-bordered w-full"
                                value={formData.end_time}
                                min={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                            />
                        </div>
                    </div>



                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">{nl.image}</span>
                        </label>
                        <input
                            type="file"
                            className="file-input file-input-bordered"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        {imagePreview && (
                            <div className="mt-2">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-32 object-cover rounded-lg"
                                />
                            </div>
                        )}
                    </div>

                    <div className="modal-action">
                        <button type="button" className="btn btn-ghost" onClick={handleClose}>
                            {nl.cancel}
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <span className="loading loading-spinner loading-sm" />
                            ) : (
                                nl.create
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
