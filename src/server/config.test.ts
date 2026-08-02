import { expect, test } from "bun:test"
import { isAllowedOrigin, SERVER_HOST } from "./config"

test("usage server binds only to loopback", () => {
  expect(SERVER_HOST).toBe("127.0.0.1")
})

test("native requests without an Origin header are allowed", () => {
  expect(isAllowedOrigin(null)).toBe(true)
})

test("dashboard requests from loopback are allowed", () => {
  expect(isAllowedOrigin("http://127.0.0.1:3190")).toBe(true)
  expect(isAllowedOrigin("http://localhost:3190")).toBe(true)
})

test("cross-site browser requests are rejected", () => {
  expect(isAllowedOrigin("https://example.com")).toBe(false)
})
