import time
import uuid
from contextlib import contextmanager
from typing import Optional, Generator

from redis import Redis
from redis.exceptions import WatchError


class RedisSemaphore:
    """
    A distributed semaphore implementation using Redis.

    This semaphore allows controlling concurrent access to shared resources across
    distributed systems using Redis as the coordination mechanism. It includes automatic
    cleanup of stale locks and can be used as a context manager.

    Args:
        redis_client: Redis client instance
        name: Name of the semaphore (used as Redis key prefix)
        max_count: Maximum number of concurrent holders allowed
        expiry: Time in seconds after which a held semaphore is considered stale and released
        retry_interval: Time in seconds to wait between acquire attempts
    """

    def __init__(
        self,
        redis_client: Redis,
        name: str,
        max_count: int,
        expiry: int = 60 * 60 * 24,
        retry_interval: float = 0.1,
    ):
        self.redis = redis_client
        self.name = name
        self.max_count = max_count
        self.expiry = expiry
        self.retry_interval = retry_interval
        self.semaphore_key = f"semaphore:{self.name}"

    def acquire(
        self, blocking: bool = True, timeout: Optional[float] = None
    ) -> Optional[str]:
        """
        Attempt to acquire the semaphore.

        Args:
            blocking: Whether to block until the semaphore is acquired
            timeout: Maximum time to wait for acquisition in seconds

        Returns:
            str: Token if acquired, None otherwise
        """
        start_time = time.time()
        token = str(uuid.uuid4())

        while True:
            self._remove_expired_locks()
            with self.redis.pipeline() as pipe:
                try:
                    pipe.watch(self.semaphore_key)
                    holders = pipe.zcard(self.semaphore_key)

                    if holders < self.max_count:
                        pipe.multi()
                        pipe.zadd(self.semaphore_key, {token: time.time()})
                        pipe.expire(self.semaphore_key, self.expiry)
                        pipe.execute()
                        return token

                    pipe.unwatch()
                except WatchError:
                    pass

            if not blocking:
                return False

            if timeout is not None and (time.time() - start_time) >= timeout:
                return False

            time.sleep(self.retry_interval)

    def release(self, token: str) -> bool:
        """
        Release the semaphore.

        Returns:
            bool: True if released successfully, False otherwise
        """
        return self.redis.zrem(self.semaphore_key, token) > 0

    def _remove_expired_locks(self) -> None:
        """
        Remove expired semaphore holders from Redis.
        """
        cutoff = time.time() - self.expiry
        self.redis.zremrangebyscore(self.semaphore_key, "-inf", cutoff)


    @contextmanager
    def lock(
        self, blocking: bool = True, timeout: Optional[float] = None
    ) -> Generator[bool, None, None]:
        """
        Context manager for acquiring and releasing the semaphore.

        Args:
            blocking: Whether to block until acquired
            timeout: Maximum wait time for acquiring

        Yields:
            bool: True if acquired, False otherwise
        """
        token = self.acquire(blocking, timeout)
        if token:
            yield token
            self.release(token)
        else:
            yield False
