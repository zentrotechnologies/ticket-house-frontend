import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventBookingAntrixhComponent } from './event-booking-antrixh.component';

describe('EventBookingAntrixhComponent', () => {
  let component: EventBookingAntrixhComponent;
  let fixture: ComponentFixture<EventBookingAntrixhComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventBookingAntrixhComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventBookingAntrixhComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
