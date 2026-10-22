import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-antrixh-terms-conditions',
  standalone: true,
  imports: [],
  templateUrl: './antrixh-terms-conditions.component.html',
  styleUrls: ['./antrixh-terms-conditions.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AntrixhTermsConditionsComponent implements OnInit {
  ngOnInit(): void {
    window.scrollTo(0, 0);
  }
}
