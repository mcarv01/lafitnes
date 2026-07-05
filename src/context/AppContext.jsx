import React, { createContext, useContext, useState, useEffect } from 'react';
import { encryptLocalData, decryptLocalData, hashPassword } from '../utils/security';

const AppContext = createContext();

// Mock Initial Data
const initialProducts = [];

const initialCustomers = [];

const initialSellers = [
  { id: 'u-admin', name: 'Admin', target: 20000, currentSales: 0, commissionRate: 3, clientsServed: 0, salesCount: 0 },
  { id: 'u-gerente', name: 'Gerente', target: 20000, currentSales: 0, commissionRate: 3, clientsServed: 0, salesCount: 0 },
  { id: 'u-vendedor', name: 'Vendedor', target: 20000, currentSales: 0, commissionRate: 3, clientsServed: 0, salesCount: 0 },
  { id: 'u-caixa', name: 'Caixa', target: 20000, currentSales: 0, commissionRate: 3, clientsServed: 0, salesCount: 0 }
];

const initialSales = [];

const initialFinances = [];

const initialCashRegister = {
  isOpen: false,
  openedAt: null,
  closedAt: null,
  initialValue: 0,
  currentValue: 0,
  transactions: []
};

const initialCoupons = [];

const initialPromotions = [
  { id: 'promo-1', name: 'Leve 3 Pague 2', type: 'l3p2', description: 'Leve 3 peças e a de menor valor sai de graça. Válido em toda a loja.', active: true, take: 3, pay: 2 },
  { id: 'promo-2', name: 'Desconto Progressivo', type: 'progressivo', description: '10% na segunda peça, 20% na terceira peça.', active: false },
  { id: 'promo-3', name: 'Kit Fitness Verão', type: 'kit', description: 'Legging + Top por R$ 199,90.', active: true, value: 199.90, category1: 'Leggings', category2: 'Tops' }
];

const initialUsers = [
  {
    id: 'usr-admin',
    username: 'admin',
    name: 'Administrador Master',
    passwordHash: hashPassword('1234'),
    role: 'admin',
    permissions: {
      accessAdmin: true,
      accessPDV: true,
      operateCash: true,
      cancelSales: true,
      applyDiscounts: true
    }
  },
  {
    id: 'usr-manager',
    username: 'gerente',
    name: 'Gerente da Loja',
    passwordHash: hashPassword('1234'),
    role: 'manager',
    permissions: {
      accessAdmin: true,
      accessPDV: true,
      operateCash: true,
      cancelSales: true,
      applyDiscounts: true
    }
  },
  {
    id: 'usr-seller',
    username: 'vendedor',
    name: 'Vendedor Padrão',
    passwordHash: hashPassword('1234'),
    role: 'seller',
    permissions: {
      accessAdmin: false,
      accessPDV: true,
      operateCash: false,
      cancelSales: false,
      applyDiscounts: true
    }
  },
  {
    id: 'usr-cashier',
    username: 'caixa',
    name: 'Operador de Caixa',
    passwordHash: hashPassword('1234'),
    role: 'cashier',
    permissions: {
      accessAdmin: false,
      accessPDV: true,
      operateCash: true,
      cancelSales: false,
      applyDiscounts: false
    }
  }
];

