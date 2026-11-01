import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-organizer-workflow-section',
  standalone: true,
  templateUrl: './organizer-workflow-section.component.html',
  styleUrl: './organizer-workflow-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizerWorkflowSectionComponent {}
