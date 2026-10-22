import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-antrixh-privacy-policy',
  standalone: true,
  imports: [],
  templateUrl: './antrixh-privacy-policy.component.html',
  styleUrls: ['./antrixh-privacy-policy.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AntrixhPrivacyPolicyComponent implements OnInit {
  ngOnInit(): void {
    window.scrollTo(0, 0);
  }
}