export const AppProvider = ({ children }) => {
  // Authentication State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fitstore_user');
    return decryptLocalData(saved, null);
  });

  // Users Database State
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('fitstore_users');
    return decryptLocalData(saved, initialUsers);
  });

  // ERP Core States
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('fitstore_products');
    const loaded = decryptLocalData(saved, initialProducts);
    return loaded.map(p => {
      if (!p.image) {
        if (p.id === 'prod-1') p.image = 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=100&auto=format&fit=crop';
        else if (p.id === 'prod-2') p.image = 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=100&auto=format&fit=crop';
        else if (p.id === 'prod-3') p.image = 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=100&auto=format&fit=crop';
        else if (p.id === 'prod-4') p.image = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=100&auto=format&fit=crop';
        else if (p.id === 'prod-5') p.image = 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=100&auto=format&fit=crop';
        else p.image = 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=100&auto=format&fit=crop';
      }
      return p;
    });
  });

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('fitstore_customers');
    return decryptLocalData(saved, initialCustomers);
  });

  const [sellers, setSellers] = useState(() => {
    const saved = localStorage.getItem('fitstore_sellers');
    return decryptLocalData(saved, initialSellers);
  });

  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('fitstore_sales');
    return decryptLocalData(saved, initialSales);
  });

  const [finances, setFinances] = useState(() => {
    const saved = localStorage.getItem('fitstore_finances');
    return decryptLocalData(saved, initialFinances);
  });

  const [cashRegister, setCashRegister] = useState(() => {
    const saved = localStorage.getItem('fitstore_cash');
    return decryptLocalData(saved, initialCashRegister);
  });

  const [coupons, setCoupons] = useState(() => {
    const saved = localStorage.getItem('fitstore_coupons');
    return decryptLocalData(saved, initialCoupons);
  });

  const [promotions, setPromotions] = useState(() => {
    const saved = localStorage.getItem('fitstore_promotions');
    const loaded = decryptLocalData(saved, initialPromotions);
    return loaded.map(p => {
      if (p.id === 'promo-1' && !p.take) {
        p.take = 3;
        p.pay = 2;
      }
      if (p.id === 'promo-3' && !p.value) {
        p.value = 199.90;
        p.category1 = 'Leggings';
        p.category2 = 'Tops';
      }
      return p;
    });
  });

  const [purchases, setPurchases] = useState(() => {
    const saved = localStorage.getItem('fitstore_purchases');
    return decryptLocalData(saved, []);
  });

  const [cashShifts, setCashShifts] = useState(() => {
    const saved = localStorage.getItem('fitstore_shifts');
    return decryptLocalData(saved, []);
  });

  const [suppliers, setSuppliers] = useState(() => {
    const saved = localStorage.getItem('fitstore_suppliers');
    return decryptLocalData(saved, [
      { id: 'sup-1', name: 'TexFitness Brasil', cnpj: '11.222.333/0001-44', contact: 'comercial@texfitness.com.br' },
      { id: 'sup-2', name: 'Confecções Aero', cnpj: '22.333.444/0001-55', contact: 'vendas@aerosport.com.br' },
      { id: 'sup-3', name: 'Importações Fit', cnpj: '33.444.555/0001-66', contact: 'fitimport@fitstore.com.br' }
    ]);
  });

  // Settings State
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('fitstore_settings');
    const defaultSettings = {
      companyName: 'LAFIT_NES ERP Matriz',
      cnpj: '12.345.678/0001-99',
      theme: 'dark',
      scannerType: 'camera',
      autoPrintReceipt: true,
      whatsappTemplate: 'Olá, {cliente}! Seu comprovante da loja FitStore no valor de {total} foi gerado. Agradecemos a preferência! 🛒💪'
    };
    return decryptLocalData(saved, defaultSettings);
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('fitstore_user', encryptLocalData(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('fitstore_users', encryptLocalData(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('fitstore_products', encryptLocalData(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('fitstore_customers', encryptLocalData(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('fitstore_sellers', encryptLocalData(sellers));
  }, [sellers]);

  useEffect(() => {
    localStorage.setItem('fitstore_sales', encryptLocalData(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('fitstore_finances', encryptLocalData(finances));
  }, [finances]);

  useEffect(() => {
    localStorage.setItem('fitstore_cash', encryptLocalData(cashRegister));
  }, [cashRegister]);

  useEffect(() => {
    localStorage.setItem('fitstore_coupons', encryptLocalData(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('fitstore_promotions', encryptLocalData(promotions));
  }, [promotions]);

  useEffect(() => {
    localStorage.setItem('fitstore_settings', encryptLocalData(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('fitstore_purchases', encryptLocalData(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('fitstore_shifts', encryptLocalData(cashShifts));
  }, [cashShifts]);

  const isDesktopMode = new URLSearchParams(window.location.search).get('desktop') === 'true' || 
                        window.matchMedia('(display-mode: standalone)').matches;

  const downloadDesktopLauncher = () => {
    const scriptText = `@echo off\r\n` +
      `title LAFIT_NES ERP - Instalador de Atalho\r\n` +
      `echo ====================================================\r\n` +
      `echo             LAFIT_NES ERP - VERSAO DESKTOP\r\n` +
      `echo ====================================================\r\n` +
      `echo.\r\n` +
      `echo Criando o atalho em tela cheia na sua Area de Trabalho...\r\n` +
      `echo.\r\n` +
      `set "EDGE_PATH=C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"\r\n` +
      `for /f "tokens=2*" %%a in ('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe" /ve 2^>nul') do (\r\n` +
      `  set "EDGE_PATH=%%b"\r\n` +
      `)\r\n` +
      `set SCRIPT="%TEMP%\\%RANDOM%-%RANDOM%-%RANDOM%-%RANDOM%.vbs"\r\n` +
      `echo Set oWS = WScript.CreateObject("WScript.Shell") >> %SCRIPT%\r\n` +
      `echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\\LAFIT_NES ERP.lnk" >> %SCRIPT%\r\n` +
      `echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%\r\n` +
      `echo oLink.TargetPath = "%EDGE_PATH%" >> %SCRIPT%\r\n` +
      `echo oLink.Arguments = "--app=https://lafitnes.vercel.app/?desktop=true --start-fullscreen" >> %SCRIPT%\r\n` +
      `echo oLink.Description = "LAFIT_NES ERP - Versao Desktop" >> %SCRIPT%\r\n` +
      `echo oLink.IconLocation = "%EDGE_PATH%,0" >> %SCRIPT%\r\n` +
      `echo oLink.Save >> %SCRIPT%\r\n` +
      `cscript /nologo %SCRIPT%\r\n` +
      `del %SCRIPT%\r\n` +
      `echo.\r\n` +
      `echo ====================================================\r\n` +
      `echo  SUCESSO! Atalho "LAFIT_NES ERP" criado no seu Desktop!\r\n` +
      `echo  Use o novo icone na Area de Trabalho para abrir o\r\n` +
      `echo  sistema em modo programa de tela cheia.\r\n` +
      `echo ====================================================\r\n` +
      `echo.\r\n` +
      `pause\r\n` +
      `exit\r\n`;

    const blob = new Blob([scriptText], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Instalar_LAFIT_NES_Desktop.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('Pronto! O instalador "Instalar_LAFIT_NES_Desktop.bat" foi baixado. Execute-o no seu computador Windows para criar o atalho oficial do programa em tela cheia na sua Área de Trabalho.');
  };

  useEffect(() => {
    localStorage.setItem('fitstore_suppliers', encryptLocalData(suppliers));
  }, [suppliers]);

  // LOGIN & LOGOUT
  const login = (username, password) => {
    const u = username.toLowerCase().trim();
    const foundUser = users.find(usr => usr.username.toLowerCase() === u);
    
    if (!foundUser) {
      return { success: false, message: 'Usuário não cadastrado no sistema.' };
    }
    
    const inputHash = hashPassword(password);
    if (foundUser.passwordHash !== inputHash) {
      return { success: false, message: 'Senha incorreta para este usuário.' };
    }

    const loggedUser = {
      id: foundUser.id,
      username: foundUser.username,
      name: foundUser.name,
      role: foundUser.role,
      permissions: foundUser.permissions || {
        accessAdmin: foundUser.role === 'admin' || foundUser.role === 'manager',
        accessPDV: true,
        operateCash: foundUser.role !== 'seller',
        cancelSales: foundUser.role === 'admin' || foundUser.role === 'manager',
        applyDiscounts: foundUser.role !== 'cashier'
      }
    };
    
    setUser(loggedUser);
    return { success: true, user: loggedUser };
  };

  const saveUser = (userObj) => {
    setUsers(prev => {
      const exists = prev.find(u => u.id === userObj.id);
      if (exists) {
        return prev.map(u => {
          if (u.id === userObj.id) {
            const updated = {
              ...u,
              username: userObj.username,
              name: userObj.name,
              role: userObj.role,
              permissions: userObj.permissions
            };
            if (userObj.password) {
              updated.passwordHash = hashPassword(userObj.password);
            }
            return updated;
          }
          return u;
        });
      } else {
        const newUser = {
          id: `usr-${Date.now()}`,
          username: userObj.username,
          name: userObj.name,
          role: userObj.role,
          permissions: userObj.permissions,
          passwordHash: hashPassword(userObj.password || '1234')
        };
        return [...prev, newUser];
      }
    });
  };

  const deleteUser = (userId) => {
    if (userId === 'usr-admin') {
      alert('Segurança: O usuário administrador principal (admin) não pode ser excluído.');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const changeUserPassword = (userId, oldPassword, newPassword) => {
    let success = false;
    let message = '';
    
    setUsers(prev => {
      const targetUser = prev.find(u => u.id === userId);
      if (!targetUser) {
        message = 'Usuário não encontrado.';
        return prev;
      }
      if (targetUser.passwordHash !== hashPassword(oldPassword)) {
        message = 'Senha atual incorreta.';
        return prev;
      }
      success = true;
      message = 'Senha alterada com sucesso!';
      return prev.map(u => u.id === userId ? { ...u, passwordHash: hashPassword(newPassword) } : u);
    });
    
    return { success, message };
  };

  const logout = () => {
    setUser(null);
  };

  // CAIXA ACTIONS
  const openCashRegister = (initialVal) => {
    const val = parseFloat(initialVal) || 0;
    const newCash = {
      isOpen: true,
      openedAt: new Date().toISOString(),
      closedAt: null,
      initialValue: val,
      currentValue: val,
      transactions: [
        { id: `t-${Date.now()}`, type: 'suprimento', amount: val, description: 'Abertura de Caixa (Fundo de troco)', time: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) }
      ]
    };
    setCashRegister(newCash);
  };

  const closeCashRegister = (declaredDetails) => {
    let expectedMoney = cashRegister.initialValue;
    let expectedPix = 0;
    let expectedCard = 0;

    cashRegister.transactions.forEach(t => {
      if (t.type === 'suprimento') {
        expectedMoney += t.amount;
      } else if (t.type === 'sangria') {
        expectedMoney -= t.amount;
      } else if (t.type === 'venda') {
        if (t.payments && t.payments.length > 0) {
          t.payments.forEach(p => {
            const m = p.method.toLowerCase();
            if (m.includes('dinheiro')) expectedMoney += p.value;
            else if (m.includes('pix')) expectedPix += p.value;
            else expectedCard += p.value;
          });
        } else {
          const method = (t.paymentMethod || '').toLowerCase();
          if (method.includes('dinheiro')) expectedMoney += t.amount;
          else if (method.includes('pix')) expectedPix += t.amount;
          else expectedCard += t.amount;
        }
      }
    });

    const expectedTotal = expectedMoney + expectedPix + expectedCard;
    const declaredMoney = parseFloat(declaredDetails.money) || 0;
    const declaredPix = parseFloat(declaredDetails.pix) || 0;
    const declaredCard = parseFloat(declaredDetails.card) || 0;
    const declaredTotal = declaredMoney + declaredPix + declaredCard;
    const difference = declaredTotal - expectedTotal;

    const shiftReport = {
      id: `shift-${Date.now()}`,
      openedAt: cashRegister.openedAt,
      closedAt: new Date().toISOString(),
      initialValue: cashRegister.initialValue,
      calculatedTotal: expectedTotal,
      declaredTotal,
      difference,
      operatorName: user?.name || 'Sistema',
      details: {
        expected: { money: expectedMoney, pix: expectedPix, card: expectedCard },
        declared: { money: declaredMoney, pix: declaredPix, card: declaredCard },
        differences: { money: declaredMoney - expectedMoney, pix: declaredPix - expectedPix, card: declaredCard - expectedCard }
      },
      transactions: cashRegister.transactions
    };

    setCashShifts(prev => [shiftReport, ...prev]);

    setCashRegister({
      isOpen: false,
      openedAt: null,
      closedAt: shiftReport.closedAt,
      initialValue: 0,
      currentValue: 0,
      transactions: []
    });

    return shiftReport;
  };

  const savePromotion = (newPromo) => {
    setPromotions(prev => {
      const idx = prev.findIndex(p => p.id === newPromo.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...newPromo };
        return updated;
      }
      return [...prev, { ...newPromo, id: `promo-${Date.now()}` }];
    });
  };

  const deletePromotion = (id) => {
    setPromotions(prev => prev.filter(p => p.id !== id));
  };

  const addCashTransaction = (type, amount, description) => {
    const amt = parseFloat(amount) || 0;
    const isSangria = type === 'sangria';
    const newCurrent = isSangria ? cashRegister.currentValue - amt : cashRegister.currentValue + amt;
    
    // Add to financial ledger too
    const newFin = {
      id: `fin-${Date.now()}`,
      type: isSangria ? 'despesa' : 'receita',
      category: isSangria ? 'Sangria de Caixa' : 'Suprimento de Caixa',
      description: description || (isSangria ? 'Retirada de caixa' : 'Aporte no caixa'),
      amount: amt,
      date: new Date().toISOString().split('T')[0],
      status: 'pago'
    };
    setFinances(prev => [newFin, ...prev]);

    setCashRegister(prev => ({
      ...prev,
      currentValue: newCurrent,
      transactions: [
        ...prev.transactions,
        {
          id: `t-${Date.now()}`,
          type,
          amount: amt,
          description,
          time: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})
        }
      ]
    }));
  };

  // PDV / SALE SUBMISSION
  const addSale = (saleData) => {
    const saleId = `sale-${1000 + sales.length + 1}`;
    const newSale = {
      id: saleId,
      date: new Date().toISOString(),
      items: saleData.items,
      subtotal: saleData.subtotal,
      discount: saleData.discount,
      total: saleData.total,
      paymentMethod: saleData.paymentMethod,
      customerId: saleData.customerId || null,
      customerName: saleData.customerName || 'Sem Cadastro',
      sellerId: saleData.sellerId || user?.id || 'sel-1',
      sellerName: saleData.sellerName || user?.name || 'Sistema',
      status: 'completed',
      redeemedPoints: saleData.redeemedPoints || 0,
      payments: saleData.payments || []
    };

    // 1. Update Inventory for each item (Grid Item Color + Size)
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        let updatedGrid = [...prod.grid];
        let gridChanged = false;
        
        newSale.items.forEach(saleItem => {
          if (saleItem.productId === prod.id) {
            updatedGrid = updatedGrid.map(g => {
              if (g.color === saleItem.color && g.size === saleItem.size) {
                gridChanged = true;
                return { ...g, stock: Math.max(0, g.stock - saleItem.quantity) };
              }
              return g;
            });
          }
        });
        return gridChanged ? { ...prod, grid: updatedGrid } : prod;
      });
    });

    // 2. Update Customer Loyalty & Metrics
    if (newSale.customerId) {
      setCustomers(prevCustomers => {
        return prevCustomers.map(cust => {
          if (cust.id === newSale.customerId) {
            const addedPoints = Math.floor(newSale.total / 10); // 1 point per 10 BRL spent
            const finalPoints = Math.max(0, cust.points - (newSale.redeemedPoints || 0) + addedPoints);
            return {
              ...cust,
              points: finalPoints,
              totalSpent: parseFloat((cust.totalSpent + newSale.total).toFixed(2)),
              lastPurchase: new Date().toISOString().split('T')[0],
              purchaseCount: cust.purchaseCount + 1
            };
          }
          return cust;
        });
      });
    }

    // 3. Update Seller Statistics
    setSellers(prevSellers => {
      return prevSellers.map(sel => {
        if (sel.id === newSale.sellerId) {
          return {
            ...sel,
            currentSales: parseFloat((sel.currentSales + newSale.total).toFixed(2)),
            salesCount: sel.salesCount + 1
          };
        }
        return sel;
      });
    });

    // 4. Update Cash Register Value
    setCashRegister(prev => ({
      ...prev,
      currentValue: prev.currentValue + newSale.total,
      transactions: [
        ...prev.transactions,
        {
          id: `t-${Date.now()}`,
          type: 'venda',
          amount: newSale.total,
          description: `Venda #${newSale.id} (${newSale.paymentMethod})`,
          time: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
          paymentMethod: newSale.paymentMethod,
          payments: newSale.payments
        }
      ]
    }));

    // 5. Add to Finance Records
    const newFin = {
      id: `fin-${Date.now()}`,
      type: 'receita',
      category: 'Venda de Mercadorias',
      description: `Venda Geral PDV #${newSale.id}`,
      amount: newSale.total,
      date: new Date().toISOString().split('T')[0],
      status: 'pago'
    };

    setFinances(prev => [newFin, ...prev]);
    setSales(prev => [newSale, ...prev]);

    return newSale;
  };

  // PRODUCT OPERATIONS
  const saveProduct = (productData) => {
    if (productData.id) {
      setProducts(prev => prev.map(p => p.id === productData.id ? productData : p));
    } else {
      const newProd = {
        ...productData,
        id: `prod-${Date.now()}`,
        status: 'active'
      };
      setProducts(prev => [newProd, ...prev]);
    }
  };

  // CUSTOMER OPERATIONS
  const saveCustomer = (customerData) => {
    if (customerData.id) {
      setCustomers(prev => prev.map(c => c.id === customerData.id ? customerData : c));
    } else {
      const newCust = {
        ...customerData,
        id: `cust-${Date.now()}`,
        points: 0,
        totalSpent: 0,
        lastPurchase: null,
        purchaseCount: 0
      };
      setCustomers(prev => [newCust, ...prev]);
    }
  };

  // SELLER OPERATIONS
  const saveSeller = (sellerData) => {
    if (sellerData.id) {
      setSellers(prev => prev.map(s => s.id === sellerData.id ? sellerData : s));
    } else {
      const newSel = {
        ...sellerData,
        id: `sel-${Date.now()}`,
        currentSales: 0,
        salesCount: 0,
        clientsServed: 0
      };
      setSellers(prev => [newSel, ...prev]);
    }
  };

  // PURCHASE OPERATIONS
  const savePurchase = (purchaseData) => {
    const newPurchase = {
      id: `purch-${Date.now()}`,
      date: new Date().toISOString(),
      productId: purchaseData.productId,
      productName: purchaseData.productName,
      supplierId: purchaseData.supplierId,
      supplierName: purchaseData.supplierName,
      color: purchaseData.color,
      size: purchaseData.size,
      quantity: purchaseData.quantity,
      costPrice: purchaseData.costPrice,
      totalCost: purchaseData.totalCost
    };

    // 1. Update Inventory stock
    setProducts(prevProducts => {
      return prevProducts.map(prod => {
        if (prod.id === purchaseData.productId) {
          let updatedGrid = [...prod.grid];
          let foundInGrid = false;
          updatedGrid = updatedGrid.map(g => {
            if (g.color === purchaseData.color && g.size === purchaseData.size) {
              foundInGrid = true;
              return { ...g, stock: g.stock + purchaseData.quantity };
            }
            return g;
          });
          if (!foundInGrid) {
            updatedGrid.push({ color: purchaseData.color, size: purchaseData.size, stock: purchaseData.quantity });
          }
          return { ...prod, grid: updatedGrid };
        }
        return prod;
      });
    });

    // 2. Add to finances ledger
    const newFin = {
      id: `fin-${Date.now()}`,
      type: 'despesa',
      category: 'Compra de Mercadorias',
      description: `Compra - ${purchaseData.supplierName} (${purchaseData.quantity}x ${purchaseData.productName})`,
      amount: purchaseData.totalCost,
      date: new Date().toISOString().split('T')[0],
      status: 'pago'
    };

    setFinances(prev => [newFin, ...prev]);
    setPurchases(prev => [newPurchase, ...prev]);
  };

  const saveSupplier = (supplierData) => {
    if (supplierData.id) {
      setSuppliers(prev => prev.map(s => s.id === supplierData.id ? supplierData : s));
    } else {
      const newSup = {
        ...supplierData,
        id: `sup-${Date.now()}`
      };
      setSuppliers(prev => [newSup, ...prev]);
    }
  };

  // AI ENGINE (LOCAL NLP-BASED INTELLIGENCE)
  const askAI = (query) => {
    const q = query.toLowerCase().trim();
    
    // Helper data
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.date.startsWith(today));
    const todayTotal = todaySales.reduce((acc, s) => acc + s.total, 0);
    
    // 1. "Quanto vendi hoje?" / "Vendas de hoje"
    if (q.includes('quanto vendi hoje') || q.includes('faturamento de hoje') || q.includes('venda hoje')) {
      return {
        reply: `Hoje você vendeu um total de **R$ ${todayTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}** em **${todaySales.length}** atendimentos finalizados. O ticket médio das vendas de hoje é de **R$ ${(todaySales.length ? todayTotal / todaySales.length : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**.`,
        chartData: todaySales.map(s => ({ time: new Date(s.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}), total: s.total }))
      };
    }

    // 2. "Quem é meu melhor vendedor?"
    if (q.includes('melhor vendedor') || q.includes('ranking de vendedores') || q.includes('quem vendeu mais')) {
      const sortedSellers = [...sellers].sort((a, b) => b.currentSales - a.currentSales);
      const best = sortedSellers[0];
      return {
        reply: `O seu melhor vendedor é **${best.name}**, com um faturamento acumulado de **R$ ${best.currentSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** em **${best.salesCount}** vendas. Ele atingiu **${Math.round((best.currentSales / best.target) * 100)}%** da sua meta mensal de R$ ${best.target.toLocaleString('pt-BR')}.`,
        chartData: sortedSellers.map(s => ({ name: s.name.split(' ')[0], vendas: s.currentSales }))
      };
    }

    // 3. "Qual produto está parado?"
    if (q.includes('produto parado') || q.includes('sem giro') || q.includes('estoque parado')) {
      // Find products with high stock and zero or very few sales
      const productSalesCount = {};
      sales.forEach(s => {
        s.items.forEach(item => {
          productSalesCount[item.productId] = (productSalesCount[item.productId] || 0) + item.quantity;
        });
      });

      const itemsWithStock = products.map(p => {
        const totalStock = p.grid.reduce((acc, g) => acc + g.stock, 0);
        const sold = productSalesCount[p.id] || 0;
        return { name: p.name, stock: totalStock, sold };
      });

      // Sort by high stock and low sales
      const deadStock = itemsWithStock.sort((a, b) => (b.stock - b.sold) - (a.stock - a.sold)).slice(0, 2);
      
      return {
        reply: `Identifiquei que o produto **${deadStock[0].name}** está com baixo giro. Ele possui **${deadStock[0].stock} unidades em estoque** e teve apenas **${deadStock[0].sold} unidades vendidas** nas últimas semanas. Sugiro criar uma promoção do tipo *Kit Fitness* ou aplicar um desconto progressivo para girar esse estoque.`,
        data: deadStock
      };
    }

    // 4. "Quais clientes não compram há 60 dias?"
    if (q.includes('não compram há 60 dias') || q.includes('clientes inativos') || q.includes('sem comprar')) {
      const inactive = customers.filter(c => {
        if (!c.lastPurchase) return true;
        const lastDate = new Date(c.lastPurchase);
        const diffTime = Math.abs(new Date() - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 60;
      });

      return {
        reply: `Encontrei **${inactive.length} clientes** que não realizam compras há mais de 60 dias. Entre eles estão **${inactive.slice(0, 2).map(c => c.name).join(', ')}**. \n\nNo painel do CRM, você pode disparar uma campanha automatizada via WhatsApp oferecendo um cupom especial (ex: **VOLTAFIT15**) para reengajá-los.`,
        data: inactive
      };
    }

    // 5. "Quanto preciso vender para bater a meta?"
    if (q.includes('bater a meta') || q.includes('meta da loja') || q.includes('meta')) {
      const totalTarget = sellers.reduce((acc, s) => acc + s.target, 0);
      const totalSales = sellers.reduce((acc, s) => acc + s.currentSales, 0);
      const remaining = Math.max(0, totalTarget - totalSales);
      const pct = Math.round((totalSales / totalTarget) * 100);

      return {
        reply: `A meta global da loja é de **R$ ${totalTarget.toLocaleString('pt-BR')}**. Até o momento, foram vendidos **R$ ${totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** (${pct}% da meta). \n\nFaltam **R$ ${remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** para atingir o objetivo mensal. Com um ticket médio de R$ 220,00, seriam necessárias aproximadamente **${Math.ceil(remaining / 220)} vendas** para bater a meta.`,
        chartData: [
          { name: 'Vendido', valor: totalSales },
          { name: 'Restante', valor: remaining }
        ]
      };
    }

    // 6. "Qual fornecedor devo comprar?"
    if (q.includes('fornecedor') || q.includes('comprar') || q.includes('reposição')) {
      // Find low stock items
      const lowStockProducts = products.filter(p => {
        const totalStock = p.grid.reduce((acc, g) => acc + g.stock, 0);
        return totalStock < 50; // Threshold
      });

      const suppliersToBuy = [...new Set(lowStockProducts.map(p => p.supplier))];

      return {
        reply: `Recomendo fazer um pedido de reposição para o fornecedor **${suppliersToBuy[0] || 'TexFitness Brasil'}**. Os produtos da categoria *Leggings* e *Tops* estão com estoque abaixo do mínimo de segurança (menos de 15 unidades por grade de cor e tamanho).`,
        data: lowStockProducts
      };
    }

    // Fallback: Default smart tips and campaign generator
    return {
      reply: `Sou a IA de Inteligência Comercial do FITSTORE ERP. Posso te ajudar a analisar sua loja física. Tente me perguntar:\n\n` +
             `- *"Quanto vendi hoje?"*\n` +
             `- *"Quem é meu melhor vendedor?"*\n` +
             `- *"Qual produto está parado no estoque?"*\n` +
             `- *"Quais clientes não compram há 60 dias?"*\n` +
             `- *"Quanto falta para bater a meta?"*`
    };
  };

  return (
    <AppContext.Provider value={{
      user,
      products,
      customers,
      sellers,
      sales,
      finances,
      cashRegister,
      coupons,
      promotions,
      settings,
      purchases,
      suppliers,
      cashShifts,
      users,
      login,
      logout,
      saveUser,
      deleteUser,
      changeUserPassword,
      openCashRegister,
      closeCashRegister,
      addCashTransaction,
      addSale,
      saveProduct,
      saveCustomer,
      saveSeller,
      savePurchase,
      saveSupplier,
      savePromotion,
      deletePromotion,
      askAI,
      setSettings,
      setPromotions,
      setProducts,
      setCustomers,
      setSellers,
      setSales,
      setFinances,
      setCashRegister,
      setCoupons,
      setPurchases,
      setCashShifts,
      setUsers,
      isDesktopMode,
      downloadDesktopLauncher
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
