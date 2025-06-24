from handler import embed
from threading import Thread, Lock
import time
from concurrent.futures import ThreadPoolExecutor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")

# Test sentences
sentences = [
    "BM25 is a bag-of-words retrieval function that ranks a set of documents based on the query terms appearing in each document",
    "BGE M3 is an embedding model supporting dense retrieval, lexical matching and multi-vector interaction.",
]

# Constants
MAX_WORKERS = 10  # Limit concurrent threads
TIMEOUT = 5  # Test duration in seconds
SLEEP_INTERVAL = 0.01  # Time between thread creation


class EmbeddingTester:
    def __init__(self):
        self.total_task_done = 0
        self.lock = Lock()
        self.start_time = None

    def task(self):
        try:
            embed(
                sentences,
                max_length=8096,
                batch_size=1,
            )
            with self.lock:
                self.total_task_done += 1
        except Exception as e:
            logging.error(f"Error in embedding task: {e}")

    def run_test(self):
        self.start_time = time.time()

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            while time.time() - self.start_time < TIMEOUT:
                executor.submit(self.task)
                time.sleep(SLEEP_INTERVAL)

        elapsed_time = time.time() - self.start_time
        qps = self.total_task_done / elapsed_time

        logging.info(f"Test completed:")
        logging.info(f"Total tasks completed: {self.total_task_done}")
        logging.info(f"Time elapsed: {elapsed_time:.2f} seconds")
        logging.info(f"Queries per second: {qps:.2f}")


if __name__ == "__main__":
    tester = EmbeddingTester()
    tester.run_test()
