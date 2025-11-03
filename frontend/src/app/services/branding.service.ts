import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BrandingService {
  private readonly defaultLogoUrl = 'assets/images/juriprev.svg';
  private readonly storageKey = 'clienteLogo';

  private logoSubject = new BehaviorSubject<string>(this.defaultLogoUrl);
  logoUrl$ = this.logoSubject.asObservable();

  constructor() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      this.logoSubject.next(saved);
    }
  }

  setLogo(url?: string) {
    const effective = url && url.trim() ? url : this.defaultLogoUrl;
    this.logoSubject.next(effective);

    // Persist only valid string URLs or data URIs; otherwise clear
    if (effective && (effective.startsWith('data:') || effective.startsWith('http') || effective.startsWith('assets/') || effective.startsWith('/assets'))) {
      localStorage.setItem(this.storageKey, effective);
    } else {
      localStorage.removeItem(this.storageKey);
    }
  }

  resetLogo() {
    this.setLogo(this.defaultLogoUrl);
  }
}