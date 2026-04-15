# decision/otc_advice.py

def otc_advice(severity):
    """
    Input:
        severity = LOW / MODERATE / HIGH

    Output:
        list of recommendations (strings)
    """

    if severity == "LOW":
        return [
            "Maintain hydration",
            "Get adequate rest"
        ]

    elif severity == "MODERATE":
        return [
            "General OTC fever reducers (consult a pharmacist)",
            "Common cold-relief medicines",
            "Warm fluids and rest"
        ]

    else:
        return [
            "Consult a doctor immediately",
            "Avoid self-medication"
        ]
