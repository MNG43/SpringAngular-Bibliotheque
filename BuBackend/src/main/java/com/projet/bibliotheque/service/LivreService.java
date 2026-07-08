package com.projet.bibliotheque.service;

import com.projet.bibliotheque.dto.LivreDto;
import com.projet.bibliotheque.dto.LivreRequest;
import com.projet.bibliotheque.exception.ConflictException;
import com.projet.bibliotheque.exception.ResourceNotFoundException;
import com.projet.bibliotheque.model.Auteur;
import com.projet.bibliotheque.model.Livre;
import com.projet.bibliotheque.model.Reservation;
import com.projet.bibliotheque.repository.AuteurRepository;
import com.projet.bibliotheque.repository.LivreRepository;
import com.projet.bibliotheque.repository.ReservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class LivreService {

    private final LivreRepository livreRepository;
    private final AuteurRepository auteurRepository;
    private final ReservationRepository reservationRepository;
    private final DtoMapper mapper;

    public LivreService(LivreRepository livreRepository, AuteurRepository auteurRepository,
                        ReservationRepository reservationRepository, DtoMapper mapper) {
        this.livreRepository = livreRepository;
        this.auteurRepository = auteurRepository;
        this.reservationRepository = reservationRepository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<LivreDto> listerTous() {
        return livreRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<LivreDto> listerDisponibles() {
        return livreRepository.findByStockDisponibleGreaterThan(0).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public LivreDto trouverParId(Long id) {
        return toDto(getLivre(id));
    }

    @Transactional(readOnly = true)
    public List<LivreDto> rechercher(String query) {
        return livreRepository.rechercher(query).stream().map(this::toDto).toList();
    }

    public LivreDto creer(LivreRequest req) {
        if (req.isbn() != null && !req.isbn().isBlank() && livreRepository.existsByIsbn(req.isbn())) {
            throw new ConflictException("ISBN déjà existant : " + req.isbn());
        }
        Livre livre = new Livre();
        appliquer(livre, req);
        return toDto(livreRepository.save(livre));
    }

    public LivreDto modifier(Long id, LivreRequest req) {
        Livre livre = getLivre(id);
        if (req.isbn() != null && !req.isbn().isBlank()
                && !req.isbn().equals(livre.getIsbn()) && livreRepository.existsByIsbn(req.isbn())) {
            throw new ConflictException("ISBN déjà existant : " + req.isbn());
        }
        // On préserve la part déjà empruntée du stock lors d'un changement de stock total
        int empruntes = livre.getStockTotal() - livre.getStockDisponible();
        appliquer(livre, req);
        int nouveauDispo = req.stockTotal() - empruntes;
        livre.setStockDisponible(Math.max(0, nouveauDispo));
        return toDto(livreRepository.save(livre));
    }

    public void supprimer(Long id) {
        Livre livre = getLivre(id);
        if (livre.getStockDisponible() < livre.getStockTotal()) {
            throw new ConflictException("Impossible de supprimer un livre avec des exemplaires empruntés");
        }
        livreRepository.delete(livre);
    }

    private void appliquer(Livre livre, LivreRequest req) {
        boolean nouveau = livre.getId() == null;
        livre.setTitre(req.titre());
        livre.setIsbn(req.isbn());
        livre.setAnneePublication(req.anneePublication());
        livre.setCategorie(req.categorie());
        livre.setStockTotal(req.stockTotal());
        livre.setImageUrl(req.imageUrl());
        livre.setDescription(req.description());
        if (nouveau) {
            livre.setStockDisponible(req.stockTotal());
        }
        List<Auteur> auteurs = req.auteurIds().stream()
                .map(aid -> auteurRepository.findById(aid)
                        .orElseThrow(() -> new ResourceNotFoundException("Auteur introuvable : " + aid)))
                .toList();
        livre.setAuteurs(new java.util.ArrayList<>(auteurs));
    }

    private Livre getLivre(Long id) {
        return livreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Livre introuvable : " + id));
    }

    private LivreDto toDto(Livre l) {
        int fileAttente = (int) reservationRepository.countByLivreIdAndStatut(l.getId(), Reservation.Statut.EN_ATTENTE);
        return mapper.toLivreDto(l, fileAttente);
    }
}