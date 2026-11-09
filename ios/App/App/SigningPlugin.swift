import Capacitor
import Foundation

/// An app signed with a free Apple ID stops opening when its profile expires, after 7 days.
/// This tells the page when that is, so it can warn if a trip falls after it.
/// App Store builds have no profile, so they never warn.
@objc(SigningPlugin)
public class SigningPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SigningPlugin"
    public let jsName = "Signing"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "expiry", returnType: CAPPluginReturnPromise)
    ]

    @objc func expiry(_ call: CAPPluginCall) {
        if let date = Self.profileExpiry() {
            call.resolve(["date": date.timeIntervalSince1970 * 1000])
        } else {
            call.resolve()
        }
    }

    private static func profileExpiry() -> Date? {
        // The profile is a signed wrapper around a plain XML plist, so the plist can be cut out as text.
        guard let url = Bundle.main.url(forResource: "embedded", withExtension: "mobileprovision"),
              let raw = try? Data(contentsOf: url),
              let text = String(data: raw, encoding: .isoLatin1),
              let start = text.range(of: "<?xml"),
              let end = text.range(of: "</plist>"),
              let xml = String(text[start.lowerBound..<end.upperBound]).data(using: .isoLatin1),
              let plist = try? PropertyListSerialization.propertyList(from: xml, options: [], format: nil) as? [String: Any]
        else { return nil }
        return plist["ExpirationDate"] as? Date
    }
}
