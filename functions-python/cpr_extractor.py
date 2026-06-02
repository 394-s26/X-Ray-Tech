from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import json
import subprocess
import sys

# Firebase Cloud Functions use Google Cloud Buildpacks which don't run
# `playwright install`. We install the browser binary at module load time.
subprocess.run(
    [sys.executable, "-m", "playwright", "install", "chromium"],
    check=True,
)


BASE_URL = (
    "https://cpr.heart.org/en/courses"
    "#sort=relevancy&numberOfResults=100"
    "&f:@courseaudience=[Healthcare%20Professionals]"
)


def parse_courses(soup):
    courses = []
    for result in soup.find_all("div", class_="CoveoResult"):
        title_div = result.find("div", class_="coveo-title")
        if not title_div:
            continue

        a_tag = title_div.find("a", class_="CoveoResultLink")
        title_name = a_tag.get_text(strip=True) if a_tag else None
        title_link = a_tag["href"] if a_tag else None

        # Description is in the second coveo-result-row's span
        rows = result.find_all("div", class_="coveo-result-row")
        description_text = None
        if len(rows) >= 2:
            span = rows[1].find("span")
            description_text = span.get_text(strip=True) if span else None

        courses.append({
            "title": title_name,
            "link": title_link,
            "expiration": "2 years",
            "provider": "American Heart Association",
            "description": description_text,
            "licenses": ["cpr"],
        })

    return courses


def scrape_cpr_courses():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        page = browser.new_page(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            )
        )
        page.goto(BASE_URL, wait_until="networkidle", timeout=120000)
        page.wait_for_selector(".CoveoResult", timeout=120000)

        soup = BeautifulSoup(page.content(), "html.parser")
        browser.close()

    return parse_courses(soup)


if __name__ == "__main__":
    all_courses = scrape_cpr_courses()
    print(f"Total courses: {len(all_courses)}")
    print(json.dumps(all_courses, indent=2))
