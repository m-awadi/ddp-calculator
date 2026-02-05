import { useState } from 'react';
import { formatCurrency } from '../utils/formatters';

const HistoryPanel = ({
    isOpen,
    onToggle,
    history,
    onLoad,
    onDelete,
    onRename,
    onClearAll,
    onSave,
    currentReportName,
}) => {
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveName, setSaveName] = useState('');

    const filteredHistory = history.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleStartEdit = (item) => {
        setEditingId(item.id);
        setEditName(item.name);
    };

    const handleSaveEdit = (id) => {
        if (editName.trim()) {
            onRename(id, editName.trim());
        }
        setEditingId(null);
        setEditName('');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const handleSaveClick = () => {
        setSaveName(currentReportName || '');
        setShowSaveModal(true);
    };

    const handleConfirmSave = () => {
        onSave(saveName.trim() || null);
        setShowSaveModal(false);
        setSaveName('');
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    // Panel styles
    const panelStyle = {
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: isOpen ? '360px' : '0px',
        background: 'var(--bg-primary)',
        borderLeft: isOpen ? '1px solid var(--border)' : 'none',
        boxShadow: isOpen ? '-4px 0 20px rgba(0,0,0,0.1)' : 'none',
        transition: 'width 0.3s ease, box-shadow 0.3s ease',
        overflow: 'hidden',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
    };

    const toggleButtonStyle = {
        position: 'fixed',
        top: '50%',
        right: isOpen ? '360px' : '0px',
        transform: 'translateY(-50%)',
        width: '32px',
        height: '80px',
        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
        border: 'none',
        borderRadius: '8px 0 0 8px',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        transition: 'right 0.3s ease',
        zIndex: 1001,
        boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={onToggle}
                style={toggleButtonStyle}
                title={isOpen ? 'Close History' : 'Open History'}
            >
                <span style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    fontSize: '12px',
                    fontWeight: '600',
                    letterSpacing: '1px',
                }}>
                    {isOpen ? '▶' : '◀ HISTORY'}
                </span>
            </button>

            {/* Panel */}
            <div style={panelStyle}>
                {isOpen && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        width: '360px',
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '20px',
                            borderBottom: '1px solid var(--border)',
                            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                            color: 'white',
                        }}>
                            <h2 style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}>
                                <span>📜</span> Quotation History
                            </h2>

                            {/* Save Current Button */}
                            <button
                                onClick={handleSaveClick}
                                style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    background: 'rgba(255,255,255,0.2)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: '0.2s',
                                }}
                                onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.3)'}
                                onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
                            >
                                <span>💾</span> Save Current Quotation
                            </button>
                        </div>

                        {/* Search */}
                        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                            <input
                                type="text"
                                placeholder="Search quotations..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                }}
                            />
                        </div>

                        {/* History List */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '12px',
                        }}>
                            {filteredHistory.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '40px 20px',
                                    color: 'var(--text-muted)',
                                }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📋</div>
                                    <p style={{ fontSize: '14px' }}>
                                        {searchTerm ? 'No matching quotations found' : 'No saved quotations yet'}
                                    </p>
                                    <p style={{ fontSize: '12px', marginTop: '8px' }}>
                                        {!searchTerm && 'Click "Save Current Quotation" to save your work'}
                                    </p>
                                </div>
                            ) : (
                                filteredHistory.map(item => (
                                    <div
                                        key={item.id}
                                        style={{
                                            background: 'var(--bg-card)',
                                            borderRadius: '10px',
                                            padding: '14px',
                                            marginBottom: '10px',
                                            border: '1px solid var(--border)',
                                            transition: '0.2s',
                                        }}
                                    >
                                        {/* Name (editable) */}
                                        {editingId === item.id ? (
                                            <div style={{ marginBottom: '8px' }}>
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') handleSaveEdit(item.id);
                                                        if (e.key === 'Escape') handleCancelEdit();
                                                    }}
                                                    autoFocus
                                                    style={{
                                                        width: '100%',
                                                        padding: '6px 8px',
                                                        fontSize: '14px',
                                                        fontWeight: '600',
                                                        border: '2px solid var(--accent-blue)',
                                                        borderRadius: '4px',
                                                        outline: 'none',
                                                    }}
                                                />
                                                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                                    <button
                                                        onClick={() => handleSaveEdit(item.id)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            fontSize: '11px',
                                                            background: 'var(--accent-blue)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        style={{
                                                            padding: '4px 8px',
                                                            fontSize: '11px',
                                                            background: 'var(--bg-secondary)',
                                                            color: 'var(--text-muted)',
                                                            border: '1px solid var(--border)',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                style={{
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    color: 'var(--text-primary)',
                                                    marginBottom: '6px',
                                                    cursor: 'pointer',
                                                }}
                                                onClick={() => handleStartEdit(item)}
                                                title="Click to rename"
                                            >
                                                {item.name}
                                            </div>
                                        )}

                                        {/* Summary */}
                                        <div style={{
                                            fontSize: '12px',
                                            color: 'var(--text-muted)',
                                            marginBottom: '10px',
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '8px',
                                        }}>
                                            <span title="Items">{item.summary.itemCount} items</span>
                                            <span>•</span>
                                            <span title="Total CBM">{item.summary.totalCBM.toFixed(2)} CBM</span>
                                            <span>•</span>
                                            <span
                                                style={{ fontWeight: '600', color: 'var(--accent-blue)' }}
                                                title="DDP Total"
                                            >
                                                {formatCurrency(item.summary.ddpTotal)}
                                            </span>
                                        </div>

                                        {/* Date */}
                                        <div style={{
                                            fontSize: '11px',
                                            color: 'var(--text-muted)',
                                            marginBottom: '10px',
                                        }}>
                                            Saved {formatDate(item.savedAt)}
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button
                                                onClick={() => onLoad(item.id)}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px 12px',
                                                    background: 'var(--accent-blue)',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    color: 'white',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '4px',
                                                    transition: '0.2s',
                                                }}
                                                title="Load this quotation"
                                            >
                                                <span>↩</span> Restore
                                            </button>
                                            <button
                                                onClick={() => onDelete(item.id)}
                                                style={{
                                                    padding: '8px 12px',
                                                    background: 'var(--bg-secondary)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '6px',
                                                    color: '#dc2626',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    transition: '0.2s',
                                                }}
                                                title="Delete this quotation"
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {history.length > 0 && (
                            <div style={{
                                padding: '12px 20px',
                                borderTop: '1px solid var(--border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {history.length} saved quotation{history.length !== 1 ? 's' : ''}
                                </span>
                                <button
                                    onClick={() => {
                                        if (confirm('Are you sure you want to clear all history?')) {
                                            onClearAll();
                                        }
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        background: 'transparent',
                                        border: '1px solid #dc2626',
                                        borderRadius: '6px',
                                        color: '#dc2626',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Clear All
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Save Modal */}
            {showSaveModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                }}>
                    <div style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '16px',
                        padding: '24px',
                        width: '400px',
                        maxWidth: '90vw',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    }}>
                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            marginBottom: '16px',
                            color: 'var(--text-primary)',
                        }}>
                            💾 Save Quotation
                        </h3>
                        <input
                            type="text"
                            placeholder="Enter a name for this quotation..."
                            value={saveName}
                            onChange={e => setSaveName(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleConfirmSave();
                                if (e.key === 'Escape') setShowSaveModal(false);
                            }}
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                fontSize: '14px',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                marginBottom: '16px',
                                outline: 'none',
                            }}
                        />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowSaveModal(false)}
                                style={{
                                    padding: '10px 20px',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    color: 'var(--text-muted)',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmSave}
                                style={{
                                    padding: '10px 20px',
                                    background: 'var(--accent-blue)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default HistoryPanel;
