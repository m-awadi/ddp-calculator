import { useState, useRef } from 'react';
import { QUOTATION_COLORS } from '../utils/defaultTerms';

const QuotationItemRow = ({ item, index, onUpdate, onRemove, showPictureColumn = true }) => {
    const [imagePreview, setImagePreview] = useState(item.image || null);
    const fileInputRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Resize image to fit cell (max 300x300)
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const maxSize = 300;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const resizedImage = canvas.toDataURL('image/jpeg', 0.85);
                setImagePreview(resizedImage);
                onUpdate(index, 'image', resizedImage);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImagePreview(null);
        onUpdate(index, 'image', null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <tr style={{ borderBottom: `1px solid ${QUOTATION_COLORS.textMuted}40` }}>
            {/* Item Number */}
            <td style={{
                padding: '12px 8px',
                textAlign: 'center',
                width: '60px',
                fontWeight: '600',
                color: QUOTATION_COLORS.textDark
            }}>
                {index + 1}
            </td>

            {/* Picture */}
            {showPictureColumn && (
                <td style={{
                    padding: '12px 8px',
                    width: '320px',
                    verticalAlign: 'middle'
                }}>
                    <div style={{
                        width: '310px',
                        height: '310px',
                        border: `2px dashed ${QUOTATION_COLORS.textMuted}40`,
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: QUOTATION_COLORS.white,
                        position: 'relative',
                        margin: '0 auto'
                    }}>
                        {imagePreview ? (
                            <>
                                <img
                                    src={imagePreview}
                                    alt="Product"
                                    style={{
                                        maxWidth: '300px',
                                        maxHeight: '300px',
                                        objectFit: 'contain'
                                    }}
                                />
                                <button
                                    onClick={removeImage}
                                    style={{
                                        position: 'absolute',
                                        top: '4px',
                                        right: '4px',
                                        background: QUOTATION_COLORS.primary,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    ✕
                                </button>
                            </>
                        ) : (
                            <>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        padding: '8px 16px',
                                        background: QUOTATION_COLORS.primary,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '500'
                                    }}
                                >
                                    Upload Image
                                </button>
                                <span style={{
                                    marginTop: '8px',
                                    fontSize: '11px',
                                    color: QUOTATION_COLORS.textMuted
                                }}>
                                    Max 300x300px
                                </span>
                            </>
                        )}
                    </div>
                </td>
            )}

            {/* Description */}
            <td style={{ padding: '12px 8px' }}>
                <textarea
                    value={item.description}
                    onChange={(e) => onUpdate(index, 'description', e.target.value)}
                    placeholder="Product description..."
                    style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '8px',
                        border: `1px solid ${QUOTATION_COLORS.textMuted}40`,
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                    }}
                />
            </td>

            {/* Quantity */}
            <td style={{ padding: '12px 8px', width: '120px' }}>
                <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    style={{
                        width: '100%',
                        padding: '8px',
                        border: `1px solid ${QUOTATION_COLORS.textMuted}40`,
                        borderRadius: '6px',
                        fontSize: '14px',
                        textAlign: 'right'
                    }}
                />
            </td>

            {/* Price */}
            <td style={{ padding: '12px 8px', width: '140px' }}>
                <input
                    type="number"
                    value={item.price}
                    onChange={(e) => onUpdate(index, 'price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    style={{
                        width: '100%',
                        padding: '8px',
                        border: `1px solid ${QUOTATION_COLORS.textMuted}40`,
                        borderRadius: '6px',
                        fontSize: '14px',
                        textAlign: 'right'
                    }}
                />
            </td>

            {/* Total */}
            <td style={{
                padding: '12px 8px',
                width: '140px',
                textAlign: 'right',
                fontWeight: '600',
                color: QUOTATION_COLORS.textDark,
                fontSize: '14px'
            }}>
                ${(item.quantity * item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>

            {/* Remove Button */}
            <td style={{ padding: '12px 8px', width: '60px', textAlign: 'center' }}>
                <button
                    onClick={() => onRemove(index)}
                    style={{
                        padding: '6px 10px',
                        background: '#EF444420',
                        border: '1px solid #EF444440',
                        borderRadius: '6px',
                        color: '#EF4444',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    ✕
                </button>
            </td>
        </tr>
    );
};

export default QuotationItemRow;
