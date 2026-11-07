import Foundation
import Capacitor
import ActivityKit

@available(iOS 16.1, *)
@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiveActivityPlugin"
    public let jsName = "LiveActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopActivity", returnType: CAPPluginReturnPromise)
    ]

    private var currentActivity: Activity<TrainGuardAttributes>? = nil

    @objc func startActivity(_ call: CAPPluginCall) {
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
}

