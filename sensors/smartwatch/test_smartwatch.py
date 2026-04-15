import asyncio
from smartwatch_manager import get_smartwatch_data

if __name__ == "__main__":
    print("\n=== SMARTWATCH MODULE TEST ===\n")

    data = asyncio.run(get_smartwatch_data())

    print("\n=== FINAL OUTPUT ===")
    print(data)
