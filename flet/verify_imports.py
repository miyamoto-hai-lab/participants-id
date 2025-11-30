import os
import sys

sys.path.append(os.getcwd())

try:
    import flet
    print("flet imported")
    import uuid7
    print("uuid7 imported")
    from src.participant_id.participant_id import Participant
    print("Participant imported")
except Exception as e:
    print(f"Error: {e}")
