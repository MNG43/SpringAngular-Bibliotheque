package com.projet.bibliotheque.dto;

import java.util.List;

public record LivreDto(
        Long id,
        String titre,
        String isbn,
        Integer anneePublication,
        String categorie,
        Integer stockTotal,
        Integer stockDisponible,
        boolean disponible,
        int fileAttente,
        List<AuteurSimpleDto> auteurs,
        String imageUrl,
        String description
) {
}