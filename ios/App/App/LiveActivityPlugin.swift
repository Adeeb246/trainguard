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
        CAPPluginMethod(name: "updateActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "addToCalendar", returnType: CAPPluginReturnPromise)
    ]

    private var currentActivity: Activity<TrainGuardAttributes>? = nil

    @objc func startActivity(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else {
            call.reject("Live Activities require iOS 16.2 or newer")
            return
        }
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            call.reject("Live Activities are not enabled by the user")
            return
        }

        let trainNumber = call.getString("trainNumber") ?? "16629"
        let trainName = call.getString("trainName") ?? "Malabar Express"
        let coach = call.getString("coach") ?? "B4"
        let seat = call.getString("seat") ?? "31"
        let platform = call.getString("platform") ?? "PF 2"
        let departureTime = call.getString("departureTime") ?? "18:40"
        let etaMinutes = call.getInt("etaMinutes") ?? 105
        let hasClash = call.getBool("hasClash") ?? false
        let clashDetails = call.getString("clashDetails") ?? ""

        let attributes = TrainGuardAttributes(
            trainNumber: trainNumber,
            trainName: trainName,
            coach: coach,
            seat: seat
        )

        let initialContentState = TrainGuardAttributes.ContentState(
            platform: platform,
            departureTime: departureTime,
            countdownDate: Date().addingTimeInterval(TimeInterval(etaMinutes * 60)),
            hasClash: hasClash,
            clashDetails: clashDetails
        )

        do {
            let activity = try Activity.request(
                attributes: attributes,
                content: .init(state: initialContentState, staleDate: nil)
            )
            self.currentActivity = activity
            call.resolve([
                "activityId": activity.id,
                "status": "started"
            ])
        } catch {
            call.reject("Failed to start Live Activity: \(error.localizedDescription)")
        }
    }

    @objc func updateActivity(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else {
            call.reject("Live Activities require iOS 16.2 or newer")
            return
        }
        guard let activity = currentActivity else {
            call.reject("No active Live Activity to update")
            return
        }

        let platform = call.getString("platform") ?? "PF 2"
        let departureTime = call.getString("departureTime") ?? "18:40"
        let etaMinutes = call.getInt("etaMinutes") ?? 105
        let hasClash = call.getBool("hasClash") ?? false
        let clashDetails = call.getString("clashDetails") ?? ""

        let updatedContentState = TrainGuardAttributes.ContentState(
            platform: platform,
            departureTime: departureTime,
            countdownDate: Date().addingTimeInterval(TimeInterval(etaMinutes * 60)),
            hasClash: hasClash,
            clashDetails: clashDetails
        )

        Task {
            await activity.update(
                ActivityContent<TrainGuardAttributes.ContentState>(
                    state: updatedContentState,
                    staleDate: nil
                )
            )
            call.resolve(["status": "updated"])
        }
    }

    @objc func stopActivity(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else {
            call.resolve(["status": "unsupported"])
            return
        }
        guard let activity = currentActivity else {
            call.resolve(["status": "already_stopped"])
            return
        }

        Task {
            await activity.end(nil, dismissalPolicy: .immediate)
            self.currentActivity = nil
            call.resolve(["status": "stopped"])
        }
    }

    @objc func addToCalendar(_ call: CAPPluginCall) {
        let title = call.getString("title") ?? "Train Journey"
        let location = call.getString("location") ?? ""
        let notes = call.getString("notes") ?? ""
        let startTimestamp = call.getDouble("startDate") ?? (Date().timeIntervalSince1970 * 1000)
        let endTimestamp = call.getDouble("endDate") ?? (startTimestamp + (8 * 3600 * 1000))

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

            // Boarding Alert: 45 minutes before departure
            let alarm = EKAlarm(relativeOffset: -45 * 60)
            event.addAlarm(alarm)

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
