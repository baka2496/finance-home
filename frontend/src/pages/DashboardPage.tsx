import { useQuery } from "@tanstack/react-query";
import {
  CircleAlert,
  CreditCard,
  Landmark,
  PiggyBank,
  PieChart as PieIcon,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api";
import { ExpenseIcon, IncomeIcon } from "../flowIcons";
import AttentionReminders from "../AttentionReminders";
import { useOwnerFilter } from "../ownerFilter";
import type { Dashboard, Transaction } from "../types";
import { useChartTheme } from "../chartTheme";
import { Amount, Badge, Button, Card, EmptyState, Figure, FigureRow, PageHeader, money, number } from "../ui";

const accountLabels: Record<string, string> = {
  bank: "銀行存款",
  cash: "現金",
  ewallet: "電子支付",
  brokerage: "證券投資",
  crypto: "加密貨幣",
  credit_card: "信用卡",
  loan: "貸款",
  other: "其他",
};

const todayLabel = () =>
  new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", month: "long", day: "numeric", weekday: "long" }).format(new Date());

/** Same category name always gets the same tint, so 餐飲 looks the same everywhere. */
function categoryTint(name: string, palette: string[]) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

function RecentTransactions({ owner }: { owner: string }) {
  const chartTheme = useChartTheme();
  const recent = useQuery({
    queryKey: ["transactions", "recent", owner],
    queryFn: () => api<Transaction[]>(`/transactions?owner=${owner}&limit=12`),
  });
  const items = (recent.data || []).filter((item) => item.transaction_kind !== "transfer").slice(0, 5);

  return (
    <Card className="p-5 sm:p-6" aria-label="最近交易">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-[17px] font-semibold text-ink">最近交易</h2>
        <Link to="/transactions" className="text-sm font-medium text-accent hover:underline">全部</Link>
      </div>
      {recent.isPending ? (
        <div className="space-y-3 py-2">
          {[0, 1, 2].map((row) => <div key={row} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : !items.length ? (
        <p className="py-6 text-center text-sm text-slate-400">還沒有交易紀錄</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => {
            const income = item.base_amount > 0;
            const tint = categoryTint(item.category_name || "未分類", chartTheme.categorical);
            return (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-xl text-sm font-semibold"
                  style={income ? undefined : { background: `${tint}1f`, color: tint }}
                >
                  {income ? (
                    <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><IncomeIcon size={18} /></span>
                  ) : (
                    (item.category_name || "未").slice(0, 1)
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-ink">{item.description}</p>
                  <p className="truncate text-xs text-slate-500">{item.category_name || "未分類"} · {item.transaction_date.slice(5).replace("-", "/")}</p>
                </div>
                <span className={`shrink-0 text-[15px] font-semibold tabular-nums ${income ? "text-emerald-700" : "text-ink"}`}>
                  {income ? "+" : "−"}{money(Math.abs(item.base_amount))}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const [ownerFilter] = useOwnerFilter();
  const chartTheme = useChartTheme();
  const chartColors = chartTheme.categorical;
  const dashboard = useQuery({
    queryKey: ["dashboard", ownerFilter],
    queryFn: () => api<Dashboard>(`/dashboard?owner=${ownerFilter}`),
  });

  if (dashboard.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-56 animate-pulse rounded-3xl bg-slate-200/70" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
      </div>
    );
  }

  if (!dashboard.data) {
    return (
      <Card>
        <EmptyState
          icon={<CircleAlert />}
          title="無法載入財務資料"
          description={dashboard.error instanceof Error ? dashboard.error.message : "請確認後端服務是否已啟動。"}
          action={<Button onClick={() => dashboard.refetch()}>重新載入</Button>}
        />
      </Card>
    );
  }

  const data = dashboard.data;
  const hasData = data.accounts.length > 0;
  const saved = data.month_savings >= 0;

  return (
    <>
      <PageHeader
        eyebrow={todayLabel()}
        title="總覽"
        description="所有帳戶、投資與現金流，集中在同一個地方。"
        action={
          <Button variant="secondary" onClick={() => dashboard.refetch()} disabled={dashboard.isFetching}>
            <RefreshCw size={16} className={dashboard.isFetching ? "animate-spin" : ""} />
            更新畫面
          </Button>
        }
      />

      <AttentionReminders owner={ownerFilter} />
      {dashboard.isError && <p role="alert" className="mb-4 text-sm text-amber-700">更新失敗，目前保留上次載入的數字。<Button onClick={() => dashboard.refetch()}>重試</Button></p>}
      {!hasData ? (
        <Card>
          <EmptyState
            icon={<Landmark size={26} />}
            title="先建立第一個帳戶"
            description="加入銀行、證券、加密貨幣或信用卡帳戶後，這裡會開始整理你的完整財務狀況。"
            action={
              <Link to="/accounts">
                <Button>建立帳戶</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <Card aria-label="淨資產" className="overflow-hidden p-5 pb-3 sm:p-6 sm:pb-3">
              <p className="text-sm text-slate-500">淨資產</p>
              <p className="mt-1 font-display text-[40px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-5xl"><Amount value={money(data.net_worth)} /></p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className={saved ? "rounded-full bg-emerald-50 px-2.5 py-1 text-[13px] font-semibold text-emerald-700" : "rounded-full bg-red-50 px-2.5 py-1 text-[13px] font-semibold text-red-700"}>
                  {saved ? "▲ 本月存下" : "▼ 本月超支"} {money(Math.abs(data.month_savings))}
                </span>
                <span>總資產 {money(data.assets)} − 負債 {money(data.liabilities)}</span>
              </div>
              <div className={data.net_worth_trend.length > 1 ? "-mx-5 mt-3 h-28 sm:-mx-6" : "mt-3 pb-2"} aria-hidden="true">
                {data.net_worth_trend.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.net_worth_trend} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} accessibilityLayer={false}>
                      <defs>
                        <linearGradient id="heroTrendFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartTheme.ink} stopOpacity={0.22} />
                          <stop offset="100%" stopColor={chartTheme.ink} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <YAxis hide domain={["dataMin", "dataMax"]} />
                      <Area type="monotone" dataKey="net_worth" stroke={chartTheme.ink} strokeWidth={2.2} fill="url(#heroTrendFill)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-400">累積兩天以上的餘額紀錄後，這裡會出現淨資產走勢</p>
                )}
              </div>
            </Card>

            <FigureRow label="本月收支" className="mb-0 grid-cols-2">
              <Figure icon={<IncomeIcon size={17} />} iconTone="green" label="本月收入" value={money(data.month_income)} subtext="不含帳戶互轉" />
              <Figure icon={<ExpenseIcon size={17} />} iconTone="red" label="本月支出" value={money(data.month_expense)} subtext="依分類彙整" />
              <Figure
                icon={<PiggyBank size={17} />}
                iconTone="accent"
                label="本月儲蓄"
                value={money(data.month_savings)}
                subtext={data.savings_rate === null ? "有收入後計算儲蓄率" : `儲蓄率 ${number(data.savings_rate, 1)}%`}
              />
              <Figure icon={<CreditCard size={17} />} iconTone="slate" label="總負債" value={money(data.liabilities)} subtext="信用卡與貸款" />
            </FigureRow>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
            <Card className="p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-[17px] font-semibold text-ink">近六個月現金流</h2>
                  <p className="mt-1 text-xs text-slate-400">收入與支出的月度變化</p>
                </div>
                <Badge tone={saved ? "green" : "red"}>
                  {saved ? "本月有結餘" : "本月支出較高"}
                </Badge>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.cashflow_trend} barGap={6} accessibilityLayer={false}>
                    <CartesianGrid vertical={false} stroke={chartTheme.grid} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(value) => `${value / 1000}k`} />
                    <Tooltip formatter={(value) => money(Number(value))} cursor={{ fill: "rgba(91, 108, 240, .06)" }} />
                    <Bar dataKey="income" name="收入" fill={chartTheme.ink} radius={[8, 8, 8, 8]} maxBarSize={22} />
                    <Bar dataKey="expense" name="支出" fill={chartTheme.muted} radius={[8, 8, 8, 8]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <RecentTransactions owner={ownerFilter} />
          </div>

          <div className="mt-4">
            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-[17px] font-semibold text-ink">資產走勢圖</h2>
                  <p className="mt-1 text-xs text-slate-400">每次更新餘額或行情後，保留當日資產紀錄</p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><i className="size-2 rounded-full" style={{ background: chartTheme.ink }} />總資產</span>
                  <span className="flex items-center gap-1.5"><i className="size-2 rounded-full" style={{ background: chartTheme.accent }} />淨資產</span>
                  <span className="flex items-center gap-1.5"><i className="size-2 rounded-full" style={{ background: chartTheme.danger }} />總負債</span>
                </div>
              </div>
              {data.net_worth_trend.length ? (
                <div className="mt-5 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.net_worth_trend} accessibilityLayer={false}>
                      <defs>
                        <linearGradient id="assetTrendFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartTheme.ink} stopOpacity={0.14} />
                          <stop offset="95%" stopColor={chartTheme.ink} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke={chartTheme.grid} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={62}
                        tickFormatter={(value) => Math.abs(value) >= 10000 ? `${number(value / 10000, 0)}萬` : `${number(value / 1000, 0)}k`}
                      />
                      <Tooltip formatter={(value, name) => [money(Number(value)), name]} />
                      <Area type="monotone" dataKey="assets" name="總資產" stroke={chartTheme.ink} strokeWidth={2} fill="url(#assetTrendFill)" />
                      <Area type="monotone" dataKey="net_worth" name="淨資產" stroke={chartTheme.accent} strokeWidth={2.2} fill="transparent" />
                      <Area type="monotone" dataKey="liabilities" name="總負債" stroke={chartTheme.danger} strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  icon={<Wallet size={22} />}
                  title="趨勢會從今天開始累積"
                  description="更新帳戶餘額或行情後，這裡會逐日顯示資產變化。"
                />
              )}
            </Card>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <Card className="p-5 sm:p-6">
              <div className="mb-3">
                <h2 className="text-[17px] font-semibold text-ink">資產配置</h2>
                <p className="mt-1 text-xs text-slate-400">依帳戶類型換算為新台幣</p>
              </div>
              {data.allocation.length ? (
                <>
                  <div className="mx-auto h-[200px] max-w-sm">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart accessibilityLayer={false}>
                        <Pie data={data.allocation} dataKey="value" nameKey="name" innerRadius={60} outerRadius={86} paddingAngle={3} cornerRadius={6} stroke="none" isAnimationActive={false}>
                          {data.allocation.map((_, index) => (
                            <Cell key={index} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => money(Number(value))} labelFormatter={(label) => accountLabels[label] || label} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {data.allocation.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2 text-xs">
                        <span className="size-2.5 rounded-full" style={{ background: chartColors[index % chartColors.length] }} />
                        <span className="text-slate-500">{accountLabels[item.name] || item.name}</span>
                        <span className="ml-auto font-semibold text-slate-700">{money(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState icon={<PieIcon size={22} />} title="尚無資產配置" description="新增資產帳戶後即可查看。" />
              )}
            </Card>

            <Card className="p-5 sm:p-6">
              <div>
                <h2 className="text-[17px] font-semibold text-ink">本月支出重點</h2>
                <p className="mt-1 text-xs text-slate-400">依分類排列</p>
              </div>
              {data.category_expenses.length ? (
                <div className="mt-5 space-y-4">
                  {data.category_expenses.slice(0, 5).map((item) => {
                    const percentage = data.month_expense ? (item.value / data.month_expense) * 100 : 0;
                    const tint = categoryTint(item.name, chartColors);
                    return (
                      <div key={item.name} className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl text-sm font-semibold" style={{ background: `${tint}1f`, color: tint }}>
                          {item.name.slice(0, 1)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex items-center text-sm">
                            <span className="font-medium text-slate-700">{item.name}</span>
                            <span className="ml-auto font-semibold text-ink">{money(item.value)}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, percentage)}%`, background: tint }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={<ExpenseIcon size={22} />} title="本月還沒有支出" description="手動新增或匯入交易後，這裡會整理主要支出。" />
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
