(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SJ63Meetings = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var TIME_ZONE = "America/Toronto";
  var PLACE = "55 Bridge Street, Carleton Place";
  var SKIP_MONTHS = { 6: true, 7: true, 8: true };
  var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function partsOf(date) {
    var fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23"
    });
    var parts = {};
    fmt.formatToParts(date).forEach(function (part) {
      parts[part.type] = part.value;
    });
    var hour = Number(parts.hour);
    if (hour === 24) hour = 0;
    return {
      year: Number(parts.year),
      month: Number(parts.month),
      day: Number(parts.day),
      hour: hour,
      minute: Number(parts.minute),
      weekday: parts.weekday
    };
  }

  function civilInstant(year, month, day) {
    return new Date(Date.UTC(year, month - 1, day, 17, 0, 0));
  }

  function weekdayIndex(year, month, day) {
    var label = partsOf(civilInstant(year, month, day)).weekday;
    return WEEKDAYS.indexOf(label);
  }

  function secondWednesday(year, month) {
    var first = weekdayIndex(year, month, 1);
    var firstWednesday = 1 + ((3 - first + 7) % 7);
    return firstWednesday + 7;
  }

  function firstEligible(year, month) {
    while (SKIP_MONTHS[month]) {
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
    return { year: year, month: month };
  }

  function nextEligibleMonth(year, month) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    return firstEligible(year, month);
  }

  function compareDate(year, month, day, otherYear, otherMonth, otherDay) {
    if (year !== otherYear) return year > otherYear ? 1 : -1;
    if (month !== otherMonth) return month > otherMonth ? 1 : -1;
    if (day !== otherDay) return day > otherDay ? 1 : -1;
    return 0;
  }

  function nextRegularMeeting(now) {
    var when = now instanceof Date ? now : new Date(now);
    var today = partsOf(when);
    var cursor = firstEligible(today.year, today.month);

    for (var i = 0; i < 16; i += 1) {
      var day = secondWednesday(cursor.year, cursor.month);
      var order = compareDate(cursor.year, cursor.month, day, today.year, today.month, today.day);
      if (order > 0) {
        return { year: cursor.year, month: cursor.month, day: day, tonight: false };
      }
      if (order === 0 && today.hour < 22) {
        return { year: cursor.year, month: cursor.month, day: day, tonight: true };
      }
      cursor = nextEligibleMonth(cursor.year, cursor.month);
    }
    return null;
  }

  function formatDate(meeting) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(civilInstant(meeting.year, meeting.month, meeting.day));
  }

  function meetingLine(meeting) {
    if (!meeting) return "";
    if (meeting.tonight) return "Tonight, 7:30 PM · " + PLACE;
    return formatDate(meeting) + " · 7:30 PM · " + PLACE;
  }

  function dateKey(year, month, day) {
    return year * 10000 + month * 100 + day;
  }

  function eventHasPassed(dateStr, now) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || "");
    if (!match) return false;
    var today = partsOf(now instanceof Date ? now : new Date(now));
    return dateKey(Number(match[1]), Number(match[2]), Number(match[3])) < dateKey(today.year, today.month, today.day);
  }

  function hidePastEvents(root, now) {
    if (!root || !root.querySelectorAll) return;
    var when = now instanceof Date ? now : new Date(now);
    root.querySelectorAll("[data-date]").forEach(function (card) {
      if (eventHasPassed(card.getAttribute("data-date"), when)) card.hidden = true;
    });
  }

  return {
    nextRegularMeeting: nextRegularMeeting,
    meetingLine: meetingLine,
    formatDate: formatDate,
    eventHasPassed: eventHasPassed,
    hidePastEvents: hidePastEvents
  };
});
