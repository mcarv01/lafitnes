import React, { useState } from 'react';
import { signBackupData, verifyBackupSignature, hashPassword } from '../utils/security';
import { useApp } from '../context/AppContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  LayoutDashboard, ShoppingBag, Users, ShieldAlert, MessageSquare, 
  DollarSign, TrendingUp, Settings, LogOut, ArrowLeft, Plus, 
  FileSpreadsheet, Sliders, RefreshCw, Send, AlertTriangle, Check, X
} from 'lucide-react';

export default function Admin({ onNavigateToPDV }) {
  const { 
    logout, products, customers, sellers, sales, finances, 
    coupons, promotions, settings, askAI, saveProduct, saveCustomer,
    purchases, suppliers, savePurchase, saveSupplier, cashShifts, setCashShifts,
    savePromotion, deletePromotion,
    setPromotions, setProducts, setCustomers, setSellers, setSales, setFinances, setCashRegister, setCoupons, setPurchases, setSettings
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('dashboard');

  // AI Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { sender: 'ai', text: 'Olá! Sou a inteligência artificial do LAFIT_NES ERP. Posso analisar suas vendas, estoque, CRM e performance financeira. Como posso te ajudar hoje?' }
  ]);

  // Product CRUD & Grid States
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [tempGrid, setTempGrid] = useState([]);
  const [newColor, setNewColor] = useState('');
  const [newSize, setNewSize] = useState('P');
  const [modalProductImage, setModalProductImage] = useState('');

  // Purchase Modal States
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedProductForPurchase, setSelectedProductForPurchase] = useState(null);
  const [selectedPurchaseColor, setSelectedPurchaseColor] = useState('');
  const [selectedPurchaseSize, setSelectedPurchaseSize] = useState('P');

  // Customer CRUD States
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [crmTabMode, setCrmTabMode] = useState('crm'); // 'crm' or 'clients'

  // CRM WhatsApp Automation State
  const [sentAutomations, setSentAutomations] = useState({});

  // Expanded Shift details state
  const [expandedShiftId, setExpandedShiftId] = useState(null);

  // Promotion Creation States
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [promoType, setPromoType] = useState('percentage');

  // Calculations for Dashboard
  const totalFaturamento = sales.reduce((acc, s) => acc + s.total, 0);
  const totalVendasCount = sales.length;
  const ticketMedio = totalVendasCount ? totalFaturamento / totalVendasCount : 0;
  
  // Cost of goods sold (CMV) and Profit
  const totalCusto = sales.reduce((acc, s) => {
    return acc + s.items.reduce((itemAcc, item) => itemAcc + ((item.costPrice || 0) * item.quantity), 0);
  }, 0);
  const lucroBruto = totalFaturamento - totalCusto;
  const margemLucro = totalFaturamento ? (lucroBruto / totalFaturamento) * 100 : 0;

  // Chart Data: Sales per Hour (Simulated based on sales dates)
  const salesByHourData = [
    { hour: '09:00', total: 0 },
    { hour: '10:00', total: 139.90 },
    { hour: '11:00', total: 224.73 },
    { hour: '12:00', total: 0 },
    { hour: '13:00', total: 0 },
    { hour: '14:00', total: 349.80 },
    { hour: '15:00', total: 0 },
    { hour: '16:00', total: 124.90 },
    { hour: '17:00', total: 0 }
  ];

  // Chart Data: Sellers Ranking
  const sellersRankingData = sellers.map(s => ({
    name: s.name.split(' ')[0],
    Vendas: s.currentSales,
    Meta: s.target
  }));

  // Chart Data: Sales by Category
  const categoryDataMap = {};
  sales.forEach(s => {
    s.items.forEach(item => {
      // Find category of product
      const prod = products.find(p => p.id === item.productId);
      const cat = prod ? prod.category : 'Outros';
      categoryDataMap[cat] = (categoryDataMap[cat] || 0) + (item.price * item.quantity);
    });
  });
  const categoryChartData = Object.keys(categoryDataMap).map(key => ({
    name: key,
    value: parseFloat(categoryDataMap[key].toFixed(2))
  }));

  const COLORS = ['#FF2D8E', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

  // CRM Cohort Filter (15d, 30d, 60d, 90d)
  const getCRMCohorts = () => {
    const cohorts = {
      n15: [], // 15 days - send news
      n30: [], // 30 days - send coupon
      n60: [], // 60 days - custom message
      n90: []  // 90 days - inactive client
    };

    customers.forEach(c => {
      if (!c.lastPurchase) {
        cohorts.n90.push(c);
        return;
      }
      const lastDate = new Date(c.lastPurchase);
      const diffDays = Math.ceil(Math.abs(new Date() - lastDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 90) cohorts.n90.push(c);
      else if (diffDays >= 60) cohorts.n60.push(c);
      else if (diffDays >= 30) cohorts.n30.push(c);
      else if (diffDays >= 15) cohorts.n15.push(c);
    });

    return cohorts;
  };

  const cohorts = getCRMCohorts();

  // Send CRM WhatsApp Simulation
  const triggerCRMWhatsApp = (cust, messageType, templateText) => {
    const text = templateText
      .replace('{cliente}', cust.name.split(' ')[0])
      .replace('{total}', 'R$ 150,00'); // mock value or based on history
      
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/${cust.whatsapp}?text=${encodedText}`, '_blank');
    
    setSentAutomations(prev => ({
      ...prev,
      [`${cust.id}-${messageType}`]: true
    }));
  };

  // AI Chat Submission
  const handleAISubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    setTimeout(() => {
      const response = askAI(userMsg);
      setChatHistory(prev => [...prev, { 
        sender: 'ai', 
        text: response.reply,
        chartData: response.chartData,
        data: response.data
      }]);
    }, 500);
  };

  // Open Product Modal and init grid
  const openProductModal = (prod) => {
    setEditingProduct(prod);
    setModalProductImage(prod ? prod.image || '' : '');
    setTempGrid(prod && Array.isArray(prod.grid) ? [...prod.grid] : [
      { color: 'Preto', size: 'P', stock: 10 },
      { color: 'Preto', size: 'M', stock: 10 },
      { color: 'Preto', size: 'G', stock: 10 }
    ]);
    setShowProductModal(true);
  };

  // Product Save Form Handling
  const handleProductSubmit = (e) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target);
      
      const costRaw = String(formData.get('costPrice') || '').replace(',', '.').trim();
      const saleRaw = String(formData.get('salePrice') || '').replace(',', '.').trim();
      
      const costPrice = parseFloat(costRaw);
      const salePrice = parseFloat(saleRaw);
      
      if (isNaN(costPrice) || isNaN(salePrice)) {
        alert('Por favor, insira valores numéricos válidos para os preços (Ex: 59.90 ou 59,90).');
        return;
      }

      const prodData = {
        id: editingProduct?.id || null,
        name: formData.get('name'),
        sku: formData.get('sku'),
        barcode: formData.get('barcode') || String(Date.now()),
        category: formData.get('category'),
        supplier: formData.get('supplier') || '',
        costPrice,
        salePrice,
        grid: tempGrid,
        image: modalProductImage || 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=100&auto=format&fit=crop'
      };
      
      saveProduct(prodData);
      setShowProductModal(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
      alert('Erro ao salvar produto: ' + err.message);
    }
  };

  // Customer Save Form Handling
  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target);
      
      const custData = {
        id: editingCustomer?.id || null,
        name: formData.get('name'),
        cpf: formData.get('cpf'),
        phone: formData.get('phone') || '',
        whatsapp: formData.get('whatsapp'),
        instagram: formData.get('instagram') || '',
        address: formData.get('address') || '',
        city: formData.get('city') || '',
        birthdate: formData.get('birthdate') || '',
        gender: formData.get('gender') || 'Feminino',
        notes: formData.get('notes') || '',
        points: editingCustomer?.points || 0,
        totalSpent: editingCustomer?.totalSpent || 0,
        lastPurchase: editingCustomer?.lastPurchase || null,
        purchaseCount: editingCustomer?.purchaseCount || 0
      };
      
      saveCustomer(custData);
      setShowCustomerModal(false);
      setEditingCustomer(null);
    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
      alert('Erro ao salvar cliente: ' + err.message);
    }
  };


  return (
    <div style={styles.adminContainer}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar} className="glass-card">
        <div style={styles.sidebarHeader}>
          <img src="/logo.png" alt="Lafitnes Logo" style={{ height: '32px', width: '32px', borderRadius: '8px', objectFit: 'cover' }} />
          <span style={styles.brandText}>LAFIT_NES <span className="text-neon" style={{ fontWeight: '800' }}>ERP</span></span>
        </div>

        <nav style={styles.navMenu}>
          <button 
            onClick={() => setActiveSubTab('dashboard')} 
            style={{ ...styles.navLink, ...(activeSubTab === 'dashboard' ? styles.navLinkActive : {}) }}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveSubTab('products')} 
            style={{ ...styles.navLink, ...(activeSubTab === 'products' ? styles.navLinkActive : {}) }}
          >
            <ShoppingBag size={18} /> Produtos
          </button>
          <button 
            onClick={() => setActiveSubTab('crm')} 
            style={{ ...styles.navLink, ...(activeSubTab === 'crm' ? styles.navLinkActive : {}) }}
          >
            <Users size={18} /> CRM & Clientes
          </button>
          <button 
            onClick={() => setActiveSubTab('stock')} 
            style={{ ...styles.navLink, ...(activeSubTab === 'stock' ? styles.navLinkActive : {}) }}
          >
            <ShieldAlert size={18} /> Estoque ABC
          </button>
          <button 
            onClick={() => setActiveSubTab('finance')} 
            style={{ ...styles.navLink, ...(activeSubTab === 'finance' ? styles.navLinkActive : {}) }}
          >
            <DollarSign size={18} /> Financeiro DRE
          </button>
          <button 
            onClick={() => setActiveSubTab('ai')} 
            style={{ ...styles.navLink, ...(activeSubTab === 'ai' ? styles.navLinkActive : {}) }}
          >
            <MessageSquare size={18} className="pulse-neon" /> IA Inteligente
          </button>
          <button 
            onClick={() => setActiveSubTab('purchases')} 
            style={{ ...styles.navLink, ...(activeSubTab === 'purchases' ? styles.navLinkActive : {}) }}
          >
            <FileSpreadsheet size={18} /> Compras & Entrada
          </button>
          <button 
            onClick={() => setActiveSubTab('promotions')} 
            style={{ ...styles.navLink, ...(activeSubTab === 'promotions' ? styles.navLinkActive : {}) }}
          >
            <Sliders size={18} /> Promoções & Campanhas
          </button>
          <button 
            onClick={() => setActiveSubTab('audits')} 
            style={{ ...styles.navLink, ...(activeSubTab === 'audits' ? styles.navLinkActive : {}) }}
          >
            <ShieldAlert size={18} /> Auditoria de Caixas
          </button>
          <button 
            onClick={() => setActiveSubTab('settings')} 
            style={{ ...styles.navLink, ...(activeSubTab === 'settings' ? styles.navLinkActive : {}) }}
          >
            <Settings size={18} /> Configurações
          </button>
        </nav>

        <div style={styles.sidebarFooter}>
          <button onClick={onNavigateToPDV} className="btn btn-primary" style={{ width: '100%', gap: '6px' }}>
            <ArrowLeft size={16} /> Ir para o PDV
          </button>
          <button onClick={logout} className="btn btn-ghost" style={{ width: '100%', marginTop: '8px', color: 'var(--danger)', gap: '6px' }}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <main style={styles.mainContent}>
        
        {/* DASHBOARD TAB */}
        {activeSubTab === 'dashboard' && (
          <div className="animate-fade-in" style={styles.tabContent}>
            <div style={styles.contentHeader}>
              <div>
                <h2>Painel Executivo</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Resumo de performance de vendas e indicadores em tempo real</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => window.print()} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                  <FileSpreadsheet size={16} /> Exportar PDF
                </button>
                <button onClick={() => alert('Dados sincronizados!')} className="btn btn-ghost" style={{ padding: '8px' }}>
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid-4" style={{ marginBottom: '20px' }}>
              <div className="glass-card" style={styles.metricCard}>
                <span style={styles.metricLabel}>Faturamento Hoje</span>
                <h2 className="text-neon" style={{ fontSize: '1.75rem', fontWeight: '800', margin: '4px 0' }}>
                  R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h2>
                <span style={{ fontSize: '0.7rem', color: 'var(--success)' }}>▲ 12.5% vs ontem</span>
              </div>

              <div className="glass-card" style={styles.metricCard}>
                <span style={styles.metricLabel}>Lucro Bruto (Hoje)</span>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '4px 0' }}>
                  R$ {lucroBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h2>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Margem média: {margemLucro.toFixed(1)}%</span>
              </div>

              <div className="glass-card" style={styles.metricCard}>
                <span style={styles.metricLabel}>Ticket Médio</span>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '4px 0' }}>
                  R$ {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h2>
                <span style={{ fontSize: '0.7rem', color: 'var(--success)' }}>▲ R$ 14.50 de aumento</span>
              </div>

              <div className="glass-card" style={styles.metricCard}>
                <span style={styles.metricLabel}>Meta Mensal Loja</span>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '4px 0' }}>
                  {Math.round((totalFaturamento / 70000) * 100)}%
                </h2>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Faturamento: R$ {totalFaturamento.toFixed(0)} / R$ 70.000</span>
              </div>
            </div>

            {/* Charts Grid */}
            <div style={styles.chartsGrid}>
              {/* Sales By Hour */}
              <div className="glass-card" style={styles.chartCard}>
                <h4 style={{ marginBottom: '16px', fontSize: '0.9rem' }}>Vendas por Hora</h4>
                <div style={{ width: '100%', height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesByHourData}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--neon-pink)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="var(--neon-pink)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={11} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} />
                      <Tooltip contentStyle={{ background: '#121216', borderColor: 'var(--border-color)' }} />
                      <Area type="monotone" dataKey="total" stroke="var(--neon-pink)" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sellers Performance */}
              <div className="glass-card" style={styles.chartCard}>
                <h4 style={{ marginBottom: '16px', fontSize: '0.9rem' }}>Desempenho dos Vendedores</h4>
                <div style={{ width: '100%', height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sellersRankingData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} />
                      <Tooltip contentStyle={{ background: '#121216', borderColor: 'var(--border-color)' }} />
                      <Bar dataKey="Vendas" fill="var(--neon-pink)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Meta" fill="rgba(255,255,255,0.08)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sales By Category */}
              <div className="glass-card" style={styles.chartCard}>
                <h4 style={{ marginBottom: '16px', fontSize: '0.9rem' }}>Vendas por Categoria</h4>
                <div style={{ width: '100%', height: '240px', display: 'flex', alignItems: 'center' }}>
                  <div style={{ flex: 1, height: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData.length ? categoryChartData : [{name: 'Sem Vendas', value: 1}]}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#121216', borderColor: 'var(--border-color)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={styles.chartLegend}>
                    {categoryChartData.map((entry, idx) => (
                      <div key={idx} style={styles.legendItem}>
                        <span style={{ ...styles.legendColor, background: COLORS[idx % COLORS.length] }}></span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{entry.name} ({Math.round(entry.value / totalFaturamento * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeSubTab === 'products' && (
          <div className="animate-fade-in" style={styles.tabContent}>
            <div style={styles.contentHeader}>
              <div>
                <h2>Cadastro de Produtos</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Gerenciamento de estoque por grade (Cor + Tamanho) e preços</p>
              </div>
              <button onClick={() => openProductModal(null)} className="btn btn-primary">
                <Plus size={16} /> Cadastrar Produto
              </button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome / SKU</th>
                    <th>Categoria</th>
                    <th>Custo</th>
                    <th>Venda</th>
                    <th>Estoque Total</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(prod => {
                    const totalStock = Array.isArray(prod.grid) ? prod.grid.reduce((acc, g) => acc + g.stock, 0) : 0;
                    return (
                      <tr key={prod.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img 
                              src={prod.image || 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=100&auto=format&fit=crop'} 
                              alt={prod.name} 
                              style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <strong style={{ fontSize: '0.875rem' }}>{prod.name}</strong>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{prod.sku}</span>
                            </div>
                          </div>
                        </td>
                        <td>{prod.category}</td>
                        <td>R$ {prod.costPrice.toFixed(2)}</td>
                        <td>R$ {prod.salePrice.toFixed(2)}</td>
                        <td>
                          <span className={`badge ${totalStock < 15 ? 'badge-danger' : 'badge-pink'}`}>
                            {totalStock} un
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${prod.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                            {prod.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => openProductModal(prod)}
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          >
                            Editar Grade
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CRM TAB */}
        {activeSubTab === 'crm' && (
          <div className="animate-fade-in" style={styles.tabContent}>
            <div style={styles.contentHeader}>
              <div>
                <h2>CRM & Gestão de Clientes</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Filtros inteligentes baseados em comportamento de compra e cadastro completo</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '2px' }}>
                  <button 
                    onClick={() => setCrmTabMode('crm')} 
                    style={{ 
                      background: crmTabMode === 'crm' ? 'var(--neon-pink)' : 'none',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Réguas CRM
                  </button>
                  <button 
                    onClick={() => setCrmTabMode('clients')} 
                    style={{ 
                      background: crmTabMode === 'clients' ? 'var(--neon-pink)' : 'none',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Lista de Clientes
                  </button>
                </div>
                {crmTabMode === 'clients' && (
                  <button onClick={() => { setEditingCustomer(null); setShowCustomerModal(true); }} className="btn btn-primary">
                    <Plus size={16} /> Cadastrar Cliente
                  </button>
                )}
              </div>
            </div>

            {crmTabMode === 'crm' ? (
              /* CRM Segments */
              <div style={styles.crmGrid}>
                {/* Segment: 90 Days Idle (Critical Inactive) */}
                <div className="glass-card" style={styles.crmCard}>
                  <div style={styles.crmCardHeader}>
                    <h4 style={{ color: 'var(--danger)' }}>Cliente Inativo (+90 dias)</h4>
                    <span className="badge badge-danger">{cohorts.n90.length}</span>
                  </div>
                  <p style={styles.crmCardDesc}>Régua: Enviar cupom agressivo de reativação.</p>
                  <div style={styles.crmUserList}>
                    {cohorts.n90.map(cust => (
                      <div key={cust.id} style={styles.crmUserRow}>
                        <div>
                          <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>{cust.name}</span>
                          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Última compra: {cust.lastPurchase || 'Nunca'}</p>
                        </div>
                        <button 
                          onClick={() => triggerCRMWhatsApp(cust, '90d', 'Olá, {cliente}! Sentimos sua falta. Preparamos um cupom especial de 20% para sua próxima compra fitness: VOLTAFIT20. Aproveite! 🛍️')}
                          className="btn btn-danger"
                          style={{ padding: '6px', borderRadius: '8px' }}
                        >
                          {sentAutomations[`${cust.id}-90d`] ? <Check size={14} /> : <Send size={14} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Segment: 60 Days Idle */}
                <div className="glass-card" style={styles.crmCard}>
                  <div style={styles.crmCardHeader}>
                    <h4 style={{ color: 'var(--warning)' }}>Sem comprar (+60 dias)</h4>
                    <span className="badge badge-warning">{cohorts.n60.length}</span>
                  </div>
                  <p style={styles.crmCardDesc}>Régua: Mensagem personalizada de novidades.</p>
                  <div style={styles.crmUserList}>
                    {cohorts.n60.map(cust => (
                      <div key={cust.id} style={styles.crmUserRow}>
                        <div>
                          <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>{cust.name}</span>
                          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Última compra: {cust.lastPurchase}</p>
                        </div>
                        <button 
                          onClick={() => triggerCRMWhatsApp(cust, '60d', 'Olá, {cliente}! Chegaram novos conjuntos de treino com cores lindas na loja. Separamos seu tamanho para você dar uma olhada. Quando vem nos visitar? 🏋️‍♀️')}
                          className="btn btn-secondary"
                          style={{ padding: '6px', borderRadius: '8px', color: 'var(--warning)' }}
                        >
                          {sentAutomations[`${cust.id}-60d`] ? <Check size={14} /> : <Send size={14} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Segment: 30 Days Idle */}
                <div className="glass-card" style={styles.crmCard}>
                  <div style={styles.crmCardHeader}>
                    <h4 style={{ color: 'var(--info)' }}>Fidelidade (+30 dias)</h4>
                    <span className="badge badge-warning" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>{cohorts.n30.length}</span>
                  </div>
                  <p style={styles.crmCardDesc}>Régua: Oferecer cupom de desconto exclusivo.</p>
                  <div style={styles.crmUserList}>
                    {cohorts.n30.map(cust => (
                      <div key={cust.id} style={styles.crmUserRow}>
                        <div>
                          <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>{cust.name}</span>
                          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Última compra: {cust.lastPurchase}</p>
                        </div>
                        <button 
                          onClick={() => triggerCRMWhatsApp(cust, '30d', 'Oi {cliente}, tudo bem? Faz 30 dias que você não treina de roupa nova! Use o cupom VIPFIT10 para garantir 10% de desconto no site ou na loja física. 💪')}
                          className="btn btn-secondary"
                          style={{ padding: '6px', borderRadius: '8px', color: '#3B82F6' }}
                        >
                          {sentAutomations[`${cust.id}-30d`] ? <Check size={14} /> : <Send size={14} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Customers List Table */
              <div className="table-container animate-fade-in">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nome / CPF</th>
                      <th>WhatsApp / Celular</th>
                      <th>Cidade</th>
                      <th>Gasto Total</th>
                      <th>Última Compra</th>
                      <th>Pontos</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(cust => (
                      <tr key={cust.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ fontSize: '0.875rem' }}>{cust.name}</strong>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CPF: {cust.cpf}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{cust.phone}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Zap: {cust.whatsapp}</span>
                          </div>
                        </td>
                        <td>{cust.city || 'Não informado'}</td>
                        <td>R$ {cust.totalSpent.toFixed(2)}</td>
                        <td>{cust.lastPurchase || 'Nunca comprou'}</td>
                        <td>
                          <span className="badge badge-pink">{cust.points} pts</span>
                        </td>
                        <td>
                          <button 
                            onClick={() => { setEditingCustomer(cust); setShowCustomerModal(true); }}
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* INVENTORY ABC TAB */}
        {activeSubTab === 'stock' && (
          <div className="animate-fade-in" style={styles.tabContent}>
            <div style={styles.contentHeader}>
              <div>
                <h2>Curva ABC de Estoque</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Classificação de produtos baseada no valor investido e giro</p>
              </div>
            </div>

            <div className="grid-3" style={{ marginBottom: '20px' }}>
              <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--neon-pink)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Classe A (Giro Alto / Valor Alto)</span>
                <h3 style={{ margin: '4px 0' }}>70% do Faturamento</h3>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ex: Legging High Compression, Corta Vento</p>
              </div>
              <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #3B82F6' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Classe B (Giro Médio)</span>
                <h3 style={{ margin: '4px 0' }}>20% do Faturamento</h3>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ex: Top Sport Combat, Shorts Running</p>
              </div>
              <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #10B981' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Classe C (Giro Baixo)</span>
                <h3 style={{ margin: '4px 0' }}>10% do Faturamento</h3>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ex: Camiseta UV Protection</p>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Estoque</th>
                    <th>Valor de Custo</th>
                    <th>Valor de Venda</th>
                    <th>Investimento Total</th>
                    <th>Classe</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, idx) => {
                    const totalStock = Array.isArray(p.grid) ? p.grid.reduce((acc, g) => acc + g.stock, 0) : 0;
                    const costVal = totalStock * p.costPrice;
                    const saleVal = totalStock * p.salePrice;
                    const cClass = idx < 2 ? 'A' : idx < 4 ? 'B' : 'C';
                    
                    return (
                      <tr key={p.id}>
                        <td><strong>{p.name}</strong></td>
                        <td>{totalStock} un</td>
                        <td>R$ {p.costPrice.toFixed(2)}</td>
                        <td>R$ {p.salePrice.toFixed(2)}</td>
                        <td>R$ {costVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td>
                          <span className={`badge ${cClass === 'A' ? 'badge-pink' : cClass === 'B' ? 'badge-warning' : 'badge-success'}`}>
                            Classe {cClass}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FINANCE DRE TAB */}
        {activeSubTab === 'finance' && (
          <div className="animate-fade-in" style={styles.tabContent}>
            <div style={styles.contentHeader}>
              <div>
                <h2>DRE (Demonstração do Resultado do Exercício)</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Análise de receitas, custos operacionais e margem líquida simulada</p>
              </div>
            </div>

            {/* DRE Report Card */}
            <div className="glass-card" style={styles.dreCard}>
              <div style={styles.dreRowHeader}>
                <span>Conta Financeira</span>
                <span>Valor Acumulado (R$)</span>
              </div>
              
              <div style={styles.dreRow}>
                <span>(+) RECEITA BRUTA DE VENDAS</span>
                <span>R$ {totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={styles.dreRowSub}>
                <span>(-) Impostos (Simples Nacional 6%)</span>
                <span style={{ color: 'var(--danger)' }}>- R$ {(totalFaturamento * 0.06).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              <div style={{ ...styles.dreRow, fontWeight: '600' }}>
                <span>(=) RECEITA LÍQUIDA</span>
                <span>R$ {(totalFaturamento * 0.94).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              <div style={styles.dreRow}>
                <span>(-) CUSTO DAS MERCADORIAS VENDIDAS (CMV)</span>
                <span style={{ color: 'var(--danger)' }}>- R$ {totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              <div style={{ ...styles.dreRow, fontWeight: '600', background: 'rgba(255,45,142,0.03)' }}>
                <span>(=) LUCRO OPERACIONAL BRUTO</span>
                <span className="text-neon">R$ {lucroBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              <div style={styles.dreRow}>
                <span>(-) DESPESAS OPERACIONAIS</span>
                <span style={{ color: 'var(--danger)' }}>- R$ 1.500,00</span>
              </div>
              <div style={styles.dreRowSub}>
                <span>Aluguel & Condomínio Proporcional</span>
                <span>- R$ 800,00</span>
              </div>
              <div style={styles.dreRowSub}>
                <span>Marketing & Tráfego</span>
                <span>- R$ 300,00</span>
              </div>
              <div style={styles.dreRowSub}>
                <span>Comissões de Vendedores (3% médio)</span>
                <span>- R$ {(totalFaturamento * 0.03).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              <div style={{ ...styles.dreRowHeader, background: 'var(--bg-tertiary)', borderTop: '1px solid var(--neon-pink-border)' }}>
                <span>(=) RESULTADO LÍQUIDO DO PERÍODO (LUCRO)</span>
                <span className="text-neon" style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                  R$ {(lucroBruto - 1500 - (totalFaturamento * 0.03)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* AI INTEGRATED TAB */}
        {activeSubTab === 'ai' && (
          <div className="animate-fade-in" style={styles.tabContent}>
            <div style={styles.contentHeader}>
              <div>
                <h2>Inteligência Artificial Executiva</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Consulte faturamento, melhor vendedor, ruptura de estoque e campanhas em linguagem natural</p>
              </div>
            </div>

            <div style={styles.aiChatContainer} className="glass-card">
              <div style={styles.chatHistoryBox}>
                {chatHistory.map((msg, index) => (
                  <div key={index} style={{
                    ...styles.chatBubbleRow,
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{
                      ...styles.chatBubble,
                      background: msg.sender === 'user' ? 'var(--neon-pink)' : 'var(--bg-tertiary)',
                      border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)',
                    }}>
                      <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-line' }}>{msg.text}</p>
                      
                      {/* Interactive dynamic chart injected by AI response */}
                      {msg.chartData && (
                        <div style={{ width: '100%', height: '160px', marginTop: '16px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={msg.chartData}>
                              <XAxis dataKey="name" stroke="#888888" fontSize={10} />
                              <Tooltip contentStyle={{ background: '#121216', fontSize: '10px' }} />
                              <Bar dataKey="vendas" fill="#ff57a5" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="valor" fill="#ff57a5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Interactive data grid injected by AI response */}
                      {msg.data && (
                        <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                          {msg.data.slice(0, 3).map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '4px 0' }}>
                              <span>{item.name}</span>
                              <strong className="text-neon">{item.stock ? `${item.stock} un` : `R$ ${item.totalSpent}`}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Prompt Buttons */}
              <div style={styles.quickPromptsRow}>
                <button onClick={() => { setChatInput('Quanto vendi hoje?'); }} style={styles.promptBtn}>"Quanto vendi hoje?"</button>
                <button onClick={() => { setChatInput('Quem é meu melhor vendedor?'); }} style={styles.promptBtn}>"Quem é meu melhor vendedor?"</button>
                <button onClick={() => { setChatInput('Qual produto está parado no estoque?'); }} style={styles.promptBtn}>"Qual produto está parado?"</button>
                <button onClick={() => { setChatInput('Quais clientes não compram há 60 dias?'); }} style={styles.promptBtn}>"Inativos há 60 dias?"</button>
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleAISubmit} style={styles.chatInputForm}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Pergunte algo sobre a sua loja física (Ex: Quem é o melhor vendedor?)..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary">
                  Perguntar
                </button>
              </form>
            </div>
          </div>
        )}

        {/* PURCHASES TAB */}
        {activeSubTab === 'purchases' && (
          <div className="animate-fade-in" style={styles.tabContent}>
            <div style={styles.contentHeader}>
              <div>
                <h2>Gestão de Compras e Reposição</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Histórico de ordens de compra e entrada de mercadorias no estoque físico</p>
              </div>
              <button onClick={() => {
                if (products.length === 0) {
                  alert('Cadastre um produto antes de registrar uma compra.');
                  return;
                }
                setSelectedProductForPurchase(products[0]);
                const gridColors = products[0]?.grid?.map(g => g.color) || ['Preto'];
                setSelectedPurchaseColor(gridColors[0] || 'Preto');
                setShowPurchaseModal(true);
              }} className="btn btn-primary">
                <Plus size={16} /> Lançar Compra
              </button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Fornecedor</th>
                    <th>Produto / SKU</th>
                    <th>Grade</th>
                    <th>Qtd</th>
                    <th>Preço Custo</th>
                    <th>Total Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases?.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma compra registrada</td>
                    </tr>
                  ) : (
                    purchases?.map(p => (
                      <tr key={p.id}>
                        <td>{new Date(p.date).toLocaleDateString('pt-BR')}</td>
                        <td>{p.supplierName}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong>{p.productName}</strong>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {products.find(prod => prod.id === p.productId)?.sku || ''}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-pink">{p.color} - {p.size}</span>
                        </td>
                        <td>{p.quantity} un</td>
                        <td>R$ {p.costPrice.toFixed(2)}</td>
                        <td style={{ fontWeight: '600' }}>R$ {p.totalCost.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PROMOTIONS TAB */}
        {activeSubTab === 'promotions' && (
          <div className="animate-fade-in" style={styles.tabContent}>
            <div style={styles.contentHeader}>
              <div>
                <h2>Campanhas Promocionais Ativas</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Gerencie descontos de checkout e promoções globais aplicados ao PDV</p>
              </div>
              <button 
                onClick={() => {
                  setEditingPromo(null);
                  setPromoType('percentage');
                  setShowPromoModal(true);
                }} 
                className="btn btn-primary"
              >
                <Plus size={16} /> Criar Campanha
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {promotions?.map(promo => (
                <div key={promo.id} className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>{promo.name}</h3>
                      <span className={`badge ${promo.active ? 'badge-success' : 'badge-danger'}`}>
                        {promo.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{promo.description}</p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Código Interno: {promo.type}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => {
                        const updated = promotions.map(p => p.id === promo.id ? { ...p, active: !p.active } : p);
                        setPromotions(updated);
                      }}
                      className={`btn ${promo.active ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                    >
                      {promo.active ? 'Desativar' : 'Ativar'}
                    </button>
                    {!['promo-1', 'promo-2', 'promo-3'].includes(promo.id) && (
                      <button 
                        onClick={() => {
                          if (window.confirm('Deseja excluir esta campanha?')) {
                            deletePromotion(promo.id);
                          }
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '8px', color: 'var(--danger)' }}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AUDITS TAB */}
        {activeSubTab === 'audits' && (
          <div className="animate-fade-in" style={styles.tabContent}>
            <div style={styles.contentHeader}>
              <div>
                <h2>Auditoria de Caixas & Turnos</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Histórico de fechamentos cegos, declarações de operadores e conciliação de caixa</p>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Data Fechamento</th>
                    <th>Operador</th>
                    <th>Fundo Inicial</th>
                    <th>Total Esperado</th>
                    <th>Total Declarado</th>
                    <th>Diferença (Quebra)</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {cashShifts?.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum turno de caixa encerrado ainda.</td>
                    </tr>
                  ) : (
                    cashShifts.map(shift => {
                      const isExpanded = expandedShiftId === shift.id;
                      const diffColor = shift.difference === 0 
                        ? 'var(--success)' 
                        : shift.difference > 0 
                          ? '#00ffff' 
                          : 'var(--danger)';

                      return (
                        <React.Fragment key={shift.id}>
                          <tr>
                            <td>{new Date(shift.closedAt).toLocaleString('pt-BR')}</td>
                            <td><strong>{shift.operatorName}</strong></td>
                            <td>R$ {shift.initialValue.toFixed(2)}</td>
                            <td>R$ {shift.calculatedTotal.toFixed(2)}</td>
                            <td>R$ {shift.declaredTotal.toFixed(2)}</td>
                            <td>
                              <strong style={{ color: diffColor }}>
                                {shift.difference > 0 ? '+' : ''} R$ {shift.difference.toFixed(2)}
                              </strong>
                            </td>
                            <td>
                              <button 
                                onClick={() => setExpandedShiftId(isExpanded ? null : shift.id)}
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                              >
                                {isExpanded ? 'Ocultar Detalhes' : 'Ver Conciliação'}
                              </button>
                            </td>
                          </tr>
                          
                          {isExpanded && (
                            <tr>
                              <td colSpan="7" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                  
                                  {/* Tabela de Conciliação */}
                                  <div>
                                    <h4 style={{ color: 'var(--neon-pink)', marginBottom: '12px', fontSize: '0.9rem' }}>Conciliação por Meio de Pagamento</h4>
                                    <table className="table" style={{ fontSize: '0.8rem', background: 'transparent' }}>
                                      <thead>
                                        <tr>
                                          <th>Meio</th>
                                          <th>Esperado</th>
                                          <th>Declarado</th>
                                          <th>Diferença</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td><strong>Dinheiro</strong></td>
                                          <td>R$ {shift.details.expected.money.toFixed(2)}</td>
                                          <td>R$ {shift.details.declared.money.toFixed(2)}</td>
                                          <td style={{ color: shift.details.differences.money === 0 ? 'var(--text-secondary)' : shift.details.differences.money > 0 ? '#00ffff' : 'var(--danger)', fontWeight: 'bold' }}>
                                            R$ {shift.details.differences.money.toFixed(2)}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td><strong>PIX</strong></td>
                                          <td>R$ {shift.details.expected.pix.toFixed(2)}</td>
                                          <td>R$ {shift.details.declared.pix.toFixed(2)}</td>
                                          <td style={{ color: shift.details.differences.pix === 0 ? 'var(--text-secondary)' : shift.details.differences.pix > 0 ? '#00ffff' : 'var(--danger)', fontWeight: 'bold' }}>
                                            R$ {shift.details.differences.pix.toFixed(2)}
                                          </td>
                                        </tr>
                                        <tr>
                                          <td><strong>Cartões</strong></td>
                                          <td>R$ {shift.details.expected.card.toFixed(2)}</td>
                                          <td>R$ {shift.details.declared.card.toFixed(2)}</td>
                                          <td style={{ color: shift.details.differences.card === 0 ? 'var(--text-secondary)' : shift.details.differences.card > 0 ? '#00ffff' : 'var(--danger)', fontWeight: 'bold' }}>
                                            R$ {shift.details.differences.card.toFixed(2)}
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* Histórico de Transações do Turno */}
                                  <div>
                                    <h4 style={{ color: 'var(--neon-pink)', marginBottom: '12px', fontSize: '0.9rem' }}>Transações Realizadas no Turno</h4>
                                    <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px' }}>
                                      {shift.transactions?.length === 0 ? (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', margin: '20px 0' }}>Sem transações registradas.</p>
                                      ) : (
                                        shift.transactions.map((tx, idx) => (
                                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem' }}>
                                            <div>
                                              <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>[{tx.time}]</span>
                                              <span style={{ textTransform: 'capitalize', fontWeight: '500', color: tx.type === 'sangria' ? 'var(--danger)' : tx.type === 'suprimento' ? '#00ffff' : 'var(--text-primary)' }}>{tx.type}</span>
                                              <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)' }}>{tx.description}</p>
                                            </div>
                                            <strong>R$ {tx.amount.toFixed(2)}</strong>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeSubTab === 'settings' && (
          <div className="animate-fade-in" style={styles.tabContent}>
            <div style={styles.contentHeader}>
              <div>
                <h2>Configurações do ERP</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Gerencie os dados da empresa, backups e restauração completa</p>
              </div>
            </div>

            <div className="grid-2">
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Backup e Portabilidade</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Como o FITSTORE ERP armazena todos os seus dados localmente no navegador, você pode baixar o backup completo para salvar seu progresso ou transferir para outra máquina.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button 
                    onClick={() => {
                      try {
                        const dbData = {
                          fitstore_products: localStorage.getItem('fitstore_products'),
                          fitstore_customers: localStorage.getItem('fitstore_customers'),
                          fitstore_sellers: localStorage.getItem('fitstore_sellers'),
                          fitstore_sales: localStorage.getItem('fitstore_sales'),
                          fitstore_finances: localStorage.getItem('fitstore_finances'),
                          fitstore_cash: localStorage.getItem('fitstore_cash'),
                          fitstore_coupons: localStorage.getItem('fitstore_coupons'),
                          fitstore_promotions: localStorage.getItem('fitstore_promotions'),
                          fitstore_settings: localStorage.getItem('fitstore_settings'),
                          fitstore_purchases: localStorage.getItem('fitstore_purchases'),
                          fitstore_suppliers: localStorage.getItem('fitstore_suppliers'),
                          fitstore_shifts: localStorage.getItem('fitstore_shifts')
                        };
                        const signature = signBackupData(dbData);
                        const backup = {
                          payload: dbData,
                          signature: signature
                        };
                        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `fitstore_backup_${new Date().toISOString().slice(0, 10)}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      } catch (err) {
                        alert('Erro ao gerar backup: ' + err.message);
                      }
                    }} 
                    className="btn btn-primary" 
                    style={{ width: '100%', gap: '8px' }}
                  >
                    Exportar Banco de Dados (JSON)
                  </button>
 
                  <div style={{ borderTop: '1px solid var(--border-color)', margin: '8px 0' }}></div>
 
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '6px' }}>Importar Banco de Dados (JSON)</label>
                  <input 
                    type="file" 
                    accept=".json" 
                    className="input-field" 
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        try {
                          const data = JSON.parse(evt.target.result);
                          let payload = data;
                          
                          if (data.signature && data.payload) {
                            const isValid = verifyBackupSignature(data.payload, data.signature);
                            if (!isValid) {
                              alert('ERRO DE SEGURANÇA: A assinatura digital do arquivo de backup não confere! O arquivo pode ter sido corrompido ou adulterado por um agente malicioso.');
                              return;
                            }
                            payload = data.payload;
                          } else {
                            if (!window.confirm('AVISO: Este arquivo de backup não possui uma assinatura de segurança digital. Deseja importá-lo mesmo assim?')) {
                              return;
                            }
                          }

                          if (!payload.fitstore_products && !payload.fitstore_settings) {
                            alert('Arquivo JSON inválido. Certifique-se de que é um backup legítimo do FitStore ERP.');
                            return;
                          }
                          Object.keys(payload).forEach(key => {
                            if (payload[key]) localStorage.setItem(key, payload[key]);
                          });
                          alert('Banco de dados restaurado com sucesso! O sistema será reiniciado.');
                          window.location.reload();
                        } catch (err) {
                          alert('Erro ao ler arquivo: ' + err.message);
                        }
                      };
                      reader.readAsText(file);
                    }}
                    style={{ fontSize: '0.8rem', padding: '10px' }} 
                  />
                  
                  <div style={{ borderTop: '1px solid var(--border-color)', margin: '14px 0' }}></div>

                  <button 
                    onClick={() => {
                      const passwordInput = prompt('ATENÇÃO: Essa ação irá apagar permanentemente toda a base de dados (vendas, estoque, clientes, fluxo de caixa) e reiniciará o ERP para o modo de produção vazio.\n\nPara confirmar, digite a senha master do administrador:');
                      if (passwordInput === null) return; // Cancelado
                      
                      const hashedInput = hashPassword(passwordInput);
                      const correctHash = hashPassword('1234'); // Senha admin master padrão
                      
                      if (hashedInput !== correctHash) {
                        alert('ERRO: Senha master incorreta. Operação de limpeza abortada.');
                        return;
                      }

                      if (window.confirm('ÚLTIMA CONFIRMAÇÃO: Tem certeza absoluta que deseja LIMPAR TUDO? Esta ação é irreversível.')) {
                        localStorage.clear();
                        alert('Banco de dados limpo com sucesso! O sistema será reiniciado com a base vazia para produção.');
                        window.location.reload();
                      }
                    }} 
                    className="btn btn-secondary" 
                    style={{ width: '100%', gap: '8px', color: 'var(--danger)', borderColor: 'var(--danger)', padding: '10px', fontSize: '0.8rem' }}
                  >
                    Limpar Banco de Dados (Reset para Produção)
                  </button>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>Dados da Loja</h3>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    setSettings({
                      ...settings,
                      companyName: formData.get('companyName'),
                      cnpj: formData.get('cnpj'),
                      whatsappTemplate: formData.get('whatsappTemplate')
                    });
                    alert('Configurações atualizadas!');
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                  <div className="form-group">
                    <label className="form-label">Razão Social / Nome Fantasia</label>
                    <input type="text" name="companyName" className="input-field" defaultValue={settings.companyName} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CNPJ</label>
                    <input type="text" name="cnpj" className="input-field" defaultValue={settings.cnpj} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Template de WhatsApp Comprovante</label>
                    <textarea name="whatsappTemplate" className="input-field" rows="3" defaultValue={settings.whatsappTemplate} style={{ resize: 'none', fontFamily: 'inherit' }} required />
                  </div>
                  <button type="submit" className="btn btn-secondary" style={{ width: '100%', marginTop: '8px' }}>
                    Salvar Dados
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* PRODUCT CONFIGURATION MODAL (WITH MATRIX GRADE EDIT) */}
      {showProductModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-fade-in" style={styles.productModal}>
            <div style={styles.modalHeader}>
              <h3>{editingProduct ? 'Editar Grade do Produto' : 'Cadastrar Novo Produto'}</h3>
              <button onClick={() => setShowProductModal(false)} style={styles.modalCloseBtn}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleProductSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Nome do Produto</label>
                <input
                  type="text"
                  name="name"
                  className="input-field"
                  defaultValue={editingProduct?.name || ''}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">SKU</label>
                  <input
                    type="text"
                    name="sku"
                    className="input-field"
                    defaultValue={editingProduct?.sku || ''}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Categoria</label>
                  <input
                    type="text"
                    name="category"
                    className="input-field"
                    defaultValue={editingProduct?.category || ''}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Preço Custo (R$)</label>
                  <input
                    type="text"
                    name="costPrice"
                    className="input-field"
                    placeholder="0.00"
                    defaultValue={editingProduct?.costPrice || ''}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Preço Venda (R$)</label>
                  <input
                    type="text"
                    name="salePrice"
                    className="input-field"
                    placeholder="0.00"
                    defaultValue={editingProduct?.salePrice || ''}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Fornecedor</label>
                <input
                  type="text"
                  name="supplier"
                  className="input-field"
                  defaultValue={editingProduct?.supplier || ''}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Imagem do Produto</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {modalProductImage ? (
                    <img 
                      src={modalProductImage} 
                      alt="Preview" 
                      style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
                    />
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '8px', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      Sem Foto
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <button 
                      type="button" 
                      onClick={() => {
                        const fileInput = document.getElementById('product-image-file-input');
                        if (fileInput) fileInput.click();
                      }}
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'fit-content' }}
                    >
                      Escolher Foto Local
                    </button>
                    <input 
                      id="product-image-file-input"
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            setModalProductImage(evt.target.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Ou cole a URL da imagem..." 
                      value={modalProductImage} 
                      onChange={(e) => setModalProductImage(e.target.value)}
                      style={{ padding: '6px 12px', fontSize: '0.75rem', width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Grid Matrix View */}
              <div style={{ marginTop: '8px' }}>
                <label className="form-label">Grade de Estoque (Cor + Tamanho)</label>
                <div style={styles.modalGridMatrix}>
                  {tempGrid.map((item, idx) => (
                    <div key={idx} style={styles.matrixItemRow}>
                      <span>{item.color} - {item.size}</span>
                      <input
                        type="number"
                        className="input-field"
                        value={item.stock}
                        style={{ width: '80px', padding: '4px', textAlign: 'center', fontSize: '0.8rem' }}
                        onChange={(e) => {
                          const updated = [...tempGrid];
                          updated[idx].stock = parseInt(e.target.value) || 0;
                          setTempGrid(updated);
                        }}
                      />
                    </div>
                  ))}
                </div>
                {/* Add variation form */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Nova Cor (ex: Azul)"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="input-field"
                    style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }}
                  />
                  <select
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    className="input-field"
                    style={{ width: '70px', padding: '6px', fontSize: '0.8rem', background: '#121212' }}
                  >
                    <option value="PP">PP</option>
                    <option value="P">P</option>
                    <option value="M">M</option>
                    <option value="G">G</option>
                    <option value="GG">GG</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (newColor.trim()) {
                        setTempGrid([...tempGrid, { color: newColor.trim(), size: newSize, stock: 10 }]);
                        setNewColor('');
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    + Add
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%', marginTop: '12px' }}>
                Salvar Produto
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER CONFIGURATION MODAL */}
      {showCustomerModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-fade-in" style={styles.productModal}>
            <div style={styles.modalHeader}>
              <h3>{editingCustomer ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</h3>
              <button onClick={() => setShowCustomerModal(false)} style={styles.modalCloseBtn}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleCustomerSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input
                  type="text"
                  name="name"
                  className="input-field"
                  defaultValue={editingCustomer?.name || ''}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">CPF</label>
                  <input
                    type="text"
                    name="cpf"
                    className="input-field"
                    placeholder="000.000.000-00"
                    defaultValue={editingCustomer?.cpf || ''}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Nascimento</label>
                  <input
                    type="date"
                    name="birthdate"
                    className="input-field"
                    defaultValue={editingCustomer?.birthdate || ''}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Telefone</label>
                  <input
                    type="text"
                    name="phone"
                    className="input-field"
                    placeholder="(00) 00000-0000"
                    defaultValue={editingCustomer?.phone || ''}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">WhatsApp (DDI+DDD+Num)</label>
                  <input
                    type="text"
                    name="whatsapp"
                    className="input-field"
                    placeholder="5511999999999"
                    defaultValue={editingCustomer?.whatsapp || ''}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Instagram</label>
                  <input
                    type="text"
                    name="instagram"
                    className="input-field"
                    placeholder="@usuario"
                    defaultValue={editingCustomer?.instagram || ''}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Sexo</label>
                  <select
                    name="gender"
                    className="input-field"
                    defaultValue={editingCustomer?.gender || 'Feminino'}
                    style={{ background: '#121212' }}
                  >
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Cidade</label>
                  <input
                    type="text"
                    name="city"
                    className="input-field"
                    defaultValue={editingCustomer?.city || ''}
                  />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Endereço Completo</label>
                  <input
                    type="text"
                    name="address"
                    className="input-field"
                    defaultValue={editingCustomer?.address || ''}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Observações de Preferência</label>
                <textarea
                  name="notes"
                  className="input-field"
                  rows="2"
                  defaultValue={editingCustomer?.notes || ''}
                  placeholder="Ex: prefere calças de compressão pretas..."
                  style={{ fontFamily: 'inherit', resize: 'none' }}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%', marginTop: '12px' }}>
                Salvar Cliente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PURCHASE REGISTRATION MODAL */}
      {showPurchaseModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-fade-in" style={styles.productModal}>
            <div style={styles.modalHeader}>
              <h3>Registrar Entrada de Mercadoria</h3>
              <button onClick={() => setShowPurchaseModal(false)} style={styles.modalCloseBtn}><X size={18} /></button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const prodId = formData.get('productId');
              const supId = formData.get('supplierId');
              const qty = parseInt(formData.get('quantity')) || 0;
              const cost = parseFloat(formData.get('costPrice')) || 0;

              if (qty <= 0 || cost <= 0) {
                alert('Quantidade e preço de custo devem ser maiores que zero.');
                return;
              }

              const prod = products.find(p => p.id === prodId);
              const sup = suppliers.find(s => s.id === supId);

              savePurchase({
                productId: prodId,
                productName: prod.name,
                supplierId: supId,
                supplierName: sup.name,
                color: selectedPurchaseColor,
                size: selectedPurchaseSize,
                quantity: qty,
                costPrice: cost,
                totalCost: qty * cost
              });

              setShowPurchaseModal(false);
            }} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Produto *</label>
                <select 
                  name="productId" 
                  className="input-field" 
                  value={selectedProductForPurchase?.id || ''}
                  onChange={(e) => {
                    const prod = products.find(p => p.id === e.target.value);
                    setSelectedProductForPurchase(prod);
                    const gridColors = prod?.grid?.map(g => g.color) || ['Preto'];
                    setSelectedPurchaseColor(gridColors[0] || 'Preto');
                  }}
                  style={{ background: '#121212' }}
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Fornecedor *</label>
                <select name="supplierId" className="input-field" style={{ background: '#121212' }} required>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.cnpj})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Cor *</label>
                  <select 
                    value={selectedPurchaseColor} 
                    onChange={(e) => {
                      setSelectedPurchaseColor(e.target.value);
                    }}
                    className="input-field"
                    style={{ background: '#121212' }}
                    required
                  >
                    {Array.from(new Set(selectedProductForPurchase?.grid?.map(g => g.color) || ['Preto'])).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="Nova Cor">+ Outra</option>
                  </select>
                  {selectedPurchaseColor === 'Nova Cor' && (
                    <input 
                      type="text" 
                      placeholder="Nome da cor" 
                      className="input-field" 
                      style={{ marginTop: '6px', padding: '6px' }}
                      onBlur={(e) => {
                        if (e.target.value.trim()) {
                          setSelectedPurchaseColor(e.target.value.trim());
                        }
                      }}
                    />
                  )}
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Tamanho *</label>
                  <select 
                    value={selectedPurchaseSize} 
                    onChange={(e) => setSelectedPurchaseSize(e.target.value)}
                    className="input-field"
                    style={{ background: '#121212' }}
                    required
                  >
                    {['PP', 'P', 'M', 'G', 'GG'].map(sz => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Quantidade *</label>
                  <input type="number" name="quantity" className="input-field" placeholder="Ex: 50" min="1" required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Preço Custo Unitário (R$) *</label>
                  <input 
                    type="number" 
                    name="costPrice" 
                    className="input-field" 
                    placeholder="0.00" 
                    step="0.01" 
                    defaultValue={selectedProductForPurchase?.costPrice || ''} 
                    required 
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%', marginTop: '12px' }}>
                Registrar Entrada e Despesa
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PROMOTION MODAL */}
      {showPromoModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-fade-in" style={styles.productModal}>
            <div style={styles.scannerHeader}>
              <h3>{editingPromo ? 'Editar Campanha' : 'Criar Nova Campanha'}</h3>
              <button onClick={() => setShowPromoModal(false)} style={styles.modalCloseBtn}><X size={18} /></button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const type = formData.get('type');
              
              let promoObj = {
                id: editingPromo?.id || null,
                name: formData.get('name'),
                type,
                description: formData.get('description'),
                active: formData.get('active') === 'true'
              };

              if (type === 'percentage') {
                promoObj.value = parseFloat(formData.get('value')) || 0;
              } else if (type === 'category') {
                promoObj.value = parseFloat(formData.get('value')) || 0;
                promoObj.category = formData.get('category') || '';
              } else if (type === 'l3p2') {
                promoObj.take = parseInt(formData.get('take')) || 3;
                promoObj.pay = parseInt(formData.get('pay')) || 2;
              } else if (type === 'kit') {
                promoObj.value = parseFloat(formData.get('value')) || 199.90;
                promoObj.category1 = formData.get('category1') || 'Leggings';
                promoObj.category2 = formData.get('category2') || 'Tops';
              }

              savePromotion(promoObj);
              setShowPromoModal(false);
            }} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div className="form-group">
                <label className="form-label">Nome da Campanha</label>
                <input 
                  type="text" 
                  name="name" 
                  className="input-field" 
                  defaultValue={editingPromo?.name || ''} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de Campanha</label>
                <select 
                  name="type" 
                  className="input-field" 
                  value={promoType}
                  onChange={(e) => setPromoType(e.target.value)}
                  style={{ background: '#121212' }}
                  required
                >
                  <option value="percentage">Desconto em Porcentagem (%) Global</option>
                  <option value="category">Desconto em Categoria Específica (%)</option>
                  <option value="l3p2">Leve X Pague Y (Ex: Leve 3 Pague 2)</option>
                  <option value="progressivo">Desconto Progressivo de Varejo</option>
                  <option value="kit">Kit Compre Junto (Legging + Top)</option>
                </select>
              </div>

              {/* Conditional parameters based on type */}
              {promoType === 'percentage' && (
                <div className="form-group">
                  <label className="form-label">Desconto Global (%)</label>
                  <input 
                    type="number" 
                    name="value" 
                    className="input-field" 
                    placeholder="Ex: 15" 
                    defaultValue={editingPromo?.value || ''} 
                    required 
                  />
                </div>
              )}

              {promoType === 'category' && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Categoria do Produto</label>
                    <input 
                      type="text" 
                      name="category" 
                      className="input-field" 
                      placeholder="Ex: Leggings" 
                      defaultValue={editingPromo?.category || ''} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Desconto na Categoria (%)</label>
                    <input 
                      type="number" 
                      name="value" 
                      className="input-field" 
                      placeholder="Ex: 20" 
                      defaultValue={editingPromo?.value || ''} 
                      required 
                    />
                  </div>
                </div>
              )}

              {promoType === 'l3p2' && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Leve (Qtd)</label>
                    <input 
                      type="number" 
                      name="take" 
                      className="input-field" 
                      defaultValue={editingPromo?.take || 3} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Pague (Qtd)</label>
                    <input 
                      type="number" 
                      name="pay" 
                      className="input-field" 
                      defaultValue={editingPromo?.pay || 2} 
                      required 
                    />
                  </div>
                </div>
              )}

              {promoType === 'kit' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Categoria 1</label>
                      <input 
                        type="text" 
                        name="category1" 
                        className="input-field" 
                        defaultValue={editingPromo?.category1 || 'Leggings'} 
                        required 
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Categoria 2</label>
                      <input 
                        type="text" 
                        name="category2" 
                        className="input-field" 
                        defaultValue={editingPromo?.category2 || 'Tops'} 
                        required 
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preço Combinado das 2 Peças (R$)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      name="value" 
                      className="input-field" 
                      defaultValue={editingPromo?.value || 199.90} 
                      required 
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Descrição da Promoção (Aparece no PDV)</label>
                <textarea 
                  name="description" 
                  className="input-field" 
                  rows="2" 
                  defaultValue={editingPromo?.description || ''} 
                  placeholder="Descreva as condições da campanha..." 
                  required
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input 
                  type="checkbox" 
                  id="promo-active-checkbox" 
                  name="active" 
                  value="true" 
                  defaultChecked={editingPromo ? editingPromo.active : true} 
                  style={{ width: '16px', height: '16px' }}
                />
                <label htmlFor="promo-active-checkbox" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>Ativar campanha imediatamente</label>
              </div>

              <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%', marginTop: '12px' }}>
                Salvar Campanha
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline styles
const styles = {
  adminContainer: {
    display: 'flex',
    height: '100vh',
    height: '100dvh',
    background: 'var(--bg-primary)',
    overflow: 'hidden'
  },
  sidebar: {
    width: '260px',
    height: '100%',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '0',
    borderRight: '1px solid var(--border-color)',
    flexShrink: 0
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '32px'
  },
  logoCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'var(--neon-pink-dim)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandText: {
    fontSize: '1.1rem',
    fontWeight: '700',
    letterSpacing: '0.5px'
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flexGrow: 1
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '0.875rem',
    textAlign: 'left',
    cursor: 'pointer',
    width: '100%',
    transition: 'var(--transition)'
  },
  navLinkActive: {
    background: 'var(--neon-pink-dim)',
    color: 'var(--neon-pink)',
    borderLeft: '3px solid var(--neon-pink)',
    borderRadius: '0 12px 12px 0'
  },
  sidebarFooter: {
    borderTop: '1px solid var(--border-color)',
    paddingTop: '16px'
  },

  mainContent: {
    flexGrow: 1,
    height: '100%',
    overflowY: 'auto',
    padding: '24px'
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  contentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  metricCard: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column'
  },
  metricLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },

  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px'
  },
  chartCard: {
    padding: '20px',
    minHeight: '300px'
  },
  chartLegend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingLeft: '12px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  legendColor: {
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  },

  // CRM specific styles
  crmGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px'
  },
  crmCard: {
    padding: '20px',
    height: '380px',
    display: 'flex',
    flexDirection: 'column'
  },
  crmCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  crmCardDesc: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginBottom: '16px'
  },
  crmUserList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    overflowY: 'auto',
    flexGrow: 1
  },
  crmUserRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.015)',
    border: '1px solid var(--border-color)',
    padding: '10px 12px',
    borderRadius: '10px'
  },

  // Finance DRE styles
  dreCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  dreRowHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontWeight: '600',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '8px 12px',
    background: 'var(--bg-secondary)',
    borderRadius: '6px'
  },
  dreRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.9rem',
    padding: '10px 12px',
    borderBottom: '1px solid var(--border-color)'
  },
  dreRowSub: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    padding: '6px 12px 6px 28px'
  },

  // AI Chat styles
  aiChatContainer: {
    height: '520px',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px'
  },
  chatHistoryBox: {
    flexGrow: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '8px',
    marginBottom: '12px'
  },
  chatBubbleRow: {
    display: 'flex',
    width: '100%'
  },
  chatBubble: {
    maxWidth: '80%',
    padding: '12px 16px',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-sm)',
    color: 'white'
  },
  quickPromptsRow: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '12px',
    flexShrink: 0
  },
  promptBtn: {
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    padding: '8px 14px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'var(--transition)'
  },
  chatInputForm: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0
  },

  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(8px)',
    zIndex: '999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  productModal: {
    width: '100%',
    maxWidth: '480px'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-color)'
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer'
  },
  modalGridMatrix: {
    maxHeight: '150px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    background: 'rgba(0,0,0,0.2)',
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)'
  },
  matrixItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.8rem',
    padding: '4px 8px'
  }
};
// Add CSS hover logic dynamically via standard hooks if needed, or index.css handles it.
styles.promptBtn[':hover'] = {
  borderColor: 'var(--neon-pink)',
  color: 'white'
};
