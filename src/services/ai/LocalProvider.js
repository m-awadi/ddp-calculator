/**
 * Local/Generic Provider for AI Service
 * Handles interaction with OpenAI-compatible endpoints (Ollama, LocalAI, vLLM)
 */
export class LocalProvider {
    constructor(config) {
        this.baseUrl = config.baseUrl || 'http://localhost:11434/v1';
        this.apiKey = config.apiKey || 'sk-dummy'; // Local LLMs often don't need a real key
        this.modelName = config.model || 'llama3';
    }

    /**
     * Get provider capabilities
     */
    getCapabilities() {
        return {
            name: 'Local LLM (OpenAI Compatible)',
            id: 'local',
            multimodal: false, // Assume text-only for generic local LLMs for now
            fileTypes: ['text/plain', 'text/csv', 'application/json']
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
            // Check if attachments are supported (text-only mostly)
            if (attachments && attachments.length > 0) {
                // For local LLMs without vision, we might just append text content if available
                // But for PDF/Image base64, we can't send it unless the model supports it.
                // For now, we throw if binary attachments are sent to a text-only provider
                const hasBinary = attachments.some(a => !a.mimeType.startsWith('text/'));
                if (hasBinary) {
                    throw new Error('Local provider currently does not support image/PDF attachments. Please extract text first.');
                }
            }

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.modelName,
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.1
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Local API Error (${response.status}): ${err}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Local API Error:', error);
            throw new Error(`Local API Error: ${error.message}`);
        }
    }
}
