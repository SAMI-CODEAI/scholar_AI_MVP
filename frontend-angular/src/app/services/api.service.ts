import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface GuideListItem {
    id: string;
    title: string;
    filename: string;
    created_at: number;
}

export interface QuizQuestion {
    question: string;
    possible_answers: string[];
    index: number;
}

export interface StudyGuide {
    id: string;
    title: string;
    summary: string;
    flash_cards: string[][];
    quiz: QuizQuestion[];
    study_schedule?: {
        day_offset: number;
        title: string;
        details: string;
        duration_minutes: number;
        completed?: boolean;
    }[];
    created_at: number;
    filename?: string;
}

export interface UploadResponse {
    id: string;
    title: string;
}

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private apiUrl = environment.apiUrl;

    private getAuthHeaders(): Observable<HttpHeaders> {
        return from(this.authService.getIdToken()).pipe(
            switchMap(token => {
                let headers = new HttpHeaders();
                if (token) {
                    headers = headers.set('Authorization', `Bearer ${token}`);
                }
                return of(headers);
            })
        );
    }

    healthCheck(): Observable<any> {
        return this.http.get(`${this.apiUrl}/health`);
    }

    uploadFile(file: File, apiKey?: string, goals?: string): Observable<UploadResponse> {
        return this.getAuthHeaders().pipe(
            switchMap(authHeaders => {
                const formData = new FormData();
                formData.append('file', file);
                if (goals) {
                    formData.append('goals', goals);
                }

                let headers = authHeaders;
                if (apiKey) {
                    headers = headers.set('X-Gemini-API-Key', apiKey);
                }

                return this.http.post<UploadResponse>(`${this.apiUrl}/upload`, formData, { headers });
            })
        );
    }

    getGuide(id: string): Observable<StudyGuide> {
        return this.getAuthHeaders().pipe(
            switchMap(headers => {
                return this.http.get<StudyGuide>(`${this.apiUrl}/guide/${id}`, { headers });
            })
        );
    }

    getAllGuides(): Observable<{ guides: GuideListItem[] }> {
        return this.getAuthHeaders().pipe(
            switchMap(headers => {
                return this.http.get<{ guides: GuideListItem[] }>(`${this.apiUrl}/guides`, { headers });
            })
        );
    }

    deleteGuide(id: string): Observable<{ success: boolean }> {
        return this.getAuthHeaders().pipe(
            switchMap(headers => {
                return this.http.delete<{ success: boolean }>(`${this.apiUrl}/guide/${id}`, { headers });
            })
        );
    }

    getExportUrl(type: 'quiz' | 'flashcards' | 'summary', guideId: string): string {
        return `${this.apiUrl}/export/${type}/${guideId}`;
    }

    updateProgress(guideId: string, index: number, completed: boolean): Observable<any> {
        return this.getAuthHeaders().pipe(
            switchMap(headers => {
                return this.http.put(`${this.apiUrl}/guide/${guideId}/progress`, { index, completed }, { headers });
            })
        );
    }

    getMotivation(completedCount: number, totalCount: number): Observable<{ message: string }> {
        return this.getAuthHeaders().pipe(
            switchMap(headers => {
                return this.http.post<{ message: string }>(`${this.apiUrl}/motivation`, { completed_count: completedCount, total_count: totalCount }, { headers });
            })
        );
    }

    replanSchedule(guideId: string): Observable<any[]> {
        return this.getAuthHeaders().pipe(
            switchMap(headers => {
                return this.http.post<any[]>(`${this.apiUrl}/guide/${guideId}/replan`, {}, { headers });
            })
        );
    }
}
