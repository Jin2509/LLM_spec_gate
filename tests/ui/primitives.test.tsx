import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/ui/primitives";

describe("Radix Primitives with Design Tokens", () => {
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

  describe("Tabs", () => {
    it("renders tabs and triggers", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Nội dung 1</TabsContent>
          <TabsContent value="tab2">Nội dung 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText("Nội dung 1")).toBeDefined();
      expect(screen.getByRole("tab", { name: "Tab 1" })).toBeDefined();
      expect(screen.getByRole("tab", { name: "Tab 2" })).toBeDefined();
    });
  });

  describe("Popover", () => {
    it("renders trigger and displays content when open", () => {
      render(
        <Popover open={true}>
          <PopoverTrigger asChild>
            <Button>Mở Popover</Button>
          </PopoverTrigger>
          <PopoverContent>Nội dung chi tiết Popover</PopoverContent>
        </Popover>
      );

      expect(screen.getByText("Nội dung chi tiết Popover")).toBeDefined();
    });
  });

  describe("Dialog", () => {
    it("renders trigger and displays dialog content when open", () => {
      render(
        <Dialog open={true}>
          <DialogTrigger asChild>
            <Button>Mở Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Tiêu đề Hộp thoại</DialogTitle>
            <p>Nội dung hộp thoại</p>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText("Tiêu đề Hộp thoại")).toBeDefined();
      expect(screen.getByText("Nội dung hộp thoại")).toBeDefined();
    });
  });
});
