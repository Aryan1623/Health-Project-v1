from bleak import BleakClient

HEART_RATE_SERVICE_UUID = "0000180d-0000-1000-8000-00805f9b34fb"

async def supports_heart_rate(address):
    try:
        async with BleakClient(address) as client:
            services = await client.get_services()
            for service in services:
                if service.uuid.lower() == HEART_RATE_SERVICE_UUID:
                    return True
    except Exception:
        return False

    return False
