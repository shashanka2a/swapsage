import os
from decimal import Decimal
from django.shortcuts import render
from django.http import JsonResponse
from .utils import get_quote, get_tokens
from .models import SwapRequest

CHAIN_ID = 1  # Ethereum mainnet


def home(request):
    """Landing page; optionally shows popular tokens if 1inch key is set."""
    tokens = {}
    try:
        if os.getenv("ONEINCH_API_KEY"):
            tokens = get_tokens(CHAIN_ID)
    except Exception:
        tokens = {}
    return render(request, "home.html", {"tokens": tokens, "chain_id": CHAIN_ID})


def swap_view(request):
    """Swap UI page."""
    return render(request, "swap.html", {"chain_id": CHAIN_ID})


def api_quote(request):
    """
    Fetch a quote from 1inch.
    Query params:
      - src (address)
      - dst (address)
      - amount (human units)
      - decimals (src token decimals)
    """
    try:
        src = request.GET.get("src")
        dst = request.GET.get("dst")
        amount = request.GET.get("amount")  # human units
        decimals = int(request.GET.get("decimals", "18"))

        if not (src and dst and amount):
            return JsonResponse({"ok": False, "error": "Missing src/dst/amount"}, status=400)

        # Convert to wei-like integer string (simple decimal conversion)
        amount_wei = str(int(float(amount) * (10 ** decimals)))

        data = get_quote(CHAIN_ID, src, dst, amount_wei)

        # Very basic risk hint (adjust when using real fields from 1inch)
        price_impact_bps = (data.get("priceImpact", 0) or 0) * 100
        slippage_hint = "low" if price_impact_bps < 50 else "medium" if price_impact_bps < 200 else "high"

        return JsonResponse({
            "ok": True,
            "data": data,
            "risk": {
                "price_impact_bps": price_impact_bps,
                "slippage": slippage_hint,
            }
        })
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=500)


def api_explain(request):
    """
    Generate a plain-English explanation (stub) AND log the request minimally.

    Optional query params for logging:
      - src_symbol
      - dst_symbol
      - amount
      - risk  (e.g., 'low' | 'medium' | 'high')
    """
    route = request.GET.get("route_summary", "best route")
    risk = request.GET.get("risk", "unknown")

    # Build simple explanation text (replace with OpenAI later if needed)
    explanation_text = (
        "SwapSage recommends this route because it balances liquidity depth and gas cost. "
        f"Risk level: {risk}. Route summary: {route}."
    )

    # Minimal logging (doesn't fail the API if inputs are missing)
    src_symbol = request.GET.get("src_symbol") or "SRC"
    dst_symbol = request.GET.get("dst_symbol") or "DST"
    amount_str = request.GET.get("amount") or "0"

    try:
        amount = Decimal(amount_str)
    except Exception:
        amount = Decimal("0")

    try:
        SwapRequest.objects.create(
            src_symbol=src_symbol,
            dst_symbol=dst_symbol,
            amount=amount,
            risk_level=risk if len(risk) <= 16 else risk[:16],
            explanation=explanation_text,
        )
    except Exception:
        # Logging shouldn't break the UX; ignore DB errors silently
        pass

    return JsonResponse({"ok": True, "explanation": explanation_text})
