import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatter, getSeasonalNightlyRate, getFeeAdjustedRate, calculateMonthlyRevenue, OCCUPANCY_RATES } from '../utils/rentalPerformance';

interface RentalPerformanceProps {
  shortTermNightly: number;
  longTermMonthly: number;
  managementFee: number;
}

export default function RentalPerformance({ shortTermNightly, longTermMonthly, managementFee }: RentalPerformanceProps) {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const isManaged = managementFee > 0;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Rental Performance</h3>
      
      {/* Chart */}
      <div className="mt-6 h-[300px] max-w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            margin={{ left: 25 }}
            data={Array(12).fill(0).map((_, i) => ({
              month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
              low: calculateMonthlyRevenue('low', i, shortTermNightly, isManaged, managementFee),
              medium: calculateMonthlyRevenue('medium', i, shortTermNightly, isManaged, managementFee),
              high: calculateMonthlyRevenue('high', i, shortTermNightly, isManaged, managementFee),
              longTerm: longTermMonthly,
            }))}
          >
            <XAxis dataKey="month" />
            <YAxis tickFormatter={formatter} width={80} />
            <RechartsTooltip formatter={formatter} />
            <Legend />
            <Line type="monotone" dataKey="low" stroke="#FF6B6B" name="Revenue Low" />
            <Line type="monotone" dataKey="medium" stroke="#4ECDC4" name="Revenue Medium" />
            <Line type="monotone" dataKey="high" stroke="#45B7D1" name="Revenue High" />
            <Line type="monotone" dataKey="longTerm" stroke="#FFE66D" strokeDasharray="5 5" name="Long Term Rental" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="max-w-full overflow-x-auto border rounded-lg shadow-sm">
        <div className="min-w-[1000px]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="border-b">
                <th className="text-left py-3 px-6 min-w-[120px] bg-gray-50">Metric</th>
                {MONTHS.map(month => (
                  <th key={month} className="text-right py-3 px-6 min-w-[100px] bg-gray-50">{month}</th>
                ))}
                <th className="text-right py-3 px-6 min-w-[120px] bg-gray-50 border-l">Total</th>
                <th className="text-right py-3 px-6 min-w-[120px] bg-gray-50">Monthly Avg</th>
              </tr>
            </thead>
            <tbody>
              {/* Nightly Rate Row */}
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-6">Nightly Rate</td>
                {Array(12).fill(0).map((_, i) => (
                  <td key={i} className="text-right py-3 px-6 whitespace-nowrap">
                    {formatter(getSeasonalNightlyRate(shortTermNightly, i))}
                  </td>
                ))}
                <td colSpan={2}></td>
              </tr>

              {/* Fee Adjusted Rate Row */}
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-6">Fee-Adjusted Rate</td>
                {Array(12).fill(0).map((_, i) => (
                  <td key={i} className="text-right py-3 px-6 whitespace-nowrap">
                    {formatter(getFeeAdjustedRate(getSeasonalNightlyRate(shortTermNightly, i), isManaged))}
                  </td>
                ))}
                <td colSpan={2}></td>
              </tr>

              {/* Occupancy Rows */}
              {Object.entries(OCCUPANCY_RATES).map(([scenario, rates]) => (
                <tr key={scenario} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-6">Occupancy {scenario.charAt(0).toUpperCase() + scenario.slice(1)}</td>
                  {rates.map((rate, i) => (
                    <td key={i} className="text-right py-3 px-6 whitespace-nowrap">{rate}%</td>
                  ))}
                  <td colSpan={2}></td>
                </tr>
              ))}

              {/* Management Fee Row */}
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-6">Management Fee</td>
                {Array(12).fill(0).map((_, i) => (
                  <td key={i} className="text-right py-3 px-6 whitespace-nowrap">{managementFee}%</td>
                ))}
                <td colSpan={2}></td>
              </tr>

              {/* Revenue Rows */}
              {(['low', 'medium', 'high'] as const).map((scenario) => {
                const monthlyRevenues = Array(12).fill(0).map((_, i) => 
                  calculateMonthlyRevenue(scenario, i, shortTermNightly, isManaged, managementFee)
                );
                const totalRevenue = monthlyRevenues.reduce((sum, rev) => sum + rev, 0);
                const avgRevenue = totalRevenue / 12;

                return (
                  <tr 
                    key={scenario} 
                    className={`border-b ${
                      scenario === 'low' 
                        ? 'bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20' 
                        : scenario === 'medium'
                        ? 'bg-[#4ECDC4]/10 hover:bg-[#4ECDC4]/20'
                        : 'bg-[#45B7D1]/10 hover:bg-[#45B7D1]/20'
                    }`}
                  >
                    <td className={`py-3 px-6 font-medium ${
                      scenario === 'low' 
                        ? 'text-[#FF6B6B]'
                        : scenario === 'medium'
                        ? 'text-[#4ECDC4]'
                        : 'text-[#45B7D1]'
                    }`}>
                      Revenue {scenario.charAt(0).toUpperCase() + scenario.slice(1)}
                    </td>
                    {monthlyRevenues.map((revenue, i) => (
                      <td key={i} className="text-right py-3 px-6 whitespace-nowrap">
                        {formatter(revenue)}
                      </td>
                    ))}
                    <td className="text-right py-3 px-6 border-l font-semibold">
                      {formatter(totalRevenue)}
                    </td>
                    <td className="text-right py-3 px-6 font-semibold">
                      {formatter(avgRevenue)}
                    </td>
                  </tr>
                );
              })}

              {/* Long Term Rental Row */}
              <tr className="border-b bg-[#FFE66D]/10 hover:bg-[#FFE66D]/20">
                <td className="py-3 px-6 text-[#B8860B] font-medium">Long Term Rental</td>
                {Array(12).fill(0).map((_, i) => (
                  <td key={i} className="text-right py-3 px-6 whitespace-nowrap">
                    {formatter(longTermMonthly)}
                  </td>
                ))}
                <td className="text-right py-3 px-6 border-l font-semibold">
                  {formatter(longTermMonthly * 12)}
                </td>
                <td className="text-right py-3 px-6 font-semibold">
                  {formatter(longTermMonthly)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      </div>
  );
}
