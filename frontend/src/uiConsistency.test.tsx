// @vitest-environment jsdom
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import QuickTransactionForm from "./QuickTransactionForm";
import { priceSourceLabel } from "./pages/InvestmentsPage";
import type { Account, Category } from "./types";
import { Button, Dialog } from "./ui";

afterEach(() => { cleanup(); sessionStorage.clear(); localStorage.clear(); });

const srcDir = __dirname;
const pageSources = readdirSync(join(srcDir, "pages"))
  .filter((name) => name.endsWith(".tsx") && !name.includes(".test."))
  .map((name) => ({ name, source: readFileSync(join(srcDir, "pages", name), "utf8") }));

describe("income and spending arrows mean the same thing on every page", () => {
  it("pages use the shared IncomeIcon / ExpenseIcon instead of picking arrows themselves", () => {
    for (const { name, source } of pageSources) {
      expect(source, name).not.toMatch(/\bArrow(Up|Down)(Left|Right)\b/);
    }
    for (const name of ["DashboardPage.tsx", "TransactionsPage.tsx"]) {
      const source = pageSources.find((page) => page.name === name)!.source;
      expect(source, name).toContain("IncomeIcon");
      expect(source, name).toContain("ExpenseIcon");
    }
  });
});

describe("page labels are in Chinese", () => {
  it("no page header eyebrow is written in English", () => {
    for (const { name, source } of pageSources) {
      for (const [, eyebrow] of source.matchAll(/eyebrow="([^"]*)"/g)) {
        expect(eyebrow, `${name}: ${eyebrow}`).not.toMatch(/[A-Za-z]/);
      }
    }
  });

  it("price sources the app itself produces are shown in Chinese", () => {
    expect(priceSourceLabel("manual")).toBe("手動價格");
    expect(priceSourceLabel("missing")).toBe("尚無價格");
    expect(priceSourceLabel("demo")).toBe("示範資料");
    expect(priceSourceLabel("TWSE")).toBe("證交所");
    expect(priceSourceLabel("Binance")).toBe("Binance");
  });
});

describe("the floating add button never hides the last row on phones", () => {
  it("leaves the button's height (3.5rem) + its 1rem offset + a 1.5rem gap below the last row", () => {
    const app = readFileSync(join(srcDir, "App.tsx"), "utf8");
    const main = app.match(/<main className="mx-auto min-h-screen[^"]*"/)?.[0] ?? "";
    const padding = Number(main.match(/\bpb-(\d+)\b/)?.[1] ?? 0) * 0.25;
    expect(padding).toBeGreaterThanOrEqual(3.5 + 1 + 1.5);
  });
});

describe("the sidebar storage note", () => {
  it("does not repeat the same sentence twice", () => {
    const app = readFileSync(join(srcDir, "App.tsx"), "utf8");
    expect(app).not.toContain("資料庫位於這台電腦");
  });
});

describe("removed features and dead UI remnants do not creep back in", () => {
  const allFrontendFiles = [
    ...pageSources,
    ...["App.tsx", "appQueries.ts", "ownerFilter.ts", "types.ts", "ui.tsx"].map((name) => ({
      name,
      source: readFileSync(join(srcDir, name), "utf8"),
    })),
  ];

  it("does not reference removed plans/goals, budgets, overall health scores, or hidden engineering settings", () => {
    for (const { name, source } of allFrontendFiles) {
      expect(source, name).not.toMatch(/\bSHOW_ENGINEERING_SETTINGS\b/);
      expect(source, name).not.toMatch(/\bMobileWizard(Progress|Step|Actions)\b/);
      expect(source, name).not.toMatch(/\bvalidateWizardStep\b/);
      expect(source, name).not.toContain('path="/plans"');
      expect(source, name).not.toContain("超出整體預算");
      expect(source, name).not.toContain("設定預算");
      expect(source, name).not.toContain("共同");
      expect(source, name).not.toMatch(/\bexport interface Budget\b/);
    }
  });
});

describe("adding a transaction", () => {
  const accounts = [{ id: 1, name: "現金", currency: "TWD", owner_label: "我" }] as Account[];
  const categories = [
    { id: 3, name: "餐飲", kind: "expense", essential: true, color: "#f80", icon: "utensils" },
    { id: 1, name: "薪資", kind: "income", essential: false, color: "#0a0", icon: "briefcase" },
  ] as Category[];

  function Harness() {
    const [open, setOpen] = useState(false);
    return <>
      <Button onClick={() => setOpen(true)}>新增交易</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="新增交易">
        <QuickTransactionForm kind="expense" accounts={accounts} categories={categories} owner="me" pending={false} onSubmit={vi.fn()} onCancel={() => setOpen(false)} />
      </Dialog>
    </>;
  }

  it("puts the cursor in the amount field as soon as the dialog opens", async () => {
    render(<Harness />);
    await userEvent.setup().click(screen.getByRole("button", { name: "新增交易" }));
    expect(document.activeElement).toBe(screen.getByRole("spinbutton", { name: "花費金額" }));
  });

  it("shows the category picker without opening extra options", () => {
    render(<QuickTransactionForm kind="expense" accounts={accounts} categories={categories} owner="me" pending={false} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const category = screen.getByRole("combobox", { name: "分類" });
    expect(category.closest("details")).toBeNull();
    expect([...(category as HTMLSelectElement).options].map((option) => option.text)).toEqual(["自動分類", "餐飲"]);
  });
});
