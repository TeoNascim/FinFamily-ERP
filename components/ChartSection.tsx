import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Transaction } from '../types';

interface ChartSectionProps {
  data: Transaction[];
  color: string;
}

export const ChartSection: React.FC<ChartSectionProps> = ({ data, color }) => {
  // Aggregate data by month for the chart
  const processedData = React.useMemo(() => {
    const grouped: Record<string, number> = {};
    
    // Sort transactions by date to ensure chart is chronological
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedData.forEach(t => {
      // Split date manually to avoid timezone issues when constructing Date object just for formatting
      const [year, month, day] = t.date.split('-');
      const key = `${day}`; // Show just the day number in monthly view
      grouped[key] = (grouped[key] || 0) + t.amount;
    });

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }));
      // Removed .slice(-7) to show full month context
  }, [data]);

  const mapColor = (c: string) => {
    switch(c) {
      case 'blue': return '#3b82f6';
      case 'emerald': return '#10b981';
      case 'violet': return '#8b5cf6';
      case 'amber': return '#f59e0b';
      default: return '#64748b';
    }
  }

  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={processedData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }} 
            dy={10}
            label={{ value: 'Dia', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 10 }}
          />
          <YAxis 
            hide
          />
          <Tooltip 
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
          />
          <Bar 
            dataKey="value" 
            fill={mapColor(color)} 
            radius={[4, 4, 0, 0]} 
            barSize={20} // Smaller bars to fit up to 31 days
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};