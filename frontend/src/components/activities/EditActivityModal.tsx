import { useState, useRef, useEffect } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { nl } from '@/lib/translations';
import { formatDateForInput } from '@/lib/utils';
import type { Activity } from '@/types';

interface EditActivityModalProps {
    activity: Activity;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (updatedActivity: Activity) => void;
}

export function EditActivityModal({ activity, isOpen, onClose, onSuccess }: EditActivityModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const { updateActivity } = useActivities();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_time: '',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Initialize form with activity data when opening
    useEffect(() => {
        if (isOpen && activity) {
            setFormData({
                title: activity.title,
                description: activity.description,
                start_time: formatDateForInput(activity.start_time),
            });
            // Note: we can't easily preview the existing image here as a File, 
            // but we could show the URL if we wanted. For now, we only preview NEW uploads.

            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen, activity]);

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

        try {
            const updated = await updateActivity(activity.id, {
                ...formData,
                start_time: new Date(formData.start_time).toISOString(),
                image: imageFile || undefined,
            });

            setImageFile(null);
            setImagePreview(null);

            onSuccess?.(updated);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update activity');
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

                <h3 className="font-bold text-lg mb-4">Activiteit Bewerken</h3>

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

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">{nl.dateTime} *</span>
                        </label>
                        <input
                            type="datetime-local"
                            className="input input-bordered"
                            value={formData.start_time}
                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Afbeelding wijzigen (optioneel)</span>
                        </label>
                        <input
                            type="file"
                            className="file-input file-input-bordered"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        {imagePreview && (
                            <div className="mt-2">
                                <p className="text-xs mb-1">Nieuwe afbeelding:</p>
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
