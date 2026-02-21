'use client';

import { useState, useRef } from 'react';
import { UploadIcon } from './AdminIcons';

interface ImageUploadProps {
    currentImageUrl?: string | null;
    onFileSelect: (file: File | null) => void;
    error?: string;
}

export default function ImageUpload({ currentImageUrl, onFileSelect, error }: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
    const [fileError, setFileError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (file: File | null) => {
        setFileError('');

        if (!file) {
            setPreview(currentImageUrl || null);
            onFileSelect(null);
            return;
        }

        // Validate type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setFileError('Use apenas JPG, PNG ou WebP');
            return;
        }

        // Validate size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setFileError('Arquivo muito grande (máx. 5MB)');
            return;
        }

        setPreview(URL.createObjectURL(file));
        onFileSelect(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileChange(file);
    };

    return (
        <div className="form-group">
            <label className="form-label">Foto do Produto *</label>
            <div
                className={`image-upload-zone ${preview ? 'has-image' : ''}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
            >
                {preview ? (
                    <img src={preview} alt="Preview" className="image-upload-preview" />
                ) : (
                    <>
                        <UploadIcon size={32} color="var(--primary-light)" />
                        <div className="image-upload-text">
                            Clique ou arraste uma imagem
                        </div>
                        <div className="image-upload-hint">
                            JPG, PNG ou WebP - Máx. 5MB
                        </div>
                    </>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={e => handleFileChange(e.target.files?.[0] || null)}
            />
            {preview && (
                <button
                    type="button"
                    style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={e => {
                        e.stopPropagation();
                        setPreview(null);
                        onFileSelect(null);
                        if (inputRef.current) inputRef.current.value = '';
                    }}
                >
                    Remover imagem
                </button>
            )}
            {(fileError || error) && (
                <div className="image-upload-error">{fileError || error}</div>
            )}
        </div>
    );
}
