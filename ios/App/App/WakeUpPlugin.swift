import Capacitor
import CoreLocation
import Foundation
import SwiftUI
import UserNotifications
#if canImport(AlarmKit)
import AlarmKit
#endif

#if canImport(AlarmKit)
@available(iOS 26.0, *)
struct WakeUpAlarmMetadata: AlarmMetadata {}

/// A real alarm: AlarmKit rings through silent mode and Focus, which a notification can't do.
@available(iOS 26.0, *)
enum WakeUpAlarm {
    static func schedule(title: String, at date: Date) async throws -> UUID {
        let manager = AlarmManager.shared
        guard try await manager.requestAuthorization() == .authorized else {
            throw CocoaError(.userCancelled)
        }
        let emerald = Color(red: 0.29, green: 0.87, blue: 0.50)
        let alert = AlarmPresentation.Alert(
            title: LocalizedStringResource(stringLiteral: title),
            stopButton: AlarmButton(text: "Stop", textColor: emerald, systemImageName: "stop.circle"),
            secondaryButton: nil,
            secondaryButtonBehavior: nil
        )
        let attributes = AlarmAttributes(
            presentation: AlarmPresentation(alert: alert),
            metadata: WakeUpAlarmMetadata(),
            tintColor: emerald
        )
        let id = UUID()
        let configuration = AlarmManager.AlarmConfiguration<WakeUpAlarmMetadata>.alarm(
            schedule: .fixed(date),
            attributes: attributes
        )
        _ = try await manager.schedule(id: id, configuration: configuration)
        return id
    }

    static func cancel(_ id: UUID) {
        try? AlarmManager.shared.cancel(id: id)
    }
}
#endif

/// Wakes the passenger before their stop, by distance first and by the clock as a backup.
/// iOS relaunches the app in the background for region events, so this lives outside the
/// web view and has to be created at launch.
final class WakeUpManager: NSObject, CLLocationManagerDelegate {
    static let shared = WakeUpManager()

    struct Plan {
        let title: String
        let gps: Bool
        let latitude: Double
        let longitude: Double
        let backupDate: Date?
        let notBefore: Double
        let expires: Double
    }

    private enum Key {
        static let title = "wake.title"
        static let notBefore = "wake.notBefore"
        static let expires = "wake.expires"
        static let backupAlarm = "wake.backupAlarm"
    }
    private static let regionId = "trainguard.destination"
    private static let backupNotification = "trainguard.wake.backup"
    private static let gpsNotification = "trainguard.wake.gps"
    private static let radiusMeters = 20_000.0

    private let location = CLLocationManager()
    private let store = UserDefaults.standard

    private override init() {
        super.init()
        location.delegate = self
    }

    private var locationStatus: String {
        switch location.authorizationStatus {
        case .authorizedAlways: return "always"
        case .authorizedWhenInUse: return "whenInUse"
        case .denied, .restricted: return "denied"
        default: return "notDetermined"
        }
    }

    func schedule(_ plan: Plan) async -> [String: Any] {
        await cancel()
        store.set(plan.title, forKey: Key.title)
        store.set(plan.notBefore, forKey: Key.notBefore)
        store.set(plan.expires, forKey: Key.expires)
        var alarmSet = true
        if let date = plan.backupDate, date > Date() {
            alarmSet = await ring(title: plan.title, at: date, isBackup: true)
        }
        var status = ""
        await MainActor.run {
            if plan.gps { startRegion(latitude: plan.latitude, longitude: plan.longitude) }
            status = locationStatus
        }
        return ["alarm": alarmSet, "location": status]
    }

    func cancel() async {
        await MainActor.run {
            for region in location.monitoredRegions where region.identifier == Self.regionId {
                location.stopMonitoring(for: region)
            }
        }
        cancelBackup()
    }

    private func startRegion(latitude: Double, longitude: Double) {
        guard CLLocationManager.isMonitoringAvailable(for: CLCircularRegion.self) else { return }
        if location.authorizationStatus != .authorizedAlways { location.requestAlwaysAuthorization() }
        let region = CLCircularRegion(
            center: CLLocationCoordinate2D(latitude: latitude, longitude: longitude),
            radius: min(Self.radiusMeters, location.maximumRegionMonitoringDistance),
            identifier: Self.regionId
        )
        region.notifyOnEntry = true
        region.notifyOnExit = false
        location.startMonitoring(for: region)
    }

