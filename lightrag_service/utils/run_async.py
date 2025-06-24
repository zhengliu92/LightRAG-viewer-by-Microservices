import asyncio


def run_async(f, *args, **kwargs):
    try:
        # Try to get the running event loop
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import threading

            def _run_async():
                new_loop = asyncio.new_event_loop()
                asyncio.set_event_loop(new_loop)
                return new_loop.run_until_complete(f(*args, **kwargs))

            thread = threading.Thread(target=_run_async)
            thread.start()
            thread.join()
        else:
            # If no event loop is running, use the current one
            return loop.run_until_complete(f(*args, **kwargs))
    except RuntimeError:
        # If no event loop exists, create a new one
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        return loop.run_until_complete(f(*args, **kwargs))
