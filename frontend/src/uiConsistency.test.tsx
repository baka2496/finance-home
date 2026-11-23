// @vitest-environment jsdom
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import QuickTransactionForm from "./QuickTransactionForm";
import { priceSourceLabel } from "./pages/InvestmentsPage";
import { chartThemeFor } from "./chartTheme";
import type { Account, Category } from "./types";
import { Amount, Button, Dialog } from "./ui";

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
    const transactions = pageSources.find((page) => page.name === "TransactionsPage.tsx")!.source;
    expect(transactions).toContain("IncomeIcon");
    expect(transactions).toContain("ExpenseIcon");
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

describe("the chosen look stays consistent", () => {
  // 2026-11-23: the user picked "A 清透卡片" for light mode and "C 深色高級" for dark mode,
  // after rejecting several flatter styles as having no sense of quality.
  const css = readFileSync(join(srcDir, "index.css"), "utf8");
  const tailwind = readFileSync(join(srcDir, "..", "tailwind.config.js"), "utf8");
  const ui = readFileSync(join(srcDir, "ui.tsx"), "utf8");
  const page = (name: string) => pageSources.find((item) => item.name === name)!.source;

  it("pages and shared parts never hard-code the retired greens", () => {
    const sources = [...pageSources, { name: "ui.tsx", source: ui }];
    for (const { name, source } of sources) {
      expect(source, name).not.toMatch(/#(23845f|167a5a|4ecb9b|153b32|e8eeeb|f1a15b)/i);
    }
    expect(css).not.toMatch(/#(047857|ecfdf5|d7f75b)/i);
  });

  it("light mode is A: grey canvas, white cards with a soft shadow, indigo accent", () => {
    expect(tailwind).toContain('canvas: "#f4f4f6"');
    expect(tailwind).toMatch(/accent: \{\s*DEFAULT: "#5b6cf0"/);
    expect(tailwind).toMatch(/soft: "0 1px 2px rgb\(0 0 0 \/ 4%\), 0 8px 24px rgb\(0 0 0 \/ 5%\)"/);
    expect(ui).toContain('"card-surface rounded-3xl bg-white shadow-soft"');
  });

  it("dark mode is C: warm dark gradient, raised cards and champagne gold", () => {
    expect(css).toMatch(/\.dark body \{\s*background: radial-gradient\(/);
    expect(css).toMatch(/\.dark \.card-surface \{[^}]*linear-gradient/);
    expect(css).toMatch(/\.dark \.bg-forest,\s*\.dark \.bg-accent \{\s*background-color: #d9bf8c;\s*color: #1a1917;/);
    expect(css).toMatch(/\.dark \.text-accent \{\s*color: #d9bf8c;/);
  });

  it("chart colors follow the mode and stay readable", () => {
    const light = chartThemeFor("light");
    const dark = chartThemeFor("dark");
    expect(light.ink).toBe("#5b6cf0");
    expect(dark.ink).toBe("#d9bf8c");
    expect(new Set(light.categorical).size).toBe(light.categorical.length);
    expect(new Set(dark.categorical).size).toBe(dark.categorical.length);
  });

  it("uses the chosen fonts: Inter for numbers and Latin text, 昭源黑體 (Chiron Hei HK) for Chinese", () => {
    expect(tailwind).toMatch(/sans: \["Inter", '"Chiron Hei HK"'/);
    expect(tailwind).toMatch(/display: \["Inter", '"Chiron Hei HK"'/);
    expect(css).toContain("family=Chiron+Hei+HK");
    expect(tailwind + css).not.toMatch(/Space.Grotesk/);
  });

  it("the overview leads with a net-worth card, tinted figure tiles and recent transactions", () => {
    const dashboard = page("DashboardPage.tsx");
    expect(dashboard).toMatch(/<Card aria-label="淨資產"/);
    expect(dashboard).toMatch(/<FigureRow label="本月收支"[\s\S]*iconTone="green"[\s\S]*iconTone="red"/);
    expect(dashboard).toContain("<RecentTransactions owner={ownerFilter} />");
    expect(dashboard).toContain("本月支出重點");
    expect(dashboard).toContain("資產配置");
    expect(dashboard).toContain("資產走勢圖");
  });

  it("investments use figure tiles and the spending chart uses the shared palette", () => {
    expect(page("InvestmentsPage.tsx")).toContain('<FigureRow label="投資摘要" className="sm:grid-cols-3">');
    expect(page("AnalysisPage.tsx")).not.toContain("item.color");
  });

  it("the sidebar is light in A and follows dark mode through app-sidebar", () => {
    const app = readFileSync(join(srcDir, "App.tsx"), "utf8");
    expect(app).toContain('"app-sidebar fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200/70 bg-white/85');
    expect(app).not.toMatch(/text-emerald-(50|100)\//);
    expect(css).toMatch(/\.dark \.app-sidebar \{/);
  });
});

describe("amounts show the currency mark small and grey", () => {
  // 2026-11-23: the user asked for a small "NT$" in front of big numbers, like the A mockup.
  it.each([
    ["NT$1,284,560", "", "NT$", "1,284,560"],
    ["-NT$12,680", "-", "NT$", "12,680"],
    ["+NT$47,051", "+", "NT$", "47,051"],
    ["US$67,000.00", "", "US$", "67,000.00"],
  ])("%s", (value, sign, currency, digits) => {
    const { container } = render(<Amount value={value} />);
    const mark = container.querySelector("span > span")!;
    expect(mark.textContent).toBe(currency);
    expect(mark.className).toContain("text-[0.5em]");
    expect(container.textContent).toBe(`${sign}${currency}${digits}`);
  });

  it("big figures on the overview, tiles and account cards use it", () => {
    expect(readFileSync(join(srcDir, "ui.tsx"), "utf8")).toContain('typeof value === "string" ? <Amount value={value} /> : value');
    expect(pageSources.find((p) => p.name === "DashboardPage.tsx")!.source).toContain("<Amount value={money(data.net_worth)} />");
    expect(pageSources.find((p) => p.name === "AccountsPage.tsx")!.source).toContain("<Amount value={money(Math.abs(account.total_twd))} />");
  });
});
