// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "ClaudeUsageMenuBar",
    platforms: [.macOS(.v13)],
    products: [
        .library(name: "UsageCore", targets: ["UsageCore"]),
        .executable(name: "ClaudeUsageMenuBar", targets: ["ClaudeUsageMenuBar"]),
    ],
    targets: [
        .target(name: "UsageCore"),
        .executableTarget(name: "ClaudeUsageMenuBar", dependencies: ["UsageCore"]),
        .testTarget(name: "UsageCoreTests", dependencies: ["UsageCore"]),
    ]
)
