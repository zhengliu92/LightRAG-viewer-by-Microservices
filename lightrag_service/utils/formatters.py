from prompt.prompt import GRAPH_FIELD_SEP, PROMPTS


entity_types = PROMPTS["DEFAULT_ENTITY_TYPES"]
language = PROMPTS["DEFAULT_LANGUAGE"]


def get_relavent_examples(prompt: str, **kwargs):
    examples = "\n".join(PROMPTS["entity_extraction_examples"])
    example_context_base = dict(
        tuple_delimiter=PROMPTS["DEFAULT_TUPLE_DELIMITER"],
        record_delimiter=PROMPTS["DEFAULT_RECORD_DELIMITER"],
        completion_delimiter=PROMPTS["DEFAULT_COMPLETION_DELIMITER"],
        entity_types=",".join(entity_types),
        language=language,
    )
    query_prompt = """Which example is most relevant to the following prompt:

{prompt}

""".format(
        **example_context_base
    )


if __name__ == "__main__":
    print(get_relavent_examples(""))
