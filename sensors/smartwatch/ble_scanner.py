import asyncio
from bleak import BleakScanner

async def scan_ble_devices(timeout=5):
    devices = await BleakScanner.discover(timeout=timeout)
    return [
        {"name": d.name or "Unknown", "address": d.address}
        for d in devices
    ]

if __name__ == "__main__":
    print(asyncio.run(scan_ble_devices()))
