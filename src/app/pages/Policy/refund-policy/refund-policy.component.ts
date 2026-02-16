import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-refund-policy',
  standalone: true,
  imports: [],
  templateUrl: './refund-policy.component.html',
  styleUrl: './refund-policy.component.css',
})
export class RefundPolicyComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
    // Scroll to top when component loads
    window.scrollTo(0, 0);
  }
}
