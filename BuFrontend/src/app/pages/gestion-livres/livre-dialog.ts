import { Component, inject, signal, computed, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Auteur, Livre, LivreRequest } from '../../core/models';
import { Ui } from '../../core/ui';

interface DialogData {
  livre: Livre | null;
  auteurs: Auteur[];
}

const TAILLE_MAX_IMAGE = 2 * 1024 * 1024; // 2 Mo

@Component({
  selector: 'app-livre-dialog',
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatChipsModule, MatAutocompleteModule,
  ],
  template: `
    <div class="dialog-head">
      <p class="eyebrow">{{ data.livre ? 'Modification' : 'Nouvel ouvrage' }}</p>
      <h2 mat-dialog-title>{{ data.livre ? data.livre.titre : 'Ajouter un livre' }}</h2>
    </div>

    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="form-with-image">
          <div class="champs">
            <mat-form-field appearance="outline" class="full">
              <mat-label>Titre</mat-label>
              <input matInput formControlName="titre" />
            </mat-form-field>

            <!-- Sélection des auteurs par puces + autocomplétion -->
            <mat-form-field appearance="outline" class="full">
              <mat-label>Auteur(s)</mat-label>
              <mat-chip-grid #chipGrid aria-label="Auteurs sélectionnés">
                @for (a of auteursSelectionnes(); track a.id) {
                  <mat-chip-row (removed)="retirerAuteur(a)">
                    {{ a.prenom }} {{ a.nom }}
                    <button matChipRemove aria-label="Retirer l'auteur">
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </mat-chip-row>
                }
                <input
                  placeholder="Taper un nom d'auteur..."
                  #auteurInput
                  [matChipInputFor]="chipGrid"
                  [matAutocomplete]="auto"
                  [formControl]="rechercheAuteur"
                />
              </mat-chip-grid>
              <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onAuteurChoisi($event)">
                @for (a of auteursSuggeres(); track a.id) {
                  <mat-option [value]="a.id">{{ a.prenom }} {{ a.nom }}</mat-option>
                }
              </mat-autocomplete>
              <mat-hint>Tape un nom puis sélectionne dans la liste — un livre peut avoir plusieurs auteurs</mat-hint>
              @if (auteursVide()) {
                <mat-error>Au moins un auteur est requis</mat-error>
              }
            </mat-form-field>

            <div class="row">
              <mat-form-field appearance="outline">
                <mat-label>ISBN</mat-label>
                <input matInput formControlName="isbn" maxlength="13" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Année</mat-label>
                <input matInput type="number" formControlName="anneePublication" />
              </mat-form-field>
            </div>

            <div class="row">
              <mat-form-field appearance="outline">
                <mat-label>Catégorie</mat-label>
                <input matInput formControlName="categorie" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Stock total</mat-label>
                <input matInput type="number" formControlName="stockTotal" min="0" />
              </mat-form-field>
            </div>
          </div>

          <div class="image-bloc">
            <span class="image-label">Couverture</span>
            <div class="image-preview">
              @if (apercu()) {
                <img [src]="apercu()" alt="Aperçu de la couverture" />
              } @else {
                <mat-icon>menu_book</mat-icon>
              }
            </div>
            <input #fileInput type="file" accept="image/*" hidden (change)="onFichierChoisi($event)" />
            <button type="button" mat-stroked-button (click)="fileInput.click()">
              <mat-icon>upload</mat-icon> Choisir
            </button>
            @if (apercu()) {
              <button type="button" mat-button color="warn" (click)="retirerImage()">Retirer</button>
            }
          </div>
        </div>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="4" maxlength="2000"
            placeholder="Résumé, quatrième de couverture..."></textarea>
          <mat-hint align="end">{{ form.controls.description.value?.length || 0 }} / 2000</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="btn-ghost">Annuler</button>
      <button mat-flat-button class="btn-primary" [disabled]="form.invalid || auteursVide()" (click)="valider()">
        Enregistrer
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');

    :host {
      --ink: #0f1222;
      --ink-soft: #6b7280;
      --line: #e8eaf0;
      --indigo: #4f46e5;
      --gold: #b8842f;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .dialog-head { padding: 24px 24px 4px; }
    .eyebrow {
      margin: 0 0 4px; font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em; color: var(--gold);
    }
    h2[mat-dialog-title] {
      margin: 0; font-family: 'Source Serif 4', Georgia, serif;
      font-weight: 700; font-size: 21px; color: var(--ink);
    }

    .dialog-form { display: flex; flex-direction: column; min-width: 520px; padding-top: 12px; gap: 4px; }
    .full { width: 100%; }
    .row { display: flex; gap: 12px; }
    .row mat-form-field { flex: 1; }

    .form-with-image { display: flex; gap: 20px; align-items: flex-start; }
    .champs { flex: 1; min-width: 0; }
    .image-bloc {
      width: 150px; display: flex; flex-direction: column; align-items: center; gap: 8px; flex-shrink: 0;
    }
    .image-label { font-size: 12px; color: var(--ink-soft); align-self: flex-start; }
    .image-preview {
      width: 130px; height: 170px; border-radius: 8px; border: 1px dashed var(--line);
      background: #f4f5fb; display: flex; align-items: center; justify-content: center; overflow: hidden;
    }
    .image-preview img { width: 100%; height: 100%; object-fit: cover; }
    .image-preview mat-icon { font-size: 38px; width: 38px; height: 38px; color: var(--indigo); opacity: .5; }

    mat-dialog-actions { padding: 12px 24px 20px !important; }
    .btn-ghost { color: var(--ink-soft) !important; }
    .btn-primary { background: var(--indigo) !important; color: #fff !important; }

    @media (max-width: 600px) {
      .dialog-form { min-width: 260px; }
      .row { flex-direction: column; gap: 0; }
      .form-with-image { flex-direction: column; align-items: center; }
    }
  `],
})
export class LivreDialog {
  private fb = inject(FormBuilder);
  private ref = inject(MatDialogRef<LivreDialog>);
  private ui = inject(Ui);
  data = inject<DialogData>(MAT_DIALOG_DATA);

