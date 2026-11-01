import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HomeHeroSectionComponent } from './sections/home-hero-section.component';
import { OrganizerToolsSectionComponent } from './sections/organizer-tools-section.component';
import { OrganizerWorkflowSectionComponent } from './sections/organizer-workflow-section.component';
import { OrganizerCtaSectionComponent } from './sections/organizer-cta-section.component';
import { AntrixhFooterComponent } from '../../../shared/antrixh-footer/antrixh-footer.component';

@Component({
  selector: 'app-antrixh-home',
  standalone: true,
  imports: [
    HomeHeroSectionComponent,
    OrganizerToolsSectionComponent,
    OrganizerWorkflowSectionComponent,
    OrganizerCtaSectionComponent,
    AntrixhFooterComponent,
  ],
  templateUrl: './antrixh-home.component.html',
  styleUrl: './antrixh-home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AntrixhHomeComponent {}
