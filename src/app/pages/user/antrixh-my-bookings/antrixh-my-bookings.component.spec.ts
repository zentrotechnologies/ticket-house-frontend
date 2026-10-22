import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AntrixhMyBookingsComponent } from './antrixh-my-bookings.component';

describe('AntrixhMyBookingsComponent', () => {
  let component: AntrixhMyBookingsComponent;
  let fixture: ComponentFixture<AntrixhMyBookingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AntrixhMyBookingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AntrixhMyBookingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
