import AppKit
import Foundation
import UsageCore

@main
@MainActor
struct ClaudeUsageMenuBarApp {
    static func main() {
        let application = NSApplication.shared
        let delegate = AppDelegate()
        application.delegate = delegate
        application.setActivationPolicy(.accessory)
        application.run()
    }
}

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    private let dashboardURL = URL(string: "http://127.0.0.1:3190")!
    private let statsURL = URL(string: "http://127.0.0.1:3190/api/stats")!
    private let statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
    private let todayItem = NSMenuItem(title: "Today: —", action: nil, keyEquivalent: "")
    private let sessionItem = NSMenuItem(title: "No active session", action: nil, keyEquivalent: "")
    private let totalItem = NSMenuItem(title: "All time: —", action: nil, keyEquivalent: "")
    private let connectionItem = NSMenuItem(title: "Connecting…", action: nil, keyEquivalent: "")
    private let engine = UsageEngine()
    private var pollTask: Task<Void, Never>?
    private var consecutiveFailures = 0

    func applicationDidFinishLaunching(_ notification: Notification) {
        configureStatusItem()
        engine.startIfNeeded()
        pollTask = Task { [weak self] in
            while !Task.isCancelled {
                await self?.refresh()
                try? await Task.sleep(for: .seconds(15))
            }
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        pollTask?.cancel()
        engine.stopManagedProcess()
    }

    private func configureStatusItem() {
        if let button = statusItem.button {
            button.image = NSImage(systemSymbolName: "chart.bar.xaxis", accessibilityDescription: "Claude Code usage")
            button.image?.isTemplate = true
            button.title = " —"
            button.toolTip = "Claude Code Usage"
        }

        [todayItem, sessionItem, totalItem, connectionItem].forEach { $0.isEnabled = false }

        let menu = NSMenu()
        menu.addItem(todayItem)
        menu.addItem(sessionItem)
        menu.addItem(totalItem)
        menu.addItem(.separator())
        menu.addItem(connectionItem)
        menu.addItem(.separator())
        menu.addItem(NSMenuItem(title: "Open Dashboard", action: #selector(openDashboard), keyEquivalent: "o"))
        menu.addItem(NSMenuItem(title: "Refresh Now", action: #selector(refreshNow), keyEquivalent: "r"))
        menu.addItem(NSMenuItem(title: "Start Usage Engine", action: #selector(startEngine), keyEquivalent: "s"))
        menu.addItem(.separator())
        menu.addItem(NSMenuItem(title: "Quit Claude Usage", action: #selector(quit), keyEquivalent: "q"))
        menu.items.forEach { $0.target = self }
        statusItem.menu = menu
    }

    private func refresh() async {
        do {
            var request = URLRequest(url: statsURL)
            request.timeoutInterval = 5
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                throw URLError(.badServerResponse)
            }
            let snapshot = try JSONDecoder().decode(UsageSnapshot.self, from: data)
            render(snapshot)
            consecutiveFailures = 0
        } catch {
            consecutiveFailures += 1
            renderOffline()
            if EngineRecoveryPolicy.shouldAttemptStart(
                consecutiveFailures: consecutiveFailures,
                processIsRunning: engine.isRunning
            ) {
                engine.startIfNeeded()
            }
        }
    }

    private func render(_ snapshot: UsageSnapshot) {
        statusItem.button?.title = " \(UsagePresentation.statusTitle(for: snapshot))"
        todayItem.title = "Today: \(UsagePresentation.currency(snapshot.todayCostUSD))"
        sessionItem.title = UsagePresentation.sessionSummary(for: snapshot)
        totalItem.title = "All time: \(UsagePresentation.compactTokens(snapshot.totalTokens)) · \(UsagePresentation.currency(snapshot.totalCostUSD))"
        connectionItem.title = "Live · refreshes every 15 seconds"
    }

    private func renderOffline() {
        statusItem.button?.title = " —"
        connectionItem.title = "Waiting for the local usage engine…"
    }

    @objc private func openDashboard() {
        NSWorkspace.shared.open(dashboardURL)
    }

    @objc private func refreshNow() {
        Task { await refresh() }
    }

    @objc private func startEngine() {
        engine.startIfNeeded()
        Task {
            try? await Task.sleep(for: .seconds(1))
            await refresh()
        }
    }

    @objc private func quit() {
        NSApplication.shared.terminate(nil)
    }
}

@MainActor
final class UsageEngine {
    private var process: Process?

    var isRunning: Bool { process?.isRunning == true }

    func startIfNeeded() {
        if isRunning { return }

        guard let executableURL = executableURL() else { return }
        let child = Process()
        child.executableURL = executableURL
        child.arguments = ["serve"]
        child.standardOutput = FileHandle.nullDevice
        child.standardError = FileHandle.nullDevice

        do {
            try child.run()
            process = child
        } catch {
            process = nil
        }
    }

    func stopManagedProcess() {
        guard process?.isRunning == true else { return }
        process?.terminate()
    }

    private func executableURL() -> URL? {
        if let bundled = Bundle.main.url(forResource: "claude-code-usage", withExtension: nil) {
            return bundled
        }

        let home = FileManager.default.homeDirectoryForCurrentUser
        let candidates = [
            home.appendingPathComponent(".local/bin/claude-code-usage"),
            URL(fileURLWithPath: "/opt/homebrew/bin/claude-code-usage"),
            URL(fileURLWithPath: "/usr/local/bin/claude-code-usage"),
        ]
        return candidates.first { FileManager.default.isExecutableFile(atPath: $0.path) }
    }
}
