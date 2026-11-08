import Foundation
import Capacitor
import ActivityKit
import EventKit

@available(iOS 16.2, *)
@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiveActivityPlugin"
    public let jsName = "LiveActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "addToCalendar", returnType: CAPPluginReturnPromise)
    ]

    private func endRunningActivities() async {
        for activity in Activity<TrainGuardAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
    }

    @objc func startActivity(_ call: CAPPluginCall) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            call.reject("Live Activities are not enabled by the user")
            return
        }
        guard let trainNumber = call.getString("trainNumber"), let etaMinutes = call.getInt("etaMinutes") else {
            call.reject("trainNumber and etaMinutes are required")
            return
        }

        let attributes = TrainGuardAttributes(
            trainNumber: trainNumber,
            trainName: call.getString("trainName") ?? "",
            coach: call.getString("coach") ?? "—",
            seat: call.getString("seat") ?? "—"
        )
        let state = TrainGuardAttributes.ContentState(
            platform: call.getString("platform") ?? "PF ?",
            departureTime: call.getString("departureTime") ?? "",
            countdownDate: Date().addingTimeInterval(TimeInterval(etaMinutes * 60)),
            hasClash: call.getBool("hasClash") ?? false,
            clashDetails: call.getString("clashDetails") ?? ""
        )

        Task {
            // Activities outlive the app, so the one from an earlier launch has to be ended too.
            await endRunningActivities()
            do {
                let activity = try Activity.request(attributes: attributes, content: .init(state: state, staleDate: nil))
                call.resolve(["activityId": activity.id, "status": "started"])
            } catch {
                call.reject("Failed to start Live Activity: \(error.localizedDescription)")
            }
        }
    }

    @objc func stopActivity(_ call: CAPPluginCall) {
        Task {
            await endRunningActivities()
            call.resolve(["status": "stopped"])
        }
    }

    @objc func addToCalendar(_ call: CAPPluginCall) {
        let title = call.getString("title") ?? "Train Journey"
        let location = call.getString("location") ?? ""
        let notes = call.getString("notes") ?? ""
        let startTimestamp = call.getDouble("startDate") ?? (Date().timeIntervalSince1970 * 1000)
        let endTimestamp = call.getDouble("endDate") ?? (startTimestamp + (8 * 3600 * 1000))
        let alarmMinutes = call.getArray("alarmMinutes")?.compactMap { ($0 as? NSNumber)?.intValue } ?? []

        let eventStore = EKEventStore()
        let startDate = Date(timeIntervalSince1970: startTimestamp / 1000.0)
        let endDate = Date(timeIntervalSince1970: endTimestamp / 1000.0)

        let saveHandler: (Bool, Error?) -> Void = { granted, error in
            guard granted && error == nil else {
                call.reject("Calendar permission denied or error: \(error?.localizedDescription ?? "Not authorized")")
                return
            }

            let event = EKEvent(eventStore: eventStore)
            event.title = title
            event.startDate = startDate
            event.endDate = endDate
            event.location = location
            event.notes = notes
            event.calendar = eventStore.defaultCalendarForNewEvents
            for minutes in alarmMinutes {
                event.addAlarm(EKAlarm(relativeOffset: TimeInterval(-minutes * 60)))
            }

            do {
                try eventStore.save(event, span: .thisEvent)
                call.resolve([
                    "status": "saved",
                    "eventId": event.eventIdentifier ?? ""
                ])
            } catch {
                call.reject("Failed to save event to Apple Calendar: \(error.localizedDescription)")
            }
        }

        if #available(iOS 17.0, *) {
            eventStore.requestWriteOnlyAccessToEvents(completion: saveHandler)
        } else {
            eventStore.requestAccess(to: .event, completion: saveHandler)
        }
    }
}
