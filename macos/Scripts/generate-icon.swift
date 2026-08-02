import AppKit

let arguments = CommandLine.arguments
precondition(arguments.count == 2, "usage: generate-icon.swift <iconset-directory>")
let outputDirectory = URL(fileURLWithPath: arguments[1], isDirectory: true)

struct IconTarget {
    let filename: String
    let pixels: Int
}

let targets = [
    IconTarget(filename: "icon_16x16.png", pixels: 16),
    IconTarget(filename: "icon_16x16@2x.png", pixels: 32),
    IconTarget(filename: "icon_32x32.png", pixels: 32),
    IconTarget(filename: "icon_32x32@2x.png", pixels: 64),
    IconTarget(filename: "icon_128x128.png", pixels: 128),
    IconTarget(filename: "icon_128x128@2x.png", pixels: 256),
    IconTarget(filename: "icon_256x256.png", pixels: 256),
    IconTarget(filename: "icon_256x256@2x.png", pixels: 512),
    IconTarget(filename: "icon_512x512.png", pixels: 512),
    IconTarget(filename: "icon_512x512@2x.png", pixels: 1024),
]

func drawIcon(pixels: Int) -> Data {
    let bitmap = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: pixels,
        pixelsHigh: pixels,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    )!
    bitmap.size = NSSize(width: pixels, height: pixels)

    let context = NSGraphicsContext(bitmapImageRep: bitmap)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = context

    let size = CGFloat(pixels)
    let bounds = NSRect(x: 0, y: 0, width: size, height: size)
    let inset = size * 0.06
    let tile = NSBezierPath(roundedRect: bounds.insetBy(dx: inset, dy: inset), xRadius: size * 0.22, yRadius: size * 0.22)
    NSGradient(colors: [
        NSColor(red: 0.10, green: 0.075, blue: 0.065, alpha: 1),
        NSColor(red: 0.035, green: 0.03, blue: 0.028, alpha: 1),
    ])!.draw(in: tile, angle: -90)

    let barWidth = size * 0.13
    let gap = size * 0.07
    let originX = size * 0.24
    let baseline = size * 0.23
    let heights = [size * 0.23, size * 0.38, size * 0.55]
    for (index, height) in heights.enumerated() {
        let rect = NSRect(x: originX + CGFloat(index) * (barWidth + gap), y: baseline, width: barWidth, height: height)
        let bar = NSBezierPath(roundedRect: rect, xRadius: barWidth * 0.42, yRadius: barWidth * 0.42)
        NSGradient(colors: [
            NSColor(red: 1.0, green: 0.64, blue: 0.36, alpha: 1),
            NSColor(red: 0.86, green: 0.31, blue: 0.19, alpha: 1),
        ])!.draw(in: bar, angle: 90)
    }

    let glowRect = NSRect(x: size * 0.67, y: size * 0.70, width: size * 0.095, height: size * 0.095)
    NSColor.white.withAlphaComponent(0.92).setFill()
    NSBezierPath(ovalIn: glowRect).fill()

    NSGraphicsContext.restoreGraphicsState()
    return bitmap.representation(using: .png, properties: [:])!
}

for target in targets {
    let destination = outputDirectory.appendingPathComponent(target.filename)
    try drawIcon(pixels: target.pixels).write(to: destination)
}
