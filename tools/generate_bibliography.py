import os
from pybtex.database.input import bibtex
from pybtex.plugin import find_plugin

parser = bibtex.Parser()
style = find_plugin("pybtex.style.formatting", "plain")()
backend = find_plugin("pybtex.backends", "plaintext")()


def load_bib(filename):
    return parser.parse_file(filename)


def format_title(entry):
    sentence = style.format_title(entry, "title")
    return sentence.render(backend)


def format_authors(persons, emphasize="Hicks"):
    authors = [
        (
            f"<strong>{' '.join(p.bibtex_first_names)} {' '.join(p.last_names)}</strong>"
            if emphasize and p.last_names[0] == emphasize
            else " ".join(p.bibtex_first_names + p.last_names)
        )
        for p in persons
    ]
    if len(authors) > 1:
        authors[-1] = "and " + authors[-1]
    authors[-1] += "."
    return ", ".join(authors)


def as_link(url, text):
    return f'<span>[ <a href="{url}" target="_blank">{text}</a> ]</span>'


def format_entry(entry, index, emphasize_author=None):
    entry_elements = [f"<dt>{index + 1}</dt>", "<dd>"]
    title = entry.fields["title"] + "." if entry.fields["title"][-1] != "." else ""
    authors = format_authors(entry.persons["author"], emphasize=emphasize_author)
    year = entry.fields["year"] + "." if entry.fields["year"][-1] != "." else ""

    links = [as_link(f"/bibtex/{entry.key}.bib", "bibtex")]
    if "url" in entry.fields:
        links.append(
            as_link(
                entry.fields["url"], "pdf" if "thesis" not in entry.type else "thesis"
            )
        )
    if "code" in entry.fields:
        links.append(as_link(entry.fields["code"], "code"))

    pub = entry.fields.get("journal", entry.fields.get("booktitle", "")) + "."
    entry_elements.extend(
        [f"<span>{authors}</span>", f"<span>{title}</span>", f"<span>{year}</span>"]
    )
    if pub:
        entry_elements.append(f"<em>{pub}</em>")
    entry_elements.append(f'<div>{" ".join(links)}</div>')
    entry_elements.append("</dd>")
    return " ".join(entry_elements)


def main():
    os.makedirs("./bibtex", exist_ok=True)
    bib_data = load_bib("./data/ref.bib")
    entries = list(reversed(list(bib_data.entries.items())))

    formatted_entries = [
        format_entry(entry, index)
        for index, (_, entry) in enumerate(entries)
        if entry.type in ["article", "inproceedings", "incollection"]
    ]
    master_entries = [
        format_entry(entry, index, emphasize_author=None)
        for index, (_, entry) in enumerate(entries)
        if entry.type in ["mastersthesis"]
    ]
    phd_entries = [
        format_entry(entry, index, emphasize_author=None)
        for index, (_, entry) in enumerate(entries)
        if entry.type in ["phdthesis"]
    ]

    print(f"Found {len(formatted_entries)} formatted entries.")
    print(f"Found {len(master_entries)} master entries.")
    print(f"Found {len(phd_entries)} phd entries.")

    if formatted_entries:
        with open("bibliography.html", "w") as f:
            f.write("<dl>" + "".join(formatted_entries) + "</dl>")
    if master_entries:
        with open("master.html", "w") as f:
            f.write("<dl>" + "".join(master_entries) + "</dl>")
    if phd_entries:
        with open("phd.html", "w") as f:
            f.write("<dl>" + "".join(phd_entries) + "</dl>")


if __name__ == "__main__":
    main()
