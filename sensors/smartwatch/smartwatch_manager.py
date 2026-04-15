import asyncio
from ble_scanner import scan_ble_devices
from ble_capability_check import supports_heart_rate
from ble_reader import read_heart_rate
from manual_input import get_manual_watch_data


async def get_smartwatch_data():
    devices = await scan_ble_devices()

    if not devices:
        print("No BLE devices found.")
        return get_manual_watch_data()

    print("\nNearby BLE Devices:\n")
    for i, d in enumerate(devices):
        print(f"{i}. {d['name']} ({d['address']})")

    try:
        idx = int(input("\nSelect device index: "))
        selected = devices[idx]
    except (ValueError, IndexError):
        print("Invalid selection.")
        return get_manual_watch_data()

    print(f"\nChecking capabilities for {selected['name']}...\n")

    if await supports_heart_rate(selected["address"]):
        try:
            hr = await read_heart_rate(selected["address"])
            if hr:
                return {
                    "heart_rate": hr,
                    "source": "ble"
                }
        except Exception:
            pass

    return get_manual_watch_data()
