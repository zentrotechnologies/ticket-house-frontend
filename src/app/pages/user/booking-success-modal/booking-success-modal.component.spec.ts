import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingSuccessModalComponent } from './booking-success-modal.component';

describe('BookingSuccessModalComponent', () => {
  let component: BookingSuccessModalComponent;
  let fixture: ComponentFixture<BookingSuccessModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingSuccessModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingSuccessModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
