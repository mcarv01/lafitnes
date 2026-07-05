import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, ShoppingCart, User, CreditCard, DollarSign, QrCode, 
  Trash2, Plus, Minus, Camera, Smartphone, Power, LayoutDashboard,
  Coins, ArrowDownRight, ArrowUpRight, CheckCircle2, Send, X, Printer
} from 'lucide-react';

export default function PDV({ onNavigateToAdmin }) {
  const { 
    user, logout, products, customers, cashRegister, openCashRegister, 
    closeCashRegister, addCashTransaction, addSale, coupons, saveCustomer, settings,
    promotions
  } = useApp();

  // PDV States
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [discountVal, setDiscountVal] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);


  // Modals / Simulators
  const [showScanner, setShowScanner] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('PIX');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [splitPayments, setSplitPayments] = useState([]); // for split payment
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashTxType, setCashTxType] = useState('suprimento'); // suprimento / sangria
  const [cashTxAmount, setCashTxAmount] = useState('');
  const [cashTxDesc, setCashTxDesc] = useState('');
  
  // Checkout Success State
  const [completedSale, setCompletedSale] = useState(null);

  // Cashback States
  const [useCashback, setUseCashback] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  // Installments and Split Settings
  const [installments, setInstallments] = useState(1);
  const [isSplitActive, setIsSplitActive] = useState(false);
  const [tempPaymentMethod, setTempPaymentMethod] = useState('PIX');
  const [tempPaymentAmount, setTempPaymentAmount] = useState('');

  // Focus and refs
  const searchInputRef = useRef(null);

  // Check if Cash Register is open
  const [initialCashValue, setInitialCashValue] = useState('300.00');

  // Fechamento Cego States
  const [showCloseCashModal, setShowCloseCashModal] = useState(false);
  const [declaredMoney, setDeclaredMoney] = useState('');
  const [declaredPix, setDeclaredPix] = useState('');
  const [declaredCard, setDeclaredCard] = useState('');

  const handleCloseCashSubmit = (e) => {
    e.preventDefault();
    if (!user?.permissions?.operateCash) {
      alert('ERRO DE PERMISSÃO: Você não tem autorização para fechar o caixa.');
      return;
    }
    const report = closeCashRegister({
      money: parseFloat(declaredMoney) || 0,
      pix: parseFloat(declaredPix) || 0,
      card: parseFloat(declaredCard) || 0
    });
    
    setDeclaredMoney('');
    setDeclaredPix('');
    setDeclaredCard('');
    setShowCloseCashModal(false);
    
    const diff = report.difference;
    const absDiff = Math.abs(diff).toFixed(2);
    if (diff === 0) {
      alert(`Caixa fechado com sucesso! O caixa concilia perfeitamente.`);
    } else if (diff > 0) {
      alert(`Caixa fechado com sucesso! Atenção: Sobrou R$ ${absDiff} no caixa (Diferença positiva).`);
    } else {
      alert(`Caixa fechado com sucesso! Atenção: Falta R$ ${absDiff} no caixa (Diferença de R$ -${absDiff} - Quebra de Caixa).`);
    }
  };

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F10') {
        e.preventDefault();
        if (cart.length > 0) {
          setSelectedPayment(prev => prev || 'PIX');
          setShowPaymentModal(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [cart]);

  useEffect(() => {
    setUseCashback(false);
    setPointsToRedeem(0);
  }, [selectedCustomer]);

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.sku.toLowerCase().includes(query) || 
        p.barcode.includes(query)
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, products]);

  // Filter customers based on search query
  useEffect(() => {
    if (customerSearch.trim().length > 1) {
      const query = customerSearch.toLowerCase();
      const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.cpf.includes(query) || 
        c.phone.includes(query)
      );
      setCustomerResults(filtered);
    } else {
      setCustomerResults([]);
    }
  }, [customerSearch, customers]);

  // Add Item to Cart
  const handleAddToCart = (product, color, size) => {
    // Check if item already exists in cart
    const existingIndex = cart.findIndex(item => 
      item.productId === product.id && 
      item.color === color && 
      item.size === size
    );

    const gridItem = Array.isArray(product.grid) ? product.grid.find(g => g.color === color && g.size === size) : null;
    const availableStock = gridItem ? gridItem.stock : 0;

    if (availableStock <= 0) {
      alert(`Atenção: ${product.name} (${color} - ${size}) está sem estoque!`);
      // Allow adding, but warn
    }

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      if (updatedCart[existingIndex].quantity >= availableStock) {
        alert(`Alerta: Quantidade adicionada supera o estoque atual (${availableStock} un).`);
      }
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        color,
        size,
        price: product.salePrice,
        costPrice: product.costPrice,
        quantity: 1,
        maxStock: availableStock,
        image: product.image
      }]);
    }
    setSearchQuery('');
    setSearchResults([]);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const handleUpdateQty = (index, amount) => {
    const updatedCart = [...cart];
    const newQty = updatedCart[index].quantity + amount;
    if (newQty <= 0) {
      updatedCart.splice(index, 1);
    } else {
      updatedCart[index].quantity = newQty;
    }
    setCart(updatedCart);
  };

  const handleRemoveItem = (index) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  let promoDiscount = 0;
  let promoDetails = [];

  // Loop through all active promotions
  promotions?.forEach(p => {
    if (!p.active) return;

    // 1. Leve X Pague Y (l3p2)
    if (p.type === 'l3p2') {
      const take = parseInt(p.take) || 3;
      const pay = parseInt(p.pay) || 2;
      let flatItems = [];
      cart.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
          flatItems.push({ price: item.price });
        }
      });
      if (flatItems.length >= take) {
        flatItems.sort((a, b) => a.price - b.price);
        const groups = Math.floor(flatItems.length / take);
        const freeCount = groups * (take - pay);
        let l3p2Amt = 0;
        for (let i = 0; i < freeCount; i++) {
          l3p2Amt += flatItems[i].price;
        }
        if (l3p2Amt > 0) {
          promoDiscount += l3p2Amt;
          promoDetails.push({ name: p.name, amount: l3p2Amt });
        }
      }
    }

    // 2. Desconto Progressivo (progressivo)
    else if (p.type === 'progressivo' && cart.length >= 2) {
      let flatItems = [];
      cart.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
          flatItems.push({ price: item.price });
        }
      });
      flatItems.sort((a, b) => b.price - a.price);
      let progressivoAmt = 0;
      progressivoAmt += flatItems[1].price * 0.10;
      if (flatItems.length >= 3) {
        for (let i = 2; i < flatItems.length; i++) {
          progressivoAmt += flatItems[i].price * 0.20;
        }
      }
      if (progressivoAmt > 0) {
        promoDiscount += progressivoAmt;
        promoDetails.push({ name: p.name, amount: progressivoAmt });
      }
    }

    // 3. Kit Fitness (kit)
    else if (p.type === 'kit') {
      const kitPrice = parseFloat(p.value) || 199.90;
      const cat1 = p.category1 || 'Leggings';
      const cat2 = p.category2 || 'Tops';
      let cat1Items = [];
      let cat2Items = [];
      cart.forEach(item => {
        const prod = products.find(pr => pr.id === item.productId);
        if (prod) {
          if (prod.category === cat1) {
            for (let i = 0; i < item.quantity; i++) cat1Items.push(item.price);
          } else if (prod.category === cat2) {
            for (let i = 0; i < item.quantity; i++) cat2Items.push(item.price);
          }
        }
      });
      const pairsCount = Math.min(cat1Items.length, cat2Items.length);
      if (pairsCount > 0) {
        cat1Items.sort((a, b) => a - b);
        cat2Items.sort((a, b) => a - b);
        let kitDiscount = 0;
        for (let i = 0; i < pairsCount; i++) {
          const standardCost = cat1Items[i] + cat2Items[i];
          kitDiscount += Math.max(0, standardCost - kitPrice);
        }
        if (kitDiscount > 0) {
          promoDiscount += kitDiscount;
          promoDetails.push({ name: p.name, amount: kitDiscount });
        }
      }
    }

    // 4. Desconto Simples em Porcentagem (percentage)
    else if (p.type === 'percentage') {
      const pct = parseFloat(p.value) || 0;
      const amt = subtotal * (pct / 100);
      if (amt > 0) {
        promoDiscount += amt;
        promoDetails.push({ name: p.name, amount: amt });
      }
    }

    // 5. Desconto por Categoria (category)
    else if (p.type === 'category') {
      const pct = parseFloat(p.value) || 0;
      const cat = p.category || '';
      let catAmt = 0;
      cart.forEach(item => {
        const prod = products.find(pr => pr.id === item.productId);
        if (prod && prod.category === cat) {
          catAmt += item.price * item.quantity * (pct / 100);
        }
      });
      if (catAmt > 0) {
        promoDiscount += catAmt;
        promoDetails.push({ name: p.name, amount: catAmt });
      }
    }
  });

  const couponDiscount = appliedCoupon ? (appliedCoupon.type === 'percentage' ? (subtotal * appliedCoupon.value / 100) : appliedCoupon.value) : 0;
  
  // Cashback calculation: 1 point = R$ 0.10
  const maxRedeemablePoints = selectedCustomer ? Math.min(selectedCustomer.points, Math.floor((subtotal - couponDiscount - promoDiscount - discountVal) / 0.10)) : 0;
  
  const cashbackDiscount = useCashback ? parseFloat((pointsToRedeem * 0.10).toFixed(2)) : 0;
  const totalDiscount = discountVal + promoDiscount + couponDiscount + cashbackDiscount;
  const total = Math.max(0, subtotal - totalDiscount);

  // Apply Coupon
  const handleApplyCoupon = () => {
    const found = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.active);
    if (found) {
      if (subtotal < found.minPurchase) {
        alert(`Compra mínima para este cupom é R$ ${found.minPurchase}`);
        return;
      }
      setAppliedCoupon(found);
      setCouponCode('');
    } else {
      alert('Cupom inválido ou expirado.');
    }
  };

  // Simulates Camera scanning
  const triggerCameraScan = () => {
    setShowScanner(true);
    // Simulate finding a barcode after 1.5 seconds
    setTimeout(() => {
      // Pick a random product barcode
      const randomProd = products[Math.floor(Math.random() * products.length)];
      // Pick random grid item
      const randomGrid = Array.isArray(randomProd.grid) && randomProd.grid.length
        ? randomProd.grid[Math.floor(Math.random() * randomProd.grid.length)]
        : { color: 'Preto', size: 'M', stock: 10 };
      
      handleAddToCart(randomProd, randomGrid.color, randomGrid.size);
      setShowScanner(false);
    }, 1500);
  };

  // Handle Cash Register Opening
  const handleOpenCash = (e) => {
    e.preventDefault();
    if (!user?.permissions?.operateCash) {
      alert('ERRO DE PERMISSÃO: Você não tem autorização para realizar operações de caixa (Abertura).');
      return;
    }
    openCashRegister(parseFloat(initialCashValue));
  };

  // Finish Sale
  const handleFinishSale = () => {
    if (cart.length === 0) {
      alert('Carrinho está vazio!');
      return;
    }

    if (isSplitActive) {
      const paidAmt = splitPayments.reduce((acc, p) => acc + p.value, 0);
      if (Math.abs(paidAmt - total) > 0.01) {
        alert(`O valor total pago (R$ ${paidAmt.toFixed(2)}) deve ser igual ao total da venda (R$ ${total.toFixed(2)})!`);
        return;
      }
    }

    // Compile sale data
    const finalPaymentMethod = isSplitActive 
      ? splitPayments.map(p => `${p.method} (R$ ${p.value.toFixed(2)})`).join(' + ')
      : (selectedPayment === 'Crédito' && installments > 1 ? `Crédito ${installments}x` : selectedPayment);

    const saleData = {
      items: cart,
      subtotal,
      discount: totalDiscount,
      total,
      paymentMethod: finalPaymentMethod,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      sellerId: user?.id,
      sellerName: user?.name,
      redeemedPoints: useCashback ? pointsToRedeem : 0,
      payments: isSplitActive ? splitPayments : [{ method: selectedPayment, value: total }]
    };

    const completed = addSale(saleData);
    setCompletedSale(completed);
    
    // Clear State
    setCart([]);
    setSelectedCustomer(null);
    setDiscountVal(0);
    setAppliedCoupon(null);
    setUseCashback(false);
    setPointsToRedeem(0);
    setSplitPayments([]);
    setIsSplitActive(false);
    setInstallments(1);
    setShowPaymentModal(false);
  };

  // WhatsApp Message Sender
  const handleSendWhatsApp = () => {
    if (!completedSale) return;
    
    const phone = selectedCustomer?.whatsapp || '5511999998888';
    const text = `*FITSTORE ERP - COMPROVANTE DE VENDA*\n\n` +
                 `Olá, ${completedSale.customerName}!\n` +
                 `Obrigado por comprar conosco.\n\n` +
                 `*Detalhes do Pedido #${completedSale.id}:*\n` +
                 completedSale.items.map(item => `- ${item.quantity}x ${item.name} (${item.color}/${item.size}) - R$ ${(item.price * item.quantity).toFixed(2)}`).join('\n') +
                 `\n\n*Subtotal:* R$ ${completedSale.subtotal.toFixed(2)}` +
                 `\n*Desconto:* R$ ${completedSale.discount.toFixed(2)}` +
                 `\n*Total Pago:* R$ ${completedSale.total.toFixed(2)}` +
                 `\n*Forma de Pagamento:* ${completedSale.paymentMethod}\n\n` +
                 `Volte sempre! 💪🧘‍♀️`;
                 
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
  };

  // Print simulated receipt
  const handlePrintSimulate = () => {
    alert('Cupom enviado para a Fila de Impressão Térmica (Simulado).');
  };

  // Render Closed Cash Register state
  if (!cashRegister.isOpen) {
    return (
      <div style={styles.cashClosedContainer}>
        <div className="glass-card animate-fade-in" style={styles.cashClosedCard}>
          <div style={styles.closedIconWrapper} className="pulse-neon">
            <Coins size={36} color="var(--neon-pink)" />
          </div>
          <h2 style={{ marginBottom: '8px' }}>Caixa Fechado</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px', textAlign: 'center' }}>
            Para iniciar as vendas no PDV, é necessário realizar a abertura do caixa informando o fundo de troco.
          </p>
          <form onSubmit={handleOpenCash} style={{ width: '100%' }}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Fundo de Troco Inicial (R$)</label>
              <input
                type="number"
                className="input-field"
                step="0.01"
                value={initialCashValue}
                onChange={(e) => setInitialCashValue(e.target.value)}
                required
                style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: '600' }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%' }}>
              Abrir Caixa
            </button>
          </form>
          <button 
            onClick={logout} 
            className="btn btn-ghost" 
            style={{ marginTop: '16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Power size={14} /> Sair do Sistema
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pdvContainer}>
      {/* PDV Header */}
      <header style={styles.pdvHeader} className="glass-card">
        <div style={styles.headerLeft}>
          <img src="/logo.png" alt="Lafitnes Logo" style={{ height: '36px', width: '36px', borderRadius: '8px', objectFit: 'cover' }} />
          <span style={styles.headerBrand}>LAFIT_NES <span className="text-neon" style={{ fontWeight: '800' }}>PDV</span></span>
          <span style={styles.cashierBadge}>
            <span style={styles.statusDot}></span> Caixa Aberto (R$ {cashRegister.currentValue.toFixed(2)})
          </span>
        </div>

        <div style={styles.headerRight}>
          {user?.permissions?.accessAdmin && (
            <button onClick={onNavigateToAdmin} className="btn btn-secondary" style={styles.navBtn}>
              <LayoutDashboard size={16} /> Dashboard
            </button>
          )}

          <div style={styles.userProfile}>
            <span style={styles.userName}>{user?.name}</span>
            <span style={styles.userRole}>{user?.role === 'admin' ? 'Administrador' : user?.role === 'manager' ? 'Gerente' : 'Operador'}</span>
          </div>

          <button 
            onClick={() => {
              if (!user?.permissions?.operateCash) {
                alert('ERRO DE PERMISSÃO: Você não tem autorização para fechar o caixa.');
                return;
              }
              setDeclaredMoney('');
              setDeclaredPix('');
              setDeclaredCard('');
              setShowCloseCashModal(true);
            }} 
            className="btn btn-ghost" 
            title="Fechar Caixa (Fechamento Cego)"
            style={{ padding: '8px', color: 'var(--danger)' }}
          >
            <Power size={18} />
          </button>
        </div>
      </header>

      {/* Main PDV Workspace */}
      <div style={styles.pdvGrid}>
        {/* LEFT COLUMN - SEARCH AND CART */}
        <div style={styles.leftCol}>
          {/* Search Bar */}
          <div className="glass-card" style={styles.searchCard}>
            <div style={styles.searchBarWrapper}>
              <Search size={20} style={styles.searchIcon} />
              <input
                ref={searchInputRef}
                type="text"
                className="input-field"
                placeholder="Pesquisar produto por Nome, SKU ou Código de Barras..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              <button onClick={triggerCameraScan} className="btn btn-secondary" style={styles.scannerBtn} title="Escanear por Câmera">
                <Camera size={18} />
              </button>
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div style={styles.searchResultsDropdown} className="glass-card">
                {searchResults.map(prod => (
                  <div key={prod.id} style={styles.searchResultItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <img 
                        src={prod.image || 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=100&auto=format&fit=crop'} 
                        alt={prod.name} 
                        style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                      />
                      <div style={styles.resultItemInfo}>
                        <span style={{ fontWeight: '500' }}>{prod.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {prod.sku} | R$ {prod.salePrice.toFixed(2)}</span>
                      </div>
                    </div>
                    {/* Size and Color Selector Grid */}
                    <div style={styles.gridSelector}>
                      {Array.isArray(prod.grid) && prod.grid.map((g, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAddToCart(prod, g.color, g.size)}
                          style={styles.gridSelectBtn}
                          disabled={g.stock <= 0}
                          title={`Estoque: ${g.stock}`}
                        >
                          {g.color.substring(0,3)}/{g.size} <span style={{fontSize: '0.65rem', opacity: 0.7}}>({g.stock})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Card */}
          <div className="glass-card" style={styles.cartCard}>
            <div style={styles.cartHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={20} color="var(--neon-pink)" />
                <h3 style={{ fontSize: '1rem' }}>Sacola de Compras</h3>
              </div>
              <span className="badge badge-pink">{cart.reduce((acc, item) => acc + item.quantity, 0)} itens</span>
            </div>

            <div style={styles.cartItemsList}>
              {cart.length === 0 ? (
                <div style={styles.emptyCart}>
                  <ShoppingCart size={48} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Nenhum produto adicionado à sacola</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Digite acima ou use o leitor</span>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={index} style={styles.cartItem}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img 
                        src={item.image || 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=100&auto=format&fit=crop'} 
                        alt={item.name} 
                        style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                      />
                      <div style={styles.cartItemDetails}>
                        <span style={styles.cartItemName}>{item.name}</span>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <span className="badge badge-pink" style={{ fontSize: '0.65rem' }}>{item.color}</span>
                          <span className="badge badge-pink" style={{ fontSize: '0.65rem' }}>Tamanho {item.size}</span>
                        </div>
                      </div>
                    </div>

                    <div style={styles.cartItemRight}>
                      <div style={styles.qtyControls}>
                        <button onClick={() => handleUpdateQty(index, -1)} style={styles.qtyBtn}><Minus size={12} /></button>
                        <span style={styles.qtyVal}>{item.quantity}</span>
                        <button onClick={() => handleUpdateQty(index, 1)} style={styles.qtyBtn}><Plus size={12} /></button>
                      </div>

                      <div style={styles.cartItemPriceBox}>
                        <span style={styles.cartItemPrice}>R$ {(item.price * item.quantity).toFixed(2)}</span>
                        <button onClick={() => handleRemoveItem(index)} style={styles.deleteItemBtn}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - CUSTOMER, BILLING AND CHECKOUT */}
        <div style={styles.rightCol}>
          {/* Customer Selection */}
          <div className="glass-card" style={styles.customerCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <User size={18} color="var(--text-secondary)" />
              <h4 style={{ fontSize: '0.875rem', fontWeight: '500' }}>Identificar Cliente</h4>
            </div>

            {selectedCustomer ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} className="animate-fade-in">
                <div style={styles.selectedCustomerBox}>
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '0.875rem' }}>{selectedCustomer.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>CPF: {selectedCustomer.cpf} | Pontos: {selectedCustomer.points} pts</p>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} style={styles.removeCustomerBtn}>
                    <X size={16} />
                  </button>
                </div>
                {selectedCustomer.points > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', userSelect: 'none' }}>
                      <input 
                        type="checkbox" 
                        checked={useCashback} 
                        onChange={(e) => {
                          setUseCashback(e.target.checked);
                          if (e.target.checked) setPointsToRedeem(maxRedeemablePoints);
                        }} 
                        style={{ accentColor: 'var(--neon-pink)' }}
                      />
                      Resgatar Cashback
                    </label>
                    {useCashback && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input 
                          type="number" 
                          className="input-field" 
                          max={maxRedeemablePoints} 
                          min={0}
                          value={pointsToRedeem} 
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(maxRedeemablePoints, parseInt(e.target.value) || 0));
                            setPointsToRedeem(val);
                          }}
                          style={{ width: '70px', padding: '4px 6px', fontSize: '0.75rem', textAlign: 'center' }} 
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600' }}>
                          - R$ {(pointsToRedeem * 0.10).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Buscar cliente por Nome, CPF ou Celular..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    style={{ width: '100%', paddingRight: '40px' }}
                  />
                  {customerResults.length > 0 && (
                    <div style={styles.customerResultsDropdown} className="glass-card">
                      {customerResults.map(cust => (
                        <div 
                          key={cust.id} 
                          onClick={() => {
                            setSelectedCustomer(cust);
                            setCustomerSearch('');
                            setCustomerResults([]);
                          }}
                          style={styles.customerResultItem}
                        >
                          <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>{cust.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CPF: {cust.cpf} | Celular: {cust.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setShowQuickCustomerModal(true)} 
                  className="btn btn-secondary"
                  style={{ padding: '10px 14px' }}
                  title="Cadastrar Novo Cliente Rápido"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Checkout Summary */}
          <div className="glass-card" style={styles.summaryCard}>
            {/* Promotions banner */}
            <div style={styles.promoBanner}>
              <span style={{ fontWeight: '600', fontSize: '0.75rem' }}>🔥 CAMPANHAS ATIVAS:</span>
              {promotions?.filter(p => p.active).map(p => (
                <span key={p.id} style={{ fontSize: '0.72rem' }}>• {p.name} ({p.type === 'l3p2' ? 'Pague 2 Leve 3' : p.type === 'progressivo' ? 'Progressivo 10%/20%' : 'Conjunto R$ 199,90'})</span>
              ))}
              {promotions?.filter(p => p.active).length === 0 && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Nenhuma campanha ativa no momento</span>
              )}
            </div>

            <div style={styles.summaryDetails}>
              <div style={styles.summaryRow}>
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              
              {promoDiscount > 0 && promoDetails.map((det, idx) => (
                <div key={idx} style={{ ...styles.summaryRow, color: 'var(--success)' }}>
                  <span>Desconto ({det.name})</span>
                  <span>- R$ {det.amount.toFixed(2)}</span>
                </div>
              ))}

              {appliedCoupon && (
                <div style={{ ...styles.summaryRow, color: 'var(--success)' }}>
                  <span>Cupom ({appliedCoupon.code})</span>
                  <span>
                    - {appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `R$ ${appliedCoupon.value.toFixed(2)}`}
                  </span>
                </div>
              )}

              {cashbackDiscount > 0 && (
                <div style={{ ...styles.summaryRow, color: 'var(--success)' }}>
                  <span>Cashback Resgatado</span>
                  <span>- R$ {cashbackDiscount.toFixed(2)}</span>
                </div>
              )}

              {discountVal > 0 && (
                <div style={{ ...styles.summaryRow, color: 'var(--success)' }}>
                  <span>Desconto Adicional</span>
                  <span>- R$ {discountVal.toFixed(2)}</span>
                </div>
              )}

              <div style={styles.couponInputRow}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Cupom"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
                />
                <button onClick={handleApplyCoupon} className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                  Aplicar
                </button>
              </div>

              <div style={styles.manualDiscountRow}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Desconto manual (R$)</span>
                <input
                  type="number"
                  className="input-field"
                  value={discountVal || ''}
                  onChange={(e) => {
                    if (!user?.permissions?.applyDiscounts) {
                      alert('ERRO DE PERMISSÃO: Você não tem autorização para aplicar descontos manuais.');
                      return;
                    }
                    setDiscountVal(parseFloat(e.target.value) || 0);
                  }}
                  disabled={!user?.permissions?.applyDiscounts}
                  style={{ width: '80px', padding: '6px', fontSize: '0.8rem', textAlign: 'right', opacity: user?.permissions?.applyDiscounts ? 1 : 0.5 }}
                />
              </div>

              <div style={styles.totalDivider}></div>

              <div style={styles.totalRow}>
                <span>Total</span>
                <span className="text-neon" style={{ fontSize: '1.75rem', fontWeight: '800' }}>R$ {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Quick Payment Trigger Buttons */}
            <div style={styles.paymentGrid}>
              <button 
                onClick={() => { setSelectedPayment('PIX'); setShowPaymentModal(true); }}
                style={{ ...styles.payBtn, border: selectedPayment === 'PIX' ? '1px solid var(--neon-pink)' : '1px solid var(--border-color)' }}
              >
                <QrCode size={18} />
                <span>PIX</span>
              </button>
              <button 
                onClick={() => { setSelectedPayment('Dinheiro'); setShowPaymentModal(true); }}
                style={{ ...styles.payBtn, border: selectedPayment === 'Dinheiro' ? '1px solid var(--neon-pink)' : '1px solid var(--border-color)' }}
              >
                <DollarSign size={18} />
                <span>Dinheiro</span>
              </button>
              <button 
                onClick={() => { setSelectedPayment('Débito'); setShowPaymentModal(true); }}
                style={{ ...styles.payBtn, border: selectedPayment === 'Débito' ? '1px solid var(--neon-pink)' : '1px solid var(--border-color)' }}
              >
                <CreditCard size={18} />
                <span>Débito</span>
              </button>
              <button 
                onClick={() => { setSelectedPayment('Crédito'); setShowPaymentModal(true); }}
                style={{ ...styles.payBtn, border: selectedPayment === 'Crédito' ? '1px solid var(--neon-pink)' : '1px solid var(--border-color)' }}
              >
                <CreditCard size={18} />
                <span>Crédito</span>
              </button>
            </div>

            <button 
              onClick={() => { setSelectedPayment('PIX'); setShowPaymentModal(true); }}
              className="btn btn-primary btn-large" 
              style={{ width: '100%', marginTop: '16px' }}
              disabled={cart.length === 0}
            >
              Finalizar Venda (F10)
            </button>
          </div>

          {/* Quick Cash Operations */}
          <div style={styles.quickCashRow}>
            <button 
              onClick={() => {
                if (!user?.permissions?.operateCash) {
                  alert('ERRO DE PERMISSÃO: Você não tem autorização para realizar operações de caixa (Suprimento).');
                  return;
                }
                setCashTxType('suprimento');
                setShowCashModal(true);
              }}
              className="btn btn-secondary" 
              style={{ flex: 1, fontSize: '0.75rem', gap: '4px', opacity: user?.permissions?.operateCash ? 1 : 0.5 }}
            >
              <ArrowDownRight size={14} color="var(--success)" /> Suprimento
            </button>
            <button 
              onClick={() => {
                if (!user?.permissions?.operateCash) {
                  alert('ERRO DE PERMISSÃO: Você não tem autorização para realizar operações de caixa (Sangria).');
                  return;
                }
                setCashTxType('sangria');
                setShowCashModal(true);
              }}
              className="btn btn-secondary" 
              style={{ flex: 1, fontSize: '0.75rem', gap: '4px', opacity: user?.permissions?.operateCash ? 1 : 0.5 }}
            >
              <ArrowUpRight size={14} color="var(--danger)" /> Sangria
            </button>
          </div>
        </div>
      </div>

      {/* CAMERA SCANNER SIMULATOR MODAL */}
      {showScanner && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-fade-in" style={styles.scannerModal}>
            <div style={styles.scannerHeader}>
              <h4>Escanear Código de Barras</h4>
              <button onClick={() => setShowScanner(false)} style={styles.modalCloseBtn}><X size={18} /></button>
            </div>
            <div style={styles.scannerCameraView}>
              {/* Animated Laser Line */}
              <div style={styles.laserLine}></div>
              <p style={{ position: 'absolute', bottom: '16px', fontSize: '0.75rem', color: '#ffeaee', width: '100%', textAlign: 'center' }}>
                Posicione o código de barras na linha vermelha
              </p>
            </div>
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Simulando scanner inteligente...</span>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT FINALIZATION MODAL */}
      {showPaymentModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-fade-in" style={{ ...styles.paymentModal, maxWidth: isSplitActive ? '480px' : '400px' }}>
            <div style={styles.scannerHeader}>
              <h3>{isSplitActive ? 'Pagamento Fracionado (Múltiplo)' : `Finalizar com ${selectedPayment}`}</h3>
              <button 
                onClick={() => {
                  setShowPaymentModal(false);
                  setSplitPayments([]);
                  setIsSplitActive(false);
                }} 
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Valor Total da Venda</span>
                <h1 className="text-neon" style={{ fontSize: '2.0rem', fontWeight: '800' }}>R$ {total.toFixed(2)}</h1>
              </div>

              {/* Split payment checkbox toggle */}
              <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500', userSelect: 'none' }}>
                  <input 
                    type="checkbox"
                    checked={isSplitActive}
                    onChange={(e) => {
                      setIsSplitActive(e.target.checked);
                      setSplitPayments([]);
                      setTempPaymentAmount('');
                    }}
                    style={{ accentColor: 'var(--neon-pink)' }}
                  />
                  Dividir pagamento em várias formas
                </label>
              </div>

              {isSplitActive ? (
                /* Split Payment Workflow */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {/* Payment form */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label" style={{ fontSize: '0.65rem' }}>Forma</label>
                      <select 
                        className="input-field" 
                        value={tempPaymentMethod} 
                        onChange={(e) => setTempPaymentMethod(e.target.value)}
                        style={{ padding: '8px', fontSize: '0.8rem' }}
                      >
                        <option value="PIX">PIX</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Débito">Cartão de Débito</option>
                        <option value="Crédito">Cartão de Crédito</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label" style={{ fontSize: '0.65rem' }}>Valor (R$)</label>
                      <input 
                        type="number" 
                        className="input-field" 
                        placeholder="Ex: 50.00" 
                        value={tempPaymentAmount} 
                        onChange={(e) => setTempPaymentAmount(e.target.value)}
                        style={{ padding: '8px', fontSize: '0.8rem' }}
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        const amt = parseFloat(tempPaymentAmount);
                        if (isNaN(amt) || amt <= 0) {
                          alert('Digite um valor válido!');
                          return;
                        }
                        const currentPaid = splitPayments.reduce((acc, p) => acc + p.value, 0);
                        if (currentPaid + amt > total + 0.01) {
                          alert(`Valor ultrapassa o restante da venda (Falta R$ ${(total - currentPaid).toFixed(2)})`);
                          return;
                        }
                        setSplitPayments([...splitPayments, { method: tempPaymentMethod, value: amt }]);
                        setTempPaymentAmount('');
                      }}
                      className="btn btn-secondary" 
                      style={{ padding: '9px 12px', fontSize: '0.8rem' }}
                    >
                      Inserir
                    </button>
                  </div>

                  {/* List of payments entered */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', maxHeight: '120px', overflowY: 'auto' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Lançamentos:</span>
                    {splitPayments.length === 0 ? (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>Nenhum lançamento adicionado</p>
                    ) : (
                      splitPayments.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <span>{p.method}</span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <strong>R$ {p.value.toFixed(2)}</strong>
                            <button 
                              type="button" 
                              onClick={() => {
                                const copy = [...splitPayments];
                                copy.splice(idx, 1);
                                setSplitPayments(copy);
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Balance indicators */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '500', padding: '0 4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Falta:</span>
                    <span style={{ color: total - splitPayments.reduce((acc, p) => acc + p.value, 0) > 0 ? 'var(--neon-pink)' : 'var(--success)' }}>
                      R$ {Math.max(0, total - splitPayments.reduce((acc, p) => acc + p.value, 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                /* Single Payment Workflow */
                <div>
                  {selectedPayment === 'PIX' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                      <div style={styles.qrBox}>
                        <QrCode size={140} color="#ffffff" />
                      </div>
                      <span className="badge badge-pink" style={{ fontSize: '0.75rem' }}>Aguardando pagamento PIX... (Automático)</span>
                    </div>
                  )}

                  {selectedPayment === 'Dinheiro' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                      <div className="form-group">
                        <label className="form-label">Valor Recebido</label>
                        <input
                          type="number"
                          className="input-field"
                          placeholder="Quanto o cliente entregou?"
                          value={receivedAmount}
                          onChange={(e) => setReceivedAmount(e.target.value)}
                          style={{ fontSize: '1.25rem', textAlign: 'center', fontWeight: '600' }}
                        />
                      </div>
                      {parseFloat(receivedAmount) > total && (
                        <div style={styles.changeBox}>
                          <span style={{ fontSize: '0.875rem' }}>Troco do Cliente:</span>
                          <strong style={{ color: 'var(--success)', fontSize: '1.5rem' }}>
                            R$ {(parseFloat(receivedAmount) - total).toFixed(2)}
                          </strong>
                        </div>
                      )}
                    </div>
                  )}

                  {(selectedPayment === 'Débito' || selectedPayment === 'Crédito') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                      {selectedPayment === 'Crédito' && (
                        <div className="form-group">
                          <label className="form-label">Parcelamento</label>
                          <select 
                            className="input-field" 
                            value={installments} 
                            onChange={(e) => setInstallments(parseInt(e.target.value))}
                            style={{ textAlign: 'center', fontSize: '1rem', fontWeight: '500' }}
                          >
                            <option value={1}>1x de R$ {total.toFixed(2)} (Sem Juros)</option>
                            {[2, 3].map(i => (
                              <option key={i} value={i}>{i}x de R$ {(total / i).toFixed(2)} (Sem Juros)</option>
                            ))}
                            {[4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => {
                              const rate = 0.015;
                              const compoundTotal = total * Math.pow(1 + rate, i);
                              const installmentVal = compoundTotal / i;
                              return (
                                <option key={i} value={i}>
                                  {i}x de R$ {installmentVal.toFixed(2)} (Total: R$ {compoundTotal.toFixed(2)} - 1.5% a.m.)
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                      
                      <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <div className="pulse-neon" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,45,142,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Smartphone size={24} color="var(--neon-pink)" />
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Envie a transação para a maquininha de cartão integrada...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={handleFinishSale} 
                className="btn btn-primary btn-large" 
                style={{ width: '100%', marginTop: '12px' }}
                disabled={isSplitActive && Math.abs(splitPayments.reduce((acc, p) => acc + p.value, 0) - total) > 0.01}
              >
                Confirmar Pagamento e Emitir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CASH TRANSACTION MODAL */}
      {showCashModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-fade-in" style={styles.cashModal}>
            <div style={styles.scannerHeader}>
              <h3 style={{ textTransform: 'capitalize' }}>Registrar {cashTxType}</h3>
              <button onClick={() => setShowCashModal(false)} style={styles.modalCloseBtn}><X size={18} /></button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              addCashTransaction(cashTxType, parseFloat(cashTxAmount), cashTxDesc);
              setShowCashModal(false);
              setCashTxAmount('');
              setCashTxDesc('');
            }} style={{ padding: '20px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Valor (R$)</label>
                <input
                  type="number"
                  className="input-field"
                  step="0.01"
                  placeholder="0,00"
                  value={cashTxAmount}
                  onChange={(e) => setCashTxAmount(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Motivo / Descrição</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: Troco inicial, Sangria para depósito, etc."
                  value={cashTxDesc}
                  onChange={(e) => setCashTxDesc(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%' }}>
                Confirmar Lançamento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BLIND CASH REGISTER CLOSE MODAL */}
      {showCloseCashModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-fade-in" style={styles.cashModal}>
            <div style={styles.scannerHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Power size={20} color="var(--danger)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Fechamento Cego de Caixa</h3>
              </div>
              <button onClick={() => setShowCloseCashModal(false)} style={styles.modalCloseBtn}><X size={18} /></button>
            </div>
            
            <div style={{ padding: '0 20px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <p>Por políticas de auditoria, informe os valores físicos contados no caixa. O sistema fará a conciliação automática com os registros eletrônicos.</p>
            </div>

            <form onSubmit={handleCloseCashSubmit} style={{ padding: '20px' }}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Total em Dinheiro Físico (R$)</label>
                <input
                  type="number"
                  className="input-field"
                  step="0.01"
                  placeholder="0,00"
                  value={declaredMoney}
                  onChange={(e) => setDeclaredMoney(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Total de Comprovantes PIX (R$)</label>
                <input
                  type="number"
                  className="input-field"
                  step="0.01"
                  placeholder="0,00"
                  value={declaredPix}
                  onChange={(e) => setDeclaredPix(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Total de Comprovantes Cartão (R$)</label>
                <input
                  type="number"
                  className="input-field"
                  step="0.01"
                  placeholder="0,00"
                  value={declaredCard}
                  onChange={(e) => setDeclaredCard(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%', background: 'var(--danger)', borderColor: 'var(--danger)' }}>
                Confirmar Fechamento Cego
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SALE SUCCESS SCREEN (RECEIPT) */}
      {completedSale && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-fade-in" style={styles.receiptModal}>
            <div style={styles.receiptHeader}>
              <CheckCircle2 size={48} color="var(--success)" style={{ marginBottom: '12px' }} />
              <h2 style={{ fontSize: '1.25rem' }}>Venda Realizada com Sucesso!</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Código do Pedido: {completedSale.id}</span>
            </div>

            <div style={styles.receiptDetails}>
              <div style={styles.receiptScroll}>
                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px' }}>
                  FITSTORE ERP - LOJA FISICA<br />
                  CNPJ: {settings.cnpj}
                </p>
                <div style={{ padding: '12px 0', borderBottom: '1px dashed var(--border-color)' }}>
                  {completedSale.items.map((item, idx) => (
                    <div key={idx} style={styles.receiptItemRow}>
                      <span>{item.quantity}x {item.name} ({item.color}/{item.size})</span>
                      <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal:</span>
                    <span>R$ {completedSale.subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                    <span>Desconto:</span>
                    <span>- R$ {completedSale.discount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', fontSize: '0.9rem', color: 'var(--neon-pink)' }}>
                    <span>Total Pago:</span>
                    <span>R$ {completedSale.total.toFixed(2)}</span>
                  </div>
                  <div style={{ margin: '6px 0 2px 0', borderTop: '1px dashed rgba(255,255,255,0.04)', paddingTop: '6px' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>Forma de Pagamento:</span>
                    <span style={{ textAlign: 'right', maxWidth: '180px' }}>{completedSale.paymentMethod}</span>
                  </div>
                  {completedSale.redeemedPoints > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span>Pontos Resgatados:</span>
                      <span>{completedSale.redeemedPoints} pts</span>
                    </div>
                  )}
                  {completedSale.customerId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--success)' }}>
                      <span>Pontos Ganhos:</span>
                      <span>+{Math.floor(completedSale.total / 10)} pts</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={styles.receiptActions}>
              <button onClick={handlePrintSimulate} className="btn btn-secondary" style={{ flex: 1 }}>
                <Printer size={16} /> Imprimir
              </button>
              <button onClick={handleSendWhatsApp} className="btn btn-primary" style={{ flex: 1 }}>
                <Send size={16} /> Enviar Whats
              </button>
            </div>
            
            <button 
              onClick={() => setCompletedSale(null)} 
              className="btn btn-ghost" 
              style={{ width: '100%', marginTop: '12px' }}
            >
              Nova Venda (F2)
            </button>
          </div>
        </div>
      )}

      {/* QUICK CUSTOMER REGISTRATION MODAL */}
      {showQuickCustomerModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-fade-in" style={styles.cashModal}>
            <div style={styles.scannerHeader}>
              <h3>Cadastro Rápido de Cliente</h3>
              <button onClick={() => setShowQuickCustomerModal(false)} style={styles.modalCloseBtn}><X size={18} /></button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const name = formData.get('name');
              const cpf = formData.get('cpf');
              const whatsapp = formData.get('whatsapp');
              
              if (!name || !cpf || !whatsapp) {
                alert('Preencha os campos obrigatórios.');
                return;
              }
              
              const newCust = {
                name,
                cpf,
                whatsapp,
                phone: whatsapp,
                points: 0,
                totalSpent: 0,
                lastPurchase: null,
                purchaseCount: 0
              };
              
              const custId = `cust-${Date.now()}`;
              const fullCust = { ...newCust, id: custId };
              saveCustomer(fullCust);
              setSelectedCustomer(fullCust);
              
              setShowQuickCustomerModal(false);
            }} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Nome Completo *</label>
                <input type="text" name="name" className="input-field" required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">CPF *</label>
                <input type="text" name="cpf" className="input-field" placeholder="000.000.000-00" required />
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp *</label>
                <input type="text" name="whatsapp" className="input-field" placeholder="5511999999999" required />
              </div>
              <button type="submit" className="btn btn-primary btn-large" style={{ width: '100%', marginTop: '12px' }}>
                Cadastrar e Selecionar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  // Cash register closed styles
  cashClosedContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'var(--bg-primary)'
  },
  cashClosedCard: {
    width: '100%',
    maxWidth: '400px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: '20px'
  },
  closedIconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'var(--neon-pink-dim)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    border: '1px solid var(--neon-pink-border)'
  },
  
  // PDV main styles
  pdvContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    height: '100dvh',
    background: 'var(--bg-primary)',
    padding: '12px',
    overflow: 'hidden'
  },
  pdvHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    marginBottom: '12px',
    borderRadius: '16px',
    flexShrink: 0
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
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
  headerBrand: {
    fontSize: '1.1rem',
    fontWeight: '700',
    letterSpacing: '0.5px'
  },
  cashierBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    background: 'rgba(255,255,255,0.03)',
    padding: '4px 10px',
    borderRadius: '20px',
    border: '1px solid var(--border-color)'
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--success)'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  navBtn: {
    padding: '8px 14px',
    fontSize: '0.75rem'
  },
  userProfile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    lineHeight: '1.2'
  },
  userName: {
    fontSize: '0.85rem',
    fontWeight: '500'
  },
  userRole: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)'
  },

  pdvGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '12px',
    flexGrow: 1,
    overflow: 'hidden',
    height: 'calc(100% - 64px)'
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflow: 'hidden'
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
    paddingRight: '2px'
  },

  searchCard: {
    padding: '12px',
    position: 'relative',
    flexShrink: 0
  },
  searchBarWrapper: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative'
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-muted)'
  },
  searchInput: {
    width: '100%',
    paddingLeft: '48px',
    paddingRight: '60px',
    fontSize: '0.95rem'
  },
  scannerBtn: {
    position: 'absolute',
    right: '6px',
    padding: '6px 12px',
    background: 'var(--bg-tertiary)'
  },

  searchResultsDropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: '0',
    right: '0',
    zIndex: '100',
    maxHeight: '300px',
    overflowY: 'auto',
    padding: '8px',
    boxShadow: 'var(--shadow-lg)'
  },
  searchResultItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderBottom: '1px solid var(--border-color)',
    gap: '12px'
  },
  resultItemInfo: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  },
  gridSelector: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap'
  },
  gridSelectBtn: {
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.7rem',
    cursor: 'pointer',
    transition: 'var(--transition)'
  },

  cartCard: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    overflow: 'hidden',
    padding: '16px'
  },
  cartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexShrink: 0
  },
  cartItemsList: {
    flexGrow: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  emptyCart: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    opacity: 0.8
  },
  cartItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    border: '1px solid var(--border-color)'
  },
  cartItemDetails: {
    display: 'flex',
    flexDirection: 'column'
  },
  cartItemName: {
    fontWeight: '500',
    fontSize: '0.875rem'
  },
  cartItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  qtyControls: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--bg-tertiary)',
    borderRadius: '8px',
    padding: '2px'
  },
  qtyBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  qtyVal: {
    fontSize: '0.8rem',
    fontWeight: '600',
    padding: '0 8px',
    minWidth: '24px',
    textAlign: 'center'
  },
  cartItemPriceBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  cartItemPrice: {
    fontWeight: '600',
    fontSize: '0.875rem',
    minWidth: '70px',
    textAlign: 'right'
  },
  deleteItemBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'var(--transition)'
  },

  customerCard: {
    padding: '16px'
  },
  selectedCustomerBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--neon-pink-dim)',
    border: '1px solid var(--neon-pink-border)',
    padding: '10px 12px',
    borderRadius: '10px'
  },
  removeCustomerBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--neon-pink)',
    cursor: 'pointer'
  },
  customerResultsDropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: '0',
    right: '0',
    zIndex: '100',
    maxHeight: '180px',
    overflowY: 'auto',
    padding: '4px'
  },
  customerResultItem: {
    padding: '8px 12px',
    borderBottom: '1px solid var(--border-color)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column'
  },

  summaryCard: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  promoBanner: {
    background: 'linear-gradient(90deg, var(--neon-pink-dim) 0%, rgba(0,0,0,0) 100%)',
    borderLeft: '3px solid var(--neon-pink)',
    padding: '8px 12px',
    borderRadius: '0 8px 8px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  summaryDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)'
  },
  couponInputRow: {
    display: 'flex',
    gap: '8px',
    margin: '6px 0'
  },
  manualDiscountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  totalDivider: {
    height: '1px',
    background: 'var(--border-color)',
    margin: '8px 0'
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  paymentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    marginTop: '8px'
  },
  payBtn: {
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    padding: '12px',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.75rem',
    transition: 'var(--transition)'
  },
  quickCashRow: {
    display: 'flex',
    gap: '12px'
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
  scannerModal: {
    width: '100%',
    maxWidth: '380px',
    overflow: 'hidden'
  },
  scannerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid var(--border-color)'
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer'
  },
  scannerCameraView: {
    width: '100%',
    height: '240px',
    background: '#151518',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center'
  },
  laserLine: {
    width: '100%',
    height: '2px',
    background: 'var(--neon-pink)',
    boxShadow: '0 0 12px 2px var(--neon-pink)',
    animation: 'scan 2s infinite ease-in-out',
    position: 'absolute'
  },
  
  paymentModal: {
    width: '100%',
    maxWidth: '400px'
  },
  qrBox: {
    padding: '16px',
    background: '#ffffff',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '172px',
    height: '172px'
  },
  changeBox: {
    background: 'var(--success-dim)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    padding: '12px',
    borderRadius: '10px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  
  cashModal: {
    width: '100%',
    maxWidth: '380px'
  },
  
  receiptModal: {
    width: '100%',
    maxWidth: '400px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column'
  },
  receiptHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '16px'
  },
  receiptDetails: {
    background: '#15151b',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px'
  },
  receiptScroll: {
    maxHeight: '200px',
    overflowY: 'auto',
    fontFamily: 'monospace'
  },
  receiptItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    marginBottom: '6px'
  },
  receiptActions: {
    display: 'flex',
    gap: '12px'
  }
};

// Add scanner animation to document head dynamically
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    @keyframes scan {
      0% { top: 0%; }
      50% { top: 100%; }
      100% { top: 0%; }
    }
  `;
  document.head.appendChild(styleSheet);
}
