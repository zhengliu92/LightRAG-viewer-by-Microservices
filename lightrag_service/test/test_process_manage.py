import time
from utils.process_manager import SingleProcessManager, stop_process
from handle_redis.redis_config import redis_client


def job(a: int, b: int):
    time.sleep(10)
    print(a, b)
    return a + b


if __name__ == "__main__":
    job_key = "process:test"

    manager = SingleProcessManager(
        job=job,
        redis_client=redis_client,
        job_key=job_key,
    )
    manager.start_process(a=1, b=2)
    # stop_process(redis_client, job_key, timeout=1)
    time_out = 10
    start_time = time.time()
    while True:
        time.sleep(1)
        print(manager.get_status())
        if manager.get_status().get("finished"):
            break
        if manager.get_status().get("failed"):
            break
        if time.time() - start_time > time_out:
            break
