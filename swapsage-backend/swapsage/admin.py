from django.contrib import admin
from .models import Token, SwapRequest


@admin.register(Token)
class TokenAdmin(admin.ModelAdmin):
    list_display = ("symbol", "chain_id", "address", "decimals")
    list_filter = ("chain_id",)
    search_fields = ("symbol", "address")


@admin.register(SwapRequest)
class SwapRequestAdmin(admin.ModelAdmin):
    list_display = ("created_at", "src_symbol", "dst_symbol", "amount", "risk_level")
    list_filter = ("risk_level",)
    search_fields = ("src_symbol", "dst_symbol")
    ordering = ("-created_at",)
