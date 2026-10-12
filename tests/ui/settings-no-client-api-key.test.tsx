import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import SettingsPage from "@/app/settings/page";

describe("Settings Page Security Architecture", () => {
  it("STRICT SECURITY INVARIANT: Forbids storing or inputting API keys in client", () => {
    const { container } = render(<SettingsPage />);

    // Must NOT have any password inputs or API key inputs
    const passwordInputs = container.querySelectorAll("input[type='password']");
    expect(passwordInputs.length).toBe(0);

    const apiKeyInputs = container.querySelectorAll("input[name*='apiKey'], input[name*='key']");
    expect(apiKeyInputs.length).toBe(0);

    // Verifies server-only configuration placeholder
    const placeholder = screen.getByTestId("api-keys-placeholder");
    expect(placeholder).toBeDefined();
    expect(placeholder.textContent).toContain("BẢO MẬT API KEYS: CẤU HÌNH PHÍA SERVER (.env.local)");
    expect(placeholder.textContent).toContain("tuyệt đối cấm lưu trữ API Key ở phía Client");
  });
});
