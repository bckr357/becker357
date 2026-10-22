#!/usr/bin/env python3
import hashlib
import html as html_lib
import json
import re
import sys
from pathlib import Path


def strip_html(value):
    value = "" if value is None else str(value)
    value = re.sub(r"<br\s*/?>", "\n", value, flags=re.IGNORECASE)
    value = re.sub(r"<[^>]+>", "", value)
    value = html_lib.unescape(value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def canonicalize_payload(payload):
    tasks = payload.get("tasks") or []
    normalized_tasks = [
        {
            "taskNumber": int((task or {}).get("taskNumber") or 0),
            "typeLabel": str((task or {}).get("typeLabel") or (task or {}).get("type") or ""),
            "prompt": strip_html((task or {}).get("promptHtml") or (task or {}).get("prompt") or ""),
            "userInput": str((task or {}).get("userInput") or ""),
            "correct": bool((task or {}).get("correct") or False),
            "solution": strip_html((task or {}).get("solutionHtml") or (task or {}).get("solution") or "")
        }
        for task in tasks
    ]
    visible_rows = []
    for task in normalized_tasks:
        visible_rows.append([
            str(task.get("taskNumber") or ""),
            str(task.get("typeLabel") or ""),
            task.get("prompt") or "",
            str(task.get("userInput") or ""),
            "Richtig" if bool(task.get("correct") or False) else "Falsch",
            task.get("solution") or ""
        ])
    return {
        "grade": int(payload.get("grade") or 0),
        "date": str(payload.get("date") or ""),
        "totalTasks": int(payload.get("totalTasks") or 0),
        "correct": int(payload.get("correct") or 0),
        "tasks": normalized_tasks,
        "visibleRows": visible_rows
    }


def extract_visible_rows_from_html(html_text):
    tbody_match = re.search(r"<tbody>(.*?)</tbody>", html_text, flags=re.IGNORECASE | re.DOTALL)
    if not tbody_match:
        return []

    rows = []
    for row in re.findall(r"<tr\b[^>]*>(.*?)</tr>", tbody_match.group(1), flags=re.IGNORECASE | re.DOTALL):
        cells = [
            strip_html(cell)
            for cell in re.findall(r"<td\b[^>]*>(.*?)</td>", row, flags=re.IGNORECASE | re.DOTALL)
        ]
        if cells:
            rows.append(cells)
    return rows


def read_export_id(html_text):
    match = re.search(r'<meta\s+name=["\']x-export-id["\']\s+content=["\']([^"\']+)["\']', html_text, flags=re.IGNORECASE)
    if not match:
        raise ValueError("Export-ID nicht gefunden.")
    return match.group(1)


def read_payload_json(html_text):
    match = re.search(r'<script[^>]*id=["\']result-payload["\'][^>]*>(.*?)</script>', html_text, flags=re.IGNORECASE | re.DOTALL)
    if not match:
        raise ValueError("Payload-Container nicht gefunden.")
    payload_text = match.group(1).strip()
    try:
        return json.loads(payload_text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Payload ist kein gültiges JSON: {exc}") from exc


def compute_export_id(payload, html_text):
    canonical = canonicalize_payload(payload)
    canonical["visibleRows"] = extract_visible_rows_from_html(html_text)
    payload_json = json.dumps(canonical, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    return hashlib.sha256(payload_json.encode("utf-8")).hexdigest()


def verify_file(path_str):
    path = Path(path_str).expanduser()
    if not path.exists():
        raise FileNotFoundError(f"Datei nicht gefunden: {path}")

    html_text = path.read_text(encoding="utf-8")
    export_id = read_export_id(html_text)
    payload = read_payload_json(html_text)
    actual_id = compute_export_id(payload, html_text)

    if actual_id == export_id:
        print(f"OK: {path} ist unverändert.")
        return True

    print(f"MANIPULIERT: {path} wurde verändert oder ist fehlerhaft.")
    print(f"Erwartet: {export_id}")
    print(f"Aktuell : {actual_id}")
    return False


def prompt_for_path(prompt_text):
    while True:
        user_input = input(prompt_text).strip()
        if user_input:
            return user_input
        print("Bitte einen Pfad eingeben.")


def prompt_yes_no(prompt_text):
    try:
        choice = input(prompt_text).strip().lower()
    except EOFError:
        return False
    return choice in {"j", "ja", "y", "yes"}


def main():
    while True:
        path_str = prompt_for_path("Pfad zur Exportdatei: ")
        if path_str.lower() in {"q", "quit", "exit"}:
            print("Programm beendet.")
            return

        try:
            verify_file(path_str)
        except Exception as exc:
            print(f"Fehler bei der Verifikation: {exc}")

        if not prompt_yes_no("Nächste Datei verifizieren? [j/n]: "):
            print("Programm beendet.")
            return


if __name__ == "__main__":
    if len(sys.argv) > 1:
        path_arg = sys.argv[1]
        if path_arg.lower() in {"-h", "--help"}:
            print("Verwendung: python verify_export.py [pfad_zu_datei.html]")
            print("Wenn kein Pfad übergeben wird, wird interaktiv nach der Datei gefragt.")
            sys.exit(0)
        try:
            verify_file(path_arg)
        except Exception as exc:
            print(f"Fehler bei der Verifikation: {exc}")
            sys.exit(1)
        while True:
            if not prompt_yes_no("Nächste Datei verifizieren? [j/n]: "):
                break
            path_str = prompt_for_path("Pfad zur nächsten Datei: ")
            try:
                verify_file(path_str)
            except Exception as exc:
                print(f"Fehler bei der Verifikation: {exc}")
        sys.exit(0)

    main()
