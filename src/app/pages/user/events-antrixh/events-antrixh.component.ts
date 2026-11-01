import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
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
import { AntrixhFooterComponent } from '../../../shared/antrixh-footer/antrixh-footer.component';

@Component({
  selector: 'app-events-antrixh',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AntrixhLoaderComponent, LocationIconComponent, AntrixhFooterComponent],
  templateUrl: './events-antrixh.component.html',
  styleUrl: './events-antrixh.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsAntrixhComponent implements OnInit, OnDestroy, AfterViewChecked {
  readonly fallbackImg =
    'https://images.unsplash.com/photo-1526178611801-4f9d2f6d1a6c?w=800&q=60';

  upcomingEvents: UpcomingEventResponse[] = [];
  isLoadingEvents = false;
  eventPrices: Map<number, number | null> = new Map();

  // Hero slider state
  activeSlideIndex = 0;
  animateActiveInfo = true;
  disableSlideTransition = false;
  private sliderInterval: ReturnType<typeof setInterval> | null = null;
  private sliderStartTimeout: ReturnType<typeof setTimeout> | null = null;
  private isSliderDragging = false;
  private isUserScrolling = false;
  private lastScrollLeft = 0;
  private scrollDirection: 'left' | 'right' | null = null;
  private loopResetScheduled = false;
  private scrollDebounce: ReturnType<typeof setTimeout> | null = null;
  private initialCenterDone = false;
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

  ngAfterViewChecked(): void {
    if (this.initialCenterDone || this.isLoadingEvents || this.upcomingEvents.length === 0) {
      return;
    }
    if (!this.sliderViewport?.nativeElement) return;

    this.initialCenterDone = true;
    this.scrollToActive(false);
  }

  // ===== DATA =====
  loadUpcomingEvents(): void {
    this.initialCenterDone = false;
    this.isLoadingEvents = true;

    this.apiService.getUpcomingEventsDefault().subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.upcomingEvents = response.data;
          this.upcomingEvents.forEach((event) => this.loadEventPrice(event.event_id));
          this.activeSlideIndex = this.upcomingEvents.length >= 2 ? this.upcomingEvents.length : 0;
          this.startSlider();
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

  private startSlider(delay = 0): void {
    this.stopSlider();
    if (this.isDesktopViewport() || this.upcomingEvents.length < 2) return;

    const begin = () => {
      this.sliderStartTimeout = null;
      this.sliderInterval = setInterval(() => this.nextSlide(true), 7000);
    };

    if (delay > 0) {
      this.sliderStartTimeout = setTimeout(begin, delay);
    } else {
      begin();
    }
  }

  private stopSlider(): void {
    if (this.sliderInterval) {
      clearInterval(this.sliderInterval);
      this.sliderInterval = null;
    }
    if (this.sliderStartTimeout) {
      clearTimeout(this.sliderStartTimeout);
      this.sliderStartTimeout = null;
    }
  }

  nextSlide(fromAutoplay = false): void {
    const n = this.upcomingEvents.length;
    if (n < 2) return;
    this.animateActiveInfo = true;
    this.activeSlideIndex++;
    this.scrollToActive(true);
    this.scheduleLoopReset();
    if (!fromAutoplay) this.startSlider(3000);
  }

  prevSlide(): void {
    const n = this.upcomingEvents.length;
    if (n < 2) return;
    this.animateActiveInfo = true;
    this.activeSlideIndex--;
    this.scrollToActive(true);
    this.scheduleLoopReset();
    this.startSlider(3000);
  }

  goToSlide(index: number): void {
    this.animateActiveInfo = true;
    this.activeSlideIndex = index;
    this.scrollToActive(true);
    this.scheduleLoopReset();
    this.startSlider(3000);
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
        this.loopResetScheduled = false;
        if (this.activeSlideIndex < n * 2) return;

        this.animateActiveInfo = false;
        this.disableSlideTransition = true;
        this.activeSlideIndex -= n;
        this.cdr.markForCheck();
        this.scrollToActive(false);
        this.restoreSlideTransition();
      }, 520);
    } else if (this.activeSlideIndex < n) {
      this.loopResetScheduled = true;
      setTimeout(() => {
        this.loopResetScheduled = false;
        if (this.activeSlideIndex >= n) return;

        this.animateActiveInfo = false;
        this.disableSlideTransition = true;
        this.activeSlideIndex += n;
        this.cdr.markForCheck();
        this.scrollToActive(false);
        this.restoreSlideTransition();
      }, 520);
    }
  }

  private restoreSlideTransition(): void {
    setTimeout(() => {
      this.disableSlideTransition = false;
      this.cdr.markForCheck();
    }, 50);
  }

  // The slider only exists on mobile, so start/stop it when the viewport
  // crosses the 768px breakpoint.
  @HostListener('window:resize')
  onResize(): void {
    const shouldRun = !this.isDesktopViewport() && this.upcomingEvents.length > 1;
    if (shouldRun && !this.sliderInterval && !this.sliderStartTimeout) {
      this.startSlider();
    }

    if (shouldRun) {
      this.scrollToActive(false);
    } else {
      this.stopSlider();
    }
  }

  onSliderDragStart(): void {
    this.isSliderDragging = true;
    this.isUserScrolling = true;
    const viewport = this.sliderViewport?.nativeElement;
    if (viewport) this.lastScrollLeft = viewport.scrollLeft;
    this.scrollDirection = null;
    if (this.scrollDebounce) {
      clearTimeout(this.scrollDebounce);
      this.scrollDebounce = null;
    }
    this.stopSlider();
  }

  onSliderDragEnd(): void {
    this.isSliderDragging = false;
    this.startSlider(3000);
    setTimeout(() => {
      this.isUserScrolling = false;
      this.scrollDirection = null;
      this.onSliderScroll();
    }, 50);
  }

  // Called while the viewport is scrolled manually (mouse/touch/drag); after a
  // short pause the slide nearest the center becomes the active one.
  onSliderScroll(): void {
    if (this.isSliderDragging) {
      const viewport = this.sliderViewport?.nativeElement;
      if (viewport) {
        if (viewport.scrollLeft > this.lastScrollLeft) this.scrollDirection = 'right';
        else if (viewport.scrollLeft < this.lastScrollLeft) this.scrollDirection = 'left';
        this.lastScrollLeft = viewport.scrollLeft;
      }
      return;
    }

    if (this.scrollDebounce) clearTimeout(this.scrollDebounce);
    this.scrollDebounce = setTimeout(() => {
      this.scrollDebounce = null;
      this.syncActiveFromScroll();
    }, 150);
  }

  private syncActiveFromScroll(): void {
    const viewport = this.sliderViewport?.nativeElement;
    if (!viewport) return;

    const slides = viewport.querySelectorAll<HTMLElement>('.slide');
    if (slides.length === 0) return;

    const viewportCenter = viewport.getBoundingClientRect().left + viewport.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const rect = slide.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - viewportCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    if (this.isUserScrolling && this.scrollDirection && this.upcomingEvents.length >= 2) {
      const current = this.activeSlideIndex;
      if (this.scrollDirection === 'right' && closestIndex <= current) {
        closestIndex = Math.min(current + 1, this.loopEvents.length - 1);
      } else if (this.scrollDirection === 'left' && closestIndex >= current) {
        closestIndex = Math.max(current - 1, 0);
      }
    }

    const physicalIndex = closestIndex;
    const n = this.upcomingEvents.length;
    if (n >= 2) {
      if (closestIndex < n) {
        closestIndex += n;
      } else if (closestIndex >= n * 2) {
        closestIndex -= n;
      }
    }

    const jumpingCopies = physicalIndex !== closestIndex;
    if (closestIndex !== this.activeSlideIndex) {
      const nextEvent = this.loopEvents[closestIndex];
      const currentEvent = this.loopEvents[this.activeSlideIndex];
      this.animateActiveInfo = nextEvent?.event_id !== currentEvent?.event_id;
      this.activeSlideIndex = closestIndex;
      this.cdr.markForCheck();
      if (jumpingCopies) this.scrollToActive(false);
      if (this.isUserScrolling && !jumpingCopies) {
        this.smoothScrollToSlide(this.activeSlideIndex);
      }
      this.startSlider(3000);
    } else if (physicalIndex !== this.activeSlideIndex) {
      if (this.isUserScrolling) {
        this.smoothScrollToSlide(this.activeSlideIndex);
      } else {
        this.scrollToActive(false);
      }
      this.startSlider(3000);
    }
  }

  private scrollToActive(smooth = true): void {
    const viewport = this.sliderViewport?.nativeElement;
    if (!viewport || this.isDesktopViewport()) return;

    requestAnimationFrame(() => {
      const slides = viewport.querySelectorAll<HTMLElement>('.slide');
      const slide = slides[this.activeSlideIndex];
      if (!slide || !viewport.isConnected) return;

      const viewportRect = viewport.getBoundingClientRect();
      const slideRect = slide.getBoundingClientRect();
      const slideCenter =
        viewport.scrollLeft + slideRect.left - viewportRect.left + slideRect.width / 2;
      const targetLeft = slideCenter - viewport.clientWidth / 2;

      viewport.scrollTo({
        left: targetLeft,
        behavior: smooth ? 'smooth' : 'auto',
      });
    });
  }

  private smoothScrollToSlide(index: number): void {
    const viewport = this.sliderViewport?.nativeElement;
    if (!viewport || this.isDesktopViewport()) return;

    const slides = viewport.querySelectorAll<HTMLElement>('.slide');
    const slide = slides[index];
    if (!slide || !viewport.isConnected) return;

    const viewportRect = viewport.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    const slideCenter =
      viewport.scrollLeft + slideRect.left - viewportRect.left + slideRect.width / 2;
    const targetLeft = slideCenter - viewport.clientWidth / 2;

    if (typeof (viewport as any).scrollTo === 'function') {
      viewport.scrollTo({
        left: targetLeft,
        behavior: 'smooth',
      });
    } else {
      viewport.scrollLeft = targetLeft;
    }
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
