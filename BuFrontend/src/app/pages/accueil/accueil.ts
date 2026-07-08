import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LivreService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Livre } from '../../core/models';

const ACCENTS = ['accent-indigo', 'accent-gold', 'accent-teal', 'accent-plum', 'accent-slate'] as const;

@Component({
    selector: 'app-accueil',
    imports: [RouterLink, MatIconModule, MatButtonModule],
    templateUrl: './accueil.html',
    styleUrl: './accueil.scss',
})
export class Accueil implements OnInit {
    private livreService = inject(LivreService);
    private authService = inject(AuthService);
    private router = inject(Router);

    apercu = signal<Livre[]>([]);
    loadingApercu = signal(true);
    totalOuvrages = signal<number | null>(null);

    readonly skeletonsLivres = Array.from({ length: 4 });
    readonly annee = new Date().getFullYear();

    ngOnInit(): void {
        // ✅ Force la déconnexion de toute session active sur la page d'accueil
        this.authService.clearSession();

        this.livreService.lister().subscribe({
            next: (livres) => {
                this.totalOuvrages.set(livres.length);
                this.apercu.set(livres.slice(0, 4));
                this.loadingApercu.set(false);
            },
            error: () => this.loadingApercu.set(false),
        });
    }

    initiale(livre: Livre): string {
        return livre.titre?.trim().charAt(0).toUpperCase() || '?';
    }

    auteurs(livre: Livre): string {
        return livre.auteurs?.length ? livre.auteurs.map((a) => a.nomComplet).join(', ') : 'Auteur inconnu';
    }

    accent(livre: Livre): string {
        const cle = livre.categorie || 'Non classé';
        let hash = 0;
        for (let i = 0; i < cle.length; i++) {
            hash = (hash * 31 + cle.charCodeAt(i)) >>> 0;
        }
        return ACCENTS[hash % ACCENTS.length];
    }

    goToCatalogue(event?: Event): void {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        // Le guard authGuard redirigera vers /login si non connecté
        this.router.navigate(['/catalogue']);
    }
}