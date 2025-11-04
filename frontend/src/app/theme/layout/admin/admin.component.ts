// Angular Import
import { Component, HostListener, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule, Location, LocationStrategy } from '@angular/common';

// Project Import
import { ConfigurationComponent } from './configuration/configuration.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { NavigationComponent } from './navigation/navigation.component';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { Footer } from './footer/footer';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [ConfigurationComponent, RouterModule, NavBarComponent, NavigationComponent, CommonModule, BreadcrumbComponent, Footer],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {
  private location = inject(Location);
  private locationStrategy = inject(LocationStrategy);

  // public props
  navCollapsed: boolean;
  navCollapsedMob: boolean;
  windowWidth: number;

  // constructor
  constructor() {
    this.windowWidth = window.innerWidth;
    this.navCollapsedMob = false;
    // Iniciar com menu ABERTO por padrão (desktop e mobile)
    this.navCollapsed = false;
  }

  @HostListener('window:resize', ['$event'])
  // eslint-disable-next-line
  onResize(event: any): void {
    this.windowWidth = event.target.innerWidth;
    if (this.windowWidth < 992) {
      document.querySelector('.pcoded-navbar')?.classList.add('menupos-static');
      const navEl = document.querySelector('#nav-ps-gradient-able') as HTMLElement | null;
      if (navEl) {
        navEl.style.height = '100%';
      }
    }
  }

  // public method
  navCollapse() {
    // Alterna o estado de colapso do menu lateral (desktop)
    this.navCollapsed = !this.navCollapsed;
  }

  navMobClick() {
    if (this.windowWidth < 992) {
      const nav = document.querySelector('app-navigation.pcoded-navbar');
      const hasMobOpen = nav?.classList.contains('mob-open');
      if (this.navCollapsedMob && !hasMobOpen) {
        this.navCollapsedMob = !this.navCollapsedMob;
        setTimeout(() => {
          this.navCollapsedMob = !this.navCollapsedMob;
        }, 100);
      } else {
        this.navCollapsedMob = !this.navCollapsedMob;
      }
    }
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeMenu();
    }
  }

  closeMenu() {
    const nav = document.querySelector('app-navigation.pcoded-navbar');
    if (nav?.classList.contains('mob-open')) {
      nav.classList.remove('mob-open');
    }
  }
}
