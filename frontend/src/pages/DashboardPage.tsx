import { useQuery } from "@tanstack/react-query";
import {
  CircleAlert,
  Landmark,
  PieChart as PieIcon,
  RefreshCw,
  Sparkles,
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
import { ExpenseIcon } from "../flowIcons";
import AttentionReminders from "../AttentionReminders";
import { useOwnerFilter } from "../ownerFilter";
import type { Dashboard } from "../types";
import { useChartTheme } from "../chartTheme";
import { Badge, Button, Card, EmptyState, Figure, PageHeader, money, number } from "../ui";

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
        <div className="h-20 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-2xl bg-slate-200/70" />
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

  return (
    <>
      <PageHeader
        eyebrow="總覽"
        title="你的財務總覽"
        description="所有帳戶、投資與現金流，集中在同一個地方。"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => dashboard.refetch()} disabled={dashboard.isFetching}>
            <RefreshCw size={16} className={dashboard.isFetching ? "animate-spin" : ""} />
            更新畫面
            </Button>
          </div>
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
          <section aria-label="淨資產" className="border-b border-ink pb-6">
            <p className="text-sm text-slate-500">目前淨資產</p>
            <p className="mt-1 font-display text-5xl font-semibold tracking-[-0.04em] text-ink sm:text-6xl">{money(data.net_worth)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className={data.month_savings >= 0 ? "rounded bg-lime px-2 py-1 font-semibold text-[#111111]" : "rounded bg-red-50 px-2 py-1 font-semibold text-red-700"}>
                本月{data.month_savings >= 0 ? "存下" : "超支"} {money(Math.abs(data.month_savings))}
              </span>
              <span>總資產 {money(data.assets)} − 負債 {money(data.liabilities)}</span>
            </div>
          </section>
          <div className="grid grid-cols-2 border-b border-slate-200 xl:grid-cols-4">
            <Figure className="border-b border-r pr-4 xl:border-b-0" label="本月收入" value={money(data.month_income)} subtext="不含帳戶互轉" />
            <Figure className="border-b pl-4 xl:border-b-0 xl:border-r xl:pr-4" label="本月支出" value={money(data.month_expense)} subtext="依分類彙整" />
            <Figure
              className="border-r pr-4 xl:pl-4"
              label="本月儲蓄"
              value={money(data.month_savings)}
              subtext={data.savings_rate === null ? "有收入後計算儲蓄率" : `儲蓄率 ${number(data.savings_rate, 1)}%`}
            />
            <Figure className="pl-4" label="總負債" value={money(data.liabilities)} subtext="信用卡與貸款" />
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <Card className="p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-ink">近六個月現金流</h2>
                  <p className="mt-1 text-xs text-slate-400">收入與支出的月度變化</p>
                </div>
                <Badge tone={data.month_savings >= 0 ? "green" : "red"}>
                  {data.month_savings >= 0 ? "本月有結餘" : "本月支出較高"}
                </Badge>
              </div>
              <div className="h-[290px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.cashflow_trend} barGap={8} accessibilityLayer={false}>
                    <CartesianGrid vertical={false} stroke={chartTheme.grid} strokeDasharray="4 4" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={(value) => `${value / 1000}k`} />
                    <Tooltip formatter={(value) => money(Number(value))} cursor={{ fill: "rgba(17, 17, 17, .04)" }} />
                    <Bar dataKey="income" name="收入" fill={chartTheme.ink} radius={[5, 5, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="expense" name="支出" fill={chartTheme.muted} radius={[5, 5, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="mb-3">
                <h2 className="font-bold text-ink">資產配置</h2>
                <p className="mt-1 text-xs text-slate-400">依帳戶類型換算為新台幣</p>
              </div>
              {data.allocation.length ? (
                <>
                  <div className="mx-auto h-[210px] max-w-sm">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart accessibilityLayer={false}>
                        <Pie
                          data={data.allocation}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={58}
                          outerRadius={85}
                          paddingAngle={3}
                        >
                          {data.allocation.map((_, index) => (
                            <Cell key={index} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => money(Number(value))}
                          labelFormatter={(label) => accountLabels[label] || label}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {data.allocation.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2 text-xs">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ background: chartColors[index % chartColors.length] }}
                        />
                        <span className="text-slate-500">{accountLabels[item.name] || item.name}</span>
                        <span className="ml-auto font-semibold text-slate-700">
                          {data.assets ? number((item.value / data.assets) * 100, 0) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={<PieIcon size={22} />}
                  title="尚無資產配置"
                  description="新增資產帳戶後即可查看。"
                />
              )}
            </Card>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-ink">資產走勢圖</h2>
                  <p className="mt-1 text-xs text-slate-400">每次更新餘額或行情後，保留當日資產紀錄</p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-ink" />總資產</span>
                  <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-lime" />淨資產</span>
                  <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-red-700" />總負債</span>
                </div>
              </div>
              {data.net_worth_trend.length ? (
                <div className="mt-5 h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.net_worth_trend} accessibilityLayer={false}>
                      <defs>
                        <linearGradient id="assetTrendFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartTheme.ink} stopOpacity={0.08} />
                          <stop offset="95%" stopColor={chartTheme.ink} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke={chartTheme.grid} strokeDasharray="4 4" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={66}
                        tickFormatter={(value) => Math.abs(value) >= 10000 ? `${number(value / 10000, 0)}萬` : `${number(value / 1000, 0)}k`}
                      />
                      <Tooltip formatter={(value, name) => [money(Number(value)), name]} />
                      <Area
                        type="monotone"
                        dataKey="assets"
                        name="總資產"
                        stroke={chartTheme.ink}
                        strokeWidth={1.8}
                        fill="url(#assetTrendFill)"
                      />
                      <Area
                        type="monotone"
                        dataKey="net_worth"
                        name="淨資產"
                        stroke={chartTheme.accent}
                        strokeWidth={2.2}
                        fill="transparent"
                      />
                      <Area
                        type="monotone"
                        dataKey="liabilities"
                        name="總負債"
                        stroke={chartTheme.danger}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fill="transparent"
                      />
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

            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-ink">本月支出重點</h2>
                  <p className="mt-1 text-xs text-slate-400">依分類排列</p>
                </div>
                <Sparkles size={19} className="text-slate-400" />
              </div>
              {data.category_expenses.length ? (
                <div className="mt-6 space-y-5">
                  {data.category_expenses.slice(0, 5).map((item) => {
                    const percentage = data.month_expense ? (item.value / data.month_expense) * 100 : 0;
                    return (
                      <div key={item.name}>
                        <div className="mb-2 flex items-center text-sm">
                          <span className="font-medium text-slate-700">{item.name}</span>
                          <span className="ml-auto font-semibold text-slate-800">{money(item.value)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(100, percentage)}%`, background: item.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={<ExpenseIcon size={22} />}
                  title="本月還沒有支出"
                  description="手動新增或匯入交易後，這裡會整理主要支出。"
                />
              )}
            </Card>
          </div>

        </>
      )}
    </>
  );
}
