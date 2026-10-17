var meetings = require("./meetings.js");

function atToronto(year, month, day, hour, minute) {
  var wanted = Date.UTC(year, month - 1, day, hour, minute);
  var utc = wanted;
  var fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });
  for (var i = 0; i < 4; i += 1) {
    var parts = {};
    fmt.formatToParts(new Date(utc)).forEach(function (part) {
      parts[part.type] = part.value;
    });
    var hourValue = Number(parts.hour);
    if (hourValue === 24) hourValue = 0;
    var seen = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), hourValue, Number(parts.minute));
    if (seen === wanted) return new Date(utc);
    utc += wanted - seen;
  }
  return new Date(utc);
}

var failed = 0;

function check(name, ok) {
  if (ok) {
    console.log("ok  " + name);
    return;
  }
  failed += 1;
  console.error("FAIL " + name);
}

var oct17 = meetings.nextRegularMeeting(atToronto(2026, 10, 17, 12, 0));
check("Oct 17 2026 gives Nov 11 2026", oct17 && oct17.year === 2026 && oct17.month === 11 && oct17.day === 11 && !oct17.tonight);
check(
  "Oct 17 line names the November meeting",
  meetings.meetingLine(oct17) === "Wednesday, November 11, 2026 · 7:30 PM · 55 Bridge Street, Carleton Place"
);

var may14 = meetings.nextRegularMeeting(atToronto(2026, 5, 14, 12, 0));
check("May 14 2026 gives Sep 9 2026", may14 && may14.year === 2026 && may14.month === 9 && may14.day === 9 && !may14.tonight);

var tonight = meetings.nextRegularMeeting(atToronto(2026, 11, 11, 18, 0));
check("Nov 11 2026 at 6 PM gives Tonight", tonight && tonight.tonight && meetings.meetingLine(tonight).indexOf("Tonight, 7:30 PM") === 0);

var afterTen = meetings.nextRegularMeeting(atToronto(2026, 11, 11, 22, 0));
check("Nov 11 2026 at 10 PM gives Dec 9 2026", afterTen && !afterTen.tonight && afterTen.month === 12 && afterTen.day === 9);

var june = meetings.nextRegularMeeting(atToronto(2026, 6, 1, 9, 0));
check("June 1 2026 skips to Sep 9 2026", june && june.month === 9 && june.day === 9);

var mayMeeting = meetings.nextRegularMeeting(atToronto(2026, 5, 13, 21, 30));
check("May 13 2026 at 9:30 PM is Tonight", mayMeeting && mayMeeting.tonight);

var passedToday = meetings.eventHasPassed("2026-10-16", atToronto(2026, 10, 17, 16, 0));
var stillToday = meetings.eventHasPassed("2026-10-17", atToronto(2026, 10, 17, 16, 0));
var future = meetings.eventHasPassed("2026-11-11", atToronto(2026, 10, 17, 16, 0));
check("Oct 16 has passed on Oct 17", passedToday === true);
check("Oct 17 has not passed on Oct 17", stillToday === false);
check("Nov 11 has not passed on Oct 17", future === false);

if (failed) {
  console.error(failed + " check(s) failed");
  process.exit(1);
}
console.log("all meeting checks passed");
