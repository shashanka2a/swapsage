import os
import requests

ONEINCH_BASE = "https://api.1inch.dev"

def _headers():
    return {"Authorization": f"Bearer {os.getenv('ONEINCH_API_KEY','')}"}

def get_tokens(chain_id: int):
    """Fetch token list for a chain."""
    url = f"{ONEINCH_BASE}/swap/v6.0/{chain_id}/tokens"
    r = requests.get(url, headers=_headers(), timeout=30)
    r.raise_for_status()
    return r.json().get("tokens", {})

def get_quote(chain_id: int, src: str, dst: str, amount_wei: str):
    """Fetch a swap quote."""
    url = f"{ONEINCH_BASE}/swap/v6.0/{chain_id}/quote"
    params = {"src": src, "dst": dst, "amount": amount_wei}
    r = requests.get(url, headers=_headers(), params=params, timeout=30)
    r.raise_for_status()
    return r.json()
