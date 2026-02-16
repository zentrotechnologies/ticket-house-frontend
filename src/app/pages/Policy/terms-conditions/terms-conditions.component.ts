import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-terms-conditions',
  standalone: true,
  imports: [],
  templateUrl: './terms-conditions.component.html',
  styleUrl: './terms-conditions.component.css',
})
export class TermsConditionsComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
    // Scroll to top when component loads
    window.scrollTo(0, 0);
  }
}
