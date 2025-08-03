from django.db import models
from django.utils import timezone

class Token(models.Model):
    """Store basic token details from 1inch API."""
    chain_id = models.PositiveBigIntegerField()
    address = models.CharField(max_length=64)
    symbol = models.CharField(max_length=32)
    decimals = models.PositiveSmallIntegerField(default=18)

    def __str__(self):
        return f"{self.symbol} ({self.chain_id})"


class SwapRequest(models.Model):
    """Log a swap request for history/debugging."""
    created_at = models.DateTimeField(default=timezone.now)
    src_symbol = models.CharField(max_length=32)
    dst_symbol = models.CharField(max_length=32)
    amount = models.DecimalField(max_digits=38, decimal_places=18)
    risk_level = models.CharField(max_length=16, blank=True)
    explanation = models.TextField(blank=True)

    def __str__(self):
        return f"{self.src_symbol} → {self.dst_symbol} ({self.amount})"
