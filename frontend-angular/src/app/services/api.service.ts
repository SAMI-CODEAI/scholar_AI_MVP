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

    uploadFile(file: File, apiKey?: string): Observable<UploadResponse> {
        return this.getAuthHeaders().pipe(
            switchMap(authHeaders => {
                const formData = new FormData();
                formData.append('file', file);

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
}
