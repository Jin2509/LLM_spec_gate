import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsPage from "@/app/settings/page";
import { mockApi } from "../helpers/api-routes";
import { SETTINGS } from "../fixtures/api";

describe("Settings Page Security Architecture", () => {
  it("STRICT SECURITY INVARIANT: Forbids storing or inputting API keys in client", async () => {
    mockApi({ "GET /api/settings": SETTINGS });
    const { container } = render(<SettingsPage />);

    // Đợi form cấu hình tải xong từ API rồi mới kiểm tra toàn bộ input
    await screen.findByText(/Mô hình Mặc định/);

    expect(container.querySelectorAll("input[type='password']").length).toBe(0);
    expect(container.querySelectorAll("input[name*='apiKey'], input[name*='key']").length).toBe(0);

    const placeholder = screen.getByTestId("api-keys-placeholder");
    expect(placeholder.textContent).toContain("BẢO MẬT API KEYS: CẤU HÌNH PHÍA SERVER (.env.local)");
    expect(placeholder.textContent).toContain("tuyệt đối cấm lưu trữ API Key ở phía Client");
  });

  it("saves only the LabSettings fields (never an API key) via PUT /api/settings", async () => {
    let saved: Record<string, unknown> | undefined;
    mockApi({
      "GET /api/settings": SETTINGS,
      "PUT /api/settings": ({ body }) => {
        saved = body as Record<string, unknown>;
        return SETTINGS;
      },
    });
    render(<SettingsPage />);
    await screen.findByText(/Mô hình Mặc định/);

    fireEvent.click(screen.getByTestId("save-settings-btn"));

    await waitFor(() => expect(saved).toBeDefined());
    expect(Object.keys(saved!).sort()).toEqual(Object.keys(SETTINGS.settings).sort());
    expect(await screen.findByTestId("settings-feedback")).toBeDefined();
  });
});
