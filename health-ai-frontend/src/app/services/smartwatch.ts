import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Smartwatch {

  device: BluetoothDevice | null = null;
  server: BluetoothRemoteGATTServer | null = null;

  // 🔍 Step 1: Scan devices
  async scanAndConnect() {
    try {
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['heart_rate']
      });

      this.server = await this.device.gatt?.connect() || null;

      console.log('Connected to:', this.device.name);

      return this.device.name;

    } catch (error) {
      console.error('Bluetooth error:', error);
      return null;
    }
  }

  // ❤️ Step 2: Read heart rate
  async getHeartRate() {
    if (!this.server) return null;

    try {
      const service = await this.server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');

      const value = await characteristic.readValue();

      const heartRate = value.getUint8(1);

      return heartRate;

    } catch (error) {
      console.error('Heart rate error:', error);
      return null;
    }
  }
}