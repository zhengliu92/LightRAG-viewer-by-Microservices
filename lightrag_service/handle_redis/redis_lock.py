import time
import redis
from contextlib import contextmanager


@contextmanager
def acquire_lock_with_timeout(
    redis_client: redis.Redis,
    lock_key: str,
    lock_value: str,
    timeout: int = 60 * 60 * 24,
    retry_delay: float = 0.5,
):
    lock_key_full = f"kb_processing_lock:{lock_key}"
    start_time = time.time()

    # Try to acquire the lock
    while time.time() - start_time < timeout:
        got_lock = redis_client.set(lock_key_full, lock_value, nx=True, ex=timeout)
        if got_lock:
            try:
                yield
            finally:
                # Only delete if we still own the lock
                script = """
                if redis.call('get', KEYS[1]) == ARGV[1] then
                    return redis.call('del', KEYS[1])
                else
                    return 0
                end
                """
                redis_client.eval(script, 1, lock_key_full, lock_value)
            return
        time.sleep(retry_delay)
    raise TimeoutError(f"Could not acquire lock for {lock_key} after {timeout} seconds")


def release_lock(redis_client: redis.Redis, lock_key: str, lock_value: str):
    lock_key_full = f"kb_processing_lock:{lock_key}"
    script = """
    if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
    else
        return 0
    end
    """
    r = redis_client.eval(script, 1, lock_key_full, lock_value)
    return r == 1
