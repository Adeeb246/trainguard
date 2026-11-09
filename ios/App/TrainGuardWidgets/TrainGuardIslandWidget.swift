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
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .center) {
                    HStack(spacing: 8) {
                        Image(systemName: "tram.fill")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(Color(red: 0.29, green: 0.87, blue: 0.50))
                            .frame(width: 32, height: 32)
                            .background(Color.white.opacity(0.08))
                            .clipShape(Circle())

                        VStack(alignment: .leading, spacing: 2) {
                            Text("\(context.attributes.trainNumber) \(context.attributes.trainName)")
                                .font(.system(size: 15, weight: .bold))
                                .foregroundColor(.white)
                                .lineLimit(1)
                            Text("\(context.attributes.coachLabel) \(context.attributes.coach) • \(context.attributes.berthLabel) \(cleanSeat(context.attributes.seat))")
                                .font(.system(size: 12, weight: .medium, design: .monospaced))
                                .foregroundColor(Color(red: 0.29, green: 0.87, blue: 0.50))
                        }
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 3) {
                        Text(context.state.platform)
                            .font(.system(size: 13, weight: .bold, design: .monospaced))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(Color.white.opacity(0.14))
                            .cornerRadius(6)
                            .foregroundColor(.white)
                        
                        HStack(spacing: 4) {
                            Circle()
                                .fill(Color(red: 0.29, green: 0.87, blue: 0.50))
                                .frame(width: 5, height: 5)
                            Text(timerInterval: min(Date(), context.state.countdownDate)...context.state.countdownDate, countsDown: true)
                                .font(.system(size: 12, weight: .semibold, design: .monospaced))
                                .foregroundColor(Color(red: 0.29, green: 0.87, blue: 0.50))
                        }
                    }
                }

                if context.state.hasClash {
                    HStack(spacing: 6) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(Color(red: 1.0, green: 0.42, blue: 0.42))
                            .font(.system(size: 11))
                        Text(context.state.clashDetails)
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(Color(red: 1.0, green: 0.42, blue: 0.42))
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(Color(red: 1.0, green: 0.42, blue: 0.42).opacity(0.18))
                    .cornerRadius(8)
                }
            }
            .padding(14)
            .background(Color(red: 0.067, green: 0.067, blue: 0.067))
        } dynamicIsland: { context in
            DynamicIsland {
                // ==========================================
                // 1. EXPANDED VIEW: LEADING
                // ==========================================
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 7) {
                        Image(systemName: "tram.fill")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(Color(red: 0.29, green: 0.87, blue: 0.50))
                            .frame(width: 26, height: 26)
                            .background(Color.white.opacity(0.08))
                            .clipShape(Circle())

                        VStack(alignment: .leading, spacing: 1) {
                            Text(context.attributes.trainNumber)
                                .font(.system(size: 11, weight: .bold, design: .monospaced))
                                .foregroundColor(Color(red: 0.29, green: 0.87, blue: 0.50))
                            Text(context.attributes.trainName)
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.white)
                                .lineLimit(1)
                        }
                    }
                    .padding(.leading, 2)
                }

                // ==========================================
                // 2. EXPANDED VIEW: TRAILING
                // ==========================================
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(context.state.platform)
                            .font(.system(size: 12, weight: .bold, design: .monospaced))
                            .padding(.horizontal, 7)
                            .padding(.vertical, 2)
                            .background(Color.white.opacity(0.14))
                            .cornerRadius(6)
                            .foregroundColor(.white)

                        HStack(spacing: 3) {
                            Circle()
                                .fill(Color(red: 0.29, green: 0.87, blue: 0.50))
                                .frame(width: 5, height: 5)
                            Text(timerInterval: min(Date(), context.state.countdownDate)...context.state.countdownDate, countsDown: true)
                                .font(.system(size: 12, weight: .semibold, design: .monospaced))
                                .foregroundColor(Color(red: 0.29, green: 0.87, blue: 0.50))
                        }
                    }
                    .padding(.trailing, 2)
                }

                // ==========================================
                // 3. EXPANDED VIEW: BOTTOM (Rich Telemetry Grid)
                // ==========================================
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 7) {
                        // 3-Column Glass Card
                        HStack(spacing: 6) {
                            // Column 1: Coach
                            VStack(spacing: 1) {
                                Text(context.attributes.coachLabel.uppercased())
                                    .font(.system(size: 9, weight: .semibold, design: .monospaced))
                                    .foregroundColor(.white.opacity(0.55))
                                Text(context.attributes.coach)
                                    .font(.system(size: 16, weight: .bold, design: .monospaced))
                                    .foregroundColor(.white)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 5)
                            .background(Color.white.opacity(0.07))
                            .cornerRadius(8)

                            // Column 2: Berth
                            VStack(spacing: 1) {
                                Text(context.attributes.berthLabel.uppercased())
                                    .font(.system(size: 9, weight: .semibold, design: .monospaced))
                                    .foregroundColor(.white.opacity(0.55))
                                Text(cleanSeat(context.attributes.seat))
                                    .font(.system(size: 14, weight: .bold, design: .monospaced))
                                    .foregroundColor(Color(red: 0.29, green: 0.87, blue: 0.50))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 5)
                            .background(Color.white.opacity(0.07))
                            .cornerRadius(8)

                            // Column 3: Dep Time
                            VStack(spacing: 1) {
                                Text(context.attributes.leavesLabel.uppercased())
                                    .font(.system(size: 9, weight: .semibold, design: .monospaced))
                                    .foregroundColor(.white.opacity(0.55))
                                Text(context.state.departureTime)
                                    .font(.system(size: 16, weight: .bold, design: .monospaced))
                                    .foregroundColor(.white)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 5)
                            .background(Color.white.opacity(0.07))
                            .cornerRadius(8)
                        }

                        // Bottom Status Row
                        if context.state.hasClash {
                            HStack(spacing: 5) {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .foregroundColor(Color(red: 1.0, green: 0.42, blue: 0.42))
                                    .font(.system(size: 10))
                                Text(context.state.clashDetails)
                                    .font(.system(size: 11, weight: .semibold))
                                    .foregroundColor(Color(red: 1.0, green: 0.42, blue: 0.42))
                                    .lineLimit(1)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color(red: 1.0, green: 0.42, blue: 0.42).opacity(0.18))
                            .cornerRadius(6)
                        } else {
                            HStack(spacing: 5) {
                                Image(systemName: "eye.fill")
                                    .foregroundColor(Color(red: 0.29, green: 0.87, blue: 0.50))
                                    .font(.system(size: 10))
                                Text(context.attributes.checkCoach)
                                    .font(.system(size: 10, weight: .medium))
                                    .foregroundColor(.white.opacity(0.65))
                                Spacer()
                                Text("TrainGuard")
                                    .font(.system(size: 9, weight: .bold, design: .monospaced))
                                    .foregroundColor(.white.opacity(0.35))
                            }
                            .padding(.horizontal, 4)
                        }
                    }
                    .padding(.top, 4)
                    .padding(.horizontal, 2)
                    .padding(.bottom, 2)
                }
            } compactLeading: {
                // ==========================================
                // 4. COMPACT LEADING
                // ==========================================
                HStack(spacing: 3) {
                    Image(systemName: "tram.fill")
                        .font(.system(size: 9))
                        .foregroundColor(Color(red: 0.29, green: 0.87, blue: 0.50))
                    Text(context.state.departureTime)
                        .font(.system(size: 11, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                }
            } compactTrailing: {
                // ==========================================
                // 5. COMPACT TRAILING
                // ==========================================
                Text(context.state.platform)
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .padding(.horizontal, 5)
                    .padding(.vertical, 1.5)
                    .background(Color.white.opacity(0.16))
                    .cornerRadius(4)
                    .foregroundColor(context.state.hasClash ? Color(red: 1.0, green: 0.42, blue: 0.42) : .white)
            } minimal: {
                // ==========================================
                // 6. MINIMAL VIEW
                // ==========================================
                Image(systemName: "tram.fill")
                    .foregroundColor(Color(red: 0.29, green: 0.87, blue: 0.50))
            }
        }
    }

    private func cleanSeat(_ seat: String) -> String {
        return seat
            .replacingOccurrences(of: "((", with: "(")
            .replacingOccurrences(of: "))", with: ")")
    }
}
