import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class GeminiService {
    private http = inject(HttpClient);

    constructor() { }

    async generateStudyGuide(transcript: string, goals: string, difficulty: string, examDate: string, customApiKey?: string, modelName: string = "gemini-2.5-flash-lite"): Promise<any> {
        return firstValueFrom(this.http.post<any>('/api/ai', {
            action: 'generate',
            transcript,
            goals,
            difficulty,
            examDate,
            customApiKey,
            modelName
        }));
    }

    async getMotivation(completedCount: number, totalCount: number, customApiKey?: string): Promise<string> {
        const res = await firstValueFrom(this.http.post<{ message: string }>('/api/ai', {
            action: 'motivation',
            completedCount,
            totalCount,
            customApiKey
        }));
        return res.message;
    }

    async replanSchedule(guideData: any, missedReason: string, customApiKey?: string): Promise<any> {
        return firstValueFrom(this.http.post<any>('/api/ai', {
            action: 'replan',
            guideData,
            missedReason,
            customApiKey
        }));
    }
}
