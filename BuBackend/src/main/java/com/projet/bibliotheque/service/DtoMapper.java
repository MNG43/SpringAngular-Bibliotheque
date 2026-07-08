package com.projet.bibliotheque.service;

import com.projet.bibliotheque.dto.*;
import com.projet.bibliotheque.model.*;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Convertit les entités JPA en DTOs exposés par l'API.
 * On ne renvoie jamais les entités directement (évite les problèmes de
 * sérialisation LAZY et découple le contrat REST du modèle interne).
 */
@Component
public class DtoMapper {

    public AuteurDto toAuteurDto(Auteur a) {
        return new AuteurDto(a.getId(), a.getNom(), a.getPrenom(), a.getNationalite(),
                a.getLivres() == null ? 0 : a.getLivres().size());
    }

    public AuteurSimpleDto toAuteurSimple(Auteur a) {
        return new AuteurSimpleDto(a.getId(), a.getPrenom() + " " + a.getNom());
    }

    public LivreDto toLivreDto(Livre l, int fileAttente) {
        return new LivreDto(
                l.getId(),
                l.getTitre(),
                l.getIsbn(),
                l.getAnneePublication(),
                l.getCategorie(),
                l.getStockTotal(),
                l.getStockDisponible(),
                l.getStockDisponible() != null && l.getStockDisponible() > 0,
                fileAttente,
                l.getAuteurs().stream().map(this::toAuteurSimple).toList(),
                l.getImageUrl(),
                l.getDescription()
        );
    }

    public LivreSimpleDto toLivreSimple(Livre l) {
        return new LivreSimpleDto(l.getId(), l.getTitre(), l.getIsbn());
    }

    public UtilisateurDto toUtilisateurDto(Utilisateur u) {
        return new UtilisateurDto(u.getId(), u.getNom(), u.getEmail(), u.getRole().name(),
                u.isActif(), u.getDateInscription());
    }

    public UtilisateurSimpleDto toUtilisateurSimple(Utilisateur u) {
        return new UtilisateurSimpleDto(u.getId(), u.getNom(), u.getEmail());
    }

    public EmpruntDto toEmpruntDto(Emprunt e, PenaliteDto penalite) {
        boolean enRetard = e.getStatut() == Emprunt.Statut.EN_RETARD
                || (e.getDateRetourEffective() == null && e.getDateRetourPrevue().isBefore(LocalDate.now()));
        long joursRestants = e.getDateRetourEffective() != null
                ? 0
                : ChronoUnit.DAYS.between(LocalDate.now(), e.getDateRetourPrevue());
        return new EmpruntDto(
                e.getId(),
                toLivreSimple(e.getLivre()),
                toUtilisateurSimple(e.getUtilisateur()),
                e.getDateEmprunt(),
                e.getDateRetourPrevue(),
                e.getDateRetourEffective(),
                e.getStatut().name(),
                e.isProlonge(),
                enRetard,
                joursRestants,
                penalite
        );
    }

    public ReservationDto toReservationDto(Reservation r, Integer position) {
        return new ReservationDto(
                r.getId(),
                toLivreSimple(r.getLivre()),
                toUtilisateurSimple(r.getUtilisateur()),
                r.getDateReservation(),
                r.getStatut().name(),
                r.getDateExpiration(),
                position
        );
    }

    public PenaliteDto toPenaliteDto(Penalite p) {
        return new PenaliteDto(
                p.getId(),
                p.getEmprunt().getId(),
                p.getEmprunt().getLivre().getTitre(),
                p.getEmprunt().getUtilisateur().getNom(),
                p.getMontant(),
                p.getJoursRetard(),
                p.getStatut().name(),
                p.getDateCreation()
        );
    }

    public NotificationDto toNotificationDto(Notification n) {
        return new NotificationDto(
                n.getId(),
                n.getMessage(),
                n.getType().name(),
                n.isLue(),
                n.getDateCreation(),
                n.getReservation() != null ? n.getReservation().getId() : null
        );
    }
}