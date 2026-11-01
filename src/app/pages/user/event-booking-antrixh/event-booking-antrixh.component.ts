import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  EventCategoryModel,
  EventDetailsModel,
  EventSeatTypeInventoryModel,
  UpcomingEventResponse,
} from '../../../core/models/auth.model';
import { ApiService } from '../../../core/services/api.service';
import { DateworkerService } from '../../../core/services/dateworker.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';
import { SafeHtmlPipe } from '../../../core/pipes/safe-html-pipe';
import { AntrixhLoaderComponent } from '../../../layout/antrixh-loader/antrixh-loader.component';
import { LocationIconComponent } from '../../../shared/location-icon/location-icon.component';
import { AntrixhFooterComponent } from '../../../shared/antrixh-footer/antrixh-footer.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const MAX_TICKETS_PER_BOOKING = 10;
const SIMILAR_EVENTS_COUNT = 4;
const DEVANAGARI_DESCRIPTION_FACTOR = 0.6;

interface PaymentSeatEntry {
  SeatTypeId: number;
  Quantity: number;
  SeatName: string;
  Price: number;
}

interface MapUrlData {
  geo_map_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  full_address?: string | null;
  location?: string | null;
}

@Component({
  selector: 'app-event-booking-antrixh',
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe, AntrixhLoaderComponent, LocationIconComponent, AntrixhFooterComponent],
  templateUrl: './event-booking-antrixh.component.html',
  styleUrl: './event-booking-antrixh.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventBookingAntrixhComponent implements OnInit {
  eventId = 0;
  eventNameSlug = '';
  eventDetails: EventDetailsModel | null = null;
  eventCategories: EventCategoryModel[] = [];
  similarEvents: UpcomingEventResponse[] = [];
  similarEventPrices = new Map<number, number | null>();

  seatTypes: EventSeatTypeInventoryModel[] = [];
  selectedSeats: Record<number, number> = {};
  totalAmount = 0;
  isSeatLoading = false;

  isLoading = true;
  isSimilarLoading = false;
  priceInRange: number | null = null;
  isPriceLoading = false;

  isTermsModalOpen = false;
  isSeatModalOpen = false;
  isDescriptionExpanded = false;
  descriptionCharLimit = 500;

  private isNavigatingAway = false;

  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly apiService = inject(ApiService);
  private readonly dateWorker = inject(DateworkerService);
  private readonly authService = inject(AuthService);
  private readonly toastr = inject(ToastrService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.eventId = +params['event_id'] || 0;
      this.eventNameSlug = params['event_name'] || '';

      if (this.eventId <= 0) {
        this.router.navigate(['/']);
        return;
      }

      this.loadEventDetails();

      const state = this.router.getCurrentNavigation()?.extras.state as
        | { seatSelections?: PaymentSeatEntry[] }
        | undefined;

      if (!state?.seatSelections && !this.isNavigatingAway) {
        this.loadEventSeats();
      }

      this.loadEventCategories();
    });
  }

  loadEventDetails(): void {
    this.isLoading = true;

    this.apiService.getEventDetailsById(this.eventId).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.eventDetails = response.data;
          this.loadPriceInRange();
          if (this.eventDetails.event_category_id) {
            this.loadSimilarEvents();
          }
        } else {
          this.router.navigate(['/']);
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadEventSeats(): void {
    if (this.isNavigatingAway) {
      return;
    }

    this.isSeatLoading = true;
    this.cdr.markForCheck();

    this.apiService.getEventSeatTypes(this.eventId).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.seatTypes = response.data;
          this.resetSeatSelections();
        } else {
          this.toastr.error('Failed to load seat types', 'Error');
        }
        this.isSeatLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toastr.error('Error loading seat information', 'Error');
        this.isSeatLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    this.isNavigatingAway = false;
  }

  loadPriceInRange(): void {
    if (!this.eventId) return;

    this.isPriceLoading = true;

    this.apiService.getEventPriceInRange(this.eventId).subscribe({
      next: (response) => {
        this.priceInRange = response.status === 'Success' && response.data !== null ? response.data : null;
        this.isPriceLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.priceInRange = null;
        this.isPriceLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadEventCategories(): void {
    this.apiService.getAllEventCategories().subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.eventCategories = response.data;
          this.cdr.markForCheck();
        }
      },
    });
  }

  getSimilarEventPrice(event: UpcomingEventResponse): string {
    if (!this.similarEventPrices.has(event.event_id)) {
      return 'Loading...';
    }
    const price = this.similarEventPrices.get(event.event_id);
    return price !== null ? `₹${price}` : 'Price not available';
  }

  loadSimilarEventPrice(eventId: number): void {
    this.apiService.getEventPriceInRange(eventId).subscribe({
      next: (response) => {
        this.similarEventPrices.set(eventId, response.status === 'Success' ? response.data : null);
        this.cdr.markForCheck();
      },
      error: () => {
        this.similarEventPrices.set(eventId, null);
        this.cdr.markForCheck();
      },
    });
  }

  loadSimilarEvents(): void {
    if (!this.eventDetails?.event_category_id) return;

    this.isSimilarLoading = true;

    const request = {
      categoryId: this.eventDetails.event_category_id,
      excludeEventId: this.eventId,
      count: SIMILAR_EVENTS_COUNT,
    };

    this.apiService.getSimilarEventsByCategory(request).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.similarEvents = response.data;
          this.similarEvents.forEach((event) => this.loadSimilarEventPrice(event.event_id));
        }
        this.isSimilarLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isSimilarLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  toggleSeatSelection(seatTypeId: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    const isChecked = target.checked;
    const seatType = this.seatTypes.find(
      (s) => s.event_seat_type_inventory_id === seatTypeId
    );

    if (!seatType) return;

    if (isChecked) {
      if (this.getSelectedSeatCount() >= MAX_TICKETS_PER_BOOKING) {
        this.toastr.warning(
          `You can select maximum ${MAX_TICKETS_PER_BOOKING} tickets only`,
          'Limit Reached'
        );
        target.checked = false;
        return;
      }
      if (seatType.available_seats === 0) {
        this.toastr.warning('No seats available for this type', 'Sold Out');
        target.checked = false;
        return;
      }
      this.selectedSeats[seatTypeId] = 1;
    } else {
      this.selectedSeats[seatTypeId] = 0;
    }

    this.calculateTotalAmount();
  }

  isSeatSelected(seatTypeId: number): boolean {
    return this.selectedSeats[seatTypeId] > 0;
  }

  increaseSeats(seatTypeId: number): void {
    const seatType = this.seatTypes.find(
      (s) => s.event_seat_type_inventory_id === seatTypeId
    );
    if (!seatType) return;

    if (this.getSelectedSeatCount() >= MAX_TICKETS_PER_BOOKING) {
      this.toastr.warning(
        `You can select maximum ${MAX_TICKETS_PER_BOOKING} tickets only`,
        'Limit Reached'
      );
      return;
    }

    if (this.selectedSeats[seatTypeId] < seatType.available_seats) {
      this.selectedSeats[seatTypeId]++;
      this.calculateTotalAmount();
    } else {
      this.toastr.warning(`Only ${seatType.available_seats} seats available`, 'Limit Reached');
    }
  }

  decreaseSeats(seatTypeId: number): void {
    if (this.selectedSeats[seatTypeId] > 0) {
      this.selectedSeats[seatTypeId]--;
      this.calculateTotalAmount();
    }
  }

  calculateTotalAmount(): void {
    this.totalAmount = 0;

    for (const [seatTypeId, quantity] of Object.entries(this.selectedSeats)) {
      if (quantity > 0) {
        const seatType = this.seatTypes.find(
          (s) => s.event_seat_type_inventory_id === parseInt(seatTypeId, 10)
        );
        if (seatType) {
          this.totalAmount += seatType.price * quantity;
        }
      }
    }
  }

  getSelectedSeatCount(): number {
    return Object.values(this.selectedSeats).reduce((sum, quantity) => sum + quantity, 0);
  }

  getSelectedSeatsList(): { seatType: EventSeatTypeInventoryModel; quantity: number }[] {
    const selectedList: { seatType: EventSeatTypeInventoryModel; quantity: number }[] = [];

    for (const [seatTypeId, quantity] of Object.entries(this.selectedSeats)) {
      if (quantity > 0) {
        const seatType = this.seatTypes.find(
          (s) => s.event_seat_type_inventory_id === parseInt(seatTypeId, 10)
        );
        if (seatType) {
          selectedList.push({ seatType, quantity });
        }
      }
    }

    return selectedList;
  }

  hasSelectedSeats(): boolean {
    return this.getSelectedSeatCount() > 0;
  }

  toggleSeatSelectionFromDiv(seatTypeId: number, event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      target.closest('.qty-btn') ||
      target.closest('.checkbox-container') ||
      target.closest('input[type="checkbox"]')
    ) {
      return;
    }

    const seatType = this.seatTypes.find(
      (s) => s.event_seat_type_inventory_id === seatTypeId
    );
    if (!seatType) return;

    if (seatType.available_seats === 0) {
      this.toastr.warning('No seats available for this type', 'Sold Out');
      return;
    }

    if (!this.isSeatSelected(seatTypeId)) {
      if (this.getSelectedSeatCount() >= MAX_TICKETS_PER_BOOKING) {
        this.toastr.warning(
          `You can select maximum ${MAX_TICKETS_PER_BOOKING} tickets only`,
          'Limit Reached'
        );
        return;
      }
      this.selectedSeats[seatTypeId] = 1;
    } else {
      this.selectedSeats[seatTypeId] = 0;
    }

    this.calculateTotalAmount();
  }

  onBookNow(): void {
    if (!this.hasValidPrice()) {
      this.toastr.warning('This event is sold out', 'Not Available');
      return;
    }

    this.isNavigatingAway = false;

    if (this.seatTypes.length === 0) {
      this.loadEventSeats();
      setTimeout(() => this.openSeatModal(), 500);
    } else {
      this.resetSeatSelections();
      this.openSeatModal();
    }
  }

  resetSeatSelections(): void {
    this.selectedSeats = {};
    this.totalAmount = 0;

    this.seatTypes.forEach((seat) => {
      this.selectedSeats[seat.event_seat_type_inventory_id] = 0;
    });
  }

  openSeatModal(): void {
    this.isSeatModalOpen = true;
    document.body.style.overflow = 'hidden';

    if (Object.keys(this.selectedSeats).length === 0 && this.seatTypes.length > 0) {
      this.resetSeatSelections();
    }
    this.cdr.markForCheck();
  }

  closeSeatModal(): void {
    this.isSeatModalOpen = false;
    document.body.style.overflow = 'auto';
    this.cdr.markForCheck();
  }

  closeSeatModalOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('seat-modal')) {
      this.closeSeatModal();
    }
  }

  proceedToCheckout(): void {
    const selectedSeatCount = this.getSelectedSeatCount();

    if (selectedSeatCount === 0) {
      this.toastr.warning('Please select at least one seat', 'Selection Required');
      return;
    }
    if (selectedSeatCount > MAX_TICKETS_PER_BOOKING) {
      this.toastr.warning(
        `You can select maximum ${MAX_TICKETS_PER_BOOKING} tickets only`,
        'Limit Exceeded'
      );
      return;
    }

    const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
    if (fbq) {
      fbq('track', 'AddToCart', {
        value: this.totalAmount,
        currency: 'INR',
        content_name: this.eventDetails?.event_name,
        content_ids: [this.eventId],
        content_type: 'product',
        num_items: selectedSeatCount,
      });
    }

    this.isNavigatingAway = true;

    const seatSelections = this.getSelectedSeatsList().map((item) => ({
      SeatTypeId: item.seatType.event_seat_type_inventory_id,
      Quantity: item.quantity,
      SeatName: item.seatType.seat_name,
      Price: item.seatType.price,
    }));

    const bookingData = {
      seatSelections,
      totalAmount: this.totalAmount,
      eventId: this.eventId,
      eventName: this.eventNameSlug,
      timestamp: Date.now(),
    };

    sessionStorage.setItem('temp_booking_data', JSON.stringify(bookingData));

    this.closeSeatModal();

    setTimeout(() => {
      this.router.navigate(['/event-payment-antrixh', this.eventId, this.eventNameSlug], {
        state: {
          seatSelections,
          totalAmount: this.totalAmount,
          userId: this.authService.getCurrentUserId(),
          eventTitle:
            this.eventDetails?.event_name || this.formatEventTitle(this.eventNameSlug),
        },
      });
    }, 100);
  }

  getEventCategoryName(): string {
    if (!this.eventDetails) return '';

    if (this.eventDetails.event_category_name) {
      return this.eventDetails.event_category_name;
    }

    if (this.eventDetails.event_category_id && this.eventCategories.length > 0) {
      const category = this.eventCategories.find(
        (cat) => cat.event_category_id === this.eventDetails!.event_category_id
      );
      return category ? category.event_category_name : '';
    }

    return '';
  }

  formatDisplayDate(dateString: string | Date | undefined | null): string {
    if (!dateString) return 'Date not specified';
    try {
      return this.dateWorker.formatDateAndTime(dateString.toString()).date;
    } catch {
      return 'Invalid date';
    }
  }

  getDisplayPrice(): string {
    if (!this.hasValidPrice()) {
      return 'Sold Out';
    }

    if (this.priceInRange !== null && this.priceInRange > 0) {
      return `₹${this.priceInRange}`;
    }

    if (this.eventDetails?.min_price) {
      return `₹${this.eventDetails.min_price}`;
    }

    return 'Sold Out';
  }

  getPriceRangeDisplay(): string {
    if (!this.hasValidPrice()) return '';
    if (this.priceInRange !== null) return '';
    if (!this.eventDetails?.max_price || !this.eventDetails?.min_price) return '';

    if (this.eventDetails.max_price > this.eventDetails.min_price) {
      return ` - ₹${this.eventDetails.max_price}`;
    }

    return '';
  }

  get bookingBgImage(): string {
    const url = this.eventDetails?.eventDetailBanner || this.eventDetails?.banner_image;
    if (!url) return 'none';
    return `url('${url}')`;
  }

  formatTimeForDisplay(timeString: string | undefined | null): string {
    if (!timeString) return 'Time not specified';

    if (timeString.includes('AM') || timeString.includes('PM') || timeString.includes(':')) {
      return timeString;
    }

    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    } catch {
      return timeString;
    }
  }

  formatDuration(minutes: number | null | undefined): string {
    if (!minutes || minutes <= 0) return 'Duration not specified';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  }

  onSimilarEventClick(event: UpcomingEventResponse): void {
    const eventNameSlug = this.createSlug(event.event_name);
    this.router.navigate(['/event-booking-antrixh', event.event_id, eventNameSlug]);
    window.scrollTo(0, 0);
  }

  private createSlug(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }

  private formatEventTitle(slug: string): string {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  navigateToSignUp(): void {
    window.open('mailto:support@tickethouse.in', '_blank');
  }

  openTermsModal(): void {
    this.isTermsModalOpen = true;
    document.body.style.overflow = 'hidden';
    this.cdr.markForCheck();
  }

  closeTermsModal(): void {
    this.isTermsModalOpen = false;
    document.body.style.overflow = 'auto';
    this.cdr.markForCheck();
  }

  closeTermsModalOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('terms-modal')) {
      this.closeTermsModal();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.isSeatModalOpen) {
      this.closeSeatModal();
    }
    if (this.isTermsModalOpen) {
      this.closeTermsModal();
    }
  }

  hasValidPrice(): boolean {
    if (this.priceInRange !== null && this.priceInRange > 0) {
      return true;
    }

    if (this.eventDetails?.min_price && this.eventDetails.min_price > 0) {
      return true;
    }

    if (this.seatTypes.length > 0) {
      return this.seatTypes.some((seat) => seat.available_seats > 0 && seat.price > 0);
    }

    return false;
  }

  hasLocationUrl(): boolean {
    if (!this.eventDetails) return false;
    return !!(
      this.eventDetails.geo_map_url ||
      (this.eventDetails.latitude && this.eventDetails.longitude) ||
      this.eventDetails.full_address ||
      this.eventDetails.location
    );
  }

  onVenueLocationClick(event: MouseEvent): void {
    event.stopPropagation();

    if (!this.eventDetails) return;

    const mapUrl = this.getMapUrlFromEventData({
      geo_map_url: this.eventDetails.geo_map_url,
      latitude: this.eventDetails.latitude,
      longitude: this.eventDetails.longitude,
      full_address: this.eventDetails.full_address,
      location: this.eventDetails.location,
    });

    if (mapUrl) {
      window.open(mapUrl, '_blank');
    }
  }

  hasSimilarEventLocationUrl(event: UpcomingEventResponse): boolean {
    return !!(
      event.geo_map_url ||
      (event.latitude && event.longitude) ||
      event.full_address ||
      event.location
    );
  }

  onSimilarEventLocationClick(event: MouseEvent, eventData: UpcomingEventResponse): void {
    event.stopPropagation();

    const mapUrl = this.getMapUrlFromEventData({
      geo_map_url: eventData.geo_map_url,
      latitude: eventData.latitude,
      longitude: eventData.longitude,
      full_address: eventData.full_address,
      location: eventData.location,
    });

    if (mapUrl) {
      window.open(mapUrl, '_blank');
    }
  }

  private getMapUrlFromEventData(data: MapUrlData): string | null {
    if (data.geo_map_url) {
      return data.geo_map_url;
    }

    if (data.latitude && data.longitude) {
      return `https://www.google.com/maps?q=${data.latitude},${data.longitude}`;
    }

    if (data.full_address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.full_address)}`;
    }

    if (data.location) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.location)}`;
    }

    return null;
  }

  get shouldTruncateDescription(): boolean {
    if (!this.eventDetails?.event_description) return false;

    const plainText = this.stripHtmlTags(this.eventDetails.event_description);

    if (plainText.length > this.descriptionCharLimit) {
      return true;
    }

    const hasWideScript = /[\u0900-\u097F\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F]/.test(
      plainText
    );
    if (hasWideScript && plainText.length > this.descriptionCharLimit * DEVANAGARI_DESCRIPTION_FACTOR) {
      return true;
    }

    return false;
  }

  get displayDescription(): string {
    if (this.isDescriptionExpanded || !this.shouldTruncateDescription) {
      return this.fullDescription;
    }
    return this.truncatedDescription;
  }

  toggleDescription(): void {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
    this.cdr.markForCheck();
  }

  private stripHtmlTags(html: string): string {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  private cleanHtmlContent(html: string): string {
    if (!html) return '';

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    tempDiv.querySelectorAll('p').forEach((p) => {
      const inner = p.innerHTML.trim();
      if (inner === '' || inner === '<br>' || inner === '&nbsp;') {
        p.remove();
      }
    });

    let htmlString = tempDiv.innerHTML;
    htmlString = htmlString.replace(/(<br\s*\/?>)\s*(<br\s*\/?>)+/gi, '<br>');
    htmlString = htmlString.replace(/(<p>\s*<\/p>)/gi, '');
    htmlString = htmlString.replace(/(<p>\s*<br\s*\/?>\s*<\/p>)/gi, '');

    return htmlString;
  }

  get truncatedDescription(): string {
    if (!this.eventDetails?.event_description) return '';

    const htmlContent = this.eventDetails.event_description;
    const cleanedHtml = this.cleanHtmlContent(htmlContent);
    const plainText = this.stripHtmlTags(cleanedHtml);

    const isDevanagari = /[\u0900-\u097F]/.test(plainText);
    let effectiveLimit = this.descriptionCharLimit;
    if (isDevanagari) {
      effectiveLimit = Math.floor(this.descriptionCharLimit * DEVANAGARI_DESCRIPTION_FACTOR);
    }

    if (plainText.length <= effectiveLimit) {
      return cleanedHtml;
    }

    const temp = document.createElement('div');
    temp.innerHTML = cleanedHtml;

    let remaining = effectiveLimit;
    const cut: { node: Node | null } = { node: null };

    const walk = (node: Node): boolean => {
      if (remaining <= 0) return true;

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (text.length <= remaining) {
          remaining -= text.length;
          return false;
        }
        let truncated = text.substring(0, remaining);
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > remaining * 0.7) {
          truncated = truncated.substring(0, lastSpace);
        }
        truncated = truncated.replace(/[,.;:!?]+$/, '');
        node.textContent = truncated;
        remaining = 0;
        cut.node = node;
        return true;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        for (const child of Array.from(node.childNodes)) {
          if (walk(child)) {
            let sib = child.nextSibling;
            while (sib) {
              const next = sib.nextSibling;
              node.removeChild(sib);
              sib = next;
            }
            return true;
          }
        }
      }
      return false;
    };

    walk(temp);

    const ellipsis = document.createElement('span');
    ellipsis.className = 'ellipsis-text';
    ellipsis.textContent = '...';
    if (cut.node?.parentNode) {
      cut.node.parentNode.insertBefore(ellipsis, cut.node.nextSibling);
    } else {
      temp.appendChild(ellipsis);
    }

    return temp.innerHTML;
  }

  get fullDescription(): string {
    return this.cleanHtmlContent(this.eventDetails?.event_description || '');
  }

  trackByEventId(_index: number, event: UpcomingEventResponse): number {
    return event.event_id;
  }

  trackBySeatTypeId(_index: number, seatType: EventSeatTypeInventoryModel): number {
    return seatType.event_seat_type_inventory_id;
  }
}
