import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { AntrixhFooterComponent } from '../../../shared/antrixh-footer/antrixh-footer.component';

@Component({
  selector: 'app-antrixh-refund-policy',
  standalone: true,
  imports: [AntrixhFooterComponent],
  templateUrl: './antrixh-refund-policy.component.html',
  styleUrls: ['./antrixh-refund-policy.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AntrixhRefundPolicyComponent implements OnInit {
  ngOnInit(): void {
    window.scrollTo(0, 0);
  }
}
