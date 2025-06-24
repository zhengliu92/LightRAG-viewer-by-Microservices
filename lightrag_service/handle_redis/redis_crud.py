from handle_redis.redis_config import redis_client


def hset_build_progress(
    kb_id: str,
    kbfile_id: str,
    percent: int,
    status: str,
    is_finished: bool,
    is_failed: bool,
):
    redis_client.hset(
        f"build:{kb_id}:{kbfile_id}",
        mapping={
            "percent": percent,
            "status": status,
            "is_finished": int(is_finished),
            "is_failed": int(is_failed),
        },
    )
    redis_client.expire(f"build:{kb_id}:{kbfile_id}", 60 * 60)


def hset_build_incremental_progress(
    kb_id: str,
    kbfile_id: str,
    status: str,
    incremental_percent: float = 0.0,
):
    percent = redis_client.hget(f"build:{kb_id}:{kbfile_id}", "percent")
    if percent is None:
        percent = 0.0
    percent = float(percent)
    percent += round(incremental_percent, 1)
    if percent > 99:
        percent = 99
    redis_client.hset(
        f"build:{kb_id}:{kbfile_id}",
        mapping={
            "percent": percent,
            "status": status,
        },
    )
    return percent


def hget_build_progress(kb_id: str, kbfile_id: str):
    return redis_client.hgetall(f"build:{kb_id}:{kbfile_id}")