    func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
        guard region.identifier == Self.regionId else { return }
        let now = Date().timeIntervalSince1970
        if now > store.double(forKey: Key.expires) {
            manager.stopMonitoring(for: region)
            return
        }
        // Passing near the destination before the journey starts isn't arriving.
        if now < store.double(forKey: Key.notBefore) { return }
        manager.stopMonitoring(for: region)
        let title = store.string(forKey: Key.title) ?? "Wake up: your stop is close"
        let task = UIApplication.shared.beginBackgroundTask(expirationHandler: nil)
        Task {
            cancelBackup()
            _ = await ring(title: title, at: Date().addingTimeInterval(3), isBackup: false)
            UIApplication.shared.endBackgroundTask(task)
        }
    }

    private func ring(title: String, at date: Date, isBackup: Bool) async -> Bool {
        #if canImport(AlarmKit)
        if #available(iOS 26.0, *) {
            if let id = try? await WakeUpAlarm.schedule(title: title, at: date) {
                if isBackup { store.set(id.uuidString, forKey: Key.backupAlarm) }
                return true
            }
        }
        #endif
        return await notify(title: title, at: date, identifier: isBackup ? Self.backupNotification : Self.gpsNotification)
    }

    private func notify(title: String, at date: Date, identifier: String) async -> Bool {
        let center = UNUserNotificationCenter.current()
        guard (try? await center.requestAuthorization(options: [.alert, .sound])) == true else { return false }
        let content = UNMutableNotificationContent()
        content.title = title
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: max(1, date.timeIntervalSinceNow), repeats: false)
        return (try? await center.add(UNNotificationRequest(identifier: identifier, content: content, trigger: trigger))) != nil
    }

    private func cancelBackup() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [Self.backupNotification])
        #if canImport(AlarmKit)
        if #available(iOS 26.0, *), let raw = store.string(forKey: Key.backupAlarm), let id = UUID(uuidString: raw) {
            WakeUpAlarm.cancel(id)
        }
        #endif
        store.removeObject(forKey: Key.backupAlarm)
    }
}

@objc(WakeUpPlugin)
public class WakeUpPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WakeUpPlugin"
    public let jsName = "WakeUp"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "schedule", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancel", returnType: CAPPluginReturnPromise)
    ]

    @objc func schedule(_ call: CAPPluginCall) {
        guard let title = call.getString("title"), let expires = call.getDouble("expires") else {
            call.reject("title and expires are required")
            return
        }
        let backup = call.getBool("backup") ?? false
        let plan = WakeUpManager.Plan(
            title: title,
            gps: call.getBool("gps") ?? false,
            latitude: call.getDouble("latitude") ?? 0,
            longitude: call.getDouble("longitude") ?? 0,
            backupDate: backup ? call.getDouble("backupDate").map { Date(timeIntervalSince1970: $0 / 1000) } : nil,
            notBefore: (call.getDouble("notBefore") ?? 0) / 1000,
            expires: expires / 1000
        )
        Task {
            call.resolve(await WakeUpManager.shared.schedule(plan))
        }
    }

    @objc func cancel(_ call: CAPPluginCall) {
        Task {
            await WakeUpManager.shared.cancel()
            call.resolve()
        }
    }
}

/// Keeps the status bar readable when the app's own theme differs from the phone's.
@objc(AppChromePlugin)
public class AppChromePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppChromePlugin"
    public let jsName = "AppChrome"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setDark", returnType: CAPPluginReturnPromise)
    ]

    @objc func setDark(_ call: CAPPluginCall) {
        let dark = call.getBool("dark") ?? true
        DispatchQueue.main.async {
            (self.bridge?.viewController as? CAPBridgeViewController)?.setStatusBarStyle(dark ? .lightContent : .darkContent)
            call.resolve()
        }
    }
}
