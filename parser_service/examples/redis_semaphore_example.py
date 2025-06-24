import threading
import time
from redis import Redis
from redis_crud.redis_semaphore import RedisSemaphore  # Assuming the RedisSemaphore class is saved in redis_semaphore.py

# Initialize Redis client
redis_client = Redis(host='localhost', port=6379, decode_responses=True)

# Define semaphore with a maximum of 3 concurrent accesses
semaphore = RedisSemaphore(redis_client, name="test_semaphore", max_count=2, expiry=60)

# Simulated shared resource
def worker(worker_id: int):
    """
    Simulated worker function that tries to acquire the semaphore before proceeding.
    """
    print(f"Worker {worker_id} attempting to acquire semaphore...")

    with semaphore.lock(timeout=10) as acquired:
        if acquired:
            print(f"Worker {worker_id} acquired semaphore, processing...")
            time.sleep(1)  # Simulating work done while holding the semaphore
            print(f"Worker {worker_id} releasing semaphore.")
        else:
            print(f"Worker {worker_id} failed to acquire semaphore.")

# Start multiple worker threads
num_workers = 5
threads = [threading.Thread(target=worker, args=(i,)) for i in range(num_workers)]

for thread in threads:
    thread.start()

for thread in threads:
    thread.join()

print("All workers finished execution.")
