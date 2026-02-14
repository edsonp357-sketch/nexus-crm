
import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { Customer, CustomerStatus } from '../types';
import { COLORS } from '../constants';
import { Users, DollarSign, Activity, AlertCircle } from 'lucide-react';

interface DashboardProps {
  customers: Customer[];
}

const Dashboard: React.FC<DashboardProps> = ({ customers }) => {
  const statusCounts = [
    { name: 'Ativo', value: customers.filter(c => c.status === CustomerStatus.ACTIVE).length, color: COLORS.ACTIVE },
    { name: 'Atrasado', value: customers.filter(c => c.status === CustomerStatus.OVERDUE).length, color: COLORS.OVERDUE },
    { name: 'Expirado', value: customers.filter(c => c.status === CustomerStatus.EXPIRED).length, color: COLORS.EXPIRED },
  ].filter(s => s.value > 0);

  const totalValue = customers.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const activeCount = customers.filter(c => c.status === CustomerStatus.ACTIVE).length;
  const overdueCount = customers.filter(c => c.status === CustomerStatus.OVERDUE).length;

  const valueTrend = customers.slice(-7).map((c) => ({
    name: c.name.split(' ')[0],
    value: c.value
  }));

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-hover hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
          <Icon className={color.replace('bg-', 'text-')} size={24} />
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Clientes" 
          value={customers.length} 
          icon={Users} 
          color="bg-indigo-500"
          trend={12}
        />
        <StatCard 
          title="Valor do Portfólio" 
          value={`R$ ${totalValue.toLocaleString('pt-BR')}`} 
          icon={DollarSign} 
          color="bg-emerald-500"
          trend={8}
        />
        <StatCard 
          title="Contratos Ativos" 
          value={activeCount} 
          icon={Activity} 
          color="bg-sky-500"
        />
        <StatCard 
          title="Contas Atrasadas" 
          value={overdueCount} 
          icon={AlertCircle} 
          color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Distribuição por Status</h3>
          <div className="h-[300px]">
            {statusCounts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusCounts}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} clientes`, 'Quantidade']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                Sem dados para exibição
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Tendência de Receita (Recentes)</h3>
          <div className="h-[300px]">
             {valueTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={valueTrend}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                       formatter={(value) => [`R$ ${value}`, 'Valor']}
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
             ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                Adicione clientes para ver tendências
              </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
