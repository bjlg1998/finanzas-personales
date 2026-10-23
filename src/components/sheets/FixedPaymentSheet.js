import { useTheme } from "../../theme/ThemeProvider";
import { Icon, MoneyField, Sheet, Stat } from "../../components/ui";
import { Pressable, Text, View } from 'react-native';
import { formatMoneyInput, money } from "../../domain/money";
import { planPaymentDate, shortDate } from "../../domain/dates";
export default function FixedPaymentSheet({
  sheet,
  closeSheet,
  selectedFixed,
  paymentStatus,
  fixedDate,
  cycle,
  fixedPaidAmount,
  expenseMenuRef,
  expenseMenu,
  setExpenseMenuAnchor,
  screenWidth,
  screenHeight,
  setExpenseMenu,
  paymentAction,
  setAmount,
  setPaymentAction,
  amount,
  correctFixedPayment,
  addFixedPayment,
  copyPaymentReference,
  referenceCopied,
  openPaymentUrl
}) {
  const {
    styles,
    colors: COLORS
  } = useTheme();
  return <Sheet visible={sheet === 'payFixed'} onClose={closeSheet} title={selectedFixed?.name || 'Detalle del gasto'}>
        {selectedFixed && <>
          <View style={styles.detailHeading}>
            <View style={{
          flex: 1
        }}>
              <Text style={[styles.fixedHint, {
            color: paymentStatus(selectedFixed).color
          }]}>{shortDate(fixedDate(selectedFixed))} · {paymentStatus(selectedFixed).text}</Text>
              {!!selectedFixed.deadlineDay && <Text style={styles.fixedHint}>Factura vence: {shortDate(planPaymentDate(cycle.start, {
              dueDay: selectedFixed.deadlineDay
            }))}</Text>}
              <Text style={styles.fixedHint}>{money(fixedPaidAmount(selectedFixed))} pagados</Text>
            </View>
            <Pressable ref={expenseMenuRef} accessibilityRole="button" accessibilityLabel="Opciones del gasto" accessibilityState={{
          expanded: expenseMenu
        }} style={styles.detailMenuButton} onPress={() => expenseMenuRef.current?.measureInWindow((x, y, width, height) => {
          setExpenseMenuAnchor({
            x: Math.max(12, Math.min(screenWidth - 272, x + width - 260)),
            y: Math.max(12, Math.min(screenHeight - 180, y + height + 6))
          });
          setExpenseMenu(true);
        })}><Icon name="options" size={23} color={COLORS.text} /></Pressable>
          </View>
          <View style={styles.paymentSummary}>
            <Stat label="Valor total" value={money(selectedFixed.amount)} />
            <Stat label="Pendiente" value={money(Math.max(0, selectedFixed.amount - fixedPaidAmount(selectedFixed)))} />
          </View>
          {selectedFixed.active !== false && <View style={styles.detailPanel}>
            <Text style={styles.detailSectionLabel}>PAGO</Text>
            {!paymentAction ? <>
              {fixedPaidAmount(selectedFixed) < selectedFixed.amount && <Pressable style={styles.primaryButton} onPress={() => {
            setAmount('');
            setPaymentAction('add');
          }}><Text style={styles.primaryText}>Registrar pago</Text></Pressable>}
              {fixedPaidAmount(selectedFixed) > 0 && <Pressable style={fixedPaidAmount(selectedFixed) >= selectedFixed.amount ? styles.primaryButton : styles.editButton} onPress={() => {
            setAmount(formatMoneyInput(fixedPaidAmount(selectedFixed)));
            setPaymentAction('correct');
          }}><Text style={fixedPaidAmount(selectedFixed) >= selectedFixed.amount ? styles.primaryText : styles.editButtonText}>Corregir pago</Text></Pressable>}
            </> : <>
              <MoneyField label={paymentAction === 'correct' ? 'Total pagado acumulado' : 'Monto de este pago'} value={amount} onChange={setAmount} />
              <Text style={styles.sheetNote}>{paymentAction === 'correct' ? 'Reemplaza el total registrado. Escribe 0 para volver a pendiente; las cuotas se ajustarán automáticamente.' : 'Este monto se sumará a tus abonos anteriores.'}</Text>
              {paymentAction === 'add' && <Pressable style={styles.editButton} onPress={() => setAmount(formatMoneyInput(selectedFixed.amount - fixedPaidAmount(selectedFixed)))}><Text style={styles.editButtonText}>Pagar restante: {money(selectedFixed.amount - fixedPaidAmount(selectedFixed))}</Text></Pressable>}
              <Pressable style={styles.primaryButton} onPress={paymentAction === 'correct' ? correctFixedPayment : addFixedPayment}><Text style={styles.primaryText}>{paymentAction === 'correct' ? 'Guardar corrección' : 'Guardar pago'}</Text></Pressable>
              <Pressable style={styles.editButton} onPress={() => {
            setPaymentAction(null);
            setAmount('');
          }}><Text style={styles.editButtonText}>Cancelar</Text></Pressable>
            </>}
          </View>}
          {(!!selectedFixed.paymentReference || !!selectedFixed.paymentUrl) && <Text style={styles.detailSectionLabel}>DATOS PARA PAGAR</Text>}
          {!!selectedFixed.paymentReference && <View style={styles.referenceCard}>
              <View style={{
          flex: 1
        }}>
                <Text style={styles.referenceLabel}>REFERENCIA DE PAGO</Text>
                <Text style={styles.referenceValue} selectable>{selectedFixed.paymentReference}</Text>
              </View>
              <Pressable style={styles.copyButton} onPress={() => copyPaymentReference(selectedFixed.paymentReference)}>
                <Icon name={referenceCopied ? "checkmark" : "copy"} size={18} color={COLORS.mint} />
                <Text style={styles.copyText}>{referenceCopied ? 'Copiado' : 'Copiar'}</Text>
              </Pressable>
            </View>}
          {!!selectedFixed.paymentUrl && <Pressable style={styles.editButton} onPress={() => openPaymentUrl(selectedFixed.paymentUrl)}>
              <Icon name="external-link" size={19} color={COLORS.mint} />
              <Text style={styles.editButtonText}>Abrir enlace de pago</Text>
            </Pressable>}
        </>}
      </Sheet>;
}
