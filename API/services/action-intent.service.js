function normalizeWhitespace(value) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function toSentenceCase(value) {
  const text = normalizeWhitespace(value);
  if (!text) {
    return text;
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function stripLeadingFiller(text) {
  return normalizeWhitespace(
    text
      .replace(/^(that|saying that|saying|about)\s+/i, '')
      .replace(/^(i need to|i have to|please)\s+/i, '')
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractTime(text) {
  const match = text.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|am|pm|o'?clock)?\b/i);
  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = (match[3] || '').toLowerCase();

  if (meridiem && meridiem !== "o'clock" && meridiem !== 'oclock') {
    if (meridiem.startsWith('p') && hour < 12) {
      hour += 12;
    }
    if (meridiem.startsWith('a') && hour === 12) {
      hour = 0;
    }
  }

  if (!meridiem && hour <= 7) {
    hour += 12;
  }

  return { hour, minute, raw: match[0] };
}

function extractDate(text) {
  const now = new Date();
  const lower = text.toLowerCase();
  const date = new Date(now);
  const relativeMatch = lower.match(/\bin\s+(\d+)\s+(second|seconds|sec|secs|minute|minutes|min|mins|hour|hours|day|days|week|weeks)\b/);

  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const unit = relativeMatch[2];
    const relativeDate = new Date(now);

    if (unit.startsWith('sec')) {
      relativeDate.setSeconds(relativeDate.getSeconds() + amount);
    } else if (unit.startsWith('min')) {
      relativeDate.setMinutes(relativeDate.getMinutes() + amount);
    } else if (unit.startsWith('hour')) {
      relativeDate.setHours(relativeDate.getHours() + amount);
    } else if (unit.startsWith('day')) {
      relativeDate.setDate(relativeDate.getDate() + amount);
    } else if (unit.startsWith('week')) {
      relativeDate.setDate(relativeDate.getDate() + (amount * 7));
    }

    return { date: relativeDate, raw: relativeMatch[0], relative: true };
  }

  if (lower.includes('day after tomorrow')) {
    date.setDate(date.getDate() + 2);
    return { date, raw: 'day after tomorrow' };
  }

  if (lower.includes('tomorrow')) {
    date.setDate(date.getDate() + 1);
    return { date, raw: 'tomorrow' };
  }

  if (lower.includes('today')) {
    return { date, raw: 'today' };
  }

  if (lower.includes('next week')) {
    date.setDate(date.getDate() + 7);
    return { date, raw: 'next week' };
  }

  if (lower.includes('this evening')) {
    date.setHours(18, 0, 0, 0);
    return { date, raw: 'this evening', timeLocked: true };
  }

  if (lower.includes('tonight')) {
    date.setHours(20, 0, 0, 0);
    return { date, raw: 'tonight', timeLocked: true };
  }

  const weekdayMatch = lower.match(/\b(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
  if (weekdayMatch) {
    const weekdayMap = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    const target = weekdayMap[weekdayMatch[2]];
    const current = now.getDay();
    let delta = (target - current + 7) % 7;
    if (delta === 0 || weekdayMatch[1]) {
      delta += 7;
    }
    date.setDate(date.getDate() + delta);
    return { date, raw: weekdayMatch[0] };
  }

  const isoMatch = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    return {
      date: new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])),
      raw: isoMatch[0],
    };
  }

  const slashMatch = text.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/);
  if (slashMatch) {
    return {
      date: new Date(Number(slashMatch[3]), Number(slashMatch[2]) - 1, Number(slashMatch[1])),
      raw: slashMatch[0],
    };
  }

  return null;
}

