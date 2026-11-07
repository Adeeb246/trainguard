/**
 * TrainGuard - Gmail Add-on & Auto-Calendar Guard for IRCTC Tickets
 * Scans incoming IRCTC booking emails and creates Google Calendar events with 3 alarms.
 */

function processIrctcEmails() {
  var query = 'from:ticketadmin@irctc.co.in OR subject:"IRCTC" newer_than:2d';
  var threads = GmailApp.search(query, 0, 10);

  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();
    for (var j = 0; j < messages.length; j++) {
      var body = messages[j].getPlainBody();
      var ticket = parseTicketText(body);
      if (ticket && !messages[j].isStarred()) {
        createTrainCalendarEvent(ticket);
        messages[j].star(); // Mark as processed
      }
    }
  }
}

function createTrainCalendarEvent(ticket) {
  var title = ticket.trainNo + ' ' + ticket.trainName + ' · ' + ticket.coach + '/' + ticket.berthNo + ' · ' + ticket.time + ' ' + ticket.fromStn;
  var cal = CalendarApp.getDefaultCalendar();
  
  var desc = '🚂 TrainGuard Boarding Card\n' +
             'YOUR TRAIN: ' + ticket.trainNo + ' (' + ticket.trainName + ')\n' +
             'Coach: ' + ticket.coach + ' | Berth: ' + ticket.berthNo + '\n' +
             'PNR: ' + ticket.pnr + '\n';

  if (ticket.clash) {
    desc += '\n⚠️ CLASH WARNING: ' + ticket.clash.clashNo + ' ' + ticket.clash.clashName +
            ' departs nearby at ' + ticket.clash.clashTime + '. Make sure you board ' + ticket.trainNo + '!';
  }

  var now = new Date();
  var event = cal.createEvent(title, now, new Date(now.getTime() + 4 * 3600 * 1000), {
    description: desc,
    location: ticket.fromStn + ' Railway Station'
  });

  event.removeAllReminders();
  event.addPopupReminder(180); // 3 hours before
  event.addPopupReminder(60);  // 1 hour before
  event.addPopupReminder(15);  // 15 minutes before
}
