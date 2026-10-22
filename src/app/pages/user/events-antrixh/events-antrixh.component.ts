import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UpcomingEventResponse } from '../../../core/models/auth.model';
import { ApiService } from '../../../core/services/api.service';
import { AntrixhLoaderComponent } from '../../../layout/antrixh-loader/antrixh-loader.component';
import { LocationIconComponent } from '../../../shared/location-icon/location-icon.component';

@Component({
  selector: 'app-events-antrixh',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AntrixhLoaderComponent, LocationIconComponent],
  templateUrl: './events-antrixh.component.html',
  styleUrl: './events-antrixh.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsAntrixhComponent implements OnInit, OnDestroy {
  readonly fallbackImg =
    'https://images.unsplash.com/photo-1526178611801-4f9d2f6d1a6c?w=800&q=60';

  upcomingEvents: UpcomingEventResponse[] = [];
  isLoadingEvents = false;
  eventPrices: Map<number, number | null> = new Map();

  // Hero slider state
  activeSlideIndex = 0;
  private sliderInterval: ReturnType<typeof setInterval> | null = null;
  private loopResetScheduled = false;
  private scrollDebounce: ReturnType<typeof setTimeout> | null = null;
  private readonly sliderGap = 16;
  private readonly sliderPadX = 4;
  @ViewChild('sliderViewport') sliderViewport?: ElementRef<HTMLElement>;

  // Filters
  searchQuery = '';
  selectedDate = '';
  selectedLocation = '';
  showFilters = false;
  showSearch = false;

  // View mode: list = image left / details right, grid = image top / details below
  viewMode: 'list' | 'grid' = 'list';

  constructor(
    private router: Router,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadUpcomingEvents();
  }

  ngOnDestroy(): void {
    if (this.scrollDebounce) clearTimeout(this.scrollDebounce);
    this.stopSlider();
  }

  // ===== DATA =====
  loadUpcomingEvents(): void {
    this.isLoadingEvents = true;

    this.apiService.getUpcomingEventsDefault().subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.upcomingEvents = response.data;
          this.upcomingEvents.forEach((event) => this.loadEventPrice(event.event_id));
          this.activeSlideIndex = this.upcomingEvents.length >= 2 ? this.upcomingEvents.length : 0;
          this.startSlider();
          setTimeout(() => this.scrollToActive(false), 0);
        } else {
          this.upcomingEvents = [];
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingEvents = false;
        this.cdr.markForCheck();
      },
      complete: () => {
        this.isLoadingEvents = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadEventPrice(eventId: number): void {
    this.apiService.getEventPriceInRange(eventId).subscribe({
      next: (response) => {
        this.eventPrices.set(
          eventId,
          response.status === 'Success' && response.data !== null ? response.data : null
        );
        this.cdr.markForCheck();
      },
      error: () => {
        this.eventPrices.set(eventId, null);
        this.cdr.markForCheck();
      },
    });
  }

  getEventPrice(event: UpcomingEventResponse): number | null {
    return this.eventPrices.get(event.event_id) ?? null;
  }

  // Triplicated list so the slider can loop seamlessly in both directions.
  get loopEvents(): UpcomingEventResponse[] {
    const n = this.upcomingEvents.length;
    if (n < 2) return this.upcomingEvents;
    return [...this.upcomingEvents, ...this.upcomingEvents, ...this.upcomingEvents];
  }

  get heroBackgroundImage(): string {
    const event = this.loopEvents[this.activeSlideIndex] || this.upcomingEvents[0];
    const url = event?.banner_image || this.fallbackImg;
    return `url('${url}')`;
  }

  // ===== SLIDER =====
  // The hero slider is hidden on PC (see the min-width: 769px media query),
  // so the autoplay timer must not run there either.
  private isDesktopViewport(): boolean {
    return window.innerWidth > 768;
  }

  private startSlider(): void {
    this.stopSlider();
    if (this.isDesktopViewport()) return;
    if (this.upcomingEvents.length > 1) {
      this.sliderInterval = setInterval(() => this.nextSlide(), 7000);
    }
  }

  private stopSlider(): void {
    if (this.sliderInterval) {
      clearInterval(this.sliderInterval);
      this.sliderInterval = null;
    }
  }

  nextSlide(): void {
    const n = this.upcomingEvents.length;
    if (n < 2) return;
    this.activeSlideIndex++;
    this.scrollToActive(true);
    this.scheduleLoopReset();
  }

  prevSlide(): void {
    const n = this.upcomingEvents.length;
    if (n < 2) return;
    this.activeSlideIndex--;
    this.scrollToActive(true);
    this.scheduleLoopReset();
  }

  goToSlide(index: number): void {
    this.activeSlideIndex = index;
    this.scrollToActive(true);
    this.scheduleLoopReset();
    this.startSlider();
  }

  // Non-center slides get centered on click; the centered slide opens the event.
  onSlideClick(index: number, event: UpcomingEventResponse): void {
    if (this.isCenterSlide(index)) {
      this.onEventClick(event);
    } else {
      this.goToSlide(index);
    }
  }

  // Keeps the active index inside the middle copy for a seamless infinite loop.
  private scheduleLoopReset(): void {
    const n = this.upcomingEvents.length;
    if (n < 2 || this.loopResetScheduled) return;

    if (this.activeSlideIndex >= n * 2) {
      this.loopResetScheduled = true;
      setTimeout(() => {
        this.activeSlideIndex -= n;
        this.loopResetScheduled = false;
        setTimeout(() => this.scrollToActive(false), 0);
      }, 520);
    } else if (this.activeSlideIndex < n) {
      this.loopResetScheduled = true;
      setTimeout(() => {
        this.activeSlideIndex += n;
        this.loopResetScheduled = false;
        setTimeout(() => this.scrollToActive(false), 0);
      }, 520);
    }
  }

  // The slider only exists on mobile, so start/stop it when the viewport
  // crosses the 768px breakpoint.
  @HostListener('window:resize')
  onResize(): void {
    const shouldRun = !this.isDesktopViewport() && this.upcomingEvents.length > 1;
    if (shouldRun && !this.sliderInterval) {
      this.startSlider();
    } else if (!shouldRun) {
      this.stopSlider();
    }
  }

  // Called while the viewport is scrolled manually (mouse/touch/drag); after a
  // short pause the slide nearest the center becomes the active one.
  onSliderScroll(): void {
    if (this.scrollDebounce) clearTimeout(this.scrollDebounce);
    this.scrollDebounce = setTimeout(() => {
      this.scrollDebounce = null;
      this.syncActiveFromScroll();
    }, 150);
  }

  // Where the active slide sits inside the viewport: on PC the active card is
  // the 2nd full slide from the left edge (after 1 cropped + 1 full card);
  // on mobile it stays centered.
  private activeOffset(viewport: HTMLElement, w: number): number {
    if (window.innerWidth > 768) {
      return w * 1.5 + this.sliderGap * 2;
    }
    return (viewport.clientWidth - w * 1.25) / 2;
  }

  private syncActiveFromScroll(): void {
    const viewport = this.sliderViewport?.nativeElement;
    const n = this.upcomingEvents.length;
    if (!viewport || n < 2) return;

    const w = this.resolveSlideWidth(viewport);
    if (!w) return;

    const index = Math.round(
      (viewport.scrollLeft + this.activeOffset(viewport, w) - this.sliderPadX) /
        (w + this.sliderGap)
    );

    const max = this.loopEvents.length - 1;
    const clamped = Math.min(Math.max(index, 0), max);
    if (clamped !== this.activeSlideIndex) {
      this.activeSlideIndex = clamped;
    }
  }

  // Unregistered custom properties (e.g. calc()) don't evaluate through
  // getComputedStyle, so fall back to measuring a probe element.
  private resolveSlideWidth(viewport: HTMLElement): number {
    const raw = getComputedStyle(viewport).getPropertyValue('--slide-w').trim();
    const numeric = parseFloat(raw);
    if (numeric) {
      return raw.endsWith('vw') ? (numeric / 100) * window.innerWidth : numeric;
    }

    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;width:var(--slide-w);';
    viewport.appendChild(probe);
    const width = probe.offsetWidth;
    probe.remove();
    return width;
  }

  // Centering is computed from the CSS size variables instead of probing the
  // live DOM, so the correct position is used even while widths are animating.
  private scrollToActive(smooth = true): void {
    const viewport = this.sliderViewport?.nativeElement;
    if (!viewport || this.isDesktopViewport()) return;

    const w = this.resolveSlideWidth(viewport);
    if (!w) return;

    const left =
      this.activeSlideIndex * (w + this.sliderGap) +
      this.sliderPadX -
      this.activeOffset(viewport, w);

    viewport.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
  }

  isCenterSlide(index: number): boolean {
    return index === this.activeSlideIndex;
  }

  trackByIndex(index: number): number {
    return index;
  }

  // ===== FILTERS =====
  get eventDateOptions(): { value: string; label: string }[] {
    const map = new Map<string, string>();
    this.upcomingEvents.forEach((event) => {
      if (event.event_date) {
        const key = event.event_date.substring(0, 10);
        if (!map.has(key)) {
          map.set(key, this.formatEventDate(event.event_date));
        }
      }
    });
    return Array.from(map, ([value, label]) => ({ value, label }));
  }

  get eventLocationOptions(): string[] {
    const set = new Set(
      this.upcomingEvents.map((event) => event.location).filter((loc): loc is string => !!loc)
    );
    return Array.from(set).sort();
  }

  get filteredEvents(): UpcomingEventResponse[] {
    const query = this.searchQuery.trim().toLowerCase();

    return this.upcomingEvents.filter((event) => {
      const matchesSearch =
        !query ||
        event.event_name?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query);

      const matchesDate =
        !this.selectedDate || event.event_date?.substring(0, 10) === this.selectedDate;

      const matchesLocation = !this.selectedLocation || event.location === this.selectedLocation;

      return matchesSearch && matchesDate && matchesLocation;
    });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedDate = '';
    this.selectedLocation = '';
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
    if (this.showFilters) {
      this.showSearch = false;
      this.stopSlider();
    } else {
      this.startSlider();
    }
  }

  toggleSearch(): void {
    this.showSearch = !this.showSearch;
    if (this.showSearch) {
      this.showFilters = false;
      this.stopSlider();
    } else {
      this.startSlider();
    }
  }

  closePanels(): void {
    this.showFilters = false;
    this.showSearch = false;
    this.startSlider();
  }

  onSearchResultClick(event: UpcomingEventResponse): void {
    this.showSearch = false;
    this.onEventClick(event);
  }

  setViewMode(mode: 'list' | 'grid'): void {
    this.viewMode = mode;
  }

  // ===== HELPERS =====
  formatEventDate(dateString: string | Date): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  formatEventWeekday(dateString: string | Date): string {
    if (!dateString) return '';

    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' });
  }

  formatEventShortDate(dateString: string | Date): string {
    if (!dateString) return '';

    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
    });
  }

  formatEventYear(dateString: string | Date): string {
    if (!dateString) return '';

    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric' });
  }

  formatEventTime(timeString: string): string {
    if (!timeString) return '';

    const parts = String(timeString).split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return timeString;

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  onEventClick(event: UpcomingEventResponse): void {
    const slug = this.createSlug(event.event_name);
    this.router.navigate(['/event-booking-antrixh', event.event_id, slug]);
  }

  openPrivacyPolicy(): void {
    window.open(this.router.createUrlTree(['/privacy-policy-antrixh']).toString(), '_blank');
  }

  openTermsConditions(): void {
    window.open(this.router.createUrlTree(['/terms-conditions-antrixh']).toString(), '_blank');
  }

  openRefundPolicy(): void {
    window.open(this.router.createUrlTree(['/refund-policy-antrixh']).toString(), '_blank');
  }

  private createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }

  hasLocationUrl(event: UpcomingEventResponse): boolean {
    return !!(event.geo_map_url || (event.latitude && event.longitude));
  }

  onLocationClick(event: MouseEvent, eventData: UpcomingEventResponse): void {
    event.stopPropagation();

    let mapUrl = '';
    if (eventData.geo_map_url) {
      mapUrl = eventData.geo_map_url;
    } else if (eventData.latitude && eventData.longitude) {
      mapUrl = `https://www.google.com/maps?q=${eventData.latitude},${eventData.longitude}`;
    } else if (eventData.full_address) {
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        eventData.full_address
      )}`;
    } else if (eventData.location) {
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        eventData.location
      )}`;
    }

    if (mapUrl) {
      window.open(mapUrl, '_blank');
    }
  }

  trackByEventId(index: number, event: UpcomingEventResponse): number {
    return event.event_id;
  }
}
