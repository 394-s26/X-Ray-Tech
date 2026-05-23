from firebase_functions import https_fn
from firebase_admin import initialize_app, firestore
from arrt_extractor import scrape_arrt_courses
from cpr_extractor import scrape_cpr_courses
import re

initialize_app()


def _doc_id(title: str, license_key: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:80]
    return f"{license_key}_{slug}"


@https_fn.on_request(timeout_sec=540, memory=2048)
def sync_certification_courses(_req: https_fn.Request) -> https_fn.Response:
    db = firestore.client()
    collection = db.collection("certification_courses")

    arrt_courses = scrape_arrt_courses()
    cpr_courses = scrape_cpr_courses()
    all_courses = arrt_courses + cpr_courses

    batch = db.batch()
    count = 0
    for course in all_courses:
        title = course.get("title") or ""
        license_key = (course.get("licenses") or [course.get("license", "unknown")])[0]
        doc_ref = collection.document(_doc_id(title, license_key))
        batch.set(doc_ref, course)
        count += 1
        # Firestore batches are limited to 500 writes
        if count % 500 == 0:
            batch.commit()
            batch = db.batch()

    batch.commit()

    return https_fn.Response(f"Synced {count} courses to certification_courses.")
