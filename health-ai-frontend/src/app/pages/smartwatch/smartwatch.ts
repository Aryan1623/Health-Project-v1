import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Pipeline } from '../../services/pipeline';

@Component({
  selector: 'app-smartwatch',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './smartwatch.html'
})
export class SmartwatchComponent {

  loading = false;
  deviceName: string | null = null;
  connectionFailed = false;

  manualData = {
    heart_rate: '',
    spo2: '',
    stress_level: '',
    sleep_hours: ''
  };

  constructor(
    private pipeline: Pipeline,
    private router: Router,
    private cdr: ChangeDetectorRef   // 🔥 needed for UI update
  ) {}

  // 🔵 Try Bluetooth connection
  async connectDevice() {

    console.log("Button clicked");

    // ❌ Bluetooth not supported
    if (!(navigator as any).bluetooth) {
      console.log("Bluetooth not supported → fallback");
      this.connectionFailed = true;
      return;
    }

    this.loading = true;
    this.connectionFailed = false;

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['heart_rate']
      });

      console.log("Device selected:", device);

      const server = await device.gatt.connect();
      this.deviceName = device.name || 'Unknown Device';

      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');
      const value = await characteristic.readValue();

      const heartRate = value.getUint8(1);

      const data = {
        heart_rate: heartRate,
        spo2: 98,
        stress_level: 'low',
        sleep_hours: 6
      };

      this.loading = false;
      this.finish(data);

    } catch (error) {

      console.error("Bluetooth failed → fallback:", error);

      // 🔥 CRITICAL FIXES
      this.loading = false;
      this.connectionFailed = true;

      // 🔥 force Angular UI update
      this.cdr.detectChanges();

      return;
    }
  }

  // 🟡 Manual fallback
  submitManual() {
    const data = {
      heart_rate: Number(this.manualData.heart_rate),
      spo2: Number(this.manualData.spo2),
      stress_level: this.manualData.stress_level,
      sleep_hours: Number(this.manualData.sleep_hours)
    };

    this.finish(data);
  }

  // ✅ Store + navigate
  finish(data: any) {
    this.pipeline.smartwatchData = data;

    console.log("Smartwatch Data:", data);

    this.router.navigate(['/questionnaire']);
  }
}