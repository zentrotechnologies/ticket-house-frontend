import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-event-category',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-category.component.html',
  styleUrl: './event-category.component.css',
})
export class EventCategoryComponent {

}
