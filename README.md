<div align="center">

<h1>
  Safeenah
  <img src="https://media.tenor.com/djjHE9fPm8EAAAAi/abstractchai-abster.gif" width="60" alt="Safeenah Logo" />
</h1>

<p>
  <i>"O you who believe, fear Allah as He should be feared and do not die except as Muslims"</i>
</p>

</div>


## 📖 Table of Contents

- [📖 Table of Contents](#-table-of-contents)
- [What is Safeenah](#what-is-safeenah)
- [Why This Project Exists](#why-this-project-exists)
- [Instruction for Contributor](#instruction-for-contributor)
- [What You Will Find Here](#what-you-will-find-here)
- [Author](#author)



## What is Safeenah

Safeenah is a static, content-driven website built to help people explore Islamic history and hadith through a clean visual interface. The name comes from Arabic — a ship, a vessel. Something that carries. That's what this project tries to be. A vessel that carries what has been, for the most part, kept away from ordinary people.

It's not an encyclopedia. It's not trying to be the final word on anything. It's a starting point. A way for someone to sit down, scroll through a visual timeline, click on an event, read what actually happened, see the references, and think for themselves.

The website has a historical timeline, a hadith archive, and pages for events and people — all driven by JSON data files. No databases, no login, no algorithm feeding you what it thinks you should see. Just the information, laid out as clearly as we can manage.



## Why This Project Exists

This needs a bit of honest explaining.

Most of us grew up learning Islam through whatever our local community taught us. Maybe a madrasa, maybe a family tradition, maybe just whatever the imam said on Friday. And for a lot of people, that was it. That became the whole picture.

But Islamic history is deep. It's complicated. There are events, statements, and moments that shaped everything — things that most Muslims have either never heard of, or heard about only through the lens of one particular group. The kind of things that, when you actually look into them with proper references and a calm mind, change how you understand the whole flow of the religion.

This project is specifically built to bring those facts out. The ones that are usually quietly buried. Not to cause problems, not to attack anyone — just because the truth deserves to exist somewhere that anyone can find it and examine it properly.

We were told to be Muslims. Not Shia. Not Sunni. Just Muslims. And if the truth points somewhere, even if it contradicts what our own school of thought has been saying — then that's exactly the direction an honest person should be willing to look.

That is the entire reason Safeenah exists.

## Instruction for Contributor

This project is open for contributions. If you have information, references, or content that you think should be included, please feel free to submit a pull request. Here are some guidelines:
1. **Accuracy**: Please ensure that any information you contribute is accurate and well-referenced. Include sources for any claims or events you add.
2. **Neutrality**: The content should be presented in a neutral and objective manner. Avoid any language that could be seen as biased or inflammatory.
3. **Format**: You can Create a new JSON file following this link [JSON GENERATOR](https://irshad-11.github.io/Safeenah/generatejson.html) - Download the generated JSON file and add it to the appropriate folder in the repository (e.g., `events`, `hadiths`, etc.).
4. **Add to the Folder Explorer**: Since this is frontend only project, you will need to update the array with this new JSON file name in particular file . 
   If you add new Event, then follow this process:
    - Open `data/events/`
    - Place the new JSON file in this folder.
    - Open `timeline.html` and find this line `const EVENT_FILES = [...];` , add the name of your new JSON file to this array.
    - Open `event/index.html` and find this line `const EVENT_FILES = [...];` , add the name of your new JSON file to this array.
  
  If you add new Hadith, then follow this process:
    - Open `data/hadith/`
    - Place the new JSON file in this folder.
    - Open `hadiths.html` and find this line `const HADITH_FILES = [...];` , add the name of your new JSON file to this array.
    - Open `hadith/index.html` and find this line `const HADITH_FILES = [...];` , add the name of your new JSON file to this array.
5. **Testing**: After adding your content, please test it locally to ensure that it displays correctly and that all links and references work as intended.
6. **Pull Request**: When you are ready, submit a pull request with a clear description of the changes you made and the content you added. The maintainers will review your contribution and may provide feedback or request changes before merging it into the main branch.


## What You Will Find Here

**Historical Timeline** — A timeline of key Islamic events. Each point links to a full dedicated page with dates, narrative, images, and references. Not a list of articles — an actual flowing visual experience.

**Hadith Archive** — A collection of hadith with Arabic text, translation, narrator information, source references, commentary, and where relevant, different scholarly perspectives on the narration.

**Future Content** — Biographies, books, documents, locations, media. All of it will follow the same pattern: data files drive the content, everything gets its own permanent shareable URL.

Every single page on this site has a permanent link. Nothing is hidden inside a popup. If you find something worth sharing, you can share the exact URL and someone else will land on the exact same page.





## Author

**Irshad Hossain** <br/>
[@Project_Safeenah](https://github.com/Safeenah)

*This project does not belong to any sect, school of thought, or organization. It belongs to the question — what actually happened?*
