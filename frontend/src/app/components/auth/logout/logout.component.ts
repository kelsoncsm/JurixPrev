import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="p-3">Saindo...</div>`
})
export class LogoutComponent {
  constructor(private router: Router) {
    // efetua logout imediato
    localStorage.clear();
    sessionStorage.clear();
    // redireciona para login
    this.router.navigate(['/login']);
  }
}