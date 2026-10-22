import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-location-icon',
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 16 16"
      [attr.fill]="fill"
    >
      <defs>
        <linearGradient [attr.id]="gradId" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e236a3" />
          <stop offset="100%" stop-color="#9234ea" />
        </linearGradient>
      </defs>
      <path
        [attr.fill]="fill"
        d="M2 2a1 1 0 0 1 1 1v2a5 5 0 0 0 5 5h3.586l-1.293-1.293a1 1 0 1 1 1.414-1.414l3 3a1 1 0 0 1 0 1.414l-3 3a1 1 0 1 1-1.414-1.414L11.586 12H8a7 7 0 0 1-7-7V3a1 1 0 0 1 1-1"
      />
    </svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
      flex-shrink: 0;
      margin-top: -3px;
    }
  `]
})
export class LocationIconComponent {
  @Input() size: number | string = '1em';
  @Input() gradient = false;

  private static idCounter = 0;
  readonly gradId = `location-icon-grad-${++LocationIconComponent.idCounter}`;

  get fill(): string {
    return this.gradient ? `url(#${this.gradId})` : '#ffffff';
  }
}
