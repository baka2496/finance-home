import { ArrowDownRight, ArrowUpRight } from "lucide-react";

// One meaning everywhere: income goes up, spending goes down.
// Pages must use these instead of importing arrow icons directly, so the
// overview cards and the transaction list can never disagree again.
export const IncomeIcon = ArrowUpRight;
export const ExpenseIcon = ArrowDownRight;
