import React, { useState, useEffect } from 'react';
import { ModuleType, ModuleConfig, Transaction, TransactionType, User } from './types';
import { ModuleCard } from './components/ModuleCard';
import { ModuleDetail } from './components/ModuleDetail';
import { AuthPage } from './components/AuthPage';
import { Icons } from './components/ui/Icons';
import { supabase } from './services/supabaseClient';

// --- Configuration ---
const MODULES: ModuleConfig[] = [
  {
    id: ModuleType.BUDGET,
    title: 'Orçamento Mensal',
    description: 'Controle de receitas e despesas domésticas.',
    icon: 'Wallet',
    color: 'blue'
  },
  {
    id: ModuleType.TRAVEL,
    title: 'Viagens',
    description: 'Planejamento e custos de férias.',
    icon: 'Plane',
    color: 'emerald'
  },
  {
    id: ModuleType.INVESTMENT,
    title: 'Investimentos',
    description: 'Acompanhamento de patrimônio e ativos.',
    icon: 'TrendingUp',
    color: 'violet'
  },
  {
    id: ModuleType.PROJECTION,
    title: 'Projeções',
    description: 'Metas futuras e planejamento a longo prazo.',
    icon: 'LineChart',
    color: 'amber'
  }
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Auth & Data Loading ---
  useEffect(() => {
    // 1. Check Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata.full_name || session.user.email || 'Usuário',
          email: session.user.email || ''
        });
        fetchTransactions(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // 2. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata.full_name || session.user.email || 'Usuário',
          email: session.user.email || ''
        });
        fetchTransactions(session.user.id);
      } else {
        setUser(null);
        setTransactions([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- CRUD Operations with Supabase ---

  const fetchTransactions = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        // Map DB snake_case to Frontend camelCase
        const mappedData: Transaction[] = data.map((t: any) => ({
          id: t.id,
          moduleId: t.module_id as ModuleType,
          title: t.title,
          amount: t.amount,
          date: t.date,
          type: t.type as TransactionType,
          category: t.category,
          note: t.note
        }));
        setTransactions(mappedData);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTransaction = async (t: Omit<Transaction, 'id'>) => {
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        user_id: user.id,
        module_id: t.moduleId,
        title: t.title,
        amount: t.amount,
        date: t.date,
        type: t.type,
        category: t.category
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newTransaction: Transaction = {
          id: data.id,
          moduleId: data.module_id as ModuleType,
          title: data.title,
          amount: data.amount,
          date: data.date,
          type: data.type as TransactionType,
          category: data.category,
          note: data.note
        };
        setTransactions(prev => [newTransaction, ...prev]);
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Erro ao salvar transação. Verifique se a tabela existe.');
    }
  };

  const handleEditTransaction = async (updated: Transaction) => {
    try {
      const payload = {
        title: updated.title,
        amount: updated.amount,
        date: updated.date,
        type: updated.type,
        module_id: updated.moduleId // ensure mapping
      };

      const { error } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', updated.id);

      if (error) throw error;

      setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getModuleTotal = (moduleId: ModuleType) => {
    return transactions
      .filter(t => t.moduleId === moduleId)
      .reduce((acc, curr) => curr.type === TransactionType.INCOME ? acc + curr.amount : acc - curr.amount, 0);
  };

  // --- Rendering ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLoginSuccess={() => {}} />;
  }

  if (activeModule) {
    const config = MODULES.find(m => m.id === activeModule)!;
    const moduleTransactions = transactions.filter(t => t.moduleId === activeModule);

    return (
      <ModuleDetail 
        module={config}
        transactions={moduleTransactions}
        allTransactions={transactions}
        onBack={() => setActiveModule(null)}
        onAdd={handleAddTransaction}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Icons.PieChart size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">FinFamily<span className="text-blue-600">ERP</span></span>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <p className="text-xs text-slate-500 font-medium uppercase">Olá, {user.name.split(' ')[0]}</p>
               <p className="text-sm font-bold text-slate-800">
                 Saldo: R$ {transactions.reduce((acc, curr) => curr.type === TransactionType.INCOME ? acc + curr.amount : acc - curr.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </p>
             </div>
             
             <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
               {user.name.charAt(0).toUpperCase()}
             </div>

             <button 
               onClick={handleLogout}
               className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
               title="Sair"
             >
               <Icons.LogOut size={20} />
             </button>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <main className="flex-1 p-6 lg:p-12 max-w-7xl mx-auto w-full">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Painel de Controle</h1>
          <p className="text-slate-500">Bem-vindo de volta! Aqui está o resumo das finanças da sua família.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MODULES.map(module => (
            <ModuleCard 
              key={module.id}
              config={module}
              total={getModuleTotal(module.id)}
              onClick={() => setActiveModule(module.id)}
            />
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Icons.Calendar size={20} className="text-slate-400" />
            Atividades Recentes
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Descrição</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Módulo</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Data</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.slice(0, 5).map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-700">{t.title}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${MODULES.find(m => m.id === t.moduleId)?.color}-100 text-${MODULES.find(m => m.id === t.moduleId)?.color}-700`}>
                            {MODULES.find(m => m.id === t.moduleId)?.title}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm">{new Date(t.date).toLocaleDateString()}</td>
                        <td className={`px-6 py-4 text-right font-medium ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-600'}`}>
                          {t.type === TransactionType.INCOME ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Nenhuma atividade encontrada.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;