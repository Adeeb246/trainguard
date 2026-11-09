import ActivityKit
import Foundation

@available(iOS 16.1, *)
public struct TrainGuardAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var platform: String
        public var departureTime: String
        public var countdownDate: Date
        public var hasClash: Bool
        public var clashDetails: String

        public init(platform: String, departureTime: String, countdownDate: Date, hasClash: Bool, clashDetails: String) {
            self.platform = platform
            self.departureTime = departureTime
            self.countdownDate = countdownDate
            self.hasClash = hasClash
            self.clashDetails = clashDetails
        }
    }

    public var trainNumber: String
    public var trainName: String
    public var coach: String
    public var seat: String
    public var coachLabel: String
    public var berthLabel: String
    public var leavesLabel: String
    public var checkCoach: String

    public init(trainNumber: String, trainName: String, coach: String, seat: String, coachLabel: String, berthLabel: String, leavesLabel: String, checkCoach: String) {
        self.trainNumber = trainNumber
        self.trainName = trainName
        self.coach = coach
        self.seat = seat
        self.coachLabel = coachLabel
        self.berthLabel = berthLabel
        self.leavesLabel = leavesLabel
        self.checkCoach = checkCoach
    }
}

