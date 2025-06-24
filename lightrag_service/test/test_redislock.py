import redis
from app.document_processor import acquire_lock_with_timeout
from threading import Thread
import time


def my_run(redis_client: redis.Redis, lock_key: str):
    try:
        with acquire_lock_with_timeout(redis_client, lock_key):
            print("Lock acquired")
            time.sleep(2)
            print("Lock released")
    except Exception as e:
        print(e)


def test_acquire_lock_with_timeout():
    nThread = 5
    redis_client = redis.Redis(host="localhost", port=6379, db=0)
    lock_key = "test_lock"
    for i in range(nThread):
        t = Thread(target=my_run, args=(redis_client, lock_key))
        t.start()
    for i in range(nThread):
        t.join()


if __name__ == "__main__":
    test_acquire_lock_with_timeout()