function buildReminderDate(text) {
  const dateInfo = extractDate(text);
  if (!dateInfo) {
    return null;
  }

  if (dateInfo.relative) {
    return {
      remindAt: dateInfo.date.toISOString(),
      dateText: dateInfo.raw,
      timeText: null,
    };
  }

  const remindAt = new Date(dateInfo.date);
  if (!dateInfo.timeLocked) {
    const timeInfo = extractTime(text) || { hour: 9, minute: 0, raw: null };
    remindAt.setHours(timeInfo.hour, timeInfo.minute, 0, 0);

    return {
      remindAt: remindAt.toISOString(),
      dateText: dateInfo.raw,
      timeText: timeInfo.raw,
    };
  }

  return {
    remindAt: remindAt.toISOString(),
    dateText: dateInfo.raw,
    timeText: dateInfo.raw,
  };
}

function extractReminderTitle(text) {
  const patterns = [
    /\bsaying that\s+(.+)$/i,
    /\bthat\s+(.+)$/i,
    /\babout\s+(.+)$/i,
    /\bto\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const cleaned = stripLeadingFiller(match[1]);
      if (cleaned) {
        return toSentenceCase(cleaned);
      }
    }
  }

  return '';
}

function extractReminderReference(text) {
  const patterns = [
    /\breminder\s+(?:called|named|about|for)\s+(.+)$/i,
    /\breminder\s+(.+)$/i,
    /\bthat says\s+(.+)$/i,
    /\bto\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const cleaned = stripLeadingFiller(match[1]);
      if (cleaned) {
        return toSentenceCase(cleaned);
      }
    }
  }

  return '';
}

function parseReminderIntent(text) {
  const lower = text.toLowerCase();
  if (!/(remind me|set (?:me )?a reminder|add (?:me )?a reminder|create (?:me )?a reminder|add reminder|create reminder)/i.test(lower)) {
    return null;
  }

  const when = buildReminderDate(text);
  const title = extractReminderTitle(text);
  if (!when || !title) {
    return {
      type: 'reminder',
      valid: false,
      missing: !when ? 'date/time' : 'title',
    };
  }

  return {
    type: 'reminder',
    valid: true,
    payload: {
      title,
      description: '',
      remind_at: when.remindAt,
      recurrence: '',
      priority: 'medium',
      category: 'general',
      notes: `Created from chat: ${normalizeWhitespace(text)}`,
      email_notify: false,
    },
  };
}

function parseReminderCompletionIntent(text) {
  if (!/\b(mark|complete|finish|done)\b/i.test(text) || !/\breminder\b/i.test(text)) {
    return null;
  }

  const reference = extractReminderReference(text);
  return {
    type: 'reminder_complete',
    valid: Boolean(reference),
    missing: reference ? null : 'reminder title',
    payload: { title: reference },
  };
}

function parseReminderDeleteIntent(text) {
  if (!/\b(delete|remove|cancel)\b/i.test(text) || !/\breminder\b/i.test(text)) {
    return null;
  }

  const reference = extractReminderReference(text);
  return {
    type: 'reminder_delete',
    valid: Boolean(reference),
    missing: reference ? null : 'reminder title',
    payload: { title: reference },
  };
}

function parseReminderSnoozeIntent(text) {
  if (!/\b(snooze|delay|postpone|push)\b/i.test(text) || !/\breminder\b/i.test(text)) {
    return null;
  }

  const reference = extractReminderReference(text);
  const when = buildReminderDate(text);
  if (!reference) {
    return { type: 'reminder_snooze', valid: false, missing: 'reminder title' };
  }
  if (!when) {
    return { type: 'reminder_snooze', valid: false, missing: 'new date/time' };
  }

  return {
    type: 'reminder_snooze',
    valid: true,
    payload: {
      title: reference,
      remind_at: when.remindAt,
    },
  };
}

function parseReminderListIntent(text) {
  if (!/\b(show|list|what|which)\b/i.test(text) || !/\b(reminders?|tasks?|checklists?)\b/i.test(text)) {
    return null;
  }

  const history = /\b(completed|finished|history|past)\b/i.test(text);
  const when = buildReminderDate(text);

  return {
    type: 'reminder_list',
    valid: true,
    payload: {
      remind_at: when?.remindAt || null,
      history,
      entity: /\bchecklists?\b/i.test(text) ? 'checklist' : /\btasks?\b/i.test(text) ? 'task' : 'reminder',
    },
  };
}

