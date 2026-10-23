import { StyleSheet } from 'react-native';
export default function createStyles(colors) {
  const COLORS = colors;
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: COLORS.bg
    },
    app: {
      flex: 1,
      backgroundColor: COLORS.bg
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.bg
    },
    splashLogo: {
      width: 100,
      height: 100,
      borderRadius: 26
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 16
    },
    homeHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 18
    },
    homeTitle: {
      flex: 1,
      color: COLORS.text,
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -.5
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24
    },
    eyebrow: {
      color: COLORS.mint,
      fontSize: 11,
      letterSpacing: 1.7,
      fontWeight: '800',
      textTransform: 'uppercase',
      marginBottom: 4
    },
    title: {
      color: COLORS.text,
      fontSize: 30,
      fontWeight: '800',
      letterSpacing: -1
    },
    logo: {
      width: 44,
      height: 44,
      borderRadius: 14
    },
    hero: {
      backgroundColor: COLORS.card,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: COLORS.line
    },
    heroLabel: {
      color: COLORS.muted,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.1
    },
    heroAmount: {
      color: COLORS.text,
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: -1,
      marginTop: 6
    },
    progressBg: {
      height: 7,
      borderRadius: 9,
      backgroundColor: '#22384C',
      overflow: 'hidden'
    },
    progress: {
      height: 7,
      borderRadius: 9,
      backgroundColor: COLORS.mint
    },
    row: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 12
    },
    stat: {
      flex: 1,
      backgroundColor: COLORS.card,
      borderRadius: 16,
      padding: 15
    },
    statLabel: {
      color: COLORS.muted,
      fontSize: 11,
      marginBottom: 5
    },
    statValue: {
      color: COLORS.text,
      fontSize: 15,
      fontWeight: '800'
    },
    sectionTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 28,
      marginBottom: 12
    },
    sectionTitle: {
      color: COLORS.text,
      fontSize: 18,
      fontWeight: '800'
    },
    link: {
      color: COLORS.mint,
      fontSize: 13,
      fontWeight: '700'
    },
    summaryCard: {
      backgroundColor: COLORS.card,
      borderRadius: 20,
      paddingHorizontal: 16
    },
    summaryValue: {
      color: COLORS.text,
      fontSize: 14,
      fontWeight: '800'
    },
    welcome: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 18,
      backgroundColor: COLORS.card,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: COLORS.line
    },
    welcomeIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: '#F4C96B18',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12
    },
    welcomeTitle: {
      color: COLORS.text,
      fontSize: 16,
      fontWeight: '800'
    },
    welcomeText: {
      color: COLORS.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4
    },
    nav: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 60,
      flexDirection: 'row',
      backgroundColor: COLORS.card,
      borderTopWidth: 1,
      borderColor: COLORS.line,
      paddingTop: 8,
      paddingBottom: 6
    },
    navItem: {
      flex: 1,
      alignItems: 'center',
      gap: 3
    },
    navLabel: {
      color: COLORS.muted,
      fontSize: 9,
      fontWeight: '600'
    },
    navLabelOn: {
      color: COLORS.mint
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 76,
      width: 58,
      height: 58,
      borderRadius: 20,
      backgroundColor: COLORS.mint,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: COLORS.mint,
      shadowOpacity: .35,
      shadowRadius: 12,
      elevation: 8
    },
    fabBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#00000055',
      elevation: 9,
      zIndex: 9
    },
    fabOptions: {
      position: 'absolute',
      right: 24,
      bottom: 150,
      gap: 14,
      elevation: 10,
      zIndex: 10
    },
    fabOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 12,
      minHeight: 48
    },
    fabOptionLabel: {
      color: COLORS.text,
      backgroundColor: COLORS.card,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      fontWeight: '700',
      fontSize: 14
    },
    fabOptionIcon: {
      width: 50,
      height: 50,
      borderRadius: 17,
      backgroundColor: COLORS.mint,
      alignItems: 'center',
      justifyContent: 'center'
    },
    overlay: {
      flex: 1,
      backgroundColor: '#00000099',
      justifyContent: 'flex-end'
    },
    sheetSafeArea: {
      flex: 1
    },
    sheet: {
      maxHeight: '92%',
      backgroundColor: COLORS.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 12,
      paddingHorizontal: 22
    },
    sheetScroll: {
      flexShrink: 1
    },
    sheetContent: {
      paddingBottom: 34
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 4,
      backgroundColor: '#3B5166',
      alignSelf: 'center',
      marginBottom: 16
    },
    sheetTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 18
    },
    sheetTitle: {
      color: COLORS.text,
      fontSize: 22,
      fontWeight: '800'
    },
    inputLabel: {
      color: COLORS.muted,
      fontSize: 12,
      fontWeight: '700',
      marginBottom: 7
    },
    moneyInputWrap: {
      height: 56,
      borderRadius: 15,
      backgroundColor: COLORS.card2,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      borderWidth: 1,
      borderColor: COLORS.line
    },
    currency: {
      color: COLORS.mint,
      fontWeight: '800',
      fontSize: 22,
      marginRight: 8
    },
    moneyInput: {
      flex: 1,
      color: COLORS.text,
      fontSize: 23,
      fontWeight: '800'
    },
    textInput: {
      height: 52,
      borderRadius: 15,
      backgroundColor: COLORS.card2,
      color: COLORS.text,
      paddingHorizontal: 15,
      borderWidth: 1,
      borderColor: COLORS.line,
      marginBottom: 16
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 22
    },
    chip: {
      paddingVertical: 9,
      paddingHorizontal: 13,
      borderRadius: 12,
      backgroundColor: COLORS.card2
    },
    chipOn: {
      backgroundColor: COLORS.mint
    },
    chipText: {
      color: COLORS.muted,
      fontSize: 12,
      fontWeight: '700'
    },
    chipTextOn: {
      color: COLORS.bg
    },
    primaryButton: {
      height: 54,
      borderRadius: 16,
      backgroundColor: COLORS.mint,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8
    },
    primaryText: {
      color: COLORS.bg,
      fontSize: 15,
      fontWeight: '900'
    },
    sheetNote: {
      color: COLORS.muted,
      lineHeight: 19,
      fontSize: 12,
      marginBottom: 20
    },
    reminderNote: {
      flexDirection: 'row',
      gap: 10,
      padding: 13,
      borderRadius: 13,
      backgroundColor: '#F4C96B10',
      marginBottom: 18
    },
    reminderText: {
      flex: 1,
      color: COLORS.muted,
      fontSize: 11,
      lineHeight: 17
    },
    planHero: {
      borderRadius: 22,
      padding: 20,
      backgroundColor: COLORS.card
    },
    distributionCard: {
      marginTop: 14,
      marginBottom: 12,
      padding: 16,
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 20
    },
    distributionTitle: {
      color: COLORS.text,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 16
    },
    distributionBar: {
      height: 26,
      borderRadius: 15,
      overflow: 'hidden',
      flexDirection: 'row',
      backgroundColor: COLORS.line
    },
    distributionSegment: {
      height: 26,
      justifyContent: 'center',
      alignItems: 'center',
      borderRightWidth: 1,
      borderRightColor: COLORS.card
    },
    distributionLegend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 12,
      rowGap: 14
    },
    distributionLegendItem: {
      paddingRight: 12,
      flexDirection: 'row',
      gap: 6,
      alignItems: 'flex-start'
    },
    distributionDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginTop: 3
    },
    distributionLabel: {
      color: COLORS.text,
      fontSize: 11
    },
    distributionHint: {
      color: COLORS.muted,
      fontSize: 11,
      marginTop: 2
    },
    historyHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 52,
      gap: 12
    },
    detailHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16
    },
    detailMenuButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.card2,
      borderWidth: 1,
      borderColor: COLORS.line
    },
    expenseMenuOverlay: {
      flex: 1,
      backgroundColor: '#00000020'
    },
    expensePopup: {
      position: 'absolute',
      width: 260,
      borderRadius: 16,
      backgroundColor: COLORS.card2,
      borderWidth: 1,
      borderColor: COLORS.line,
      paddingVertical: 6,
      elevation: 16,
      shadowColor: '#000000',
      shadowOpacity: .3,
      shadowRadius: 16
    },
    expensePopupItem: {
      minHeight: 56,
      paddingHorizontal: 18,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14
    },
    expensePopupText: {
      fontSize: 15,
      fontWeight: '600',
      color: COLORS.text,
      flexShrink: 1
    },
    detailPanel: {
      padding: 16,
      borderRadius: 18,
      backgroundColor: COLORS.card2,
      marginBottom: 18
    },
    detailSectionLabel: {
      color: COLORS.muted,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 14
    },
    overviewTile: {
      flex: 1,
      padding: 16,
      borderRadius: 18,
      backgroundColor: COLORS.card,
      gap: 8
    },
    overviewAmount: {
      color: COLORS.text,
      fontSize: 19,
      fontWeight: '800'
    },
    compactPayment: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 72,
      paddingVertical: 12,
      gap: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: COLORS.line
    },
    planFilters: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 14
    },
    planFilter: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: COLORS.card2
    },
    planHeroLabel: {
      color: COLORS.mint,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1.4
    },
    planHeroValue: {
      color: COLORS.text,
      fontSize: 28,
      fontWeight: '800',
      marginTop: 7
    },
    planHeroSub: {
      color: COLORS.muted,
      fontSize: 12,
      marginTop: 3
    },
    empty: {
      padding: 28,
      borderRadius: 20,
      backgroundColor: COLORS.card,
      alignItems: 'center',
      gap: 10
    },
    emptyText: {
      color: COLORS.muted,
      textAlign: 'center',
      lineHeight: 19,
      maxWidth: 250
    },
    fixedName: {
      color: COLORS.text,
      fontSize: 14,
      fontWeight: '700'
    },
    fixedHint: {
      color: COLORS.muted,
      fontSize: 11,
      marginTop: 3
    },
    paidLine: {
      color: COLORS.muted,
      fontSize: 11,
      textAlign: 'center',
      paddingVertical: 12
    },
    installmentText: {
      color: COLORS.mint,
      fontSize: 10,
      fontWeight: '700',
      marginTop: 3
    },
    remainingLabel: {
      color: COLORS.muted,
      fontSize: 9,
      marginTop: 2
    },
    goalCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      borderRadius: 18,
      padding: 16
    },
    goalIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: '#82F2BC18',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12
    },
    goalValue: {
      color: COLORS.mint,
      fontWeight: '800'
    },
    outlineButton: {
      height: 50,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: COLORS.mintDark,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20
    },
    outlineText: {
      color: COLORS.mint,
      fontWeight: '800',
      fontSize: 13
    },
    filterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16
    },
    activeFilter: {
      backgroundColor: COLORS.mint,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8
    },
    activeFilterText: {
      color: COLORS.bg,
      fontSize: 11,
      fontWeight: '900'
    },
    filterText: {
      color: COLORS.muted,
      fontSize: 11
    },
    move: {
      minHeight: 68,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: COLORS.line,
      flexDirection: 'row',
      alignItems: 'center'
    },
    moveIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: '#82F2BC12',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12
    },
    expenseValue: {
      color: COLORS.danger,
      fontSize: 14,
      fontWeight: '800'
    },
    deleteMini: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 6,
      backgroundColor: COLORS.danger + '12'
    },
    periodCard: {
      padding: 18,
      borderRadius: 20,
      backgroundColor: COLORS.card,
      marginBottom: 12
    },
    periodLabel: {
      color: COLORS.text,
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 12
    },
    periodStats: {
      flexDirection: 'row',
      gap: 8
    },
    savedLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 14
    },
    savedLabel: {
      color: COLORS.muted,
      fontSize: 12
    },
    savedValue: {
      color: COLORS.mint,
      fontWeight: '800'
    },
    settingRow: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: COLORS.line
    },
    settingIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.card,
      marginRight: 12
    },
    privacy: {
      marginTop: 24,
      borderRadius: 17,
      padding: 16,
      backgroundColor: '#0D2B2B',
      flexDirection: 'row',
      gap: 11
    },
    privacyText: {
      flex: 1,
      color: COLORS.muted,
      lineHeight: 18,
      fontSize: 11
    },
    paymentSummary: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16
    },
    editButton: {
      height: 48,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card2,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10
    },
    editButtonText: {
      color: COLORS.mint,
      fontSize: 13,
      fontWeight: '800'
    },
    referenceCard: {
      minHeight: 70,
      borderRadius: 15,
      padding: 13,
      backgroundColor: COLORS.card2,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12
    },
    referenceLabel: {
      color: COLORS.muted,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1
    },
    referenceValue: {
      color: COLORS.text,
      fontSize: 16,
      fontWeight: '800',
      marginTop: 5
    },
    copyButton: {
      height: 38,
      borderRadius: 11,
      paddingHorizontal: 11,
      backgroundColor: COLORS.mint + '12',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6
    },
    copyText: {
      color: COLORS.mint,
      fontSize: 11,
      fontWeight: '800'
    },
    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 12
    },
    themeOption: {
      width: '47%',
      padding: 10,
      borderRadius: 16,
      backgroundColor: COLORS.card2,
      borderWidth: 2,
      borderColor: 'transparent'
    },
    themeSwatch: {
      height: 64,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8
    },
    themeDot: {
      width: 20,
      height: 20,
      borderRadius: 10
    },
    themeName: {
      color: COLORS.text,
      fontSize: 12,
      fontWeight: '800',
      textAlign: 'center',
      marginTop: 8
    },
    todayPill: {
      alignSelf: 'flex-start',
      minHeight: 32,
      borderRadius: 12,
      paddingHorizontal: 11,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: COLORS.gold + '14',
      borderWidth: 1,
      borderColor: COLORS.gold + '32',
      marginBottom: 12
    },
    todayPillDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: COLORS.gold
    },
    todayPillText: {
      color: COLORS.gold,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: .7
    },
    todayPillHint: {
      color: COLORS.muted,
      fontSize: 9,
      marginLeft: 2
    },
    calendarCard: {
      backgroundColor: COLORS.card,
      borderRadius: 24,
      padding: 16,
      borderWidth: 1,
      borderColor: COLORS.line
    },
    weekRow: {
      flexDirection: 'row',
      marginBottom: 8
    },
    weekDay: {
      width: '14.285%',
      color: COLORS.muted,
      textAlign: 'center',
      fontSize: 10,
      fontWeight: '800'
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap'
    },
    dayCell: {
      width: '14.285%',
      height: 43,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 13
    },
    dayCellDue: {
      backgroundColor: COLORS.mint + '16'
    },
    dayCellToday: {
      borderWidth: 2,
      borderColor: COLORS.gold,
      backgroundColor: COLORS.gold + '12'
    },
    dayCellSelected: {
      borderWidth: 2,
      borderColor: COLORS.mint,
      backgroundColor: COLORS.mint + '22'
    },
    dayNumber: {
      color: COLORS.muted,
      fontSize: 12,
      fontWeight: '700'
    },
    dayNumberDue: {
      color: COLORS.text,
      fontWeight: '900'
    },
    dayNumberToday: {
      color: COLORS.gold,
      fontWeight: '900'
    },
    calendarDots: {
      flexDirection: 'row',
      gap: 3,
      marginTop: 3
    },
    calendarDot: {
      width: 5,
      height: 5,
      borderRadius: 3
    },
    calendarPreview: {
      marginTop: 12,
      borderRadius: 20,
      padding: 15,
      backgroundColor: COLORS.card2,
      borderWidth: 1,
      borderColor: COLORS.mint + '30'
    },
    calendarPreviewTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6
    },
    calendarPreviewEyebrow: {
      color: COLORS.mint,
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 1
    },
    calendarPreviewTitle: {
      color: COLORS.text,
      fontSize: 17,
      fontWeight: '900',
      marginTop: 3
    },
    calendarPreviewClose: {
      width: 34,
      height: 34,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.card
    },
    calendarPreviewRow: {
      minHeight: 62,
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: COLORS.line
    },
    calendarPreviewIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.mint + '12',
      marginRight: 10
    },
    calendarBill: {
      minHeight: 70,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: COLORS.line
    },
    calendarDate: {
      width: 48,
      height: 48,
      borderRadius: 15,
      backgroundColor: COLORS.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12
    },
    calendarDateDay: {
      color: COLORS.text,
      fontSize: 17,
      fontWeight: '900'
    },
    calendarDateMonth: {
      color: COLORS.mint,
      fontSize: 8,
      fontWeight: '900'
    },
    confirmOverlay: {
      flex: 1,
      backgroundColor: '#00000088',
      justifyContent: 'flex-end',
      padding: 14
    },
    confirmCard: {
      backgroundColor: COLORS.card,
      borderRadius: 28,
      padding: 22,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.line
    },
    confirmIcon: {
      width: 54,
      height: 54,
      borderRadius: 18,
      backgroundColor: COLORS.mint + '16',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14
    },
    confirmIconDanger: {
      backgroundColor: COLORS.danger + '16'
    },
    confirmTitle: {
      color: COLORS.text,
      fontSize: 21,
      fontWeight: '900',
      textAlign: 'center'
    },
    confirmMessage: {
      color: COLORS.muted,
      fontSize: 13,
      lineHeight: 20,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 20,
      maxWidth: 310
    },
    confirmCancel: {
      flex: 1,
      height: 50,
      borderRadius: 16,
      backgroundColor: COLORS.card2,
      alignItems: 'center',
      justifyContent: 'center'
    },
    confirmCancelText: {
      color: COLORS.text,
      fontSize: 13,
      fontWeight: '800'
    },
    confirmAccept: {
      flex: 1,
      height: 50,
      borderRadius: 16,
      backgroundColor: COLORS.mint,
      alignItems: 'center',
      justifyContent: 'center'
    },
    confirmAcceptDanger: {
      backgroundColor: COLORS.danger
    },
    confirmAcceptText: {
      color: COLORS.bg,
      fontSize: 13,
      fontWeight: '900'
    },
    lock: {
      flex: 1,
      backgroundColor: COLORS.bg,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 30
    },
    lockLogo: {
      width: 100,
      height: 100,
      borderRadius: 28,
      marginBottom: 28
    },
    lockTitle: {
      color: COLORS.text,
      fontSize: 26,
      fontWeight: '800'
    },
    fingerprintButton: {
      marginTop: 28,
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: COLORS.card2,
      borderWidth: 1,
      borderColor: COLORS.mint + '55',
      alignItems: 'center',
      justifyContent: 'center'
    }
  });
}
