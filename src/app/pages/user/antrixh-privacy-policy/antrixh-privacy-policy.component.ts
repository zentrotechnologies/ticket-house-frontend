import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { AntrixhFooterComponent } from '../../../shared/antrixh-footer/antrixh-footer.component';

@Component({
  selector: 'app-antrixh-privacy-policy',
  standalone: true,
  imports: [AntrixhFooterComponent],
  templateUrl: './antrixh-privacy-policy.component.html',
  styleUrls: ['./antrixh-privacy-policy.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AntrixhPrivacyPolicyComponent implements OnInit {
  ngOnInit(): void {
    window.scrollTo(0, 0);
  }
}
