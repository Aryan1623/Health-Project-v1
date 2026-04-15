def get_manual_watch_data():
    print("\n⚠️ Smartwatch data not accessible.")
    print("Please enter the following details manually:\n")

    hr = int(input("Heart Rate (bpm): "))
    spo2 = int(input("SpO₂ (%): "))
    sleep = float(input("Sleep duration (hours): "))

    return {
        "heart_rate": hr,
        "spo2": spo2,
        "sleep_hours": sleep,
        "source": "manual"
    }
