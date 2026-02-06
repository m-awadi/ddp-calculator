import { useState, useRef } from 'react';
import { QUOTATION_COLORS } from '../utils/defaultTerms';
import { detectTextDirection } from '../utils/bidiUtils';

// Common certification types for dropdown
const CERTIFICATION_TYPES = [
    { value: '', label: 'Select Type' },
    { value: 'SASO', label: 'SASO' },
    { value: 'COC', label: 'COC (Certificate of Conformity)' },
    { value: 'Lab Analysis', label: 'Lab Analysis' },
    { value: 'SABER', label: 'SABER' },
    { value: 'GCC', label: 'GCC Conformity' },
    { value: 'ESMA', label: 'ESMA' },
    { value: 'Other', label: 'Other' }
];

const QuotationItemRow = ({ item, index, onUpdate, onRemove, showPictureColumn = true, showCertificationColumn = false }) => {
    // Support both legacy single image and new multi-image array
    const getInitialImages = () => {
        if (item.images && Array.isArray(item.images)) {
            return item.images;
        }
        if (item.image) {
            return [item.image];
        }
        return [];
    };

    const [imagePreviews, setImagePreviews] = useState(getInitialImages());
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);

    const processImageFile = (file, append = true) => {
        if (!file || !file.type.startsWith('image/')) return;

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

                setImagePreviews(prev => {
                    const newImages = append ? [...prev, resizedImage] : [resizedImage];
                    // Update both 'images' array and legacy 'image' field for backwards compatibility
                    onUpdate(index, 'images', newImages);
                    onUpdate(index, 'image', newImages[0] || null);
                    return newImages;
                });
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const processMultipleFiles = (files) => {
        // Process all image files from the list
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        imageFiles.forEach((file, idx) => {
            // First file replaces if no existing images, subsequent files append
            processImageFile(file, imagePreviews.length > 0 || idx > 0);
        });
    };

    const handleImageUpload = (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        processMultipleFiles(files);
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        // Collect all image files from clipboard
        const imageFiles = [];
        for (let i = 0; i < items.length; i++) {
            const clipItem = items[i];
            if (clipItem.type.startsWith('image/')) {
                const file = clipItem.getAsFile();
                if (file) {
                    imageFiles.push(file);
                }
            }
        }

        if (imageFiles.length > 0) {
            e.preventDefault();
            // Append all pasted images to existing ones
            imageFiles.forEach(file => {
                processImageFile(file, true);
            });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            processMultipleFiles(files);
        }
    };

    const removeImage = (imageIndex) => {
        setImagePreviews(prev => {
            const newImages = prev.filter((_, i) => i !== imageIndex);
            onUpdate(index, 'images', newImages);
            onUpdate(index, 'image', newImages[0] || null);
            return newImages;
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeAllImages = () => {
        setImagePreviews([]);
        onUpdate(index, 'images', []);
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
                    verticalAlign: 'top'
                }}>
                    <div
                        ref={dropZoneRef}
                        onPaste={handlePaste}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        tabIndex={0}
                        style={{
                            width: '310px',
                            minHeight: '310px',
                            border: `2px dashed ${isDragging ? QUOTATION_COLORS.primary : QUOTATION_COLORS.textMuted}40`,
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: imagePreviews.length > 0 ? 'flex-start' : 'center',
                            background: isDragging ? `${QUOTATION_COLORS.primary}10` : QUOTATION_COLORS.white,
                            position: 'relative',
                            margin: '0 auto',
                            transition: 'all 0.2s ease',
                            outline: 'none',
                            padding: imagePreviews.length > 0 ? '8px' : '0',
                            gap: '8px'
                        }}
                    >
                        {imagePreviews.length > 0 ? (
                            <>
                                {/* Clear all button */}
                                <button
                                    onClick={removeAllImages}
                                    style={{
                                        position: 'absolute',
                                        top: '4px',
                                        right: '4px',
                                        background: QUOTATION_COLORS.primary,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        fontWeight: '500',
                                        zIndex: 10
                                    }}
                                >
                                    Clear All
                                </button>

                                {/* Images stacked vertically */}
                                {imagePreviews.map((imgSrc, imgIndex) => (
                                    <div
                                        key={imgIndex}
                                        style={{
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <img
                                            src={imgSrc}
                                            alt={`Product ${imgIndex + 1}`}
                                            style={{
                                                maxWidth: '290px',
                                                maxHeight: '290px',
                                                objectFit: 'contain',
                                                borderRadius: '4px'
                                            }}
                                        />
                                        <button
                                            onClick={() => removeImage(imgIndex)}
                                            style={{
                                                position: 'absolute',
                                                top: '2px',
                                                right: '2px',
                                                background: '#EF4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '20px',
                                                height: '20px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}

                                {/* Add more images button */}
                                <div style={{
                                    marginTop: '8px',
                                    paddingTop: '8px',
                                    borderTop: `1px dashed ${QUOTATION_COLORS.textMuted}40`,
                                    width: '100%',
                                    textAlign: 'center'
                                }}>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageUpload}
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            padding: '6px 12px',
                                            background: `${QUOTATION_COLORS.primary}20`,
                                            color: QUOTATION_COLORS.primary,
                                            border: `1px dashed ${QUOTATION_COLORS.primary}`,
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '11px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        + Add More Images
                                    </button>
                                    <div style={{
                                        marginTop: '4px',
                                        fontSize: '10px',
                                        color: QUOTATION_COLORS.textMuted
                                    }}>
                                        Or paste (Ctrl+V)
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                                {isDragging ? (
                                    <div style={{
                                        fontSize: '14px',
                                        color: QUOTATION_COLORS.primary,
                                        fontWeight: '600',
                                        textAlign: 'center'
                                    }}>
                                        Drop image(s) here
                                    </div>
                                ) : (
                                    <>
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
                                            Upload Image(s)
                                        </button>
                                        <span style={{
                                            marginTop: '8px',
                                            fontSize: '11px',
                                            color: QUOTATION_COLORS.textMuted,
                                            textAlign: 'center'
                                        }}>
                                            Click to upload, drag & drop, or paste
                                        </span>
                                        <span style={{
                                            marginTop: '4px',
                                            fontSize: '11px',
                                            color: QUOTATION_COLORS.textMuted
                                        }}>
                                            Multiple images supported
                                        </span>
                                    </>
                                )}
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
                    dir={detectTextDirection(item.description)}
                    style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '8px',
                        border: `1px solid ${QUOTATION_COLORS.inputBorder || QUOTATION_COLORS.textMuted}40`,
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        backgroundColor: QUOTATION_COLORS.inputBackground || QUOTATION_COLORS.white,
                        color: QUOTATION_COLORS.inputText || QUOTATION_COLORS.textDark,
                        unicodeBidi: 'plaintext',
                        textAlign: detectTextDirection(item.description) === 'rtl' ? 'right' : 'left'
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
                        border: `1px solid ${QUOTATION_COLORS.inputBorder || QUOTATION_COLORS.textMuted}40`,
                        borderRadius: '6px',
                        fontSize: '14px',
                        textAlign: 'right',
                        backgroundColor: QUOTATION_COLORS.inputBackground || QUOTATION_COLORS.white,
                        color: QUOTATION_COLORS.inputText || QUOTATION_COLORS.textDark
                    }}
                />
            </td>

            {/* Price - supports fractional costs like 0.084 */}
            <td style={{ padding: '12px 8px', width: '140px' }}>
                <input
                    type="number"
                    value={item.price}
                    onChange={(e) => onUpdate(index, 'price', parseFloat(e.target.value) || 0)}
                    placeholder="0.0000"
                    min="0"
                    step="0.0001"
                    style={{
                        width: '100%',
                        padding: '8px',
                        border: `1px solid ${QUOTATION_COLORS.inputBorder || QUOTATION_COLORS.textMuted}40`,
                        borderRadius: '6px',
                        fontSize: '14px',
                        textAlign: 'right',
                        backgroundColor: QUOTATION_COLORS.inputBackground || QUOTATION_COLORS.white,
                        color: QUOTATION_COLORS.inputText || QUOTATION_COLORS.textDark
                    }}
                />
            </td>

            {/* Total - supports up to 4 decimal places for fractional costs */}
            <td style={{
                padding: '12px 8px',
                width: '140px',
                textAlign: 'right',
                fontWeight: '600',
                color: QUOTATION_COLORS.textDark,
                fontSize: '14px'
            }}>
                ${(item.quantity * item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </td>

            {/* Certification/Lab Test Costs (when enabled) */}
            {showCertificationColumn && (
                <td style={{ padding: '12px 8px', width: '280px', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Certification Type Dropdown */}
                        <select
                            value={item.certificationType || ''}
                            onChange={(e) => onUpdate(index, 'certificationType', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '6px 8px',
                                border: `1px solid ${QUOTATION_COLORS.inputBorder || QUOTATION_COLORS.textMuted}40`,
                                borderRadius: '4px',
                                fontSize: '12px',
                                backgroundColor: QUOTATION_COLORS.inputBackground || QUOTATION_COLORS.white,
                                color: QUOTATION_COLORS.inputText || QUOTATION_COLORS.textDark
                            }}
                        >
                            {CERTIFICATION_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>

                        {/* Certification Cost Input */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <label style={{
                                fontSize: '11px',
                                color: QUOTATION_COLORS.textMuted,
                                minWidth: '60px'
                            }}>
                                Cert. Cost:
                            </label>
                            <input
                                type="number"
                                value={item.certificationCost || ''}
                                onChange={(e) => onUpdate(index, 'certificationCost', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                style={{
                                    flex: 1,
                                    padding: '6px 8px',
                                    border: `1px solid ${QUOTATION_COLORS.inputBorder || QUOTATION_COLORS.textMuted}40`,
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    textAlign: 'right',
                                    backgroundColor: QUOTATION_COLORS.inputBackground || QUOTATION_COLORS.white,
                                    color: QUOTATION_COLORS.inputText || QUOTATION_COLORS.textDark
                                }}
                            />
                            <span style={{ fontSize: '11px', color: QUOTATION_COLORS.textMuted }}>USD</span>
                        </div>

                        {/* Lab Test Cost Input */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <label style={{
                                fontSize: '11px',
                                color: QUOTATION_COLORS.textMuted,
                                minWidth: '60px'
                            }}>
                                Lab Test:
                            </label>
                            <input
                                type="number"
                                value={item.labTestCost || ''}
                                onChange={(e) => onUpdate(index, 'labTestCost', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                style={{
                                    flex: 1,
                                    padding: '6px 8px',
                                    border: `1px solid ${QUOTATION_COLORS.inputBorder || QUOTATION_COLORS.textMuted}40`,
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    textAlign: 'right',
                                    backgroundColor: QUOTATION_COLORS.inputBackground || QUOTATION_COLORS.white,
                                    color: QUOTATION_COLORS.inputText || QUOTATION_COLORS.textDark
                                }}
                            />
                            <span style={{ fontSize: '11px', color: QUOTATION_COLORS.textMuted }}>USD</span>
                        </div>

                        {/* One-Time Cost Input (fixed cost per item, not per pcs) */}
                        <div style={{
                            marginTop: '8px',
                            paddingTop: '8px',
                            borderTop: `1px dashed ${QUOTATION_COLORS.textMuted}40`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                                <label style={{
                                    fontSize: '11px',
                                    color: QUOTATION_COLORS.textMuted,
                                    minWidth: '60px'
                                }}>
                                    One-Time:
                                </label>
                                <input
                                    type="number"
                                    value={item.oneTimeCost || ''}
                                    onChange={(e) => onUpdate(index, 'oneTimeCost', parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    style={{
                                        flex: 1,
                                        padding: '6px 8px',
                                        border: `1px solid ${QUOTATION_COLORS.inputBorder || QUOTATION_COLORS.textMuted}40`,
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        textAlign: 'right',
                                        backgroundColor: QUOTATION_COLORS.inputBackground || QUOTATION_COLORS.white,
                                        color: QUOTATION_COLORS.inputText || QUOTATION_COLORS.textDark
                                    }}
                                />
                                <span style={{ fontSize: '11px', color: QUOTATION_COLORS.textMuted }}>USD</span>
                            </div>
                            <input
                                type="text"
                                value={item.oneTimeCostDescription || ''}
                                onChange={(e) => onUpdate(index, 'oneTimeCostDescription', e.target.value)}
                                placeholder="Description (e.g., Cylinder Cost)"
                                style={{
                                    width: '100%',
                                    padding: '4px 8px',
                                    border: `1px solid ${QUOTATION_COLORS.inputBorder || QUOTATION_COLORS.textMuted}40`,
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    backgroundColor: QUOTATION_COLORS.inputBackground || QUOTATION_COLORS.white,
                                    color: QUOTATION_COLORS.inputText || QUOTATION_COLORS.textDark
                                }}
                            />
                        </div>

                        {/* Total Add-ons Costs Display */}
                        {((item.certificationCost || 0) + (item.labTestCost || 0) + (item.oneTimeCost || 0)) > 0 && (
                            <div style={{
                                padding: '4px 8px',
                                background: `${QUOTATION_COLORS.primary}10`,
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '600',
                                color: QUOTATION_COLORS.primary,
                                textAlign: 'right',
                                marginTop: '8px'
                            }}>
                                Total Add-ons: ${((item.certificationCost || 0) + (item.labTestCost || 0) + (item.oneTimeCost || 0)).toFixed(2)}
                            </div>
                        )}
                    </div>
                </td>
            )}

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
