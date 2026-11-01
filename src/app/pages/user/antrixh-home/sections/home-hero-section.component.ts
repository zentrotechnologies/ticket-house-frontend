import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home-hero-section',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home-hero-section.component.html',
  styleUrl: './home-hero-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeHeroSectionComponent implements OnInit, OnDestroy {
  readonly posterPhotos = [
    { src: '/assets/rooftop_image.webp', label: 'Rooftop' },
    { src: '/assets/standup_image.webp', label: 'Stand-up' },
    { src: '/assets/birthday_image.webp', label: 'Birthday' },
    { src: '/assets/tech_image.webp', label: 'Tech' },
    { src: '/assets/garba_image.webp', label: 'Garba' },
    { src: '/assets/paty_image.webp', label: 'Party' },
    { src: '/assets/freshers_image.webp', label: 'Freshers' },
  ];

  readonly topNoteAngles = [-6, 3, -2, 6, -4, 2, -5];
  readonly bottomNoteAngles = [4, -5, 6, -3, 2, -6, 5];

  activePhotoIndex = 0;
  get activePhotoLabel(): string {
    return this.posterPhotos[this.activePhotoIndex].label;
  }

  private photoInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly changeDetector: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.photoInterval = setInterval(() => {
      this.activePhotoIndex = (this.activePhotoIndex + 1) % this.posterPhotos.length;
      this.changeDetector.markForCheck();
    }, 1100);
  }

  ngOnDestroy(): void {
    if (this.photoInterval) {
      clearInterval(this.photoInterval);
    }
  }
}
