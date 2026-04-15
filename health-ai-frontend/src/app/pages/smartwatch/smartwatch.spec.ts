import { Component } from '@angular/core';
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

  // Manual fallback data
  manualData = {
    heart_rate: '',
    spo2: '',
    stress_level: '',
    sleep_hours: ''
  };

  constructor(
    private pipeline: Pipeline,
    private router: Router
  ) {}

  // 🔵 Try Bluetooth
  async connectDevice() {
    this.loading = true;

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['heart_rate']
      });

      const server = await device.gatt.connect();

      this.deviceName = device.name;

      // Try reading heart rate
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

      this.finish(data);

    } catch (error) {
      console.error('Bluetooth failed:', error);

      // 🔴 fallback
      this.connectionFailed = true;
    }

    this.loading = false;
  }

  // 🟡 Manual fallback submit
  submitManual() {
    const data = {
      heart_rate: Number(this.manualData.heart_rate),
      spo2: Number(this.manualData.spo2),
      stress_level: this.manualData.stress_level,
      sleep_hours: Number(this.manualData.sleep_hours)
    };

    this.finish(data);
  }

  // ✅ Common finish
  finish(data: any) {
    this.pipeline.smartwatchData = data;

    console.log('Smartwatch Data:', data);

    this.router.navigate(['/questionnaire']);
  }
}