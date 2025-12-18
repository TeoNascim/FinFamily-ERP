import React, { useState } from 'react';
import { Icons } from './ui/Icons';
import { supabase } from '../services/supabaseClient';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setMessage('');
  };

  const translateError = (errorMessage: string) => {
    switch (errorMessage) {
      case 'User already registered':
        return 'Este e-mail já está cadastrado. Por favor, faça login.';
      case 'Invalid login credentials':
        return 'E-mail ou senha incorretos.';
      case 'Password should be at least 6 characters':
        return 'A senha deve ter pelo menos 6 caracteres.';
      case 'Email not confirmed':
        return 'Por favor, confirme seu e-mail antes de entrar.';
      default:
        return errorMessage || 'Ocorreu um erro. Tente novamente.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login com Supabase
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;
        
        onLoginSuccess();
      } else {
        // Cadastro com Supabase
        if (formData.password !== formData.confirmPassword) {
          throw new Error('As senhas não coincidem.');
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user && !data.session) {
          setMessage('Cadastro realizado com sucesso! Se necessário, verifique seu e-mail para confirmar a conta.');
          setIsLogin(true);
        } else {
          onLoginSuccess();
        }
      }
    } catch (err: any) {
      // Traduz a mensagem de erro antes de exibir
      const translatedMessage = translateError(err.message);
      setError(translatedMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-blue-600 p-8 text-center">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <Icons.PieChart size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">FinFamily ERP</h1>
          <p className="text-blue-100 mt-2">Gerencie as finanças da sua família com inteligência.</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <div className="flex gap-4 mb-8 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => { setIsLogin(true); setError(''); setMessage(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); setMessage(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Cadastro
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Nome Completo</label>
                <div className="relative">
                  <Icons.User className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Ex: João Silva"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">E-mail</label>
              <div className="relative">
                <Icons.Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Senha</label>
              <div className="relative">
                <Icons.Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Confirmar Senha</label>
                <div className="relative">
                  <Icons.Check className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    name="confirmPassword"
                    type="password"
                    required={!isLogin}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2 animate-fade-in border border-red-100">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {error}
              </div>
            )}
            
            {message && (
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600 text-sm flex items-center gap-2 animate-fade-in border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isLogin ? 'Entrar' : 'Criar Conta'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};