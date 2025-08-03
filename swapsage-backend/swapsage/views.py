import os
from django.shortcuts import render
from django.http import JsonResponse
from .utils import get_quote, get_tokens

CHAIN_ID = 1  # Ethereum mainnet

def home(request):
    tokens = {}
    try:
        if os.getenv("ONEINCH_API_KEY"):
            tokens = get_tokens(CHAIN_ID)
    except Exception:
        tokens = {}
    return render(request, "home.html", {"tokens": tokens, "chain_id": CHAIN_ID})

def swap_view(request):
    return render(request, "swap.html", {"chain_id": CHAIN_ID})

def api_quote(request):
    try:
        src = request.GET.get("src")
        dst = request.GET.get("dst")
        amount = request.GET.get("amount")  # human units
        decimals = int(request.GET.get("decimals", "18"))

        if not (src and dst and amount):
            return JsonResponse({"ok": False, "error": "Missing src/dst/amount"}, status=400)

        # NOTE: this simple conversion assumes whole-decimal tokens
        amount_wei = str(int(float(amount) * (10 ** decimals)))
        data = get_quote(CHAIN_ID, src, dst, amount_wei)

        # Basic risk hint
        price_impact_bps = (data.get("priceImpact", 0) or 0) * 100
        slippage_hint = "low" if price_impact_bps < 50 else "medium" if price_impact_bps < 200 else "high"

        return JsonResponse({"ok": True, "data": data, "risk": {
            "price_impact_bps": price_impact_bps,
            "slippage": slippage_hint,
        }})
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=500)

def api_explain(request):
    # Replace with OpenAI call if you want server-side AI
    route = request.GET.get("route_summary", "best route")
    risk = request.GET.get("risk", "unknown")
    text = (
        "SwapSage recommends this route because it balances liquidity depth and gas cost. "
        f"Risk level: {risk}. Route summary: {route}."
    )
    return JsonResponse({"ok": True, "explanation": text})
