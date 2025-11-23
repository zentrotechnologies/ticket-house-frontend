import { Injectable } from '@angular/core';
import { Router } from 'express';
import { ToastrService } from 'ngx-toastr';
import { AesService } from './aes.service';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(
    public api: ApiService,
    public toastr: ToastrService,
    public router: Router,
    public aes: AesService
    // public utility: UtilityService
  ) { }
}
