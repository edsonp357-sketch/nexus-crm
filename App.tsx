
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Edit3, 
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  RefreshCcw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Users,
  SendHorizontal
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CustomerForm from './components/CustomerForm';
import LoginForm from './components/LoginForm';
import { storageService } from './services/storageService';
import { getAIInsights, generateCustomerNotification } from './services/geminiService';
import { Customer, CustomerStatus, Notification, CRMConfig } from './types';
import { COLORS } from './constants';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'settings'>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
  const [aiInsights, setAiInsights] = useState<{ [id: string]: string }>({});
  const [isLoadingInsights, setIsLoadingInsights] = useState<string | null>(null);
  const [isNotifying, setIsNotifying] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [config, setConfig] = useState<CRMConfig>({
    webhookUrl: '',
    companyName: 'Nexus Global'
  });

  // Carregamento Inicial
  useEffect(() => {
    const loadedCustomers = storageService.getCustomers();
    setCustomers(loadedCustomers);
    setNotifications(storageService.getNotifications());

    const savedConfig = localStorage.getItem('nexus_crm_config');
    if (savedConfig) setConfig(JSON.parse(savedConfig));

    const session = sessionStorage.getItem('nexus_session');
    if (session === 'active') setIsLoggedIn(true);
  }, []);

  // Persistência
  useEffect(() => {
    storageService.saveCustomers(customers);
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('nexus_crm_config', JSON.stringify(config));
  }, [config]);

  const addNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
    storageService.addNotification(message, type);
    setNotifications(storageService.getNotifications());
  }, []);

  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 800));
    if (email === 'Edsonpereira30110@gmail.com' && pass === 'Edson3009@') {
      setIsLoggedIn(true);
      sessionStorage.setItem('nexus_session', 'active');
      addNotification('Bem-vindo ao Nexus CRM!', 'success');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('nexus_session');
  };

  const triggerWebhook = async (customer: Customer, event: string, extraData?: any) => {
    if (!config.webhookUrl) return;
    try {
      console.log(`Webhook disparado: ${event} para ${customer.name}`);
      await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, customer, extraData, timestamp: new Date().toISOString() })
      });
      addNotification(`Webhook enviado: ${event}`, 'success');
    } catch (error) {
      console.error('Erro no webhook:', error);
      addNotification('Falha ao enviar webhook', 'error');
    }
  };

  const handleAddOrEdit = (customer: Customer) => {
    const isEdit = customers.find(c => c.id === customer.id);
    if (isEdit) {
      setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
      addNotification(`Cliente atualizado: ${customer.name}`, 'info');
      if (isEdit.status !== customer.status) {
        triggerWebhook(customer, 'status_change');
      }
    } else {
      setCustomers(prev => [customer, ...prev]);
      addNotification(`Novo cliente adicionado: ${customer.name}`, 'success');
      triggerWebhook(customer, 'created');
    }
    setEditingCustomer(undefined);
  };

  const handleDelete = (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (customer && window.confirm(`Deseja realmente excluir o cliente ${customer.name}?`)) {
      setCustomers(prev => prev.filter(c => c.id !== id));
      addNotification(`Cliente removido: ${customer.name}`, 'warning');
      triggerWebhook(customer, 'deleted');
    }
  };

  const handleAIInsight = async (customer: Customer) => {
    setIsLoadingInsights(customer.id);
    const insight = await getAIInsights(customer);
    setAiInsights(prev => ({ ...prev, [customer.id]: insight }));
    setIsLoadingInsights(null);
  };

  const handleAINotify = async (customer: Customer) => {
    setIsNotifying(customer.id);
    try {
      const message = await generateCustomerNotification(customer);
      
      // Adiciona à lista de notificações do sistema
      addNotification(`Mensagem gerada para ${customer.name}: ${message}`, 'info');
      
      // Dispara via webhook
      await triggerWebhook(customer, 'ia_whatsapp_notification', { ai_message: message });
      
      // Formata o número de telefone (remove tudo que não é número)
      const cleanPhone = customer.phone.replace(/\D/g, '');
      
      // Codifica a mensagem para URL
      const encodedMsg = encodeURIComponent(message);
      
      // Abre o WhatsApp
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
      window.open(whatsappUrl, '_blank');
      
      addNotification(`WhatsApp aberto para ${customer.name}`, 'success');
    } catch (error) {
      console.error("Erro ao notificar via WhatsApp:", error);
      addNotification("Erro ao processar notificação de IA", "error");
    } finally {
      setIsNotifying(null);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.phone.includes(searchTerm);
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  const exportCSV = () => {
    const headers = ['Nome', 'Telefone', 'E-mail', 'Valor', 'Data', 'Status'];
    const rows = customers.map(c => [c.name, c.phone, c.email || '', c.value, c.date, c.status]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "clientes_nexus_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification('Banco de dados exportado com sucesso', 'success');
  };

  const StatusBadge = ({ status }: { status: CustomerStatus }) => {
    const styles = {
      [CustomerStatus.ACTIVE]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      [CustomerStatus.OVERDUE]: 'bg-amber-50 text-amber-600 border-amber-100',
      [CustomerStatus.EXPIRED]: 'bg-rose-50 text-rose-600 border-rose-100',
    };
    const Icons = {
      [CustomerStatus.ACTIVE]: CheckCircle2,
      [CustomerStatus.OVERDUE]: AlertTriangle,
      [CustomerStatus.EXPIRED]: XCircle,
    };
    const Icon = Icons[status];
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
        <Icon size={12} />
        {status}
      </span>
    );
  };

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      
      <main className="flex-1 lg:ml-64 p-4 lg:p-10 relative">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              {activeTab === 'dashboard' ? 'Painel Geral' : activeTab === 'customers' ? 'Gerenciamento de Clientes' : 'Configurações do Sistema'}
            </h1>
            <p className="text-slate-500 font-medium">Olá, Edson! Gerencie sua carteira de clientes.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors shadow-sm relative"
              >
                <Bell size={22} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="font-bold text-slate-800">Notificações</h4>
                    <button onClick={() => {
                        storageService.clearNotifications();
                        setNotifications([]);
                      }} 
                      className="text-xs text-indigo-600 font-semibold hover:underline"
                    >
                      Limpar tudo
                    </button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <p className="text-sm text-slate-700 leading-relaxed mb-1">{n.message}</p>
                          <span className="text-[10px] text-slate-400 font-medium">{new Date(n.timestamp).toLocaleString('pt-BR')}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 text-center">
                        <Bell className="mx-auto text-slate-200 mb-2" size={32} />
                        <p className="text-sm text-slate-400">Nenhuma nova notificação</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <button className="flex items-center gap-3 pl-1 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-all">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase">EP</div>
              <span className="text-sm font-semibold text-slate-700 hidden sm:inline">Edson Pereira</span>
            </button>
          </div>
        </header>

        <div className="transition-all duration-300">
          {activeTab === 'dashboard' && <Dashboard customers={customers} />}

          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 items-center gap-3 w-full">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar por nome ou telefone..." 
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                      className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none appearance-none font-medium text-slate-600 text-sm cursor-pointer"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">Todos os Status</option>
                      <option value={CustomerStatus.ACTIVE}>Ativo</option>
                      <option value={CustomerStatus.OVERDUE}>Atrasado</option>
                      <option value={CustomerStatus.EXPIRED}>Expirado</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button 
                    onClick={exportCSV}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-slate-600 font-semibold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <Download size={18} />
                    Exportar
                  </button>
                  <button 
                    onClick={() => { setEditingCustomer(undefined); setIsFormOpen(true); }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                  >
                    <Plus size={20} />
                    Novo Cliente
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor do Contrato</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map(customer => (
                          <React.Fragment key={customer.id}>
                            <tr className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold uppercase">
                                    {customer.name.substring(0, 2)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-800">{customer.name}</p>
                                    <p className="text-xs text-slate-400 font-medium">{customer.phone}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-700">R$ {customer.value.toLocaleString('pt-BR')}</p>
                              </td>
                              <td className="px-6 py-4">
                                <StatusBadge status={customer.status} />
                              </td>
                              <td className="px-6 py-4 text-slate-500 font-medium text-sm">
                                {new Date(customer.date).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => handleAINotify(customer)}
                                    disabled={isNotifying === customer.id}
                                    title="Notificar via IA (WhatsApp)"
                                    className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    {isNotifying === customer.id ? <RefreshCcw size={18} className="animate-spin" /> : <SendHorizontal size={18} />}
                                  </button>
                                  <button 
                                    onClick={() => handleAIInsight(customer)}
                                    title="Insights de IA"
                                    className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                  >
                                    <Sparkles size={18} />
                                  </button>
                                  <button 
                                    onClick={() => { setEditingCustomer(customer); setIsFormOpen(true); }}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                                  >
                                    <Edit3 size={18} />
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(customer.id)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            { (aiInsights[customer.id] || isLoadingInsights === customer.id) && (
                              <tr className="bg-indigo-50/30">
                                <td colSpan={5} className="px-6 py-4">
                                  <div className="flex gap-3 animate-in slide-in-from-top-2 duration-300">
                                    <div className="p-2 bg-white rounded-lg border border-indigo-100 shadow-sm self-start">
                                      <Sparkles size={16} className="text-indigo-500" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Recomendação da IA</p>
                                      {isLoadingInsights === customer.id ? (
                                        <div className="flex items-center gap-2 text-slate-400 text-sm italic">
                                          <RefreshCcw size={14} className="animate-spin" />
                                          Analisando dados estratégicos...
                                        </div>
                                      ) : (
                                        <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                          {aiInsights[customer.id]}
                                        </div>
                                      )}
                                    </div>
                                    <button 
                                      onClick={() => setAiInsights(prev => { const n = {...prev}; delete n[customer.id]; return n; })}
                                      className="text-slate-400 hover:text-slate-600"
                                    >
                                      <XCircle size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-20 text-center">
                            <Users className="mx-auto text-slate-200 mb-4" size={48} />
                            <h3 className="text-lg font-bold text-slate-400">Nenhum Cliente Encontrado</h3>
                            <p className="text-slate-400 max-w-xs mx-auto mt-1">Comece adicionando seu primeiro cliente para gerenciar sua carteira.</p>
                            <button 
                              onClick={() => setIsFormOpen(true)}
                              className="mt-6 px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                            >
                              Adicionar Agora
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8 animate-in fade-in duration-300">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800">Configurações Gerais</h3>
                <p className="text-slate-500">Gerencie integrações de automação e preferências do sistema.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <ExternalLink size={16} className="text-indigo-500" />
                    URL do Webhook de Automação
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="url" 
                      placeholder="https://hooks.slack.com/..."
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                      value={config.webhookUrl}
                      onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                    />
                    <button 
                      onClick={() => addNotification('Configurações salvas com sucesso', 'success')}
                      className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
                    >
                      Salvar
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-4">Sincronização Manual</h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-700 text-sm">Forçar Atualização de Todos</p>
                      <p className="text-xs text-slate-500">Envia todos os registros atuais para o seu webhook.</p>
                    </div>
                    <button 
                      onClick={() => addNotification('Sincronização manual iniciada', 'info')}
                      disabled={!config.webhookUrl}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                      Executar
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h4 className="font-bold text-rose-600 mb-4">Zona Crítica</h4>
                  <button 
                    onClick={() => {
                      if (window.confirm('Excluir TODOS os dados? Esta ação é irreversível.')) {
                        setCustomers([]);
                        addNotification('Base de dados limpa com sucesso', 'error');
                      }
                    }}
                    className="px-6 py-2 border-2 border-rose-100 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-colors"
                  >
                    Apagar Tudo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="mt-12 py-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-xs font-medium">
          <p>© 2024 Nexus CRM Brasil. Gestão Profissional v2.4.1</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-600">Políticas</a>
            <a href="#" className="hover:text-slate-600">Status</a>
            <a href="#" className="hover:text-slate-600">Ajuda</a>
          </div>
        </footer>
      </main>

      <CustomerForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSubmit={handleAddOrEdit}
        initialData={editingCustomer}
      />
    </div>
  );
};

export default App;
