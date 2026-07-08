import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, Role, Utilisateur } from './models';

const TOKEN_KEY = 'biblio_token';
const USER_KEY = 'biblio_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  // Utilisateur courant exposé en signal (réactif dans tout le layout)
  private currentUser = signal<AuthResponse | null>(this.restore());

  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly role = computed<Role | null>(() => this.currentUser()?.role ?? null);
  readonly isBibliothecaire = computed(() => {
    const r = this.currentUser()?.role;
    return r === 'BIBLIOTHECAIRE' || r === 'ADMIN';
  });
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password })
      .pipe(tap(res => this.persist(res)));
  }

  register(nom: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', { nom, email, password })
      .pipe(tap(res => this.persist(res)));
  }

  me(): Observable<Utilisateur> {
    return this.http.get<Utilisateur>('/api/auth/me');
  }

  /** Déconnexion complète avec suppression des données locales */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  /** Nettoie la session sans rediriger (utilisé par la page d'accueil) */
  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private persist(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res));
    this.currentUser.set(res);
  }

  private restore(): AuthResponse | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) as AuthResponse : null;
  }
}