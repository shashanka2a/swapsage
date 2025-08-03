from django.contrib import admin
from .models import Token, QuoteCache, SwapIntent, Explanation


@admin.register(Token)
class TokenAdmin(admin.ModelAdmin):
    list_display = ("symbol", "chain_id", "address", "decimals", "is_native", "updated_at")
    list_filter = ("chain_id", "is_native")
    search_fields = ("symbol", "name", "address")


@admin.register(QuoteCache)
class QuoteCacheAdmin(admin.ModelAdmin):
    list_display = ("chain_id", "src_token", "dst_token", "amount_wei", "price_impact_bps", "created_at")
    list_filter = ("chain_id",)
    search_fields = ("cache_key",)
    readonly_fields = ("response",)


@admin.register(SwapIntent)
class SwapIntentAdmin(admin.ModelAdmin):
    list_display = ("wallet_address", "status", "chain_id", "src_token", "dst_token", "amount", "created_at")
    list_filter = ("status", "chain_id", "src_token", "dst_token")
    search_fields = ("wallet_address", "tx_hash")


@admin.register(Explanation)
class ExplanationAdmin(admin.ModelAdmin):
    list_display = ("intent", "model", "created_at")
    search_fields = ("intent__wallet_address", "model")
