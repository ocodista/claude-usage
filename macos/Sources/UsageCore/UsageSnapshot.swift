import Foundation

public struct UsageSnapshot: Codable, Sendable, Equatable {
    public struct Session: Codable, Sendable, Equatable {
        public let project: String
        public let totalTokens: Int
        public let costUSD: Double
        public let lastActivity: String
        public let isCurrentSession: Bool?

        public init(project: String, totalTokens: Int, costUSD: Double, lastActivity: String, isCurrentSession: Bool? = nil) {
            self.project = project
            self.totalTokens = totalTokens
            self.costUSD = costUSD
            self.lastActivity = lastActivity
            self.isCurrentSession = isCurrentSession
        }
    }

    public let totalTokens: Int
    public let totalCostUSD: Double
    public let todayCostUSD: Double
    public let currentSession: Session?
    public let sessions: [Session]?

    public var activeSession: Session? {
        currentSession ?? sessions?.first { $0.isCurrentSession == true }
    }

    public init(totalTokens: Int, totalCostUSD: Double, todayCostUSD: Double, currentSession: Session?, sessions: [Session]? = nil) {
        self.totalTokens = totalTokens
        self.totalCostUSD = totalCostUSD
        self.todayCostUSD = todayCostUSD
        self.currentSession = currentSession
        self.sessions = sessions
    }
}

public enum UsagePresentation {
    public static func statusTitle(for snapshot: UsageSnapshot) -> String {
        currency(snapshot.todayCostUSD)
    }

    public static func compactTokens(_ count: Int) -> String {
        switch count {
        case 1_000_000...:
            return String(format: "%.1fM", rounded(Double(count) / 1_000_000, scale: 1))
        case 1_000...:
            return String(format: "%.1fK", rounded(Double(count) / 1_000, scale: 1))
        default:
            return String(count)
        }
    }

    public static func sessionSummary(for snapshot: UsageSnapshot) -> String {
        guard let session = snapshot.activeSession else { return "No active session" }
        return "\(session.project) · \(compactTokens(session.totalTokens)) · \(currency(session.costUSD))"
    }

    public static func currency(_ value: Double) -> String {
        String(format: "$%.2f", rounded(value, scale: 2))
    }

    private static func rounded(_ value: Double, scale: Int) -> Double {
        var source = Decimal(value)
        var result = Decimal()
        NSDecimalRound(&result, &source, scale, .plain)
        return NSDecimalNumber(decimal: result).doubleValue
    }
}

public enum EngineRecoveryPolicy {
    public static func shouldAttemptStart(consecutiveFailures: Int, processIsRunning: Bool) -> Bool {
        consecutiveFailures > 0 && !processIsRunning
    }
}
