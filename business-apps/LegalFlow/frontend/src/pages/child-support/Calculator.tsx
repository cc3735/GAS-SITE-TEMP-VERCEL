import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { childSupportApi } from '@/lib/api';
import { 
  Calculator, 
  AlertCircle, 
  Info, 
  Download, 
  RefreshCw,
  DollarSign,
  Users,
  MapPin,
} from 'lucide-react';

const states = [
  { code: 'CA', name: 'California' },
  { code: 'TX', name: 'Texas' },
  { code: 'FL', name: 'Florida' },
  { code: 'NY', name: 'New York' },
  { code: 'IL', name: 'Illinois' },
];

interface CalculationResult {
  monthlyAmount: number;
  annualAmount: number;
  breakdown: {
    parent1Percentage: number;
    parent2Percentage: number;
    combinedIncome: number;
    baseSupport: number;
    adjustments: Array<{ name: string; amount: number }>;
  };
  disclaimer: string;
  stateGuidelines: string;
}

export default function ChildSupportCalculator() {
  const [formData, setFormData] = useState({
    state: '',
    parent1Income: '',
    parent2Income: '',
    numberOfChildren: '1',
    custodyArrangement: 'sole',
    overnightsWithParent2: '0',
    healthInsuranceCost: '',
    childcareCost: '',
    specialNeeds: false,
  });

  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await childSupportApi.calculate({
        state: data.state,
        parent1Income: parseFloat(data.parent1Income),
        parent2Income: parseFloat(data.parent2Income),
        numberOfChildren: parseInt(data.numberOfChildren),
        custodyArrangement: data.custodyArrangement as 'sole' | 'joint' | 'split',
        overnightsWithNonCustodialParent: parseInt(data.overnightsWithParent2),
        additionalExpenses: {
          healthInsurance: parseFloat(data.healthInsuranceCost) || 0,
          childcare: parseFloat(data.childcareCost) || 0,
        },
      });
      return res.data as CalculationResult;
    },
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateMutation.mutate(formData);
  };

  const handleReset = () => {
    setFormData({
      state: '',
      parent1Income: '',
      parent2Income: '',
      numberOfChildren: '1',
      custodyArrangement: 'sole',
      overnightsWithParent2: '0',
      healthInsuranceCost: '',
      childcareCost: '',
      specialNeeds: false,
    });
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" />
          Child Support Calculator
        </h1>
        <p className="text-muted-foreground mt-1">
          Estimate child support payments based on your state's guidelines
        </p>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium mb-1">Important Disclaimer</p>
            <p>
              This calculator provides estimates based on publicly available state guidelines. 
              Actual child support amounts may vary based on judicial discretion, specific circumstances, 
              and recent legislative changes. This is not legal advice. Consult with a family law 
              attorney for accurate determinations.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Calculator Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 space-y-6">
            {/* State Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <MapPin className="h-4 w-4" />
                State
              </label>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
                className="w-full rounded-lg border bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select a state</option>
                {states.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                More states coming soon. Currently supporting 5 states.
              </p>
            </div>

            {/* Income Section */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Monthly Gross Income
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Parent 1 (Custodial)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={formData.parent1Income}
                      onChange={(e) => setFormData({ ...formData, parent1Income: e.target.value })}
                      required
                      min="0"
                      step="100"
                      className="w-full rounded-lg border bg-background pl-8 pr-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Parent 2 (Non-Custodial)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={formData.parent2Income}
                      onChange={(e) => setFormData({ ...formData, parent2Income: e.target.value })}
                      required
                      min="0"
                      step="100"
                      className="w-full rounded-lg border bg-background pl-8 pr-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Children Section */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Children
              </h3>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Number of Children
                </label>
                <select
                  value={formData.numberOfChildren}
                  onChange={(e) => setFormData({ ...formData, numberOfChildren: e.target.value })}
                  className="w-full rounded-lg border bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'child' : 'children'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custody Arrangement */}
            <div className="space-y-4">
              <h3 className="font-medium">Custody Arrangement</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { value: 'sole', label: 'Sole Custody' },
                  { value: 'joint', label: 'Joint Custody' },
                  { value: 'split', label: 'Split Custody' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center justify-center rounded-lg border p-3 cursor-pointer transition ${
                      formData.custodyArrangement === option.value
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="custody"
                      value={option.value}
                      checked={formData.custodyArrangement === option.value}
                      onChange={(e) =>
                        setFormData({ ...formData, custodyArrangement: e.target.value })
                      }
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
              {formData.custodyArrangement === 'joint' && (
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Overnights with Parent 2 per Year
                  </label>
                  <input
                    type="number"
                    value={formData.overnightsWithParent2}
                    onChange={(e) =>
                      setFormData({ ...formData, overnightsWithParent2: e.target.value })
                    }
                    min="0"
                    max="365"
                    className="w-full rounded-lg border bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}
            </div>

            {/* Additional Expenses */}
            <div className="space-y-4">
              <h3 className="font-medium">Additional Expenses (Optional)</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Health Insurance (Monthly)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={formData.healthInsuranceCost}
                      onChange={(e) =>
                        setFormData({ ...formData, healthInsuranceCost: e.target.value })
                      }
                      min="0"
                      className="w-full rounded-lg border bg-background pl-8 pr-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Childcare (Monthly)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={formData.childcareCost}
                      onChange={(e) =>
                        setFormData({ ...formData, childcareCost: e.target.value })
                      }
                      min="0"
                      className="w-full rounded-lg border bg-background pl-8 pr-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={calculateMutation.isPending}
                className="flex-1 rounded-lg bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {calculateMutation.isPending ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Calculator className="h-5 w-5" />
                )}
                Calculate
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border px-6 py-3 font-medium hover:bg-muted transition"
              >
                Reset
              </button>
            </div>

            {calculateMutation.isError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-300">
                Failed to calculate. Please try again.
              </div>
            )}
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-card p-6 sticky top-20">
            <h3 className="font-semibold mb-4">Estimated Child Support</h3>

            {result ? (
              <div className="space-y-6">
                {/* Main Amount */}
                <div className="text-center py-6 rounded-lg bg-primary/10">
                  <p className="text-sm text-muted-foreground mb-1">Monthly Payment</p>
                  <p className="text-4xl font-bold text-primary">
                    ${result.monthlyAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    ${result.annualAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / year
                  </p>
                </div>

                {/* Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Calculation Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Combined Income</span>
                      <span>${result.breakdown.combinedIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Parent 1 Share</span>
                      <span>{result.breakdown.parent1Percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Parent 2 Share</span>
                      <span>{result.breakdown.parent2Percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Support</span>
                      <span>${result.breakdown.baseSupport.toLocaleString()}</span>
                    </div>
                    {result.breakdown.adjustments.map((adj, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-muted-foreground">{adj.name}</span>
                        <span>${adj.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 rounded-lg border py-2 text-sm font-medium hover:bg-muted transition flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </button>
                </div>

                {/* State Guidelines Link */}
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    {result.stateGuidelines}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Enter your information and click Calculate to see estimated child support.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

