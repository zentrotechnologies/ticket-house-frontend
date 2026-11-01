import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-organizer-cta-section',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './organizer-cta-section.component.html',
  styleUrl: './organizer-cta-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizerCtaSectionComponent {}
