// Modèles TypeScript — miroir des DTOs exposés par l'API Spring Boot.

export type Role = 'ETUDIANT' | 'BIBLIOTHECAIRE' | 'ADMIN';

export interface CreateUserRequest {
  nom: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserRequest {
  nom: string;
  email?: string;
  password?: string;
  role: Role;
  actif: boolean;
}

export interface AuthResponse {
  token: string;
  type: string;
  userId: number;
  email: string;
  nom: string;
  role: Role;
}

export interface Utilisateur {
  id: number;
  nom: string;
  email: string;
  role: Role;
  actif: boolean;
  dateInscription: string;
}

export interface AuteurSimple {
  id: number;
  nomComplet: string;
}

export interface Auteur {
  id: number;
  nom: string;
  prenom: string;
  nationalite: string;
  nombreLivres: number;
}

export interface Livre {
  id: number;
  titre: string;
  isbn: string;
  anneePublication: number | null;
  categorie: string | null;
  stockTotal: number;
  stockDisponible: number;
  disponible: boolean;
  fileAttente: number;
  auteurs: AuteurSimple[];
  imageUrl: string | null;
  description: string | null;
}

export interface LivreSimple {
  id: number;
  titre: string;
  isbn: string;
}

export interface Penalite {
  id: number;
  empruntId: number;
  livreTitre: string;
  utilisateurNom: string;
  montant: number;
  joursRetard: number;
  statut: 'NON_PAYEE' | 'PAYEE';
  dateCreation: string;
}

export interface Emprunt {
  id: number;
  livre: LivreSimple;
  utilisateur: { id: number; nom: string; email: string };
  dateEmprunt: string;
  dateRetourPrevue: string;
  dateRetourEffective: string | null;
  statut: 'EN_COURS' | 'RENDU' | 'EN_RETARD';
  prolonge: boolean;
  enRetard: boolean;
  joursRestants: number;
  penalite: Penalite | null;
}

export type ReservationStatut = 'EN_ATTENTE' | 'DISPONIBLE' | 'CONFIRMEE' | 'ANNULEE' | 'EXPIREE';

export interface Reservation {
  id: number;
  livre: LivreSimple;
  utilisateur: { id: number; nom: string; email: string };
  dateReservation: string;
  statut: ReservationStatut;
  dateExpiration: string | null;
  position: number | null;
}

export interface Notification {
  id: number;
  message: string;
  type: 'ECHEANCE_PROCHE' | 'RETARD' | 'RESERVATION_DISPONIBLE' | 'INFO';
  lue: boolean;
  dateCreation: string;
  reservationId?: number;
}

export interface Dashboard {
  totalLivres: number;
  totalExemplaires: number;
  exemplairesDisponibles: number;
  totalMembres: number;
  empruntsEnCours: number;
  empruntsEnRetard: number;
  reservationsEnAttente: number;
  penalitesImpayees: number;
  montantPenalitesImpayees: number;
  topLivres: { livreId: number; titre: string; nombreEmprunts: number }[];
  empruntsParMois: { mois: string; nombre: number }[];
  repartitionStatuts: { statut: string; nombre: number }[];
}

export interface LivreRequest {
  titre: string;
  isbn: string;
  anneePublication: number | null;
  categorie: string | null;
  stockTotal: number;
  auteurIds: number[];
  imageUrl: string | null;
  description: string | null;
}

export interface AuteurRequest {
  nom: string;
  prenom: string;
  nationalite: string;
}