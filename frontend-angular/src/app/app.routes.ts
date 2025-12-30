import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/auth/login.component';
import { GuideComponent } from './components/guide/guide.component';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
        title: 'AI Learning Assistant - Home'
    },
    {
        path: 'login',
        component: LoginComponent,
        title: 'AI Learning Assistant - Login'
    },
    {
        path: 'guide/:id',
        component: GuideComponent,
        title: 'AI Learning Assistant - Study Guide'
    },
    {
        path: '**',
        redirectTo: ''
    }
];
