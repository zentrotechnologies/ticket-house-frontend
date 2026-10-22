import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AntrixhNavbarComponent } from '../antrixh-navbar/antrixh-navbar.component';

@Component({
  selector: 'app-antrixh-layout',
  standalone: true,
  imports: [RouterOutlet, AntrixhNavbarComponent],
  templateUrl: './antrixh-layout.component.html',
  styleUrl: './antrixh-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AntrixhLayoutComponent {}
