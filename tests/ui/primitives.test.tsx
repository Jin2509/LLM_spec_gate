import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/ui/primitives";

describe("Primitives with Design Tokens", () => {
  describe("Button", () => {
    it("renders with default primary variant and handles click", () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Bấm vào đây</Button>);

      const btn = screen.getByRole("button", { name: "Bấm vào đây" });
      expect(btn).toBeDefined();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("respects disabled state", () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Vô hiệu hóa
        </Button>
      );

      const btn = screen.getByRole("button", { name: "Vô hiệu hóa" }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });
});
