import { Routes } from '@angular/router';
import { adminGuard, authGuard, bibliothecaireGuard } from './core/guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'accueil' },

  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
  { path: 'register', loadComponent: () => import('./pages/register/register').then(m => m.Register) },
  { path: 'accueil', loadComponent: () => import('./pages/accueil/accueil').then(m => m.Accueil) },

  // ✅ Route du catalogue protégée par authGuard
  { path: 'catalogue', canActivate: [authGuard], loadComponent: () => import('./pages/catalogue/catalogue').then(m => m.Catalogue) },
  { path: 'catalogue/:id', canActivate: [authGuard], loadComponent: () => import('./pages/livre-detail/livre-detail').then(m => m.LivreDetail) },

  // Espace étudiant (authentifié)
  { path: 'mes-emprunts', canActivate: [authGuard], loadComponent: () => import('./pages/mes-emprunts/mes-emprunts').then(m => m.MesEmprunts) },
  { path: 'mes-reservations', canActivate: [authGuard], loadComponent: () => import('./pages/mes-reservations/mes-reservations').then(m => m.MesReservations) },
  { path: 'mes-penalites', canActivate: [authGuard], loadComponent: () => import('./pages/mes-penalites/mes-penalites').then(m => m.MesPenalites) },

  // Espace bibliothécaire / admin
  { path: 'dashboard', canActivate: [bibliothecaireGuard], loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardPage) },
  { path: 'gestion-livres', canActivate: [bibliothecaireGuard], loadComponent: () => import('./pages/gestion-livres/gestion-livres').then(m => m.GestionLivres) },
  { path: 'gestion-auteurs', canActivate: [bibliothecaireGuard], loadComponent: () => import('./pages/gestion-auteurs/gestion-auteurs').then(m => m.GestionAuteurs) },
  { path: 'gestion-emprunts', canActivate: [bibliothecaireGuard], loadComponent: () => import('./pages/gestion-emprunts/gestion-emprunts').then(m => m.GestionEmprunts) },
  { path: 'gestion-penalites', canActivate: [bibliothecaireGuard], loadComponent: () => import('./pages/gestion-penalites/gestion-penalites').then(m => m.GestionPenalites) },
  { path: 'gestion-utilisateurs', canActivate: [adminGuard], loadComponent: () => import('./pages/gestion-utilisateurs/gestion-utilisateurs').then(m => m.GestionUtilisateurs) },

  // Redirection par défaut vers le catalogue (qui sera protégé)
  { path: '**', redirectTo: 'catalogue' },
];