import WidgetKit
import SwiftUI
import ActivityKit

@available(iOS 16.1, *)
struct TrainGuardIslandWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TrainGuardAttributes.self) { context in
            // ==========================================
            // LOCK SCREEN LIVE ACTIVITY BANNER
            // ==========================================
            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .center) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(context.attributes.trainName)
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(.white)
                        Text("Coach \(context.attributes.coach) • Seat \(context.attributes.seat)")
                            .font(.system(size: 12, weight: .medium, design: .monospaced))
                            .foregroundColor(Color(red: 0.77, green: 0.63, blue: 0.35)) // #C5A059 Gold
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(context.state.platform)
                            .font(.system(size: 13, weight: .bold, design: .monospaced))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(Color.white.opacity(0.12))
                            .cornerRadius(6)
                            .foregroundColor(.white)
                        
                        Text(timerInterval: Date()...context.state.countdownDate, countsDown: true)
                            .font(.system(size: 12, weight: .semibold, design: .monospaced))
                            .foregroundColor(Color(red: 0.20, green: 0.78, blue: 0.35)) // #34C759 Green
                    }
                }

                if context.state.hasClash {
                    HStack(spacing: 6) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(Color(red: 1.0, green: 0.27, blue: 0.23))
                            .font(.system(size: 12))
                        Text(context.state.clashDetails)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(Color(red: 1.0, green: 0.27, blue: 0.23))
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color(red: 1.0, green: 0.27, blue: 0.23).opacity(0.15))
                    .cornerRadius(8)
                }
            }
            .padding(14)
            .background(Color(red: 0.04, green: 0.05, blue: 0.09)) // #0A0E17 Canvas
        } dynamicIsland: { context in
            DynamicIsland {
                // ==========================================
                // 1. EXPANDED VIEW (Long-press Dynamic Island)
                // ==========================================
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(context.attributes.trainName)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                        Text("Coach \(context.attributes.coach) • Seat \(context.attributes.seat)")
                            .font(.system(size: 11, weight: .medium, design: .monospaced))
                            .foregroundColor(Color(red: 0.77, green: 0.63, blue: 0.35))
                    }
                    .padding(.leading, 6)
                }

                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(context.state.platform)
                            .font(.system(size: 12, weight: .bold, design: .monospaced))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.white.opacity(0.12))
                            .cornerRadius(6)
                            .foregroundColor(.white)
                        
                        Text(timerInterval: Date()...context.state.countdownDate, countsDown: true)
                            .font(.system(size: 11, weight: .semibold, design: .monospaced))
                            .foregroundColor(Color(red: 0.20, green: 0.78, blue: 0.35))
                    }
                    .padding(.trailing, 6)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    if context.state.hasClash {
                        HStack(spacing: 5) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(Color(red: 1.0, green: 0.27, blue: 0.23))
                                .font(.system(size: 11))
                            Text(context.state.clashDetails)
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundColor(Color(red: 1.0, green: 0.27, blue: 0.23))
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color(red: 1.0, green: 0.27, blue: 0.23).opacity(0.15))
                        .cornerRadius(8)
                    }
                }
            } compactLeading: {
                // ==========================================
                // 2. COMPACT LEADING (Left of camera pill)
                // ==========================================
                Text(context.state.departureTime)
                    .font(.system(size: 12, weight: .bold, design: .monospaced))
                    .foregroundColor(Color(red: 0.77, green: 0.63, blue: 0.35))
            } compactTrailing: {
                // ==========================================
                // 3. COMPACT TRAILING (Right of camera pill)
                // ==========================================
                Text(context.state.platform)
                    .font(.system(size: 12, weight: .bold, design: .monospaced))
                    .foregroundColor(context.state.hasClash ? Color(red: 1.0, green: 0.27, blue: 0.23) : .white)
            } minimal: {
                // ==========================================
                // 4. MINIMAL VIEW (When 2 apps share island)
                // ==========================================
                Image(systemName: "tram.fill")
                    .foregroundColor(Color(red: 0.77, green: 0.63, blue: 0.35))
            }
        }
    }
}

