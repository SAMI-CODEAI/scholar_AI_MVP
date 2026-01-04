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

    // Advanced Planning
    examSchedule: { topic: string, date: string }[] = [];
    topicDifficulties: { topic: string, difficulty: 'Easy' | 'Medium' | 'Hard' }[] = [];

    newExamTopic = '';
    newExamDate = '';
    newTopicName = '';
    newTopicDifficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';

    recentGuides: GuideListItem[] = [];
    loadingGuides = false;

    readonly supportedFormats = ['MP4', 'MP3', 'PDF', 'DOCX', 'TXT', 'HTML', 'MD'];

    ngOnInit() {
        this.loadRecentGuides();
    }

    addExam() {
        if (this.newExamTopic && this.newExamDate) {
            this.examSchedule.push({ topic: this.newExamTopic, date: this.newExamDate });
            this.newExamTopic = '';
            this.newExamDate = '';
        }
    }

    removeExam(index: number) {
        this.examSchedule.splice(index, 1);
    }

    addTopicDifficulty() {
        if (this.newTopicName) {
            this.topicDifficulties.push({ topic: this.newTopicName, difficulty: this.newTopicDifficulty });
            this.newTopicName = '';
        }
    }

    removeTopicDifficulty(index: number) {
        this.topicDifficulties.splice(index, 1);
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

        this.isUploading = true;
        this.uploadError = '';
        this.uploadProgress = 0;

        // Convert list to dict for backend
        const difficultyMap = this.topicDifficulties.reduce((acc, curr) => {
            acc[curr.topic] = curr.difficulty;
            return acc;
        }, {} as any);

        this.apiService.uploadFile(
            this.selectedFile,
            this.apiKey,
            this.goals,
            this.examSchedule,
            difficultyMap
        ).subscribe({
            next: (response) => {
                this.uploadProgress = 100;
                this.router.navigate(['/guide', response.id]);
            },
            error: (err) => {
                this.isUploading = false;
                this.uploadError = err.error?.error || 'Upload failed. Please try again.';
            }
        });
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
