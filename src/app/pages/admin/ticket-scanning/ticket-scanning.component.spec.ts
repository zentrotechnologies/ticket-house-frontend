import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketScanningComponent } from './ticket-scanning.component';

describe('TicketScanningComponent', () => {
  let component: TicketScanningComponent;
  let fixture: ComponentFixture<TicketScanningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketScanningComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TicketScanningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
