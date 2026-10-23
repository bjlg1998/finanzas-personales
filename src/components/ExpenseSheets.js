import React from 'react';
import ExpenseFormSheet from './sheets/ExpenseFormSheet';
import FixedExpenseFormSheet from './sheets/FixedExpenseFormSheet';
import FixedPaymentSheet from './sheets/FixedPaymentSheet';
import ExpenseOptionsMenu from './sheets/ExpenseOptionsMenu';
import ThemeSheet from './sheets/ThemeSheet';
import ConfirmationDialog from './sheets/ConfirmationDialog';
import SalarySheet from './sheets/SalarySheet';
import SavingsGoalSheet from './sheets/SavingsGoalSheet';
export default function ExpenseSheets(props) {
  return <><ExpenseFormSheet sheet={props.sheet} closeSheet={props.closeSheet} amount={props.amount} setAmount={props.setAmount} name={props.name} setName={props.setName} setCategory={props.setCategory} category={props.category} updateExpense={props.updateExpense} addExpense={props.addExpense} />
<FixedExpenseFormSheet sheet={props.sheet} closeSheet={props.closeSheet} name={props.name} setName={props.setName} categoryManuallySet={props.categoryManuallySet} setFixedCategory={props.setFixedCategory} amount={props.amount} setAmount={props.setAmount} fixedCategory={props.fixedCategory} setCategoryManuallySet={props.setCategoryManuallySet} setPaymentTiming={props.setPaymentTiming} paymentTiming={props.paymentTiming} dueDay={props.dueDay} setDueDay={props.setDueDay} deadlineDay={props.deadlineDay} setDeadlineDay={props.setDeadlineDay} installmentsTotal={props.installmentsTotal} setInstallmentsTotal={props.setInstallmentsTotal} installmentsPaid={props.installmentsPaid} setInstallmentsPaid={props.setInstallmentsPaid} paymentUrl={props.paymentUrl} setPaymentUrl={props.setPaymentUrl} paymentReference={props.paymentReference} setPaymentReference={props.setPaymentReference} updateFixed={props.updateFixed} addFixed={props.addFixed} />
<FixedPaymentSheet sheet={props.sheet} closeSheet={props.closeSheet} selectedFixed={props.selectedFixed} paymentStatus={props.paymentStatus} fixedDate={props.fixedDate} cycle={props.cycle} fixedPaidAmount={props.fixedPaidAmount} expenseMenuRef={props.expenseMenuRef} expenseMenu={props.expenseMenu} setExpenseMenuAnchor={props.setExpenseMenuAnchor} screenWidth={props.screenWidth} screenHeight={props.screenHeight} setExpenseMenu={props.setExpenseMenu} paymentAction={props.paymentAction} setAmount={props.setAmount} setPaymentAction={props.setPaymentAction} amount={props.amount} correctFixedPayment={props.correctFixedPayment} addFixedPayment={props.addFixedPayment} copyPaymentReference={props.copyPaymentReference} referenceCopied={props.referenceCopied} openPaymentUrl={props.openPaymentUrl} />
<ExpenseOptionsMenu expenseMenu={props.expenseMenu} sheet={props.sheet} setExpenseMenu={props.setExpenseMenu} expenseMenuAnchor={props.expenseMenuAnchor} openFixedEditor={props.openFixedEditor} deleteFixed={props.deleteFixed} />
<ThemeSheet sheet={props.sheet} closeSheet={props.closeSheet} data={props.data} setData={props.setData} />
<ConfirmationDialog confirmDialog={props.confirmDialog} setConfirmDialog={props.setConfirmDialog} />
<SalarySheet sheet={props.sheet} closeSheet={props.closeSheet} setDueDay={props.setDueDay} dueDay={props.dueDay} data={props.data} amount={props.amount} setAmount={props.setAmount} budgetMonth={props.budgetMonth} saveSetup={props.saveSetup} />
<SavingsGoalSheet sheet={props.sheet} closeSheet={props.closeSheet} amount={props.amount} setAmount={props.setAmount} setData={props.setData} /></>;
}
