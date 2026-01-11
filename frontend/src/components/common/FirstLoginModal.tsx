import { useRef, useEffect } from 'react';
import { nl } from '@/lib/translations';

interface FirstLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FirstLoginModal({ isOpen, onClose }: FirstLoginModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen]);

    return (
        <dialog ref={dialogRef} className="modal" onClose={onClose}>
            <div className="modal-box text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="font-bold text-2xl mb-2">{nl.welcomeTitle}</h3>
                <p className="py-4 text-lg">{nl.firstLoginBonus}</p>
                <div className="flex justify-center gap-2 text-4xl mb-4">
                    <span>🏆</span>
                    <span className="font-bold text-primary">+10</span>
                    <span>🏆</span>
                </div>
                <div className="modal-action justify-center">
                    <button className="btn btn-primary btn-lg" onClick={onClose}>
                        {nl.letsGo} 🚀
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
}