function parseReminderEditIntent(text) {
  if (!/\b(edit|update|change|move|reschedule)\b/i.test(text) || !/\breminder\b/i.test(text)) {
    return null;
  }

  const titleMatch = text.match(/\breminder\s+(?:called|named|about|for)?\s*(.+?)(?:\s+(?:to|for|at|on)\b|$)/i);
  const reference = toSentenceCase(stripLeadingFiller(titleMatch?.[1] || ''));
  const when = buildReminderDate(text);
  const newTitleMatch = text.match(/\b(?:to say|to be|to)\s+(.+)$/i);
  const nextTitle = newTitleMatch?.[1] ? toSentenceCase(stripLeadingFiller(newTitleMatch[1])) : '';

  if (!reference) {
    return { type: 'reminder_edit', valid: false, missing: 'reminder title' };
  }
  if (!when && !nextTitle) {
    return { type: 'reminder_edit', valid: false, missing: 'updated date/time or title' };
  }

  return {
    type: 'reminder_edit',
    valid: true,
    payload: {
      title: reference,
      nextTitle,
      remind_at: when?.remindAt || null,
    },
  };
}

function parseChecklistItems(text) {
  const colonSplit = text.split(':');
  const trailing = colonSplit.length > 1 ? colonSplit.slice(1).join(':') : text;
  return trailing
    .split(/\n|,(?![^\[]*\])|\band\b/gi)
    .map((item) => normalizeWhitespace(item.replace(/^(with|items?|item)\s+/i, '')))
    .filter(Boolean)
    .map((item) => ({ item_text: toSentenceCase(item), priority: 'medium' }));
}

function parseChecklistIntent(text) {
  if (!/\b(checklist|to-do list|todo list)\b/i.test(text)) {
    return null;
  }

  const titleMatch = text.match(/\b(?:called|named|for)\s+(.+?)(?:\s+with\b|:|$)/i);
  const title = toSentenceCase(titleMatch?.[1] || 'Checklist');
  const items = parseChecklistItems(text);

  return {
    type: 'checklist',
    valid: true,
    payload: {
      title,
      description: 'Created from chat',
      due_date: null,
      items,
    },
  };
}

function parseTaskIntent(text) {
  if (!/\b(add|create)\s+(?:a\s+)?(?:task|todo|to-do)\b/i.test(text)) {
    return null;
  }

  const description = text
    .replace(/\b(add|create)\s+(?:a\s+)?(?:task|todo|to-do)\b/i, '')
    .replace(/\b(?:to|for)\b/i, '')
    .trim();

  const cleaned = stripLeadingFiller(description);
  if (!cleaned) {
    return { type: 'task', valid: false, missing: 'task title' };
  }

  return {
    type: 'task',
    valid: true,
    payload: {
      checklistTitle: 'Task Inbox',
      item_text: toSentenceCase(cleaned),
      priority: 'medium',
      due_date: buildReminderDate(text)?.remindAt || null,
    },
  };
}

function parseTaskCompletionIntent(text) {
  if (!/\b(mark|complete|finish|done)\b/i.test(text) || !/\b(task|todo|to-do|checklist item)\b/i.test(text)) {
    return null;
  }

  const match = text.match(/\b(?:task|todo|to-do|checklist item)\s+(?:called|named|about|for)?\s*(.+)$/i);
  const title = toSentenceCase(stripLeadingFiller(match?.[1] || ''));
  return {
    type: 'task_complete',
    valid: Boolean(title),
    missing: title ? null : 'task title',
    payload: { title },
  };
}

function parseTaskDeleteIntent(text) {
  if (!/\b(delete|remove|cancel)\b/i.test(text) || !/\b(task|todo|to-do|checklist item)\b/i.test(text)) {
    return null;
  }

  const match = text.match(/\b(?:task|todo|to-do|checklist item)\s+(?:called|named|about|for)?\s*(.+)$/i);
  const title = toSentenceCase(stripLeadingFiller(match?.[1] || ''));
  return {
    type: 'task_delete',
    valid: Boolean(title),
    missing: title ? null : 'task title',
    payload: { title },
  };
}

