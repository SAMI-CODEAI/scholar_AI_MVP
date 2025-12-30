import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/auth/login.component';
import { GuideComponent } from './components/guide/guide.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'home',
        component: HomeComponent,
        title: 'Scholar AI - Home'
    },
    {
        path: 'login',
        component: LoginComponent,
        title: 'Scholar AI - Login'
    },
    {
        path: 'guide/:id',
        component: GuideComponent,
        title: 'Scholar AI - Study Guide'
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];
