from bleak import BleakClient

HEART_RATE_CHAR_UUID = "00002a37-0000-1000-8000-00805f9b34fb"

async def read_heart_rate(address):
    async with BleakClient(address) as client:
        data = await client.read_gatt_char(HEART_RATE_CHAR_UUID)

        # Standard BLE HR format
        if len(data) >= 2:
            return data[1]

        return None
