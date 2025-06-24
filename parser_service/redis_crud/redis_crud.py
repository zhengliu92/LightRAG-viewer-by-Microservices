from setting.config import redis_client


def hset_parser_progress(
    event_name: str,
    bucket_name: str,
    doc_path: str,
    **kwargs,
):
    redis_client.hset(f"{event_name}:{bucket_name}:{doc_path}", mapping=kwargs)
    hset_parser_progress_with_ttl(event_name, bucket_name, doc_path)
    return "Success"


def hset_parser_incremental_progress(
    event_name: str,
    bucket_name: str,
    doc_path: str,
    status: str,
    incremental_percent: float = 0.0,
    reset: bool = False,
):
    if reset:
        redis_client.hset(
            f"{event_name}:{bucket_name}:{doc_path}",
            mapping={
                "percent": round(incremental_percent, 1),
                "status": status,
            },
        )
        return "Success"

    percent = redis_client.hget(f"{event_name}:{bucket_name}:{doc_path}", "percent")
    if percent is None:
        percent = 0.0
    percent = float(percent)
    percent += round(incremental_percent, 1)
    if percent < 0:
        percent = 0.0
    if percent > 99:
        percent = 99.0
    redis_client.hset(
        f"{event_name}:{bucket_name}:{doc_path}",
        mapping={
            "percent": percent,
            "status": status,
        },
    )
    hset_parser_progress_with_ttl(event_name, bucket_name, doc_path)
    return percent


def hset_parser_progress_with_ttl(
    event_name: str,
    bucket_name: str,
    doc_path: str,
    ttl_seconds: int = 3600,
):
    redis_client.expire(f"{event_name}:{bucket_name}:{doc_path}", ttl_seconds)
    return "Success"


def hget_parser_progress(event_name: str, bucket_name: str, doc_path: str):
    return redis_client.hgetall(f"{event_name}:{bucket_name}:{doc_path}")
