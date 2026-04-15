from bleak import BleakClient

DEVICE_NAME_UUID = "00002a00-0000-1000-8000-00805f9b34fb"

async def get_device_name(address):
    try:
        async with BleakClient(address) as client:
            name_bytes = await client.read_gatt_char(DEVICE_NAME_UUID)
            return name_bytes.decode("utf-8").strip()
    except Exception:
        return None
