from collections import defaultdict
from datetime import datetime, timedelta
import threading


class SimpleRateLimiter:
    """Thread-safe in-memory rate limiter using a sliding window."""

    def __init__(self, max_calls: int, period_seconds: int):
        self.max_calls = max_calls
        self.period = timedelta(seconds=period_seconds)
        self._calls: dict[str, list[datetime]] = defaultdict(list)
        self._lock = threading.Lock()

    def is_allowed(self, key: str) -> bool:
        now = datetime.utcnow()
        with self._lock:
            # Drop timestamps outside the window
            self._calls[key] = [t for t in self._calls[key] if now - t < self.period]
            if len(self._calls[key]) >= self.max_calls:
                return False
            self._calls[key].append(now)
            return True


# 3 code requests per email per 10 minutes
email_send_limiter = SimpleRateLimiter(max_calls=3, period_seconds=600)

# 10 code requests per IP per 10 minutes
ip_send_limiter = SimpleRateLimiter(max_calls=10, period_seconds=600)
