import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService, GuideListItem } from '../../services/api.service';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    private authService = inject(AuthService);
    private apiService = inject(ApiService);
    private router = inject(Router);

    user$ = this.authService.user$;

    isDragging = false;
    isUploading = false;
    uploadProgress = 0;
    uploadError = '';
    selectedFile: File | null = null;
    apiKey = ''; // User provided API Key
    goals = '';
    difficulty = 'Intermediate';
    examDate = '';

    recentGuides: GuideListItem[] = [];
    loadingGuides = false;

    readonly supportedFormats = ['MP4', 'MP3', 'PDF', 'DOCX', 'TXT', 'HTML', 'MD'];

    availableModels = [
        { id: 'gemini-3.0-flash', name: 'Gemini 3.0 Flash (Fastest)' },
        { id: 'gemini-3.0-pro', name: 'Gemini 3.0 Pro (Best Quality)' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Balanced)' },
        { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite (Lightweight)' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' }
    ];
    selectedModel = 'gemini-3.0-flash';

    ngOnInit() {
        this.loadRecentGuides();
        // Load existing API key if present
        this.apiKey = localStorage.getItem('gemini_api_key') || '';
    }

    async loadRecentGuides() {
        this.loadingGuides = true;
        try {
            const response = await this.apiService.getAllGuides().toPromise();
            this.recentGuides = response?.guides || [];
        } catch (err) {
            console.error('Failed to load guides:', err);
        } finally {
            this.loadingGuides = false;
        }
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    onFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.handleFile(input.files[0]);
        }
    }

    handleFile(file: File) {
        const extension = file.name.split('.').pop()?.toUpperCase();
        if (!extension || !this.supportedFormats.includes(extension)) {
            this.uploadError = `Unsupported file format. Please upload: ${this.supportedFormats.join(', ')}`;
            return;
        }

        this.selectedFile = file;
        this.uploadError = '';
    }

    removeFile() {
        this.selectedFile = null;
        if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
        }
    }

    async uploadFile() {
        if (!this.selectedFile) return;

        const customKey = this.apiKey?.trim() || undefined;


        this.isUploading = true;
        this.uploadError = '';
        this.uploadProgress = 0;

        // Simulate progress
        const progressInterval = setInterval(() => {
            if (this.uploadProgress < 90) {
                this.uploadProgress += Math.random() * 10;
            }
        }, 500);

        try {
            const response = await this.apiService.uploadFile(this.selectedFile, customKey, this.goals, this.difficulty, this.examDate, this.selectedModel).toPromise();
            clearInterval(progressInterval);
            this.uploadProgress = 100;

            // Navigate to the guide page
            setTimeout(() => {
                if (response?.id) {
                    this.router.navigate(['/guide', response.id]);
                }
            }, 500);
        } catch (err: any) {
            clearInterval(progressInterval);
            console.error('Upload Error Details:', err);
            this.uploadError = err.error?.error || err.message || 'Upload failed. Please try again.';
            this.isUploading = false;
            this.uploadProgress = 0;
        }
    }

    async signOut() {
        await this.authService.signOut();
        this.router.navigate(['/login']);
    }

    getFileIcon(filename: string): string {
        const ext = filename.split('.').pop()?.toLowerCase();
        const icons: Record<string, string> = {
            'pdf': '📄',
            'docx': '📝',
            'doc': '📝',
            'txt': '📃',
            'md': '📑',
            'html': '🌐',
            'mp3': '🎵',
            'mp4': '🎬',
            'wav': '🎵'
        };
        return icons[ext || ''] || '📁';
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
