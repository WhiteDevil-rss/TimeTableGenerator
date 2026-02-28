import axios from 'axios';
import { GenerateRequest } from '@nep-scheduler/types';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:5001';

export const callAiEngine = async (payload: any) => {
    try {
        const response = await axios.post(`${AI_ENGINE_URL}/solve`, payload);
        return response.data;
    } catch (error: any) {
        if (error.response) {
            throw new Error(`AI Engine Error: ${error.response.data.detail || error.response.data}`);
        }
        throw new Error('Failed to reach AI Engine');
    }
};

export const checkAiHealth = async () => {
    try {
        const response = await axios.get(`${AI_ENGINE_URL}/health`, { timeout: 3000 });
        return { ...response.data, reachable: true };
    } catch {
        return { status: 'offline', reachable: false, service: 'ai-engine' };
    }
};
