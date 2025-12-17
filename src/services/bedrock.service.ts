import {
    BedrockRuntimeClient,
    InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

/**
 * AWS Bedrock Service for Claude Sonnet 3 Integration
 * Uses AWS credentials for authentication
 */

export class BedrockService {
    private client: BedrockRuntimeClient;
    private modelId: string = 'anthropic.claude-3-sonnet-20240229-v1:0'; // Using 3.0 for higher rate limits

    constructor() {
        const region = import.meta.env.VITE_AWS_REGION || 'us-east-1';
        const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
        const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;

        if (!accessKeyId || !secretAccessKey) {
            throw new Error('AWS credentials (VITE_AWS_ACCESS_KEY_ID, VITE_AWS_SECRET_ACCESS_KEY) are required in .env');
        }

        // Initialize Bedrock client with AWS credentials
        this.client = new BedrockRuntimeClient({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });

        console.log('Bedrock service initialized with AWS credentials');
    }

    /**
     * Invoke Claude Sonnet 3 model with a prompt
     * @param prompt The user prompt to send to Claude
     * @param systemPrompt Optional system prompt to guide Claude's behavior
     * @returns JSON response from Claude
     */
    async invokeClaudeWithJSON(
        prompt: string,
        systemPrompt?: string
    ): Promise<any> {
        try {
            const requestBody = {
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 16384, // Increased from 8192 to handle 30-day plans with multiple devices
                temperature: 0.9,  // Increased from 0.7 to encourage more daily variation
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                ...(systemPrompt && {
                    system: systemPrompt,
                }),
            };

            // Create the invoke command
            const command = new InvokeModelCommand({
                modelId: this.modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(requestBody),
            });

            // Invoke the model
            console.log('Invoking Claude Sonnet 3 via Bedrock...');
            const response = await this.client.send(command);

            // Parse the response body
            const responseBody = JSON.parse(
                new TextDecoder().decode(response.body)
            );

            console.log('Response received successfully');

            return responseBody;
        } catch (error: any) {
            console.error('Error invoking Bedrock:', error);
            throw new Error(`Bedrock invocation failed: ${error.message}`);
        }
    }

    /**
     * Extract the text content from Claude's response
     * @param response The raw response from Claude
     * @returns The text content
     */
    extractTextFromResponse(response: any): string {
        if (response.content && response.content.length > 0) {
            return response.content[0].text;
        }
        return '';
    }

    /**
     * Get a JSON response from Claude by instructing it to respond in JSON format
     * @param prompt The prompt asking for JSON data
     * @param systemPrompt Optional system prompt
     * @returns Parsed JSON object
     */
    async getJSONResponse(
        prompt: string,
        systemPrompt?: string
    ): Promise<any> {
        const jsonPrompt = `${prompt}\n\nPlease respond with valid JSON only, no additional text or explanation.`;
        const response = await this.invokeClaudeWithJSON(
            jsonPrompt,
            systemPrompt
        );
        const textResponse = this.extractTextFromResponse(response);

        try {
            return JSON.parse(textResponse);
        } catch (error) {
            console.error('Failed to parse JSON response:', textResponse);
            throw new Error('Response was not valid JSON');
        }
    }
}

export default new BedrockService();
