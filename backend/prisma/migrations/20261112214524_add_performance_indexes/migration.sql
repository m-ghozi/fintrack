-- CreateIndex
CREATE INDEX "Transaction_toAccountId_idx" ON "Transaction"("toAccountId");

-- CreateIndex
CREATE INDEX "Budget_accountId_idx" ON "Budget"("accountId");

-- CreateIndex
CREATE INDEX "SavingsContribution_accountId_idx" ON "SavingsContribution"("accountId");

-- CreateIndex
CREATE INDEX "Debt_userId_dueDate_idx" ON "Debt"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "DebtPayment_accountId_idx" ON "DebtPayment"("accountId");

-- CreateIndex
CREATE INDEX "Recurring_accountId_idx" ON "Recurring"("accountId");

-- CreateIndex
CREATE INDEX "Recurring_categoryId_idx" ON "Recurring"("categoryId");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);

