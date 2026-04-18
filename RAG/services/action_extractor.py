import re
from datetime import datetime, timedelta, timezone


DATE_PATTERN = re.compile(r'\b(\d{4}-\d{2}-\d{2})\b')
SLASH_DATE_PATTERN = re.compile(r'\b(\d{1,2})/(\d{1,2})/(20\d{2})\b')
RELATIVE_PATTERN = re.compile(r'\b(?:by|in|within|before)\s+(\d+)\s+(minutes?|hours?|days?|weeks?)\b', re.I)
KEYWORD_PREFIX = re.compile(r'^(todo|action|follow up|follow-up|next step|next steps|reminder)\s*:\s*', re.I)
CHECKLIST_PREFIX = re.compile(r'^[-*]\s+|\[[ xX]?\]\s*')


def _normalize_due_date(line):
    iso_match = DATE_PATTERN.search(line)
    if iso_match:
        return f"{iso_match.group(1)}T09:00:00+00:00"

    slash_match = SLASH_DATE_PATTERN.search(line)
    if slash_match:
        day, month, year = slash_match.groups()
        return datetime(int(year), int(month), int(day), 9, 0, tzinfo=timezone.utc).isoformat()

    relative_match = RELATIVE_PATTERN.search(line)
    if relative_match:
        amount = int(relative_match.group(1))
        unit = relative_match.group(2).lower()
        now = datetime.now(timezone.utc)
        if unit.startswith('minute'):
            due = now + timedelta(minutes=amount)
        elif unit.startswith('hour'):
            due = now + timedelta(hours=amount)
        elif unit.startswith('day'):
            due = now + timedelta(days=amount)
        else:
            due = now + timedelta(weeks=amount)
        return due.isoformat()

    lower = line.lower()
    if 'tomorrow' in lower:
        return (datetime.now(timezone.utc) + timedelta(days=1)).replace(hour=9, minute=0, second=0, microsecond=0).isoformat()
    if 'today' in lower:
        return datetime.now(timezone.utc).replace(hour=17, minute=0, second=0, microsecond=0).isoformat()
    return None


def _clean_action_title(line):
    without_prefix = KEYWORD_PREFIX.sub('', line).strip()
    return re.sub(r'\s+', ' ', without_prefix).strip(' -')


def extract_action_candidates(text):
    reminders = []
    checklist_items = []
    email_followups = []

    if not text:
        return {'reminders': reminders, 'checklists': [], 'emails': []}

    lines = [line.strip() for line in text.splitlines() if line.strip()]

    for line in lines:
        lower = line.lower()
        due_date = _normalize_due_date(line)

        if KEYWORD_PREFIX.match(line) or any(marker in lower for marker in ('please follow up', 'need to', 'must ', 'action item')):
            title = _clean_action_title(line)
            if title:
                reminders.append({
                    'title': title[:160],
                    'description': line[:400],
                    'remind_at': due_date,
                    'source': 'text-scan',
                    'category': 'imported',
                })
            continue

        if CHECKLIST_PREFIX.match(line):
            item = CHECKLIST_PREFIX.sub('', line).strip()
            if item:
                checklist_items.append({
                    'item_text': item[:200],
                    'priority': 'medium',
                    'due_date': due_date,
                })
            continue

        if lower.startswith(('from:', 'subject:', 'date:')):
            continue

        if '@' in line and any(keyword in lower for keyword in ('reply', 'email', 'send', 'draft')):
            email_followups.append({
                'title': _clean_action_title(line)[:160],
                'description': line[:400],
                'remind_at': due_date,
                'source': 'email-scan',
            })

    checklists = []
    if checklist_items:
        checklists.append({
            'title': 'Imported Actions',
            'description': 'Extracted automatically from imported content',
            'items': checklist_items,
        })

    return {
        'reminders': reminders,
        'checklists': checklists,
        'emails': email_followups,
    }