  auteurInput = viewChild<ElementRef<HTMLInputElement>>('auteurInput');

  apercu = signal<string | null>(this.data.livre?.imageUrl ?? null);
  rechercheAuteur = this.fb.control('');

  auteursSelectionnes = signal<Auteur[]>(
    this.data.livre
      ? this.data.auteurs.filter(a => this.data.livre!.auteurs.some(sa => sa.id === a.id))
      : []
  );

  auteurEnCours = signal(this.rechercheAuteur.value ?? '');

  auteursSuggeres = computed(() => {
    const texte = (this.rechercheAuteur.value ?? '').toLowerCase().trim();
    const dejaChoisis = new Set(this.auteursSelectionnes().map(a => a.id));
    return this.data.auteurs
      .filter(a => !dejaChoisis.has(a.id))
      .filter(a => !texte || `${a.prenom} ${a.nom}`.toLowerCase().includes(texte))
      .slice(0, 20);
  });

  auteursVide = computed(() => this.auteursSelectionnes().length === 0);

  form = this.fb.nonNullable.group({
    titre: [this.data.livre?.titre ?? '', Validators.required],
    isbn: [this.data.livre?.isbn ?? ''],
    anneePublication: [this.data.livre?.anneePublication ?? null as number | null],
    categorie: [this.data.livre?.categorie ?? ''],
    stockTotal: [this.data.livre?.stockTotal ?? 1, [Validators.required, Validators.min(0)]],
    description: [this.data.livre?.description ?? '' as string | null],
  });

  onAuteurChoisi(event: MatAutocompleteSelectedEvent): void {
    const id = event.option.value as number;
    const auteur = this.data.auteurs.find(a => a.id === id);
    if (auteur) {
      this.auteursSelectionnes.update(list => [...list, auteur]);
    }
    this.rechercheAuteur.setValue('');
    const input = this.auteurInput()?.nativeElement;
    if (input) input.value = '';
  }

  retirerAuteur(auteur: Auteur): void {
    this.auteursSelectionnes.update(list => list.filter(a => a.id !== auteur.id));
  }

  onFichierChoisi(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0];
    if (!fichier) return;

    if (!fichier.type.startsWith('image/')) {
      this.ui.error('Le fichier sélectionné doit être une image');
      input.value = '';
      return;
    }
    if (fichier.size > TAILLE_MAX_IMAGE) {
      this.ui.error('Image trop volumineuse (2 Mo maximum)');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => this.apercu.set(reader.result as string);
    reader.onerror = () => this.ui.error('Impossible de lire cette image');
    reader.readAsDataURL(fichier);
  }

  retirerImage(): void {
    this.apercu.set(null);
  }

  valider(): void {
    if (this.form.invalid || this.auteursVide()) return;
    const req: LivreRequest = {
      ...this.form.getRawValue(),
      imageUrl: this.apercu(),
      auteurIds: this.auteursSelectionnes().map(a => a.id),
    };
    this.ref.close(req);
  }
}