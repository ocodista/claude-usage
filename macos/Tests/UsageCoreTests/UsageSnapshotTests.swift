import XCTest
@testable import UsageCore

final class UsageSnapshotTests: XCTestCase {
    func testDecodesDashboardStatsAndCurrentSession() throws {
        let json = #"""
        {
          "totalTokens": 987654,
          "totalCostUSD": 42.75,
          "todayCostUSD": 3.125,
          "currentSession": {
            "project": "claude-usage",
            "totalTokens": 12345,
            "costUSD": 1.5,
            "lastActivity": "2026-08-01T16:22:02Z"
          }
        }
        """#.data(using: .utf8)!

        let snapshot = try JSONDecoder().decode(UsageSnapshot.self, from: json)

        XCTAssertEqual(snapshot.totalTokens, 987654)
        XCTAssertEqual(snapshot.todayCostUSD, 3.125)
        XCTAssertEqual(snapshot.currentSession?.project, "claude-usage")
        XCTAssertEqual(snapshot.currentSession?.totalTokens, 12345)
    }

    func testDecodesMissingCurrentSession() throws {
        let json = #"{"totalTokens": 10, "totalCostUSD": 0.1, "todayCostUSD": 0.01, "currentSession": null}"#.data(using: .utf8)!

        let snapshot = try JSONDecoder().decode(UsageSnapshot.self, from: json)

        XCTAssertNil(snapshot.currentSession)
    }

    func testUsesCurrentEntryFromSessionsWhenTopLevelCurrentSessionIsMissing() throws {
        let json = #"""
        {
          "totalTokens": 100,
          "totalCostUSD": 1,
          "todayCostUSD": 0.5,
          "sessions": [
            {"project": "older", "totalTokens": 10, "costUSD": 0.1, "lastActivity": "2026-07-01T00:00:00Z", "isCurrentSession": false},
            {"project": "my-website", "totalTokens": 12345, "costUSD": 1.5, "lastActivity": "2026-08-01T16:22:02Z", "isCurrentSession": true}
          ]
        }
        """#.data(using: .utf8)!

        let snapshot = try JSONDecoder().decode(UsageSnapshot.self, from: json)

        XCTAssertEqual(snapshot.activeSession?.project, "my-website")
        XCTAssertEqual(UsagePresentation.sessionSummary(for: snapshot), "my-website · 12.3K · $1.50")
    }
}

final class UsagePresentationTests: XCTestCase {
    func testStatusTitleUsesTodaysCost() {
        let snapshot = UsageSnapshot(totalTokens: 1_250_000, totalCostUSD: 90, todayCostUSD: 3.125, currentSession: nil)
        XCTAssertEqual(UsagePresentation.statusTitle(for: snapshot), "$3.13")
    }

    func testCompactTokenFormatting() {
        XCTAssertEqual(UsagePresentation.compactTokens(999), "999")
        XCTAssertEqual(UsagePresentation.compactTokens(12_345), "12.3K")
        XCTAssertEqual(UsagePresentation.compactTokens(1_250_000), "1.3M")
    }

    func testSessionSummaryHandlesNoActiveSession() {
        let snapshot = UsageSnapshot(totalTokens: 100, totalCostUSD: 1, todayCostUSD: 0.5, currentSession: nil)
        XCTAssertEqual(UsagePresentation.sessionSummary(for: snapshot), "No active session")
    }

    func testSessionSummaryIncludesProjectTokensAndCost() {
        let session = UsageSnapshot.Session(project: "my-website", totalTokens: 12_345, costUSD: 1.5, lastActivity: "2026-08-01T16:22:02Z")
        let snapshot = UsageSnapshot(totalTokens: 100, totalCostUSD: 1, todayCostUSD: 0.5, currentSession: session)
        XCTAssertEqual(UsagePresentation.sessionSummary(for: snapshot), "my-website · 12.3K · $1.50")
    }
}

final class EngineRecoveryPolicyTests: XCTestCase {
    func testRetriesAfterEveryContinuedFailureWhenEngineIsNotRunning() {
        XCTAssertTrue(EngineRecoveryPolicy.shouldAttemptStart(consecutiveFailures: 1, processIsRunning: false))
        XCTAssertTrue(EngineRecoveryPolicy.shouldAttemptStart(consecutiveFailures: 2, processIsRunning: false))
        XCTAssertTrue(EngineRecoveryPolicy.shouldAttemptStart(consecutiveFailures: 10, processIsRunning: false))
    }

    func testDoesNotStartAnotherEngineWhileManagedProcessIsRunning() {
        XCTAssertFalse(EngineRecoveryPolicy.shouldAttemptStart(consecutiveFailures: 2, processIsRunning: true))
    }
}
