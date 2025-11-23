import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DateworkerService {
  constructor() {}

  formatDate(date: Date): string {
    // Format the date as yyyy-MM-ddTHH:mm
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  formatOnlyDate(sDate: string): string {
    var date = new Date(sDate);
    // Format the date as yyyy-MM-ddTHH:mm
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  convertDatetimeLocalToDate(datetimeLocalString: any) {
    const [datePart, timePart] = datetimeLocalString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes);
  }

  splitDateTime(datetimeString: string) {
    try {
      const [datePart, timePart] = datetimeString.split('T');
      const date = new Date(datetimeString);

      //add the format
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      const formattedDate = `${day}-${month}-${year}`; // Format as DD/MM/YYYY
      //  const formattedDate = date.toISOString().split('T')[0]; // yyyy-MM-dd
       const formattedTime = timePart.split('.')[0]; // HH:mm:ss (without milliseconds)

      return {
        date: formattedDate,
        time: formattedTime
      };
    }
    catch {
      return {
        date: '--',
        time: '--'
      };
    }

  }

  checkForMinDate(setDate: any, minDate: any) {
    var setDateTime = this.convertDatetimeLocalToDate(setDate);
    var minDateTime = this.convertDatetimeLocalToDate(minDate);
    if (setDateTime < minDateTime) {
      setDateTime.setDate(minDateTime.getDate() + 1);
    }

    return this.formatDate(setDateTime);
  }

  getDisplayDate(inputDate: string): string {
    const date = new Date(inputDate);

    // Extract day, month, and year
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
    const year = date.getFullYear().toString();

    // Return in DD-MM-YYYY format
    return `${day}-${month}-${year}`;
  }

  formatDateDRP(date: any) {
     if (date instanceof Date) {
      var jsDate = date;
    } else {
      var jsDate = new Date(date);
    }

    // Extract the year, month, and day
    const year = jsDate.getFullYear();
    const month = jsDate.getMonth() + 1; // getMonth() is zero-based
    const day = jsDate.getDate();

    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T00:00:00`;

    return formattedDate;
  }

  formatDateAndTime(input: string) {
    try {
      if (!input) {
        return { date: '--', time: '--' };
      }

      const [datePart, timePart] = input.split('T');

      // Format date as DD-MM-YYYY
      const [year, month, day] = datePart.split('-');
      const formattedDate = `${day}-${month}-${year}`;

      // Format time as HH:mm (ignore seconds if you want)
      let formattedTime = '--';
      if (timePart) {
        formattedTime = timePart.split(':').slice(0, 2).join(':');  // HH:mm
      }

      return {
        date: formattedDate,
        time: formattedTime
      };
    } catch {
      return { date: '--', time: '--' };
    }
  }

  getDateTime(str: string): string {
    let dateObj = this.formatDateAndTime(this.formatDate(new Date(str)));

    return dateObj.date + " " + dateObj.time;
  }
}
