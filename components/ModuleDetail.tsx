import React, { useState, useEffect } from 'react';
import { ModuleConfig, Transaction, TransactionType, AIAnalysisResult, ModuleType } from '../types';
import { Icons } from './ui/Icons';
import { ChartSection } from './ChartSection';
import { getFinancialAdvice } from '../services/geminiService';

interface ModuleDetailProps {
  module: ModuleConfig;
  transactions: Transaction[];
  allTransactions: Transaction[];
  onBack: () => void;
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onDelete: (id: string) => void;
  onEdit: (t: Transaction) => void;
}

export const ModuleDetail: React.FC<ModuleDetailProps> = ({ 
  module, 
  transactions, 
  allTransactions,
  onBack, 
  onAdd, 
  onDelete, 
  onEdit 
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  
  // Date Filter State
  const [currentDate, setCurrentDate] = useState(new Date());

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setAmount(editingItem.amount.toString());
      setType(editingItem.type);
      setDate(editingItem.date);
      setIsFormOpen(true);
    } else {
      resetForm();
    }
  }, [editingItem]);

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setType(TransactionType.EXPENSE);
    setDate(new Date().toISOString().split('T')[0]);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // Filtragem das transações do módulo atual para o mês selecionado
  const filteredTransactions = transactions.filter(t => {
    const [year, month] = t.date.split('-').map(Number);
    return month === (currentDate.getMonth() + 1) && year === currentDate.getFullYear();
  });

  // Busca todas as transações de TODOS os módulos para o mês selecionado (para cruzamento de dados)
  const allCurrentMonthTransactions = allTransactions.filter(t => {
    const [year, month] = t.date.split('-').map(Number);
    return month === (currentDate.getMonth() + 1) && year === currentDate.getFullYear();
  });

  // --- Cálculos de Resumo Mensal ---
  const monthlyIncome = filteredTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyExpenses = filteredTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyProvisions = allCurrentMonthTransactions
    .filter(t => t.moduleId === ModuleType.PROJECTION)
    .reduce((acc, t) => acc + t.amount, 0);

  // Helper para normalizar strings de comparação
  const normalize = (str: string) => str.toLowerCase().trim();

  // --- Lógica de Acumulado e Provisão ---
  
  // Se estivermos em um módulo comum, buscamos a meta no módulo de PROJEÇÃO
  const getProjectionData = (transactionTitle: string) => {
    if (module.id === ModuleType.PROJECTION) return null;
    
    // Encontrar a provisão correspondente
    const projection = allTransactions.find(p => 
      p.moduleId === ModuleType.PROJECTION && 
      normalize(p.title) === normalize(transactionTitle)
    );

    if (!projection) return null;

    // Calcular quanto JÁ FOI GASTO no total para esse título no mês atual (soma de todas as ocorrências)
    const totalSpent = filteredTransactions
      .filter(t => normalize(t.title) === normalize(transactionTitle))
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      goalAmount: projection.amount,
      currentTotal: totalSpent,
      isOver: totalSpent > projection.amount
    };
  };

  // Se estivermos no módulo de PROJEÇÃO, buscamos quanto já foi realizado nos OUTROS módulos
  const getRealizationData = (projection: Transaction) => {
    if (module.id !== ModuleType.PROJECTION) return null;

    // Soma tudo o que foi gasto/recebido com esse nome nos outros módulos neste mês
    const totalRealized = allCurrentMonthTransactions
      .filter(t => t.moduleId !== ModuleType.PROJECTION && normalize(t.title) === normalize(projection.title))
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      goalAmount: projection.amount,
      currentTotal: totalRealized,
      isOver: totalRealized > projection.amount
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    const payload = {
      moduleId: module.id,
      title,
      amount: parseFloat(amount),
      type,
      date,
    };

    if (editingItem) {
      onEdit({ ...editingItem, ...payload });
    } else {
      onAdd(payload);
    }

    setEditingItem(null);
    setIsFormOpen(false);
    resetForm();
  };

  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const result = await getFinancialAdvice(filteredTransactions, module.title);
      setAiResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 animate-fade-in pb-20">
      {/* Header */}
      <div className={`bg-${module.color}-600 pb-32 pt-8 px-6 lg:px-12 transition-colors duration-500`}>
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={onBack}
            className="flex items-center text-white/80 hover:text-white mb-6 transition-colors"
          >
            <Icons.ArrowLeft size={20} className="mr-2" />
            Voltar para Dashboard
          </button>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                {module.title}
              </h1>
              <p className="text-white/70 mt-2 max-w-xl">{module.description}</p>
            </div>
            
            {/* 3 Valores Summary Mini-Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
               <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white min-w-[160px]">
                  <p className="text-[10px] font-bold uppercase opacity-70 tracking-wider mb-1">Receitas</p>
                  <p className="text-xl font-bold">R$ {monthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
               </div>
               <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white min-w-[160px]">
                  <p className="text-[10px] font-bold uppercase opacity-70 tracking-wider mb-1">Gastos</p>
                  <p className="text-xl font-bold text-red-100">R$ {monthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
               </div>
               <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white min-w-[160px]">
                  <p className="text-[10px] font-bold uppercase opacity-70 tracking-wider mb-1">Provisionado</p>
                  <p className="text-xl font-bold text-amber-100">R$ {monthlyProvisions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna Esquerda: Lista e Gráfico */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Icons.LineChart size={20} className="text-slate-400"/>
                  Fluxo Mensal
                </h3>
                <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                  <button onClick={goToPreviousMonth} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-500">
                     <Icons.ArrowLeft size={16} />
                  </button>
                  <span className="text-sm font-semibold text-slate-700 w-32 text-center capitalize">
                    {formatMonthYear(currentDate)}
                  </span>
                  <button onClick={goToNextMonth} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-500">
                     <Icons.ArrowLeft size={16} className="rotate-180" />
                  </button>
                </div>
              </div>
              <ChartSection data={filteredTransactions} color={module.color} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-800">Transações</h3>
                <button 
                  onClick={() => { setEditingItem(null); setIsFormOpen(true); }}
                  className={`flex items-center gap-2 bg-${module.color}-600 hover:bg-${module.color}-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg`}
                >
                  <Icons.Plus size={16} />
                  Nova
                </button>
              </div>
              
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {filteredTransactions.length === 0 && (
                  <div className="p-12 text-center text-slate-400">
                    <Icons.Sparkles className="mx-auto mb-3 opacity-50" size={32} />
                    <p>Nenhuma transação neste mês.</p>
                  </div>
                )}
                {filteredTransactions.map(t => {
                  // Lógica de Comparação com Metas/Provisões
                  const data = module.id === ModuleType.PROJECTION ? getRealizationData(t) : getProjectionData(t.title);
                  const percentage = data ? Math.min((data.currentTotal / data.goalAmount) * 100, 100) : 0;

                  return (
                    <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between group gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {t.type === TransactionType.INCOME ? <Icons.TrendingUp size={18} /> : <Icons.DollarSign size={18} />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{t.title}</p>
                          <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString()}</p>
                          
                          {/* Barra de Progresso de Meta (Acumulada) */}
                          {data && (
                            <div className="mt-3 w-full max-w-sm">
                              <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
                                <span>
                                  {module.id === ModuleType.PROJECTION ? 'Realizado' : 'Progresso'}: 
                                  R$ {data.currentTotal.toLocaleString('pt-BR')} de R$ {data.goalAmount.toLocaleString('pt-BR')}
                                </span>
                                <span className={data.isOver ? 'text-red-500' : 'text-emerald-500'}>
                                  {Math.round((data.currentTotal / data.goalAmount) * 100)}%
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                                    data.isOver ? 'bg-red-500' : 
                                    t.type === TransactionType.INCOME ? 'bg-emerald-500' : 'bg-blue-500'
                                  }`} 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <p className="text-[10px] font-medium mt-1">
                                {data.isOver 
                                  ? <span className="text-red-500">Excedeu R$ {(data.currentTotal - data.goalAmount).toLocaleString('pt-BR')} do limite!</span>
                                  : <span className="text-slate-400">Restam R$ {(data.goalAmount - data.currentTotal).toLocaleString('pt-BR')} da provisão.</span>
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end gap-4">
                        <span className={`font-semibold whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-700'}`}>
                          {t.type === TransactionType.INCOME ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingItem(t)} className="p-1.5 hover:bg-slate-200 rounded text-slate-500">
                            <Icons.Edit2 size={14} />
                          </button>
                          <button onClick={() => onDelete(t.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500">
                            <Icons.Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Coluna Direita: IA e Stats */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-4">
                   <Icons.Sparkles className="text-yellow-300" />
                   <h3 className="text-lg font-bold">Consultor IA</h3>
                 </div>
                 <p className="text-sm text-indigo-200 mb-6 leading-relaxed">
                   Obtenha insights sobre {module.title.toLowerCase()} em {formatMonthYear(currentDate)}.
                 </p>
                 
                 {!aiResult && !aiLoading && (
                   <button 
                    onClick={handleAiAnalysis}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-medium transition-all backdrop-blur-sm flex justify-center items-center gap-2"
                   >
                     Gerar Análise
                   </button>
                 )}

                 {aiLoading && (
                   <div className="py-4 text-center">
                     <div className="animate-spin w-6 h-6 border-2 border-white/30 border-t-white rounded-full mx-auto mb-2"></div>
                     <p className="text-xs text-indigo-300">Analisando dados...</p>
                   </div>
                 )}

                 {aiResult && (
                   <div className="space-y-4 animate-fade-in">
                     <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                       <p className="text-xs text-indigo-200 font-semibold mb-1 uppercase">Resumo</p>
                       <p className="text-sm">{aiResult.summary}</p>
                     </div>
                     <div>
                       <p className="text-xs text-indigo-200 font-semibold mb-2 uppercase">Dicas Táticas</p>
                       <ul className="space-y-2">
                         {aiResult.tips.map((tip, idx) => (
                           <li key={idx} className="text-sm flex gap-2 items-start">
                             <span className="text-yellow-400 mt-1">•</span>
                             <span className="text-slate-100">{tip}</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                     <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                        <span className="text-xs text-indigo-300">Nível de Risco</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          aiResult.riskLevel === 'High' ? 'bg-red-500/20 text-red-200' : 
                          aiResult.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-200' : 
                          'bg-emerald-500/20 text-emerald-200'
                        }`}>
                          {aiResult.riskLevel}
                        </span>
                     </div>
                   </div>
                 )}
               </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
               <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Resumo do Mês</h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total de Entradas</span>
                    <span className="font-semibold text-emerald-600">{filteredTransactions.length}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-${module.color}-500`} 
                      style={{ width: `${Math.min((filteredTransactions.length / 20) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400">Baseado no volume de transações deste mês.</p>
               </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-scale-up">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              {editingItem ? 'Editar Transação' : 'Nova Transação'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Supermercado, Passagem Aérea..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                  <button 
                    type="button"
                    onClick={() => setType(TransactionType.EXPENSE)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${type === TransactionType.EXPENSE ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Despesa
                  </button>
                  <button 
                    type="button"
                    onClick={() => setType(TransactionType.INCOME)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Receita
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={`flex-1 px-4 py-2 bg-${module.color}-600 hover:bg-${module.color}-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-${module.color}-500/30`}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};