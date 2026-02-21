'use client';

interface DeleteConfirmModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export default function DeleteConfirmModal({ title, message, onConfirm, onCancel, loading }: DeleteConfirmModalProps) {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
                <h3 className="admin-modal-title">{title}</h3>
                <p className="admin-modal-message">{message}</p>
                <div className="admin-modal-actions">
                    <button className="btn-secondary" onClick={onCancel} disabled={loading}>
                        Cancelar
                    </button>
                    <button className="btn-danger" onClick={onConfirm} disabled={loading}>
                        {loading ? 'Excluindo...' : 'Excluir'}
                    </button>
                </div>
            </div>
        </div>
    );
}
