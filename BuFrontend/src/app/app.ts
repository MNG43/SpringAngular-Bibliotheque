import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from './core/auth.service';
import { NotificationBell } from './shared/notification-bell';

interface NavLink {
  path: string;
  label: string;
  icon: string;
  auth?: boolean;
  etudiant?: boolean;
  biblio?: boolean;
  admin?: boolean;
  public?: boolean;
  children?: NavLink[];
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    NotificationBell,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly user = this.auth.user;
  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly isBiblio = this.auth.isBibliothecaire;
  readonly isAdmin = this.auth.isAdmin;

  // Sidebar
  opened = signal(false);
  isHovered = signal(false);

  // État des sous-menus
  private submenusState = signal<Record<string, boolean>>({});

  // Pages sans layout (initialisation immédiate avec le chemin)
  isLoginPage = signal(window.location.pathname === '/login');
  showLayout = signal(!['/login', '/register', '/accueil'].includes(window.location.pathname));

  // Initiales de l'utilisateur
  readonly initials = computed(() => {
    const nom = this.user()?.nom ?? '';
    return nom
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  });

  // Liens de navigation avec sous-menus
  private readonly liens: NavLink[] = [
    { path: '/catalogue', label: 'Catalogue', icon: 'bx-book', public: true },
    { path: '/mes-emprunts', label: 'Mes emprunts', icon: 'bx-import', auth: true, etudiant: true },
    { path: '/mes-reservations', label: 'Mes réservations', icon: 'bx-bookmark', auth: true, etudiant: true },
    { path: '/mes-penalites', label: 'Mes pénalités', icon: 'bx-money', auth: true, etudiant: true },
    {
      path: '/gestion',
      label: 'Gestion',
      icon: 'bx-cog',
      auth: true,
      biblio: true,
      children: [
        { path: '/gestion-livres', label: 'Livres', icon: 'bx-book' },
        { path: '/gestion-auteurs', label: 'Auteurs', icon: 'bx-user' },
        { path: '/gestion-emprunts', label: 'Emprunts & retours', icon: 'bx-transfer' },
        { path: '/gestion-penalites', label: 'Pénalités', icon: 'bx-wallet' },
      ],
    },
    { path: '/dashboard', label: 'Tableau de bord', icon: 'bx-grid-alt', auth: true, biblio: true },
    { path: '/gestion-utilisateurs', label: 'Gérer les utilisateurs', icon: 'bx-group', auth: true, admin: true },
  ];

  readonly navLinks = computed(() =>
    this.liens.filter((link) => {
      if (link.public) return true;
      if (link.admin) return this.isAdmin();
      if (link.biblio) return this.isBiblio();
      if (link.etudiant) return this.isLoggedIn() && !this.isBiblio();
      return link.auth ? this.isLoggedIn() : true;
    })
  );

  ngOnInit() {
    // Mise à jour lors des changements de route
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const fullUrl = this.router.url;
        const path = fullUrl.split('?')[0];   // ← on ignore les paramètres
        this.isLoginPage.set(path === '/login');
        const noLayoutRoutes = ['/login', '/register', '/accueil'];
        this.showLayout.set(!noLayoutRoutes.includes(path));
      });
  }

  // Gestion des sous-menus
  toggleSubmenu(path: string) {
    this.submenusState.update((state) => ({
      ...state,
      [path]: !state[path],
    }));
  }

  isSubmenuOpen(path: string): boolean {
    return this.submenusState()[path] || false;
  }

  // Gestion de la sidebar
  collapseSidebar() {
    this.opened.set(false);
  }

  expandSidebar() {
    this.opened.set(true);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}