import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StatsService } from '../../core/api.service';
import { Ui } from '../../core/ui';
import { Dashboard } from '../../core/models';

interface Tile {
  label: string;
  valeur: number | string;
  icon: string;
  accent: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface Alert {
  type: 'warning' | 'error' | 'info';
  titre: string;
  description: string;
  action?: string;
  actionLabel?: string;
}

interface Activite {
  type: 'emprunt' | 'retour' | 'reservation' | 'penalite';
  message: string;
  utilisateur: string;
  date: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardPage implements OnInit {
  private statsService = inject(StatsService);
  private ui = inject(Ui);

  data = signal<Dashboard | null>(null);
  loading = signal(true);

  tiles = computed<Tile[]>(() => {
    const d = this.data();
    if (!d) return [];

    const tauxRetard = d.empruntsEnCours > 0 ? Math.round((d.empruntsEnRetard / d.empruntsEnCours) * 100) : 0;
    const trendRetard = tauxRetard > 10 ? 'down' : tauxRetard > 5 ? 'neutral' : 'up';

    return [
      {
        label: 'Livres disponibles',
        valeur: d.exemplairesDisponibles,
        icon: 'menu_book',
        accent: 'green',
        trend: 'up'
      },
      {
        label: 'Emprunts en cours',
        valeur: d.empruntsEnCours,
        icon: 'import_contacts',
        accent: 'blue',
        trend: 'neutral'
      },
      {
        label: 'En retard',
        valeur: d.empruntsEnRetard,
        icon: 'warning',
        accent: 'red',
        trend: trendRetard
      },
      {
        label: 'Réservations',
        valeur: d.reservationsEnAttente,
        icon: 'bookmark',
        accent: 'amber',
        trend: 'neutral'
      },
    ];
  });

  alerts = computed<Alert[]>(() => {
    const d = this.data();
    if (!d) return [];

    const alerts: Alert[] = [];

    // Alertes pour les retards
    if (d.empruntsEnRetard > 0) {
      const tauxRetard = d.empruntsEnCours > 0 ? Math.round((d.empruntsEnRetard / d.empruntsEnCours) * 100) : 0;
      if (tauxRetard > 20) {
        alerts.push({
          type: 'error',
          titre: `${d.empruntsEnRetard} emprunts en retard`,
          description: `Taux de retard élevé (${tauxRetard}%). Relancez les emprunteurs.`,
          action: 'Voir les retards',
          actionLabel: 'Gérer'
        });
      } else if (tauxRetard > 10) {
        alerts.push({
          type: 'warning',
          titre: `${d.empruntsEnRetard} emprunts en retard`,
          description: `Taux de retard de ${tauxRetard}%. Surveillez les échéances.`,
          action: 'Voir les retards',
          actionLabel: 'Voir'
        });
      }
    }

    // Alertes pour les pénalités
    if (d.montantPenalitesImpayees > 50000) {
      alerts.push({
        type: 'warning',
        titre: `${d.montantPenalitesImpayees.toLocaleString('fr-FR')} FCFA impayés`,
        description: `${d.penalitesImpayees} pénalités en attente de paiement.`,
        action: 'Voir les pénalités',
        actionLabel: 'Gérer'
      });
    }

    // Alertes pour les réservations
    if (d.reservationsEnAttente > 10) {
      alerts.push({
        type: 'info',
        titre: `${d.reservationsEnAttente} réservations en attente`,
        description: 'Beaucoup de livres sont réservés. Vérifiez les stocks.',
        action: 'Voir les réservations',
        actionLabel: 'Voir'
      });
    }

    // Stock faible
    const tauxDispo = d.totalExemplaires > 0 ? Math.round((d.exemplairesDisponibles / d.totalExemplaires) * 100) : 0;
    if (tauxDispo < 20 && d.totalExemplaires > 0) {
      alerts.push({
        type: 'warning',
        titre: 'Stock faible',
        description: `Seulement ${tauxDispo}% des exemplaires disponibles.`,
        action: 'Gérer les stocks',
        actionLabel: 'Gérer'
      });
    }

    return alerts;
  });

  activitesRecentes = computed<Activite[]>(() => {
    const d = this.data();
    if (!d) return [];

    // Simuler des activités récentes basées sur les données
    const activites: Activite[] = [];

    if (d.empruntsEnRetard > 0) {
      activites.push({
        type: 'penalite',
        message: `${d.empruntsEnRetard} emprunts en retard`,
        utilisateur: 'Système',
        date: "Aujourd'hui"
      });
    }

    if (d.reservationsEnAttente > 0) {
      activites.push({
        type: 'reservation',
        message: `${d.reservationsEnAttente} nouvelles réservations`,
        utilisateur: 'Utilisateurs',
        date: "Aujourd'hui"
      });
    }

    if (d.empruntsEnCours > 0) {
      activites.push({
        type: 'emprunt',
        message: `${d.empruntsEnCours} emprunts actifs`,
        utilisateur: 'Bibliothèque',
        date: "Cette semaine"
      });
    }

    return activites.slice(0, 5);
  });

  // Échelle du graphe mensuel
  maxMois = computed(() => Math.max(1, ...(this.data()?.empruntsParMois.map(m => m.nombre) ?? [0])));
  maxTop = computed(() => Math.max(1, ...(this.data()?.topLivres.map(l => l.nombreEmprunts) ?? [0])));
  totalStatuts = computed(() => (this.data()?.repartitionStatuts ?? []).reduce((s, r) => s + r.nombre, 0));

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading.set(true);
    this.statsService.dashboard().subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: (err: any) => { this.loading.set(false); this.ui.error(err); },
    });
  }

  lancerTraitements(): void {
    this.statsService.lancerTraitements().subscribe({
      next: r => { this.ui.success(r.resultat); this.charger(); },
      error: (err: any) => this.ui.error(err),
    });
  }

  hauteurMois(n: number): number {
    return Math.round((n / this.maxMois()) * 100);
  }

  largeurTop(n: number): number {
    return Math.round((n / this.maxTop()) * 100);
  }

  statutClasse(statut: string): string {
    switch (statut) {
      case 'EN_COURS': return 'st-cours';
      case 'RENDU': return 'st-rendu';
      case 'EN_RETARD': return 'st-retard';
      default: return 'st-cours';
    }
  }

  statutLabel(statut: string): string {
    switch (statut) {
      case 'EN_COURS': return 'En cours';
      case 'RENDU': return 'Rendus';
      case 'EN_RETARD': return 'En retard';
      default: return statut;
    }
  }

  pourcentageStatut(n: number): number {
    const t = this.totalStatuts();
    return t === 0 ? 0 : Math.round((n / t) * 100);
  }

  getTrendIcon(trend?: 'up' | 'down' | 'neutral'): string {
    switch (trend) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      default: return 'trending_flat';
    }
  }

  getTrendClass(trend?: 'up' | 'down' | 'neutral'): string {
    switch (trend) {
      case 'up': return 'trend-up';
      case 'down': return 'trend-down';
      default: return 'trend-neutral';
    }
  }

  getAlertIcon(type: 'warning' | 'error' | 'info'): string {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  }

  getAlertClass(type: 'warning' | 'error' | 'info'): string {
    switch (type) {
      case 'error': return 'alert-error';
      case 'warning': return 'alert-warning';
      default: return 'alert-info';
    }
  }

  handleAlertAction(alert: Alert): void {
    this.ui.success(alert.action || 'Action effectuée');
  }

  getActiviteIcon(type: 'emprunt' | 'retour' | 'reservation' | 'penalite'): string {
    switch (type) {
      case 'emprunt': return 'import_contacts';
      case 'retour': return 'assignment_return';
      case 'reservation': return 'bookmark';
      case 'penalite': return 'gavel';
    }
  }

  getActiviteClass(type: 'emprunt' | 'retour' | 'reservation' | 'penalite'): string {
    switch (type) {
      case 'emprunt': return 'activite-emprunt';
      case 'retour': return 'activite-retour';
      case 'reservation': return 'activite-reservation';
      case 'penalite': return 'activite-penalite';
    }
  }
}
