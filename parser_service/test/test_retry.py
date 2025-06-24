import logging

from tenacity import retry, stop_after_attempt, wait_exponential, after_log

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=8),
    after=lambda retry_state: logger.error(
        f"Attempt {retry_state.attempt_number} failed with: {retry_state.outcome.exception()}"
    ),
)
def test_retry():
    try:
        1 / 0
    except Exception as e:
        logger.error(f" {e}")
        raise e
    finally:
        logger.info("test_retry finally")


if __name__ == "__main__":
    test_retry()
