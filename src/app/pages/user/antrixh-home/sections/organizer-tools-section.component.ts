import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-organizer-tools-section',
  standalone: true,
  templateUrl: './organizer-tools-section.component.html',
  styleUrl: './organizer-tools-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizerToolsSectionComponent {}
