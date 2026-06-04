# ⛵ Safeenah

![Project Safeenah](https://img.shields.io/badge/Project-Safeenah-000000?style=for-the-badge&logoColor=white)
![Status](https://img.shields.io/badge/Status-In%20Development-000000?style=for-the-badge&logoColor=white)
![Type](https://img.shields.io/badge/Type-Static%20Website-000000?style=for-the-badge&logoColor=white)
![License](https://img.shields.io/badge/License-Open%20Source-000000?style=for-the-badge&logoColor=white)
![Contributions](https://img.shields.io/badge/Contributions-Welcome-000000?style=for-the-badge&logoColor=white)

> *"The truth does not care about your school of thought."*

---

## 📖 Table of Contents

- [⛵ Safeenah](#-safeenah)
  - [📖 Table of Contents](#-table-of-contents)
  - [What is Safeenah](#what-is-safeenah)
  - [Why This Project Exists](#why-this-project-exists)
  - [Who This is For](#who-this-is-for)
  - [Who This is NOT For](#who-this-is-not-for)
  - [What You Will Find Here](#what-you-will-find-here)
  - [Project Structure](#project-structure)
  - [How It Works](#how-it-works)
  - [Adding New Content](#adding-new-content)
  - [Contributing](#contributing)
  - [Submit an Issue](#submit-an-issue)
  - [Author](#author)

---

## What is Safeenah

Safeenah is a static, content-driven website built to help people explore Islamic history and hadith through a clean visual interface. The name comes from Arabic — a ship, a vessel. Something that carries. That's what this project tries to be. A vessel that carries what has been, for the most part, kept away from ordinary people.

It's not an encyclopedia. It's not trying to be the final word on anything. It's a starting point. A way for someone to sit down, scroll through a visual timeline, click on an event, read what actually happened, see the references, and think for themselves.

The website has a historical timeline, a hadith archive, and pages for events and people — all driven by JSON data files. No databases, no login, no algorithm feeding you what it thinks you should see. Just the information, laid out as clearly as we can manage.

---

## Why This Project Exists

This needs a bit of honest explaining.

Most of us grew up learning Islam through whatever our local community taught us. Maybe a madrasa, maybe a family tradition, maybe just whatever the imam said on Friday. And for a lot of people, that was it. That became the whole picture.

But Islamic history is deep. It's complicated. There are events, statements, and moments that shaped everything — things that most Muslims have either never heard of, or heard about only through the lens of one particular group. The kind of things that, when you actually look into them with proper references and a calm mind, change how you understand the whole flow of the religion.

This project is specifically built to bring those facts out. The ones that are usually quietly buried. Not to cause problems, not to attack anyone — just because the truth deserves to exist somewhere that anyone can find it and examine it properly.

We were told to be Muslims. Not Shia. Not Sunni. Just Muslims. And if the truth points somewhere, even if it contradicts what our own school of thought has been saying — then that's exactly the direction an honest person should be willing to look.

That is the entire reason Safeenah exists.

---

## Who This is For

- Someone who genuinely wants to understand Islamic history, not just a curated version of it
- A person who can read a reference and sit with it honestly, even if it makes them uncomfortable
- Anyone tired of getting different answers from different groups and just wanting to know what the primary sources actually say
- People who understand that being Muslim means following truth — wherever it leads

---

## Who This is NOT For

Let's be direct about this too.

This project is not for people who are **blindly attached to a label** — whether that label is a madhab, a sect, or a particular scholar's opinion — to the point where no amount of evidence can reach them. The Arabic word for this kind of attachment is *taqlid* taken to an extreme. In plain terms: people who have already decided what the answer is and are not actually looking, just looking for confirmation.

It's also not for people who think they can do *tahqiq* — proper investigation of religious claims — without actually knowing how to do it. Reading one book, or watching one YouTube channel, is not research. If someone isn't willing to sit with primary sources, check chains of narration, read multiple perspectives and weigh them honestly — this website will probably just frustrate them.

We weren't told to be Shia or Sunni. We were told to be Muslim. And a Muslim follows the truth. If you are genuinely that kind of person, this project was made for you.

---

## What You Will Find Here

![Timeline](https://img.shields.io/badge/Feature-Historical%20Timeline-000000?style=flat-square&logoColor=white)
![Hadith](https://img.shields.io/badge/Feature-Hadith%20Archive-000000?style=flat-square&logoColor=white)
![Biographies](https://img.shields.io/badge/Coming%20Soon-Biographies-000000?style=flat-square&logoColor=white)
![Books](https://img.shields.io/badge/Coming%20Soon-Books-000000?style=flat-square&logoColor=white)

**Historical Timeline** — A visual, scrollable timeline of key Islamic events. Each point links to a full dedicated page with dates, narrative, images, and references. Not a list of articles — an actual flowing visual experience.

**Hadith Archive** — A collection of hadith with Arabic text, translation, narrator information, source references, commentary, and where relevant, different scholarly perspectives on the narration.

**Future Content** — Biographies, books, documents, locations, media. All of it will follow the same pattern: data files drive the content, everything gets its own permanent shareable URL.

Every single page on this site has a permanent link. Nothing is hidden inside a popup. If you find something worth sharing, you can share the exact URL and someone else will land on the exact same page.

---

## Project Structure

```
Safeenah/
├── index.html                  ← Landing Page
├── about.html                  ← About Page
├── home.html                   ← Home Page with content tabs
├── submit.html                 ← Submit an Issue
│
├── event/
│   └── index.html              ← Renders any event via ?id=slug
│
├── hadith/
│   └── index.html              ← Renders any hadith via ?id=slug
│
├── data/
│   ├── site.json
│   ├── events/
│   │   ├── index.json          ← Master event list for timeline
│   │   └── ghadir-khum.json    ← Individual event data
│   └── hadith/
│       ├── index.json          ← Master hadith list
│       └── hadisun-safeenah.json
│
├── assets/
│   ├── css/
│   └── js/
│
└── components/                 ← Reusable HTML pieces
```

---

## How It Works

The routing is simple and entirely URL-based.

```
/Safeenah/event/?id=ghadir-khum
```

The page `event/index.html` loads, reads the `?id` parameter from the URL, fetches `data/events/ghadir-khum.json`, and renders the full event page in the browser. No server. No build step. No database.

Same for hadith:

```
/Safeenah/hadith/?id=hadith-thaqalayn
```

Everything is driven by the JSON files. The HTML templates just know how to read them and display them.

---

## Adding New Content

This is intentionally kept as simple as possible.

**To add a new historical event:**

1. Create `data/events/your-event-slug.json` with the event details
2. Add one entry to `data/events/index.json` with the id, title, and year
3. That's it — the event appears in the timeline and gets a live URL

**To add a new hadith:**

1. Create `data/hadith/your-hadith-slug.json`
2. Add one entry to `data/hadith/index.json`
3. Done

No HTML to write. No code to touch. The frontend reads the data and handles everything automatically.

**Event JSON looks like:**
```json
{
  "id": "ghadir-khum",
  "title": "Event of Ghadir Khum",
  "year": "10 AH / 632 CE",
  "summary": "Short description here",
  "narrative": "Full detailed narrative...",
  "images": ["assets/images/events/ghadir-khum/main.jpg"],
  "references": [
    {
      "source": "Sahih Muslim",
      "volume": "4",
      "page": "1873"
    }
  ],
  "tags": ["prophet", "succession", "10AH"]
}
```

---

## Contributing

![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-000000?style=for-the-badge&logoColor=white)
![Data Contributions](https://img.shields.io/badge/Data%20Contributions-Open-000000?style=for-the-badge&logoColor=white)

Contributions are very welcome. This project grows with people who care about accuracy.

**Ways you can contribute:**

- Add a new historical event with proper references
- Add a hadith entry with source verification
- Improve an existing entry — better translation, additional references, clearer narrative
- Fix factual errors (please include the source when you do)
- Improve the frontend — design, accessibility, performance
- Translate content

**Ground rules for content contributions:**

- Every claim needs a reference. Not a blog post, not a YouTube video — a primary source, or at minimum a well-known classical source with volume and page number
- Don't add content to prove a point. Add content because it happened and it's documented
- If something is disputed between scholars, note that — don't pick a side silently
- Keep the narrative factual and calm. This isn't a debate platform

**To contribute:**

1. Fork the repository
2. Add or modify JSON files in the `data/` folder
3. Test locally that the page renders correctly
4. Open a pull request with a brief description of what you added and why

If you're not comfortable with GitHub, use the Submit an Issue page on the website and we'll handle it from there.

---

## Submit an Issue

Found something wrong? Think a reference is missing or a date is off? Have a source that adds important context to an existing entry?

Use the **Submit an Issue** page on the website: `/Safeenah/submit.html`

Or open a GitHub issue directly on this repository.

We genuinely want to know. The whole point of this project is accuracy. A wrong date or a missing reference isn't a small thing here — it matters. If you find something, please tell us. You don't need to be a scholar. You just need to have found something specific, with a source.

---

## Author

**Irshad Hossain**
[@Project_Safeenah](https://github.com/Project_Safeenah)

---

![Built with care](https://img.shields.io/badge/Built%20with-Care%20%26%20References-000000?style=for-the-badge&logoColor=white)
![No Madhab](https://img.shields.io/badge/No%20Madhab-Just%20Truth-000000?style=for-the-badge&logoColor=white)

*This project does not belong to any sect, school of thought, or organization. It belongs to the question — what actually happened?*