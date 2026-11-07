import ActivityKit
import Foundation

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

    public init(trainNumber: String, trainName: String, coach: String, seat: String) {
        self.trainNumber = trainNumber
        self.trainName = trainName
        self.coach = coach
        self.seat = seat
    }
}
