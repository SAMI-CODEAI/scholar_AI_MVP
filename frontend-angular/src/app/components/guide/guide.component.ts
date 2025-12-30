import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService, StudyGuide, QuizQuestion } from '../../services/api.service';

@Component({
    selector: 'app-guide',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './guide.component.html',
    styleUrl: './guide.component.scss'
})
export class GuideComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private authService = inject(AuthService);
    private apiService = inject(ApiService);

    user$ = this.authService.user$;

    guideId = '';
    guide: StudyGuide | null = null;
    loading = true;
    error = '';

    activeTab: 'summary' | 'flashcards' | 'quiz' = 'summary';

    // Flashcard state
    currentCardIndex = 0;
    isFlipped = false;

    // Quiz state
    quizStarted = false;
    currentQuestionIndex = 0;
    selectedAnswer: number | null = null;
    quizAnswers: (number | null)[] = [];
    quizCompleted = false;
    quizScore = 0;

    ngOnInit() {
        this.guideId = this.route.snapshot.paramMap.get('id') || '';
        if (this.guideId) {
            this.loadGuide();
        } else {
            this.error = 'No guide ID provided';
            this.loading = false;
        }
    }

    async loadGuide() {
        try {
            this.guide = await this.apiService.getGuide(this.guideId).toPromise() || null;
            if (this.guide?.quiz) {
                this.quizAnswers = new Array(this.guide.quiz.length).fill(null);
            }
        } catch (err: any) {
            this.error = err.error?.error || 'Failed to load study guide';
        } finally {
            this.loading = false;
        }
    }

    setActiveTab(tab: 'summary' | 'flashcards' | 'quiz') {
        this.activeTab = tab;
        if (tab === 'flashcards') {
            this.resetFlashcards();
        }
        if (tab === 'quiz') {
            this.resetQuiz();
        }
    }

    // Flashcard methods
    flipCard() {
        this.isFlipped = !this.isFlipped;
    }

    nextCard() {
        if (this.guide && this.currentCardIndex < this.guide.flash_cards.length - 1) {
            this.currentCardIndex++;
            this.isFlipped = false;
        }
    }

    prevCard() {
        if (this.currentCardIndex > 0) {
            this.currentCardIndex--;
            this.isFlipped = false;
        }
    }

    resetFlashcards() {
        this.currentCardIndex = 0;
        this.isFlipped = false;
    }

    // Quiz methods
    startQuiz() {
        this.quizStarted = true;
        this.currentQuestionIndex = 0;
        this.selectedAnswer = null;
        this.quizAnswers = new Array(this.guide?.quiz?.length || 0).fill(null);
        this.quizCompleted = false;
    }

    selectAnswer(index: number) {
        if (!this.quizCompleted) {
            this.selectedAnswer = index;
            this.quizAnswers[this.currentQuestionIndex] = index;
        }
    }

    nextQuestion() {
        if (this.guide && this.currentQuestionIndex < this.guide.quiz.length - 1) {
            this.currentQuestionIndex++;
            this.selectedAnswer = this.quizAnswers[this.currentQuestionIndex];
        }
    }

    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.selectedAnswer = this.quizAnswers[this.currentQuestionIndex];
        }
    }

    submitQuiz() {
        if (!this.guide) return;

        this.quizCompleted = true;
        this.quizScore = 0;

        for (let i = 0; i < this.guide.quiz.length; i++) {
            if (this.quizAnswers[i] === this.guide.quiz[i].index) {
                this.quizScore++;
            }
        }
    }

    resetQuiz() {
        this.quizStarted = false;
        this.currentQuestionIndex = 0;
        this.selectedAnswer = null;
        this.quizAnswers = new Array(this.guide?.quiz?.length || 0).fill(null);
        this.quizCompleted = false;
        this.quizScore = 0;
    }

    getQuizPercentage(): number {
        if (!this.guide) return 0;
        return Math.round((this.quizScore / this.guide.quiz.length) * 100);
    }

    isAnswerCorrect(questionIndex: number): boolean {
        if (!this.guide) return false;
        return this.quizAnswers[questionIndex] === this.guide.quiz[questionIndex].index;
    }

    // Export methods
    exportQuiz() {
        window.open(this.apiService.getExportUrl('quiz', this.guideId), '_blank');
    }

    exportFlashcards() {
        window.open(this.apiService.getExportUrl('flashcards', this.guideId), '_blank');
    }

    exportSummary() {
        window.open(this.apiService.getExportUrl('summary', this.guideId), '_blank');
    }

    // Share
    copyShareLink() {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        // TODO: Add toast notification
    }

    async signOut() {
        await this.authService.signOut();
        this.router.navigate(['/login']);
    }
}
