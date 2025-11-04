import os
import hmac
import json
import time
import base64
import hashlib
from typing import Any, Dict

SECRET_KEY = os.getenv("JWT_SECRET", "change-me-secret")
TOKEN_TTL_SECONDS = int(os.getenv("TOKEN_TTL_SECONDS", "86400"))  # default: 24h


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64url_decode(data: str) -> bytes:
    pad = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + pad)


def create_token(payload: Dict[str, Any], ttl_seconds: int | None = None) -> str:
    ttl = ttl_seconds or TOKEN_TTL_SECONDS
    body = {**payload, "iat": int(time.time()), "exp": int(time.time()) + ttl}
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _b64url(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    body_b64 = _b64url(json.dumps(body, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_b64}.{body_b64}".encode("utf-8")
    signature = hmac.new(SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_b64 = _b64url(signature)
    return f"{header_b64}.{body_b64}.{signature_b64}"


def decode_token(token: str) -> Dict[str, Any] | None:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, body_b64, signature_b64 = parts
        signing_input = f"{header_b64}.{body_b64}".encode("utf-8")
        expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
        if not hmac.compare_digest(expected_sig, _b64url_decode(signature_b64)):
            return None
        body = json.loads(_b64url_decode(body_b64).decode("utf-8"))
        if int(body.get("exp", 0)) < int(time.time()):
            return None
        return body
    except Exception:
        return None