import requests
from bs4 import BeautifulSoup
import time

BASE = "https://apps.arrt.org/FindCE"
headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Referer": f"{BASE}/index.aspx",
    "Content-Type": "application/x-www-form-urlencoded",
}

def get_tokens(soup):
    def field(name):
        el = soup.find("input", {"name": name})
        return el["value"] if el else ""
    return {
        "__VIEWSTATE":          field("__VIEWSTATE"),
        "__VIEWSTATEGENERATOR": field("__VIEWSTATEGENERATOR"),
        "__EVENTVALIDATION":    field("__EVENTVALIDATION"),
        "__EVENTTARGET":        "",
        "__EVENTARGUMENT":      "",
    }

def search_category(session, category_id):
    # 1. GET index.aspx fresh for each category (new tokens)
    r = session.get(f"{BASE}/index.aspx", headers=headers)
    soup = BeautifulSoup(r.text, "html.parser")
    tokens = get_tokens(soup)

    # 2. POST search
    payload = {
        **tokens,
        "ctl00$cphSearchPanel$Search$btnSearch.x": "28",
        "ctl00$cphSearchPanel$Search$btnSearch.y": "22",
        "ctl00$cphSearchPanel$Search$txtKeyword":   "Enter Keywords",
        "ctl00$cphSearchPanel$Search$lstCategories": str(category_id),
    }
    session.post(f"{BASE}/index.aspx", data=payload, headers=headers)

    # 3. GET listing.aspx — session carries the search state
    r = session.get(f"{BASE}/listing.aspx", headers=headers)
    return BeautifulSoup(r.text, "html.parser")


def get_all_category_ids(session):
    r = session.get(f"{BASE}/index.aspx", headers=headers)
    soup = BeautifulSoup(r.text, "html.parser")
    select = soup.find("select", {"name": "ctl00$cphSearchPanel$Search$lstCategories"})
    return [(o["value"], o.text.strip()) 
            for o in select.find_all("option") 
            if o.get("value")]


def parse_courses(soup):
    courses = []
    # inspect listing.aspx HTML to find the right selector
    rows = soup.select("table.results-table tr")  # update selector after inspecting
    for row in rows:
        cols = row.find_all("td")
        if cols:
            courses.append({
                "title":    cols[0].get_text(strip=True),
                "provider": cols[1].get_text(strip=True),
                "credits":  cols[2].get_text(strip=True),
                "category": cols[3].get_text(strip=True),
            })
    return courses


# Main
session = requests.Session()
all_courses = []

categories = get_all_category_ids(session)
print(f"Found {len(categories)} categories")

for cat_id, cat_name in categories:
    print(f"Scraping category {cat_id}: {cat_name}")
    soup = search_category(session, cat_id)
    courses = parse_courses(soup)
    for c in courses:
        c["category_id"] = cat_id
        c["category_name"] = cat_name
    all_courses.extend(courses)
    time.sleep(1.5)  # be polite

print(f"Total courses: {len(all_courses)}")