import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-antrixh-footer',
  standalone: true,
  imports: [],
  templateUrl: './antrixh-footer.component.html',
  styleUrl: './antrixh-footer.component.css',
})
export class AntrixhFooterComponent {
  @Input() hideOnMobile = true;

  constructor(private router: Router) {}

  openPrivacyPolicy(): void {
    window.open(this.router.createUrlTree(['/privacy-policy-antrixh']).toString(), '_blank');
  }

  openTermsConditions(): void {
    window.open(this.router.createUrlTree(['/terms-conditions-antrixh']).toString(), '_blank');
  }

  openRefundPolicy(): void {
    window.open(this.router.createUrlTree(['/refund-policy-antrixh']).toString(), '_blank');
  }
}
