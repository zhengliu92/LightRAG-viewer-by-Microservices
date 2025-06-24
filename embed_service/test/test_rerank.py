from FlagEmbedding import FlagReranker


def test_1():
    reranker = FlagReranker(
        "BAAI/bge-reranker-v2-m3",
        use_fp16=True,
    )

    # You can map the scores into 0-1 by set "normalize=True", which will apply sigmoid function to the score
    scores = reranker.compute_score(
        [
            ["what is panda?", "hi"],
            [
                "what is panda?",
                "The giant panda (Ailuropoda melanoleuca), sometimes called a panda bear or simply panda, is a bear species endemic to China.",
            ],
        ],
        normalize=True,
    )
    print(scores)


def test_2():
    from handler import rerank

    scores = rerank(
        "what is panda?",
        [
            "The giant panda (Ailuropoda melanoleuca), sometimes called a panda bear or simply panda, is a bear species endemic to China.",
        ],
    )
    print(scores)


if __name__ == "__main__":
    test_2()