function parseTaskEditIntent(text) {
  if (!/\b(edit|update|change|move|reschedule)\b/i.test(text) || !/\b(task|todo|to-do)\b/i.test(text)) {
    return null;
  }

  const match = text.match(/\b(?:task|todo|to-do)\s+(?:called|named|about|for)?\s*(.+?)(?:\s+(?:to|for|at|on)\b|$)/i);
  const title = toSentenceCase(stripLeadingFiller(match?.[1] || ''));
  const when = buildReminderDate(text);
  const renameMatch = text.match(/\b(?:to say|to be|to)\s+(.+)$/i);
  const nextTitle = renameMatch?.[1] ? toSentenceCase(stripLeadingFiller(renameMatch[1])) : '';

  if (!title) {
    return { type: 'task_edit', valid: false, missing: 'task title' };
  }
  if (!when && !nextTitle) {
    return { type: 'task_edit', valid: false, missing: 'updated date/time or title' };
  }

  return {
    type: 'task_edit',
    valid: true,
    payload: {
      title,
      nextTitle,
      due_date: when?.remindAt || null,
    },
  };
}

function parseChecklistCompletionIntent(text) {
  if (!/\b(mark|complete|finish|done)\b/i.test(text) || !/\bchecklist\b/i.test(text)) {
    return null;
  }
  const match = text.match(/\bchecklist\s+(?:called|named|for)?\s*(.+)$/i);
  const title = toSentenceCase(stripLeadingFiller(match?.[1] || ''));
  return {
    type: 'checklist_complete',
    valid: Boolean(title),
    missing: title ? null : 'checklist title',
    payload: { title },
  };
}

function parseChecklistDeleteIntent(text) {
  if (!/\b(delete|remove|cancel)\b/i.test(text) || !/\bchecklist\b/i.test(text)) {
    return null;
  }
  const match = text.match(/\bchecklist\s+(?:called|named|for)?\s*(.+)$/i);
  const title = toSentenceCase(stripLeadingFiller(match?.[1] || ''));
  return {
    type: 'checklist_delete',
    valid: Boolean(title),
    missing: title ? null : 'checklist title',
    payload: { title },
  };
}

function findBestTaskReference(text) {
  const lower = text.toLowerCase();
  const patterns = [
    /\b(?:task|todo|to-do|checklist item)\s+(?:called|named|about|for)?\s*(.+)$/i,
    /\b(?:to)\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const candidate = toSentenceCase(stripLeadingFiller(match[1]));
      if (candidate && !/\b(today|tomorrow|tonight|this evening|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(candidate)) {
        return candidate;
      }
    }
  }

  return lower.includes('last task') ? '__last__' : '';
}

function buildSearchRegex(query) {
  const escaped = escapeRegExp(query).replace(/\s+/g, '.*');
  return new RegExp(escaped, 'i');
}

function detectActionIntent(text) {
  const normalized = normalizeWhitespace(text);
  return (
    parseReminderListIntent(normalized) ||
    parseReminderSnoozeIntent(normalized) ||
    parseReminderDeleteIntent(normalized) ||
    parseReminderCompletionIntent(normalized) ||
    parseReminderEditIntent(normalized) ||
    parseReminderIntent(normalized) ||
    parseChecklistDeleteIntent(normalized) ||
    parseChecklistCompletionIntent(normalized) ||
    parseChecklistIntent(normalized) ||
    parseTaskDeleteIntent(normalized) ||
    parseTaskCompletionIntent(normalized) ||
    parseTaskEditIntent(normalized) ||
    parseTaskIntent(normalized)
  );
}

module.exports = {
  detectActionIntent,
  buildSearchRegex,
  findBestTaskReference,
};
