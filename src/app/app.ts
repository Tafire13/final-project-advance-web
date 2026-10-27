import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent {
  title = 'frontend';
  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );
  readonly isRiderPage = computed(() => /^\/rider(?:[/?#]|$)/.test(this.currentUrl()));
  readonly currentPageTitle = computed(() => {
    const url = this.currentUrl();

    if (url.startsWith('/customers')) return 'ลูกค้า';
    if (url.startsWith('/orders')) return 'ออเดอร์';
    if (url.startsWith('/plans')) return 'วางแผนเส้นทาง';
    if (url.startsWith('/jobs')) return 'ใบงานจัดส่ง';
    return 'ระบบจัดส่ง';
  });
}
