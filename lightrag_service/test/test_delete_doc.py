from app.models import DeleteDocRequest
from app.rag_utils import get_rag
from pathlib import Path


def test_delete_doc(req: DeleteDocRequest):
    proj_path = Path("store") / req.kb_id
    if not proj_path.exists():
        return
    rag = get_rag(proj_path, req)
    rag.delete_by_doc_id(req.kbfile_id)


if __name__ == "__main__":
    kb_id = "bb232bbe-c8f9-4618-92a0-b31303a2fa02"
    kbfile_id = "b06271ed-74d1-43ae-a908-b969c88d1729"
    test_delete_doc(
        DeleteDocRequest(
            kb_id=kb_id,
            kbfile_id=kbfile_id,
            decode_api_key=False,
        )
    )
