import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AesService {
  keySize = 256;
  ivSize = 128;
  iterations = 1000;
  saltSize = 256;

  constructor() { }

  async encrypt(plainText: string): Promise<string> {
    debugger;
    var base64Key = environment.encb64;
    const plainBytes = new TextEncoder().encode(plainText);
    const key = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Generate a random IV

    const importedKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const parameters = { name: 'AES-GCM', iv };

    const encryptedData = await crypto.subtle.encrypt(
      parameters,
      importedKey,
      plainBytes
    );

    const encryptedBytes = new Uint8Array(encryptedData);

    const final = new Uint8Array(iv.length + encryptedBytes.length);
    final.set(iv, 0);
    final.set(encryptedBytes, iv.length);

    var encryptedText = '';
    try {
      encryptedText = btoa(String.fromCharCode(...final));
    }
    catch (ex) {
      console.log(ex);
      debugger;
      encryptedText = btoa(this.Uint8ToString(final));
    }

    return encryptedText;
  }

  async decrypt(encryptedText: string): Promise<string> {
    debugger;
    var base64Key = environment.encb64;
    const key = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    const encryptedBytes = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));

    const iv = encryptedBytes.slice(0, 12);
    const ciphertext = encryptedBytes.slice(12);

    const importedKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const parameters = { name: 'AES-GCM', iv };

    const decryptedData = await crypto.subtle.decrypt(
      parameters,
      importedKey,
      ciphertext
    );

    const decryptedText = new TextDecoder().decode(decryptedData);
    return decryptedText;
  }

  Uint8ToString(u8a: any) {
    var CHUNK_SZ = 0x8000;
    var c = [];
    for (var i = 0; i < u8a.length; i += CHUNK_SZ) {
      c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)));
    }
    return c.join('');
  }
}
