import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { aiService } from '../services/ai/AIService';
import { smartParseDocument } from '../utils/smartParser';
import Input from './Input';

export default function SmartImportModal({ isOpen, onClose, onImport }) {
    const [activeTab, setActiveTab] = useState('upload'); // upload, settings, preview
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [parsedData, setParsedData] = useState(null);

    // Config State
    const [config, setConfig] = useState(aiService.config);

    useEffect(() => {
        if (isOpen) {
            setConfig(aiService.config);
            if (!aiService.isReady()) {
                setActiveTab('settings');
            }
        }
    }, [isOpen]);

    const handleConfigSave = () => {
        aiService.saveConfig(config);
        alert('Configuration saved!');
        if (aiService.isReady()) {
            setActiveTab('upload');
        }
    };



    // Handle Paste Event
    useEffect(() => {
        const handlePaste = async (e) => {
            if (!isOpen || activeTab !== 'upload') return;

            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) {
                        await processFile(file);
                        return; // Only process the first image found
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isOpen, activeTab]);

    const processFile = async (file) => {
        setIsLoading(true);
        setError(null);

        try {
            let fileData;

            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                // Handle Excel: Convert to CSV for AI
                const buffer = await file.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const csvText = XLSX.utils.sheet_to_csv(firstSheet);
                fileData = {
                    data: btoa(csvText),
                    mimeType: 'text/csv'
                };
            } else {
                // Handle Image/PDF
                const base64Url = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                });

                const matches = base64Url.match(/^data:(.+);base64,(.+)$/);
                if (!matches) throw new Error('Failed to process file');

                fileData = {
                    mimeType: matches[1],
                    data: matches[2]
                };
            }

            const result = await smartParseDocument(fileData);
            setParsedData(result);
            setActiveTab('preview');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        processFile(file);
    };

    const [jsonText, setJsonText] = useState('');

    useEffect(() => {
        if (parsedData) {
            setJsonText(JSON.stringify(parsedData, null, 2));
        }
    }, [parsedData]);

    const applyImport = () => {
        try {
            const data = JSON.parse(jsonText);
            onImport(data);
            onClose();
        } catch (e) {
            alert('Invalid JSON: ' + e.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: 'var(--bg-primary)', width: '600px', maxWidth: '95%',
                borderRadius: '16px', padding: '24px', position: 'relative',
                maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '16px', right: '16px',
                    background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '24px', cursor: 'pointer'
                }}>×</button>

                <h2 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text-primary)' }}>✨ Smart Import (AI)</h2>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                    <button
                        onClick={() => setActiveTab('upload')}
                        style={{
                            padding: '10px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'upload' ? '2px solid var(--accent-blue)' : 'none',
                            color: activeTab === 'upload' ? 'var(--accent-blue)' : 'var(--text-muted)',
                            cursor: 'pointer'
                        }}
                    >
                        Upload
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        style={{
                            padding: '10px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'settings' ? '2px solid var(--accent-blue)' : 'none',
                            color: activeTab === 'settings' ? 'var(--accent-blue)' : 'var(--text-muted)',
                            cursor: 'pointer'
                        }}
                    >
                        Settings
                    </button>
                    {parsedData && (
                        <button
                            onClick={() => setActiveTab('preview')}
                            style={{
                                padding: '10px',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'preview' ? '2px solid var(--accent-blue)' : 'none',
                                color: activeTab === 'preview' ? 'var(--accent-blue)' : 'var(--text-muted)',
                                cursor: 'pointer'
                            }}
                        >
                            Preview
                        </button>
                    )}
                </div>

                {/* Content */}
                {activeTab === 'settings' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>AI Provider</label>
                            <select
                                value={config.providerId}
                                onChange={(e) => setConfig({ ...config, providerId: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                            >
                                <option value="gemini">Google Gemini</option>
                                <option value="local">Local LLM (OpenAI Compatible)</option>
                            </select>
                        </div>

                        {config.providerId === 'gemini' && (
                            <Input
                                label="Gemini API Key"
                                type="password"
                                value={config.gemini.apiKey}
                                onChange={(v) => setConfig({ ...config, gemini: { ...config.gemini, apiKey: v } })}
                                placeholder="AIza..."
                            />
                        )}

                        {config.providerId === 'local' && (
                            <Input
                                label="Local Endpoint URL"
                                value={config.local.baseUrl}
                                onChange={(v) => setConfig({ ...config, local: { ...config.local, baseUrl: v } })}
                                placeholder="http://localhost:11434/v1"
                            />
                        )}

                        <button
                            onClick={handleConfigSave}
                            style={{ padding: '12px', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px' }}
                        >
                            Save Configuration
                        </button>
                    </div>
                )}

                {activeTab === 'upload' && (
                    <div style={{ textAlign: 'center', padding: '40px', border: '2px dashed var(--border)', borderRadius: '12px' }}>
                        {isLoading ? (
                            <div>
                                <div style={{ fontSize: '40px', marginBottom: '16px' }}>🤖</div>
                                <p>Analyzing document with AI...</p>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Converting currency & mapping fields...</p>
                            </div>
                        ) : (
                            <>
                                <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
                                    Upload a Quotation (PDF, Image) or Excel file.
                                    <br />
                                    <span style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                                        Drag & Drop, Paste (Cmd+V), or Click below
                                    </span>
                                </p>
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls"
                                    onChange={handleFile}
                                    style={{ display: 'none' }}
                                    id="smart-file-upload"
                                />
                                <label
                                    htmlFor="smart-file-upload"
                                    style={{
                                        padding: '12px 24px', background: 'var(--accent-blue)',
                                        color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'inline-block'
                                    }}
                                >
                                    Select File
                                </label>
                                {error && (
                                    <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px' }}>
                                        {error}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'preview' && parsedData && (
                    <div>
                        <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px', marginBottom: '16px' }}>
                            Success! Found {parsedData.items.length} items.
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}>
                            <pre>{JSON.stringify(parsedData, null, 2)}</pre>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button
                                onClick={applyImport}
                                style={{ flex: 1, padding: '12px', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                Import Data
                            </button>
                            <button
                                onClick={() => setActiveTab('upload')}
                                style={{ flex: 1, padding: '12px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
