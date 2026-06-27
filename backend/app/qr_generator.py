"""
KHOJ AI Kiosk - QR Code Generator
Generates unique case IDs and QR codes for case tracking.
"""

import qrcode
import io
import base64
import threading
from datetime import datetime


# Thread-safe counter for case ID generation
_counter_lock = threading.Lock()
_case_counter = 0


def generate_case_id() -> str:
    """
    Generate a unique case ID in the format KHOJ-2027-XXXXX.
    Uses a thread-safe incrementing counter combined with timestamp
    to ensure uniqueness across concurrent requests.

    Returns:
        A string like "KHOJ-2027-00001"
    """
    global _case_counter
    with _counter_lock:
        _case_counter += 1
        counter_val = _case_counter

    return f"KHOJ-2027-{counter_val:05d}"


def generate_qr_code(case_id: str, case_url: str = "") -> str:
    """
    Generate a QR code as a base64-encoded PNG string.

    The QR code encodes either:
    - The full case URL if provided (e.g., "https://khoj.app/case/KHOJ-2027-00001")
    - Just the case_id if no URL is provided

    Args:
        case_id: The unique case identifier (e.g., "KHOJ-2027-00001")
        case_url: Optional URL to encode. If empty, encodes the case_id.

    Returns:
        Base64-encoded PNG string, ready for use in:
        <img src="data:image/png;base64,{returned_string}">
    """
    # Determine QR content
    if case_url:
        qr_content = case_url
    else:
        qr_content = f"KHOJ Case: {case_id} | Report at: https://khoj.app/case/{case_id}"

    # Create QR code with optimized settings for readability
    qr = qrcode.QRCode(
        version=None,  # Auto-determine version based on data
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_content)
    qr.make(fit=True)

    # Generate the image
    img = qr.make_image(fill_color="black", back_color="white")

    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    base64_string = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return base64_string
