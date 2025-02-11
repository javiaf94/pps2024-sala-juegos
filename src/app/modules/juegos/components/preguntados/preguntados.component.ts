import { Component } from '@angular/core';
import { PreguntadosService } from '../../../../services/preguntados.service';
import { Injectable, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Firestore, addDoc, collection } from '@angular/fire/firestore';
import { AuthService } from '../../../../services/auth.service';
import { map } from 'rxjs';


@Component({
  selector: 'app-preguntados',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preguntados.component.html',
  providers: [PreguntadosService],  // Proveedor standalone
  styleUrl: './preguntados.component.css'
})
export class PreguntadosComponent {

  pokemones: any[] = [];
  usedPokemons: Set<number> = new Set();
  randomPokemon: any;
  options: string[] = [];
  attemptsLeft: number = 3;  // Intentos disponibles
  score: number = 0;  // Puntuación de aciertos
  gameEnded: boolean = false;  // Indica si el juego ha terminado
  userEmail!: string;

  constructor(private preguntadosService: PreguntadosService, private router: Router,  private firestore: Firestore, private auth: AuthService) {}

  ngOnInit() {
    this.preguntadosService.loadPokemones().subscribe(pokemones => {
      this.pokemones = pokemones;
      this.showRandomPokemon();
    });

    this.auth.isLoggedIn().pipe(
      map(user => ({
        loggedIn: !!user, // Convert user object to boolean (true/false)
        email: user ? user.email : null // Retrieve user email if logged in
      }))
    ).subscribe(({ email }) => {
      this.userEmail = email; // Update userEmail attribute
    }); 
  }

  showRandomPokemon() {
    if (this.usedPokemons.size >= this.pokemones.length || this.attemptsLeft <= 0) {
      this.gameEnded = true;  // Terminar el juego
      return;
    }

    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * this.pokemones.length);
    } while (this.usedPokemons.has(this.pokemones[randomIndex].id));

    this.randomPokemon = this.pokemones[randomIndex];
    this.usedPokemons.add(this.randomPokemon.id);
    this.generateOptions();
  }

  generateOptions() {
    this.options = [this.randomPokemon.name];

    while (this.options.length < 4) {
      const randomIndex = Math.floor(Math.random() * this.pokemones.length);
      const randomPokemon = this.pokemones[randomIndex].name;

      if (!this.options.includes(randomPokemon)) {
        this.options.push(randomPokemon);
      }
    }

    this.options = this.shuffleArray(this.options);
  }

  private shuffleArray(array: any[]): any[] {
    return array.sort(() => Math.random() - 0.5);
  }

  handleGuess(selectedPokemon: string) {
    if (this.gameEnded) {
      return; // No hacer nada si el juego ha terminado
    }

    if (selectedPokemon === this.randomPokemon.name) {
      this.score++;
    } else {
      this.attemptsLeft--;  // Disminuir intentos en caso de respuesta incorrecta
    }

    if (this.attemptsLeft > 0) {
      this.showRandomPokemon();  // Mostrar nuevo Pokémon
    } else {
      this.gameEnded = true;  // Terminar el juego si se acabaron los intentos
      this.guardarPuntaje();
    }
  }

  resetGame() {
    this.usedPokemons.clear();
    this.attemptsLeft = 3;
    this.score = 0;
    this.gameEnded = false;
    this.showRandomPokemon();
  }

  volverAlInicio() {
    this.router.navigate(["/home"]);
  }

  guardarPuntaje() {
    let col = collection(this.firestore, 'puntajes');
    addDoc(col, { usuario: this.userEmail, puntaje: this.score, fecha: new Date(), juego:"preguntados"})
}
}
