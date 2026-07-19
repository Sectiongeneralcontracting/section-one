export type CertificateInput = {
  contractValue: number;
  cumulativePct: number; // نسبة الإنجاز التراكمية %
  previousCumulativeValue: number; // قيمة آخر مستخلص معتمد
  retentionPct: number; // نسبة ضمان حسن التنفيذ %
  advancePaymentAmount: number; // قيمة الدفعة المقدمة الكلية
  advanceRecoveredSoFar: number; // المسترد من الدفعة المقدمة في مستخلصات سابقة
  advanceRecoveryPct?: number; // نسبة استرداد الدفعة المقدمة من كل مستخلص (افتراضي = نفس نسبة الدفعة المقدمة)
  taxPct?: number; // نسبة الضريبة تُخصم من قيمة أعمال الفترة
};

export type CertificateResult = {
  cumulativeValue: number;
  thisPeriodValue: number;
  retentionAmount: number;
  advanceRecoveryAmount: number;
  taxAmount: number;
  netPayable: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

// يحسب كل قيم المستخلص بناءً على نسبة الإنجاز التراكمية الجديدة
export function computeCertificate(input: CertificateInput): CertificateResult {
  const {
    contractValue,
    cumulativePct,
    previousCumulativeValue,
    retentionPct,
    advancePaymentAmount,
    advanceRecoveredSoFar,
    taxPct = 0,
  } = input;

  const cumulativeValue = round2((cumulativePct / 100) * contractValue);
  const thisPeriodValue = round2(cumulativeValue - previousCumulativeValue);

  const retentionAmount = round2((retentionPct / 100) * thisPeriodValue);

  // استرداد الدفعة المقدمة: نسبته من قيمة أعمال الفترة تتناسب مع نسبة الدفعة المقدمة من قيمة العقد،
  // ويتوقف تلقائيًا لما يوصل للحد الأقصى المستحق
  const remainingAdvance = Math.max(0, advancePaymentAmount - advanceRecoveredSoFar);
  const advanceRecoveryRate = advancePaymentAmount > 0 ? advancePaymentAmount / contractValue : 0;
  const advanceRecoveryAmount = advancePaymentAmount > 0
    ? Math.min(remainingAdvance, round2(thisPeriodValue * advanceRecoveryRate))
    : 0;

  const taxAmount = round2((taxPct / 100) * thisPeriodValue);

  const netPayable = round2(thisPeriodValue - retentionAmount - advanceRecoveryAmount - taxAmount);

  return {
    cumulativeValue,
    thisPeriodValue,
    retentionAmount,
    advanceRecoveryAmount,
    taxAmount,
    netPayable,
  };
}
