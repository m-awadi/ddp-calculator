import { GeminiProvider } from './GeminiProvider';
import { LocalProvider } from './LocalProvider';

/**
 * AI Service Manager
 * Factory and singleton management for AI providers
 */
export class AIService {
    constructor() {
        this.provider = null;
        this.config = this.loadConfig();
    }

    /**
     * Load configuration from localStorage
     */
    loadConfig() {
        try {
            const stored = localStorage.getItem('ddp_ai_config');
            if (stored) {
                const config = JSON.parse(stored);

                // Migration: Upgrade old default models (1.5) to 2.0
                if (config.gemini && (config.gemini.model === 'gemini-1.5-flash' || config.gemini.model === 'gemini-1.5-flash-002')) {
                    config.gemini.model = 'gemini-2.0-flash';
                }

                return config;
            } else {
                return {
                    providerId: 'gemini',
                    gemini: { apiKey: '', model: 'gemini-2.0-flash' },
                    local: { baseUrl: 'http://localhost:11434/v1', model: 'llama3', apiKey: 'sk-dummy' }
                };
            }
        } catch (e) {
            return {
                providerId: 'gemini',
                gemini: { apiKey: '', model: 'gemini-2.0-flash' },
                local: { baseUrl: 'http://localhost:11434/v1', model: 'llama3', apiKey: 'sk-dummy' }
            };
        }
    }

    /**
     * Save configuration to localStorage
     */
    saveConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        localStorage.setItem('ddp_ai_config', JSON.stringify(this.config));
        this.initializeProvider(); // Re-init with new config
    }

    /**
     * Initialize the selected provider
     */
    initializeProvider() {
        const { providerId } = this.config;

        if (providerId === 'gemini') {
            if (!this.config.gemini.apiKey) {
                console.warn('Gemini API Key missing');
                this.provider = null;
                return;
            }
            this.provider = new GeminiProvider(this.config.gemini);
        } else if (providerId === 'local') {
            this.provider = new LocalProvider(this.config.local);
        } else {
            console.error('Unknown provider:', providerId);
            this.provider = null;
        }
    }

    /**
     * Get the active provider instance
     */
    getProvider() {
        if (!this.provider) {
            this.initializeProvider();
        }
        return this.provider;
    }

    /**
     * Check if AI service is ready (configured)
     */
    isReady() {
        return !!this.getProvider();
    }

    /**
     * Generate content using the active provider
     */
    async generateContent(prompt, attachments = []) {
        const provider = this.getProvider();
        if (!provider) {
            throw new Error('AI Service not configured. Please check settings.');
        }
        return await provider.generateContent(prompt, attachments);
    }
}

// Export singleton
export const aiService = new AIService();
