from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    """Abstract base with created/updated timestamps."""
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Token(TimeStampedModel):
    """
    On-chain token metadata (per chain).
    You can hydrate this from 1inch /tokens endpoint.
    """
    chain_id = models.PositiveBigIntegerField(db_index=True)
    address = models.CharField(max_length=64, db_index=True)  # checksummed addr or '0xEeee...'
    symbol = models.CharField(max_length=64, db_index=True)
    name = models.CharField(max_length=128, blank=True)
    decimals = models.PositiveSmallIntegerField(default=18)
    logo_uri = models.URLField(blank=True)
    is_native = models.BooleanField(default=False)

    class Meta:
        unique_together = ("chain_id", "address")
        indexes = [
            models.Index(fields=["chain_id", "symbol"]),
            models.Index(fields=["chain_id", "name"]),
        ]

    def __str__(self):
        return f"{self.symbol} ({self.chain_id})"


class QuoteCache(TimeStampedModel):
    """
    Cached quote responses from 1inch to avoid re-fetching identical requests.
    Store the raw JSON so the UI can render details directly.
    """
    chain_id = models.PositiveBigIntegerField(db_index=True)
    src_token = models.ForeignKey(Token, on_delete=models.CASCADE, related_name="quotes_src")
    dst_token = models.ForeignKey(Token, on_delete=models.CASCADE, related_name="quotes_dst")
    amount_wei = models.CharField(max_length=80)  # keep as string to avoid precision issues
    price_impact_bps = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    gas_estimate_wei = models.CharField(max_length=80, blank=True)
    route_summary = models.CharField(max_length=255, blank=True)
    response = models.JSONField()  # raw 1inch response

    # For fast cache lookups
    cache_key = models.CharField(max_length=255, db_index=True, unique=True)

    class Meta:
        indexes = [
            models.Index(fields=["chain_id", "src_token", "dst_token"]),
        ]

    def __str__(self):
        return f"Quote[{self.chain_id}] {self.src_token.symbol}->{self.dst_token.symbol} amount={self.amount_wei}"


class SwapIntent(TimeStampedModel):
    """
    A user's intent to swap—useful for demo flows, audits, and linking explanations.
    If you don’t have auth, you can store a wallet address string.
    """
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        QUOTED = "QUOTED", "Quoted"
        EXECUTED = "EXECUTED", "Executed"
        FAILED = "FAILED", "Failed"

    wallet_address = models.CharField(max_length=64, db_index=True)
    chain_id = models.PositiveBigIntegerField(db_index=True)
    src_token = models.ForeignKey(Token, on_delete=models.PROTECT, related_name="intents_src")
    dst_token = models.ForeignKey(Token, on_delete=models.PROTECT, related_name="intents_dst")
    amount = models.DecimalField(max_digits=38, decimal_places=18)  # human units
    amount_wei = models.CharField(max_length=80)  # precomputed
    slippage_bps = models.PositiveIntegerField(default=50)  # 50 = 0.50%
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)

    # Optional execution fields
    tx_hash = models.CharField(max_length=100, blank=True, db_index=True)
    route_summary = models.CharField(max_length=255, blank=True)
    risk_level = models.CharField(max_length=32, blank=True)  # "low" | "medium" | "high" etc.

    class Meta:
        indexes = [
            models.Index(fields=["wallet_address", "chain_id"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"Intent[{self.wallet_address[:6]}..] {self.src_token.symbol}->{self.dst_token.symbol} {self.amount}"


class Explanation(TimeStampedModel):
    """
    AI explanation for a given SwapIntent.
    Store the prompt and model used to help debug results.
    """
    intent = models.ForeignKey(SwapIntent, on_delete=models.CASCADE, related_name="explanations")
    model = models.CharField(max_length=64, default="gpt-4o-mini")  # set your default
    prompt = models.TextField(blank=True)
    text = models.TextField()
    meta = models.JSONField(blank=True, null=True)

    def __str__(self):
        return f"Explanation for Intent {self.intent_id} ({self.model})"
