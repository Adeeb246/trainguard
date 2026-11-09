import Capacitor
import UIKit

/// Real Liquid Glass on iOS 26, which web code can't draw. The page says where its own tab bar is, this
/// sits exactly on top of it, and taps go back to the page, so the app's logic stays in one place.
/// Older iPhones never register this plugin and keep the web tab bar.
@available(iOS 26.0, *)
@objc(GlassTabBarPlugin)
public class GlassTabBarPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GlassTabBarPlugin"
    public let jsName = "GlassTabBar"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise)
    ]

    private static let tabs = [
        (id: "pass", symbol: "ticket.fill"),
        (id: "journey", symbol: "point.topleft.down.to.point.bottomright.curvepath.fill"),
        (id: "safety", symbol: "shield.fill")
    ]
    // The same colours as --live-text in app.css
    private static let accent = UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.431, green: 0.906, blue: 0.627, alpha: 1)
            : UIColor(red: 0.067, green: 0.420, blue: 0.200, alpha: 1)
    }

    private let group = UIVisualEffectView(effect: UIGlassContainerEffect())
    private let bar = UIVisualEffectView()
    private let add = UIVisualEffectView()
    private let lens = UIView()
    private let glass: UIGlassEffect = {
        let effect = UIGlassEffect()
        effect.isInteractive = true
        return effect
    }()
    private var tabButtons: [UIButton] = []
    private var plusButton: UIButton?
    private var isHidden: Bool?

    @objc func update(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [self] in
            guard let web = bridge?.webView,
                  let barFrame = frame(call, "bar"), let addFrame = frame(call, "add"),
                  let labels = call.getArray("labels", String.self), labels.count == Self.tabs.count else {
                call.reject("bar, add and labels are required")
                return
            }
            if group.superview == nil { build(on: web) }

            group.overrideUserInterfaceStyle = call.getBool("dark") ?? true ? .dark : .light
            group.frame = barFrame.union(addFrame)
            bar.frame = barFrame.offsetBy(dx: -group.frame.minX, dy: -group.frame.minY)
            add.frame = addFrame.offsetBy(dx: -group.frame.minX, dy: -group.frame.minY)
            plusButton?.accessibilityLabel = call.getString("addLabel")

            let selected = Self.tabs.firstIndex { $0.id == call.getString("tab") } ?? 0
            let inset: CGFloat = 4
            let width = (bar.bounds.width - inset * 2) / CGFloat(tabButtons.count)
            for (index, button) in tabButtons.enumerated() {
                button.frame = CGRect(x: inset + width * CGFloat(index), y: inset, width: width, height: bar.bounds.height - inset * 2)
                button.configuration?.title = labels[index]
                button.configuration?.baseForegroundColor = index == selected ? Self.accent : .label
                button.accessibilityTraits = index == selected ? [.button, .selected] : .button
            }
            let moveLens = { [self] in lens.frame = tabButtons[selected].frame }
            if isHidden == nil {
                moveLens()
            } else {
                UIView.animate(springDuration: 0.5, bounce: UIAccessibility.isReduceMotionEnabled ? 0 : 0.25, animations: moveLens)
            }

            let hidden = call.getBool("hidden") ?? false
            if hidden != isHidden {
                isHidden = hidden
                group.isUserInteractionEnabled = !hidden
                // Apple's way to bring glass in and out: animate the effect itself, not the view's opacity.
                UIView.animate(withDuration: 0.3) { [self] in
                    for view in [bar, add] {
                        view.effect = hidden ? nil : glass
                        view.contentView.alpha = hidden ? 0 : 1
                    }
                }
            }
            call.resolve()
        }
    }

    private func frame(_ call: CAPPluginCall, _ key: String) -> CGRect? {
        guard let box = call.getArray(key, Double.self), box.count == 4 else { return nil }
        return CGRect(x: box[0], y: box[1], width: box[2], height: box[3])
    }

    private func build(on web: UIView) {
        web.addSubview(group)
        group.contentView.addSubview(bar)
        group.contentView.addSubview(add)
        bar.cornerConfiguration = .capsule()
        add.cornerConfiguration = .capsule()

        lens.cornerConfiguration = .capsule()
        lens.backgroundColor = UIColor.label.withAlphaComponent(0.12)
        bar.contentView.addSubview(lens)
        bar.contentView.accessibilityTraits = .tabBar

        tabButtons = Self.tabs.map { tab in
            let button = makeButton(symbol: tab.symbol, pointSize: 20, script: "window.__tg.tab('\(tab.id)')")
            bar.contentView.addSubview(button)
            return button
        }

        let plus = makeButton(symbol: "plus", pointSize: 24, script: "window.__tg.add()")
        plus.configuration?.baseForegroundColor = Self.accent
        plus.frame = add.contentView.bounds
        plus.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        add.contentView.addSubview(plus)
        plusButton = plus
    }

    private func makeButton(symbol: String, pointSize: CGFloat, script: String) -> UIButton {
        var configuration = UIButton.Configuration.plain()
        configuration.image = UIImage(systemName: symbol)
        configuration.preferredSymbolConfigurationForImage = UIImage.SymbolConfiguration(pointSize: pointSize, weight: .semibold)
        configuration.imagePlacement = .top
        configuration.imagePadding = 3
        configuration.contentInsets = .zero
        configuration.titleLineBreakMode = .byTruncatingTail
        configuration.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { attributes in
            var attributes = attributes
            attributes.font = .systemFont(ofSize: 12, weight: .semibold)
            return attributes
        }
        let button = UIButton(configuration: configuration)
        button.addAction(UIAction { [weak self] _ in
            self?.bridge?.webView?.evaluateJavaScript(script, completionHandler: nil)
        }, for: .touchUpInside)
        return button
    }
}
