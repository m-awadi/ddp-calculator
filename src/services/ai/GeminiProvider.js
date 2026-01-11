import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini Provider for AI Service
 * Handles interaction with Google's Gemini API
 */
export class GeminiProvider {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.modelName = config.model || 'gemini-2.0-flash';
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });
    }

    /**
     * Get provider capabilities
     */
    getCapabilities() {
        return {
            name: 'Google Gemini',
            id: 'gemini',
            multimodal: true, // Supports images/PDFs
            fileTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
        };
    }

    /**
     * Generate content from prompt and optional file attachments
     * @param {string} prompt - The text prompt
     * @param {Array} attachments - Array of { data: base64, mimeType: string }
     * @returns {Promise<string>} The generated text
     */
    async generateContent(prompt, attachments = []) {
        try {
            let contentParts = [prompt];

            if (attachments && attachments.length > 0) {
                // Convert attachments to Gemini format
                const inlineData = attachments.map(att => ({
                    inlineData: {
                        data: att.data,
                        mimeType: att.mimeType
                    }
                }));
                contentParts = [...contentParts, ...inlineData];
            }

            const result = await this.model.generateContent(contentParts);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw new Error(`Gemini API Error: ${error.message}`);
        }
    }
}
