import requests
from bs4 import BeautifulSoup
import time
import json


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
        "__LASTFOCUS":          "",
        "__EVENTTARGET":        "",
        "__EVENTARGUMENT":      "",
    }

def get_total_pages(soup):
    # find the pager and count page links
    pager = soup.find("div", id=lambda x: x and "Pager" in x)
    if not pager:
        return 1
    links = pager.find_all("a")
    page_nums = []
    for link in links:
        try:
            page_nums.append(int(link.get_text(strip=True)))
        except ValueError:
            continue
    return max(page_nums) if page_nums else 1

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
    select = soup.find("select", id="lstCategories")
    return [(int(o["value"]), o.text.strip()) 
            for o in select.find_all("option") 
            if o.get("value") and int(o["value"]) != 0]


def parse_courses(soup):
    courses = []
    body = soup.find("div", class_="contentBody")
    if not body:
        return courses

    # Direct children only, skipping divs with an id (e.g. the pager)
    items = [d for d in body.find_all("div", recursive=False) if not d.get("id")]
    for item in items:
        title_div = item.find("div", id="LinkedTitle")
        if not title_div:
            continue

        # Extract the title name and its link from the <a> component inside the div.
        a_tag = title_div.find("a")
        title_name = a_tag.get_text(strip=True) if a_tag else None
        title_link = a_tag["href"] if a_tag else None

        expiration = item.find("div", id="divExpires")
        # Get the text from the SECOND span (first is the "Current Approval Ends" label)
        expiration_date = None
        if expiration:
            spans = expiration.find_all("span")
            expiration_date = spans[1].get_text(strip=True) if len(spans) > 1 else None

        provider = item.find("span", id="lnkSponsor")
        provider_name = provider.get_text(strip=True) if provider else None

        description = item.find("span", id="lblDescription")
        description_text = description.get_text(strip=True) if description else None

        credit_info = item.find("span", id="creditInfo")
        # Split on space: num_credits is idx 0, credit category is idx 1 (e.g. "5.75 A")
        num_credits, credit_category = None, None
        if credit_info:
            parts = credit_info.get_text(strip=True).split()
            num_credits = parts[0] if parts else None
            credit_category = parts[1] if len(parts) > 1 else None

        courses.append({
            "title": title_name,
            "link": title_link,
            "expiration": expiration_date,
            "provider": provider_name,
            "description": description_text,
            "num_credits": num_credits,
            "credit_category": credit_category,
        })

    return courses


def get_page(session, listing_soup, page_num):
    """POST to listing.aspx to navigate to a specific page."""
    tokens = get_tokens(listing_soup)
    payload = {
        **tokens,
        "__EVENTTARGET":  f"ctl00$cphBody$Pager1$lnkPage{page_num}",
        "ctl00$cphSearchPanel$Search$ddlSortBy":          "",
        "ctl00$cphSearchPanel$Search$txtKeyword":         "",
        "ctl00$cphSearchPanel$Search$lstCategories":      "",
        "ctl00$cphBody$Pager1$hidCurrentPage":            str(page_num - 1),
        "ctl00$cphBody$Pager$hidCurrentPage":             str(page_num - 1),
    }
    r = session.post(f"{BASE}/listing.aspx", data=payload, headers={
        **headers,
        "Referer": f"{BASE}/listing.aspx"
    })
    return BeautifulSoup(r.text, "html.parser")

def search_category(session, category_id):
    # 1. Fresh GET index.aspx for tokens
    r = session.get(f"{BASE}/index.aspx", headers=headers)
    soup = BeautifulSoup(r.text, "html.parser")
    tokens = get_tokens(soup)

    # 2. POST search
    payload = {
        **tokens,
        "ctl00$cphSearchPanel$Search$btnSearch.x":    "28",
        "ctl00$cphSearchPanel$Search$btnSearch.y":    "22",
        "ctl00$cphSearchPanel$Search$txtKeyword":     "Enter Keywords",
        "ctl00$cphSearchPanel$Search$lstCategories":  str(category_id),
    }
    session.post(f"{BASE}/index.aspx", data=payload, headers=headers)

    # 3. GET first page of results
    r = session.get(f"{BASE}/listing.aspx", headers=headers)
    first_page_soup = BeautifulSoup(r.text, "html.parser")

    total_pages = get_total_pages(first_page_soup)
    print(f"  Category {category_id}: {total_pages} page(s)")

    all_courses = parse_courses(first_page_soup)

    # 4. Paginate through remaining pages
    current_soup = first_page_soup
    for page_num in range(2, total_pages + 1):
        print(f"  Fetching page {page_num}/{total_pages}")
        current_soup = get_page(session, current_soup, page_num)
        all_courses.extend(parse_courses(current_soup))
        time.sleep(1)  # be polite

    return all_courses


# Main
# TODO: Seems to skip over/miss many of the courses in the site...
session = requests.Session()
all_courses = []

categories = get_all_category_ids(session)
print(f"Found {len(categories)} categories")

for cat_id, cat_name in categories[:1]:
    print(f"Scraping category {cat_id}: {cat_name}")
    courses = search_category(session, cat_id)
    all_courses.extend(courses)
    time.sleep(2)  # be polite

print(f"Total courses: {len(all_courses)}")

print(json.dumps(all_courses[:20], indent=2))