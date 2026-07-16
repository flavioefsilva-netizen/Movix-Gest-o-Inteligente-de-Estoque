'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../lib/AppContext';
import * as XLSX from 'xlsx';

const GreenTruckSVG = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Cargo box with rounded top corners */}
    <path d="M14 14V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a1 1 0 0 0 1 1h11" />
    {/* Cabin */}
    <path d="M14 9h4l3 3.5V16a1 1 0 0 1-1 1h-6" />
    {/* Wheels */}
    <circle cx="6" cy="18" r="1.5" />
    <circle cx="17" cy="18" r="1.5" />
  </svg>
);

const RedTruckSVG = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Cargo box with rounded top corners */}
    <path d="M10 14V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a1 1 0 0 1-1 1H10" />
    {/* Cabin */}
    <path d="M10 9H6L3 12.5V16a1 1 0 0 0 1 1h6" />
    {/* Wheels */}
    <circle cx="18" cy="18" r="1.5" />
    <circle cx="7" cy="18" r="1.5" />
  </svg>
);

const ThreeCubesSVG = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="0.8"
    strokeLinejoin="round"
  >
    {/* Top Cube */}
    <path d="M12 2 L16.5 4.5 L12 7 L7.5 4.5 Z" fillOpacity="0.8" stroke="white" strokeWidth="0.8" />
    <path d="M7.5 4.5 L12 7 L12 11.5 L7.5 9 Z" fillOpacity="0.9" stroke="white" strokeWidth="0.8" />
    <path d="M12 7 L16.5 4.5 L16.5 9 L12 11.5 Z" stroke="white" strokeWidth="0.8" />

    {/* Bottom Left Cube */}
    <path d="M7.5 9 L12 11.5 L7.5 14 L3 11.5 Z" fillOpacity="0.8" stroke="white" strokeWidth="0.8" />
    <path d="M3 11.5 L7.5 14 L7.5 18.5 L3 16 Z" fillOpacity="0.9" stroke="white" strokeWidth="0.8" />
    <path d="M7.5 14 L12 11.5 L12 16 L7.5 18.5 Z" stroke="white" strokeWidth="0.8" />

    {/* Bottom Right Cube */}
    <path d="M16.5 9 L21 11.5 L16.5 14 L12 11.5 Z" fillOpacity="0.8" stroke="white" strokeWidth="0.8" />
    <path d="M12 11.5 L16.5 14 L16.5 18.5 L12 16 Z" fillOpacity="0.9" stroke="white" strokeWidth="0.8" />
    <path d="M16.5 14 L21 11.5 L21 16 L16.5 18.5 Z" stroke="white" strokeWidth="0.8" />
  </svg>
);

export default function MovementsView() {
  const { 
    products, 
    activeDistributor, 
    activeDistributorName,
    suppliers, 
    clients,
    employees,
    getLoggedInUserName, 
    incrementProductStocks, 
    decrementProductStocks,
    addMovementLog,
    activeTransports,
    deleteActiveTransport,
    updateProduct,
    isInventoryLocked,
    setInventoryLocked,
    setActiveView,
    zerarSaldosEmTransporte,
    movementsHistory,
    updateClient,
    userRole
  } = useApp();

  const [selectedStockType, setSelectedStockType] = useState<'fisico' | 'necessidade'>('fisico');
  const [viewingTransport, setViewingTransport] = useState<any | null>(null);
  const [viewingProductTransportsReport, setViewingProductTransportsReport] = useState<any | null>(null);
  const [viewingAllTransportsReport, setViewingAllTransportsReport] = useState(false);
  const [isDetailedViewOpen, setIsDetailedViewOpen] = useState(false);
  
  // Inventário em Loja (Ajuste de inventário em Clientes) states
  const [isAjusteClienteOpen, setIsAjusteClienteOpen] = useState(false);
  const [ajusteStep, setAjusteStep] = useState<1 | 2>(1); // 1 = Upload, 2 = Summary Preview
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [parsedData, setParsedData] = useState<any[]>([]); // parsed client adjustments
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [ajusteNotification, setAjusteNotification] = useState<{
    totalClientes: number;
    diffs: Record<string, number>;
    docNumber: string;
  } | null>(null);

  const getNextInvCliNumber = () => {
    let maxNum = 0;
    if (movementsHistory && Array.isArray(movementsHistory)) {
      movementsHistory.forEach(log => {
        if (log.nfNumber && log.nfNumber.startsWith('INV_CLI-')) {
          const numPart = log.nfNumber.replace('INV_CLI-', '');
          const num = parseInt(numPart, 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      });
    }
    const nextNum = maxNum + 1;
    return `INV_CLI-${String(nextNum).padStart(4, '0')}`;
  };

  const downloadTemplate = () => {
    const headers = ['Matrícula', 'Razão Social', 'CNPJ', 'Rota de Entrega'];
    products.forEach(p => {
      headers.push(`${p.description} (${p.code})`);
    });

    const rows = clients.filter(c => !c.inativo).map(c => {
      const row = [
        c.matricula,
        c.razaoSocial,
        c.cnpj,
        c.rotaEntrega
      ];
      products.forEach(p => {
        row.push('');
      });
      return row;
    });

    const BOM = "\uFEFF";
    const delimiter = ";";
    const csvContent = BOM + headers.join(delimiter) + "\n" + rows.map(r => r.join(delimiter)).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `modelo_ajuste_inventario_clientes.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setUploadError(null);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    const processGrid = (grid: any[][]) => {
      if (!grid || grid.length < 2) {
        setUploadError('O arquivo deve conter o cabeçalho e pelo menos uma linha de dados.');
        return;
      }

      const headers = grid[0].map(h => String(h ?? '').replace(/^"|"$/g, '').trim());

      const matriculaIdx = headers.findIndex(h => h.toLowerCase().includes('matricula') || h.toLowerCase().includes('matrícula'));

      if (matriculaIdx === -1) {
        setUploadError('Coluna "Matricula" não encontrada no cabeçalho do arquivo.');
        return;
      }

      const productCols: { productId: string; productCode: string; productDescription: string; index: number }[] = [];
      
      products.forEach(p => {
        const colIdx = headers.findIndex(h => {
          const cleanHeader = h.toLowerCase();
          return cleanHeader.includes(p.code.toLowerCase()) || cleanHeader.includes(p.description.toLowerCase());
        });
        if (colIdx !== -1) {
          productCols.push({
            productId: p.id,
            productCode: p.code,
            productDescription: p.description,
            index: colIdx
          });
        }
      });

      if (productCols.length === 0) {
        products.forEach((p, idx) => {
          const possibleIdx = 4 + idx;
          if (possibleIdx < headers.length) {
            productCols.push({
              productId: p.id,
              productCode: p.code,
              productDescription: p.description,
              index: possibleIdx
            });
          }
        });
      }

      if (productCols.length === 0) {
        setUploadError('Nenhuma coluna correspondente aos produtos cadastrados foi identificada.');
        return;
      }

      const dataRows: any[] = [];
      for (let i = 1; i < grid.length; i++) {
        const row = grid[i];
        if (!row || row.length === 0) continue;
        
        const rowVals = row.map(v => String(v ?? '').replace(/^"|"$/g, '').trim());
        if (rowVals.every(v => v === '')) continue;

        const matriculaVal = rowVals[matriculaIdx];
        if (!matriculaVal) continue;

        const matchedClient = clients.find(c => {
          const cleanC = c.matricula.replace(/^0+/, '');
          const cleanM = matriculaVal.replace(/^0+/, '');
          return cleanC === cleanM;
        });

        if (!matchedClient) {
          continue;
        }

        const sheetBalances: Record<string, number> = {};
        productCols.forEach(col => {
          const rawVal = rowVals[col.index];
          const parsedVal = parseInt(rawVal, 10);
          sheetBalances[col.productId] = isNaN(parsedVal) ? 0 : parsedVal;
        });

        const comparisonItems = products.map(p => {
          const planilhaQty = sheetBalances[p.id] ?? 0;
          const currentQty = (matchedClient.productBalances && matchedClient.productBalances[p.id] !== undefined)
            ? (matchedClient.productBalances[p.id] || 0)
            : 0;
          const difference = planilhaQty - currentQty;
          return {
            productId: p.id,
            productCode: p.code,
            productDescription: p.description,
            unit: p.unit,
            planilhaQty,
            currentQty,
            difference
          };
        });

        dataRows.push({
          clientId: matchedClient.id,
          matricula: matchedClient.matricula,
          razaoSocial: matchedClient.razaoSocial,
          cnpj: matchedClient.cnpj,
          rotaEntrega: matchedClient.rotaEntrega,
          comparisons: comparisonItems
        });
      }

      if (dataRows.length === 0) {
        setUploadError('Nenhum cliente cadastrado correspondente foi encontrado no arquivo carregado.');
        return;
      }

      setParsedData(dataRows);
      setAjusteStep(2);
    };

    const reader = new FileReader();
    if (isExcel) {
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const grid = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
          processGrid(grid);
        } catch (err: any) {
          setUploadError('Falha ao processar arquivo Excel: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          if (!text) {
            setUploadError('Arquivo vazio.');
            return;
          }
          const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
          if (lines.length === 0) {
            setUploadError('Arquivo vazio.');
            return;
          }
          const headerLine = lines[0];
          const delimiter = headerLine.includes(';') ? ';' : ',';
          const grid = lines.map(line => line.split(delimiter));
          processGrid(grid);
        } catch (err: any) {
          setUploadError('Falha ao processar arquivo CSV: ' + err.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRegistrarInventario = () => {
    const docNumber = getNextInvCliNumber();
    const currentDateStr = new Date().toISOString().split('T')[0];
    
    // Calculate total differences per product description for the summary
    const diffs: Record<string, number> = {};
    products.forEach(p => {
      diffs[p.description] = 0;
    });

    parsedData.forEach(row => {
      const client = clients.find(c => c.id === row.clientId);
      if (!client) return;

      const updatedBalances = { ...(client.productBalances || {}) };
      const sobredItems: any[] = [];
      const faltadItems: any[] = [];

      row.comparisons.forEach((comp: any) => {
        updatedBalances[comp.productId] = comp.planilhaQty;
        
        // Sum up total difference for the final summary notification
        if (diffs[comp.productDescription] === undefined) {
          diffs[comp.productDescription] = 0;
        }
        diffs[comp.productDescription] += comp.difference;

        if (comp.difference > 0) {
          sobredItems.push({
            productCode: comp.productCode,
            productDescription: comp.productDescription,
            qty: comp.difference,
            unit: comp.unit
          });
        } else if (comp.difference < 0) {
          faltadItems.push({
            productCode: comp.productCode,
            productDescription: comp.productDescription,
            qty: Math.abs(comp.difference),
            unit: comp.unit
          });
        }
      });

      const totalClientSaldo = Object.values(updatedBalances).reduce((a, b) => a + b, 0);
      updateClient({
        ...client,
        productBalances: updatedBalances,
        saldoLoja: totalClientSaldo
      });

      if (sobredItems.length > 0) {
        addMovementLog({
          nfNumber: docNumber,
          date: currentDateStr,
          supplier: `CLIENTE: ${client.razaoSocial} (MAT. ${client.matricula})`,
          responsible: getLoggedInUserName ? getLoggedInUserName() : 'Administrador',
          observation: `Ajuste Físico de Cliente - Sobra sob doc ${docNumber}. Cliente: ${client.razaoSocial}.`,
          type: '601 - AJUSTE INV. CLIENTE – SOBRA',
          items: sobredItems
        });
      }

      if (faltadItems.length > 0) {
        addMovementLog({
          nfNumber: docNumber,
          date: currentDateStr,
          supplier: `CLIENTE: ${client.razaoSocial} (MAT. ${client.matricula})`,
          responsible: getLoggedInUserName ? getLoggedInUserName() : 'Administrador',
          observation: `Ajuste Físico de Cliente - Falta sob doc ${docNumber}. Cliente: ${client.razaoSocial}.`,
          type: '602 - AJUSTE INV. CLIENTE – FALTA',
          items: faltadItems
        });
      }
    });

    // Set success notification details
    setAjusteNotification({
      totalClientes: parsedData.length,
      diffs,
      docNumber
    });

    // Clear after 6 seconds
    setTimeout(() => {
      setAjusteNotification(null);
    }, 6000);

    setIsAjusteClienteOpen(false);
    setAjusteStep(1);
    setUploadedFileName('');
    setParsedData([]);
    setUploadError(null);

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Modal states
  const [isEntradaModalOpen, setIsEntradaModalOpen] = useState(false);
  const [showConfirmZerar, setShowConfirmZerar] = useState(false);
  const [showZerarSuccess, setShowZerarSuccess] = useState(false);
  const [isAbrirInventarioOpen, setIsAbrirInventarioOpen] = useState(false);
  const [isAbertoWarningOpen, setIsAbertoWarningOpen] = useState(false);
  
  // Registrar Ajuste de Inventário states
  const [isRegistrarAjusteOpen, setIsRegistrarAjusteOpen] = useState(false);
  const [isExcluirModalOpen, setIsExcluirModalOpen] = useState(false);
  const [eliminatedDocNumbers, setEliminatedDocNumbers] = useState<string[]>([]);
  const [showEliminatedNotification, setShowEliminatedNotification] = useState(false);
  const [eliminatedDocTemp, setEliminatedDocTemp] = useState('');
  const [invDocNumber, setInvDocNumber] = useState('INV-000002');
  const [invDate, setInvDate] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedDate = localStorage.getItem('inv_saved_date');
      if (savedDate) return savedDate;
    }
    return new Date().toISOString().split('T')[0];
  });
  const [invResponsible, setInvResponsible] = useState('Marta TI (Tech Lead)');
  const [contagens, setContagens] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      const savedContagens = localStorage.getItem('inv_saved_contagens');
      if (savedContagens) {
        try {
          return JSON.parse(savedContagens);
        } catch (e) {
          // ignore
        }
      }
    }
    return {};
  });
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  const [nfNumber, setNfNumber] = useState('');
  const [nfDate, setNfDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number | string>>({});
  const [observation, setObservation] = useState('');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Saída modal states
  const [isSaidaModalOpen, setIsSaidaModalOpen] = useState(false);
  const [saidaNfNumber, setSaidaNfNumber] = useState('');
  const [saidaNfDate, setSaidaNfDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedClient, setSelectedClient] = useState('');
  const [saidaQuantities, setSaidaQuantities] = useState<Record<string, number | string>>({});
  const [saidaObservation, setSaidaObservation] = useState('');
  const [saidaWarningMessage, setSaidaWarningMessage] = useState<string | null>(null);

  const openEntradaModal = () => {
    const initial: Record<string, number | string> = {};
    products.forEach(p => {
      initial[p.id] = '';
    });
    setQuantities(initial);
    setNfNumber('');
    setObservation('');
    setWarningMessage(null);
    setNfDate(new Date().toISOString().split('T')[0]);
    
    if (suppliers && suppliers.length > 0) {
      setSelectedSupplier(suppliers[0].razaoSocial);
    } else {
      setSelectedSupplier('');
    }
    setIsEntradaModalOpen(true);
  };

  const openSaidaModal = () => {
    const initial: Record<string, number | string> = {};
    products.forEach(p => {
      initial[p.id] = '';
    });
    setSaidaQuantities(initial);
    setSaidaNfNumber('');
    setSaidaObservation('');
    setSaidaWarningMessage(null);
    setSaidaNfDate(new Date().toISOString().split('T')[0]);
    
    if (clients && clients.length > 0) {
      setSelectedClient(clients[0].razaoSocial);
    } else {
      setSelectedClient('');
    }
    setIsSaidaModalOpen(true);
  };

  const handleSaveInventory = () => {
    if (!isAnalyzed) return;

    const decreasedItems: { productCode: string; productDescription: string; qty: number; unit: string }[] = [];
    const increasedItems: { productCode: string; productDescription: string; qty: number; unit: string }[] = [];

    products.forEach(p => {
      const physicalVal = Number(contagens[p.id] || 0);
      const currentStock = p.initialStock;
      
      // Update product's stock levels
      updateProduct({
        ...p,
        initialStock: physicalVal
      });

      if (physicalVal < currentStock) {
        decreasedItems.push({
          productCode: p.code,
          productDescription: p.description,
          qty: currentStock - physicalVal,
          unit: p.unit
        });
      } else if (physicalVal > currentStock) {
        increasedItems.push({
          productCode: p.code,
          productDescription: p.description,
          qty: physicalVal - currentStock,
          unit: p.unit
        });
      }
    });

    if (decreasedItems.length > 0) {
      addMovementLog({
        nfNumber: invDocNumber,
        date: invDate,
        supplier: 'AJUSTE DE INVENTÁRIO',
        responsible: invResponsible,
        observation: `Ajuste de inventário sob documento ${invDocNumber} - FALTA.`,
        type: '202 – AJUSTE DE INVENTÁRIO - FALTA',
        items: decreasedItems
      });
    }

    if (increasedItems.length > 0) {
      addMovementLog({
        nfNumber: invDocNumber,
        date: invDate,
        supplier: 'AJUSTE DE INVENTÁRIO',
        responsible: invResponsible,
        observation: `Ajuste de inventário sob documento ${invDocNumber} - SOBRA.`,
        type: '201 – AJUSTE DE INVENTÁRIO - SOBRA',
        items: increasedItems
      });
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('inv_saved_contagens');
        localStorage.removeItem('inv_saved_date');
      } catch (err) {
        console.warn('Unable to remove item from localStorage:', err);
      }
    }

    alert('Inventário registrado com sucesso! Os saldos físicos foram atualizados no sistema.');
    setIsRegistrarAjusteOpen(false);
    setInventoryLocked(false);
    setActiveView('movements');
  };

  const handleSaveAndExit = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('inv_saved_contagens', JSON.stringify(contagens));
        localStorage.setItem('inv_saved_date', invDate);
      } catch (err) {
        console.warn('Unable to write to localStorage:', err);
      }
    }
    setIsRegistrarAjusteOpen(false);
    setActiveView('movements');
  };

  const handleQtyChange = (productId: string, val: string) => {
    if (val === '') {
      setQuantities(prev => ({
        ...prev,
        [productId]: ''
      }));
      return;
    }
    const num = parseInt(val, 10);
    setQuantities(prev => ({
      ...prev,
      [productId]: isNaN(num) ? '' : (num >= 0 ? num : 0)
    }));
  };

  const handleSaidaQtyChange = (productId: string, val: string) => {
    if (val === '') {
      setSaidaQuantities(prev => ({
        ...prev,
        [productId]: ''
      }));
      return;
    }
    const num = parseInt(val, 10);
    setSaidaQuantities(prev => ({
      ...prev,
      [productId]: isNaN(num) ? '' : (num >= 0 ? num : 0)
    }));
  };

  const handleRegisterNF = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nfNumber.trim()) {
      setWarningMessage('Por favor, informe o Número da NF.');
      setTimeout(() => {
        setWarningMessage(current => current === 'Por favor, informe o Número da NF.' ? null : current);
      }, 3000);
      return;
    }

    if (!selectedSupplier) {
      setWarningMessage('Por favor, selecione um Fornecedor.');
      setTimeout(() => {
        setWarningMessage(current => current === 'Por favor, selecione um Fornecedor.' ? null : current);
      }, 3000);
      return;
    }

    const activeItems = products
      .filter(p => {
        const qtyVal = quantities[p.id];
        return qtyVal !== undefined && qtyVal !== '' && Number(qtyVal) > 0;
      })
      .map(p => ({
        productCode: p.code,
        productDescription: p.description,
        qty: Number(quantities[p.id]) || 0,
        unit: p.unit
      }));

    if (activeItems.length === 0) {
      setWarningMessage('Por favor, informe a quantidade recebida para pelo menos um produto.');
      setTimeout(() => {
        setWarningMessage(current => current === 'Por favor, informe a quantidade recebida para pelo menos um produto.' ? null : current);
      }, 3000);
      return;
    }

    // Call single transaction stock update converting record to standard numbers
    const numQuantities: Record<string, number> = {};
    products.forEach(p => {
      const q = quantities[p.id];
      numQuantities[p.id] = Number(q) || 0;
    });
    incrementProductStocks(numQuantities);

    // Format date DD/MM/YYYY for presentation
    const formattedDate = nfDate.split('-').reverse().join('/');

    // Log the transaction in the movements history
    addMovementLog({
      nfNumber,
      date: formattedDate,
      supplier: selectedSupplier,
      responsible: getLoggedInUserName() || 'Marta TI',
      observation,
      type: '101 – ENTRADA POR NOTA FISCAL',
      items: activeItems
    });

    setIsEntradaModalOpen(false);
  };

  const handleRegisterSaidaNF = (e: React.FormEvent) => {
    e.preventDefault();

    if (!saidaNfNumber.trim()) {
      setSaidaWarningMessage('Por favor, informe o Número da NF.');
      setTimeout(() => {
        setSaidaWarningMessage(current => current === 'Por favor, informe o Número da NF.' ? null : current);
      }, 3000);
      return;
    }

    if (!selectedClient) {
      setSaidaWarningMessage('Por favor, selecione um Fornecedor de Destino. Caso não existam fornecedores cadastrados, inclua-os primeiro em Central de Cadastros.');
      setTimeout(() => {
        setSaidaWarningMessage(current => current === 'Por favor, selecione um Fornecedor de Destino. Caso não existam fornecedores cadastrados, inclua-os primeiro em Central de Cadastros.' ? null : current);
      }, 3000);
      return;
    }

    const activeItems = products
      .filter(p => {
        const qtyVal = saidaQuantities[p.id];
        return qtyVal !== undefined && qtyVal !== '' && Number(qtyVal) > 0;
      })
      .map(p => ({
        productCode: p.code,
        productDescription: p.description,
        qty: Number(saidaQuantities[p.id]) || 0,
        unit: p.unit
      }));

    if (activeItems.length === 0) {
      setSaidaWarningMessage('Por favor, informe a quantidade para pelo menos um produto.');
      setTimeout(() => {
        setSaidaWarningMessage(current => current === 'Por favor, informe a quantidade para pelo menos um produto.' ? null : current);
      }, 3000);
      return;
    }

    // Call single transaction stock update converting record to standard numbers to decrement
    const numQuantities: Record<string, number> = {};
    products.forEach(p => {
      const q = saidaQuantities[p.id];
      numQuantities[p.id] = Number(q) || 0;
    });
    decrementProductStocks(numQuantities);

    // Format date DD/MM/YYYY for presentation
    const formattedDate = saidaNfDate.split('-').reverse().join('/');

    // Log the transaction in the movements history
    addMovementLog({
      nfNumber: saidaNfNumber,
      date: formattedDate,
      supplier: selectedClient,
      responsible: getLoggedInUserName() || 'Marta TI',
      observation: saidaObservation,
      type: '102 – SAIDA POR NOTA FISCAL',
      items: activeItems
    });

    setIsSaidaModalOpen(false);
  };

  useEffect(() => {
    if (selectedStockType === 'necessidade') {
      const timer = setTimeout(() => {
        setSelectedStockType('fisico');
      }, 20000);
      return () => clearTimeout(timer);
    }
  }, [selectedStockType]);

  // Compute stats in real-time based on active distributor products
  const totalStockInWarehouse = products.reduce((acc, p) => acc + p.initialStock, 0);
  const formattedTotalWarehouse = totalStockInWarehouse.toLocaleString('pt-BR');

  // Calculate real total transit transport quantity across all active transports
  const totalTransporte = products.reduce((acc, p) => {
    const totalQty = (activeTransports || []).reduce((sum, trp) => {
      return sum + (trp.stock?.[p.id]?.veiculo || 0);
    }, 0);
    return acc + totalQty;
  }, 0);

  // Calculate total store balance (saldoLoja) across all active clients
  const totalLoja = clients.reduce((acc, c) => acc + (c.saldoLoja || 0), 0);

  // Calculate total store inventory (saldoContagem) across all active clients
  const totalContagem = clients.reduce((acc, c) => acc + (c.saldoContagem || 0), 0);

  const totalGeralSoma = products.reduce((acc, p) => {
    const armazem = p.initialStock;
    const transporte = (activeTransports || []).reduce((sum, trp) => sum + (trp.stock?.[p.id]?.veiculo || 0), 0);
    const prodLoja = clients.reduce((sum, c) => {
      if (c.productBalances && c.productBalances[p.id] !== undefined) {
        return sum + (c.productBalances[p.id] || 0);
      }
      const pIdx = products.findIndex(prod => prod.id === p.id);
      const pct = pIdx === 0 ? 0.5 : pIdx === 1 ? 0.35 : pIdx === 2 ? 0.15 : 0;
      return sum + Math.floor((c.saldoLoja || 0) * pct);
    }, 0);
    return acc + armazem + transporte + prodLoja;
  }, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-350">

      {ajusteNotification && (
        <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-950 rounded-2xl p-5 shadow-lg flex items-start gap-4 animate-in slide-in-from-top-4 duration-300">
          <span className="material-symbols-outlined text-emerald-600 text-3xl font-extrabold animate-bounce">check_circle</span>
          <div className="space-y-2 w-full">
            <h4 className="text-sm font-black uppercase tracking-wider text-emerald-900">
              Inventário ajustado!
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-700 bg-emerald-100/50 p-3 rounded-xl border border-emerald-200">
              <div>
                <span className="text-slate-500 uppercase block text-[9px] tracking-wider font-extrabold">Número do Inventário</span>
                <span className="font-mono text-emerald-800 text-sm font-black">{ajusteNotification.docNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase block text-[9px] tracking-wider font-extrabold">Total de Clientes</span>
                <span className="text-slate-800 text-sm font-black">{ajusteNotification.totalClientes} Clientes</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase block text-[9px] tracking-wider font-extrabold">Status</span>
                <span className="text-emerald-700 text-xs font-black uppercase flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Processado com Sucesso
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="text-slate-500 uppercase text-[9px] tracking-wider font-extrabold block">Diferença Total Ajustada</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ajusteNotification.diffs).map(([prodName, diffVal]) => {
                  const isSob = diffVal > 0;
                  const isFal = diffVal < 0;
                  return (
                    <span
                      key={prodName}
                      className={`px-3 py-1 rounded-lg text-xs font-black border uppercase tracking-wider flex items-center gap-1.5 ${
                        isSob
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                          : isFal
                          ? 'bg-red-100 border-red-300 text-red-800'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span>{prodName}:</span>
                      <span>{isSob ? `+${diffVal}` : diffVal}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {isInventoryLocked && (
        <div className="bg-red-600 border-2 border-red-700 rounded-2xl p-5 shadow-md flex items-start gap-4 animate-in slide-in-from-top-4 duration-300 text-white">
          <span className="material-symbols-outlined text-white text-3xl font-extrabold">warning</span>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-white uppercase tracking-widest">
              BLOQUEIO SISTÊMICO ATIVO POR INVENTÁRIO
            </h4>
            <p className="text-[11px] text-white font-extrabold leading-relaxed">
              O procedimento de inventário está em andamento. Todas as movimentações sistêmicas (Notas Fiscais de Entrada e Saída, Transportes, Estoque em Armazém e Saldos em Loja) estão temporariamente bloqueadas até que o ajuste de diferenças seja registrado.
            </p>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* AJUSTE DE INVENTÁRIO EM CLIENTES OVERLAY WINDOW */}
      {/* ---------------------------------------------------- */}
      {isAjusteClienteOpen && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border-2 border-purple-600 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 relative pointer-events-auto">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-purple-100 pb-4 gap-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-purple-600 text-3xl font-black">inventory</span>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    Ajuste de inventário em Clientes
                  </h3>
                  <p className="text-[11px] text-purple-600 font-bold italic">
                    Baixe o modelo, preencha os dados e envie a planilha para realizar o ajuste automático do Saldo em Loja.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAjusteClienteOpen(false);
                  setAjusteStep(1);
                  setUploadedFileName('');
                  setParsedData([]);
                  setUploadError(null);
                }}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase rounded-lg transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>

            {ajusteStep === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                
                {/* Box 1: Download Template */}
                <div className="border border-purple-200 bg-purple-50/40 rounded-xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-purple-600 text-xl">download_for_offline</span>
                      <h4 className="text-xs font-black text-purple-800 uppercase tracking-wide">Planilha Modelo</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                      Gere e baixe a planilha contendo todos os clientes ativos e seus respectivos saldos de produtos atuais. Esta planilha servirá como base para o seu preenchimento físico em campo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-lg shadow-2xs hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Baixar Modelo de Planilha (CSV)
                  </button>
                </div>

                {/* Box 2: Upload File */}
                <div className="border border-purple-200 bg-purple-50/40 rounded-xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-purple-600 text-xl">upload_file</span>
                      <h4 className="text-xs font-black text-purple-800 uppercase tracking-wide">Upload de Planilha Preenchida</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                      Após preencher a contagem física real apontada de cada cliente na planilha, salve o arquivo no formato Excel (<strong>.xlsx</strong> / <strong>.xls</strong>) ou <strong>CSV</strong> e envie abaixo para carregar as diferenças do inventário.
                    </p>
                  </div>

                  <div className="relative">
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-purple-300 hover:border-purple-500 bg-white rounded-xl p-4 cursor-pointer transition-colors group">
                      <span className="material-symbols-outlined text-purple-400 group-hover:text-purple-600 text-3xl mb-1 transition-colors">cloud_upload</span>
                      <span className="text-[10px] font-black uppercase text-purple-700 group-hover:text-purple-900 tracking-wider">
                        Selecionar Planilha (Excel / CSV)
                      </span>
                      <span className="text-[9px] text-gray-400 mt-1">Clique para procurar (.xlsx, .xls, .csv)</span>
                      <input
                        type="file"
                        accept=".csv, .xls, .xlsx, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleCSVUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {uploadedFileName && (
                    <div className="text-[11px] text-purple-800 font-bold bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">grid_on</span>
                      <span>Arquivo selecionado: <strong>{uploadedFileName}</strong></span>
                    </div>
                  )}

                  {uploadError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold rounded-lg flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">error</span>
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              // Step 2: Summary Preview Table
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-600">assignment_turned_in</span>
                    <span className="text-xs font-extrabold text-purple-800 uppercase tracking-wider">
                      Resumo dos Ajustes de Inventário Propostos
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 border px-2 py-1 rounded-md uppercase tracking-wider">
                      Documento Sequencial Previsto: <span className="text-purple-700 font-black">{getNextInvCliNumber()}</span>
                    </span>
                  </div>
                </div>

                {/* Responsive Table */}
                <div className="overflow-x-auto border border-purple-200 rounded-xl bg-white shadow-3xs max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left text-[11px] border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-purple-100 border-b border-purple-200 text-purple-900 font-extrabold uppercase tracking-wider text-[9px] sticky top-0 z-10">
                        <th className="py-2 px-3">Matrícula</th>
                        <th className="py-2 px-3">Razão Social</th>
                        <th className="py-2 px-3">CNPJ</th>
                        <th className="py-2 px-3">Rota</th>
                        {products.map(p => (
                          <th key={p.id} className="py-2 px-3 text-center border-l border-purple-100" colSpan={3}>
                            {p.description}
                          </th>
                        ))}
                      </tr>
                      <tr className="bg-purple-50/50 border-b border-purple-100 text-[8px] font-extrabold uppercase tracking-wider text-purple-700 sticky top-[25px] z-10">
                        <th className="py-1 px-3"></th>
                        <th className="py-1 px-3"></th>
                        <th className="py-1 px-3"></th>
                        <th className="py-1 px-3"></th>
                        {products.map(p => (
                          <React.Fragment key={p.id}>
                            <th className="py-1 px-1 text-center border-l border-purple-100 text-slate-500">Planilha</th>
                            <th className="py-1 px-1 text-center text-slate-500 font-bold">Loja</th>
                            <th className="py-1 px-1 text-center text-slate-500 font-bold">Dif.</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100 bg-white">
                      {parsedData.map((row) => (
                        <tr key={row.clientId} className="hover:bg-purple-50/20 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-slate-700">{row.matricula}</td>
                          <td className="py-2 px-3 font-bold text-slate-800 truncate max-w-[160px]" title={row.razaoSocial}>
                            {row.razaoSocial}
                          </td>
                          <td className="py-2 px-3 text-slate-500 font-mono text-[10px]">{row.cnpj}</td>
                          <td className="py-2 px-3 text-slate-600 font-bold uppercase">{row.rotaEntrega}</td>
                          {row.comparisons.map((comp: any) => {
                            const isSob = comp.difference > 0;
                            const isFal = comp.difference < 0;
                            return (
                              <React.Fragment key={comp.productId}>
                                <td className="py-2 px-1.5 text-center font-bold border-l border-purple-100 text-slate-800 bg-purple-50/10">
                                  {comp.planilhaQty}
                                </td>
                                <td className="py-2 px-1.5 text-center font-bold text-purple-700">
                                  {comp.currentQty}
                                </td>
                                <td className={`py-2 px-1.5 text-center font-black ${
                                  isSob ? 'text-emerald-600 bg-emerald-50/20' : isFal ? 'text-red-600 bg-red-50/20' : 'text-slate-400'
                                }`}>
                                  {isSob ? `+${comp.difference}` : comp.difference}
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                    {/* Totals Row */}
                    <tfoot>
                      <tr className="bg-purple-50 border-t-2 border-purple-200 text-[10px] font-black text-purple-950 uppercase tracking-wide">
                        <td className="py-2.5 px-3" colSpan={4}>
                          Total ({parsedData.length} Clientes)
                        </td>
                        {products.map(p => {
                          let totalPlanilha = 0;
                          let totalLojaCol = 0;
                          let totalDif = 0;

                          parsedData.forEach(row => {
                            const comp = row.comparisons.find((c: any) => c.productId === p.id);
                            if (comp) {
                              totalPlanilha += comp.planilhaQty;
                              totalLojaCol += comp.currentQty;
                              totalDif += comp.difference;
                            }
                          });

                          return (
                            <React.Fragment key={p.id}>
                              <td className="py-2.5 px-1.5 text-center border-l border-purple-200 bg-purple-100/40">
                                {totalPlanilha.toLocaleString('pt-BR')}
                              </td>
                              <td className="py-2.5 px-1.5 text-center text-purple-700 bg-purple-100/40">
                                {totalLojaCol.toLocaleString('pt-BR')}
                              </td>
                              <td className={`py-2.5 px-1.5 text-center font-black bg-purple-100/40 ${
                                totalDif > 0 ? 'text-emerald-700' : totalDif < 0 ? 'text-red-700' : 'text-purple-900'
                              }`}>
                                {totalDif > 0 ? `+${totalDif.toLocaleString('pt-BR')}` : totalDif.toLocaleString('pt-BR')}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAjusteStep(1);
                      setUploadedFileName('');
                      setParsedData([]);
                      setUploadError(null);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar e Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleRegistrarInventario}
                    className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                    Registrar Inventário
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Metrics Cards similar to Imagem 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Saldo em Armazém */}
        <div className={`p-4 pb-3 rounded-xl border-2 shadow-2xs min-h-[180px] flex flex-col justify-between transition-all ${
          isInventoryLocked 
            ? 'bg-gray-100 border-gray-300 text-gray-400 opacity-55 cursor-not-allowed select-none' 
            : 'bg-white border-orange-500/70'
        }`}>
          <div>
            <div className="text-center w-full pb-1 border-b border-gray-100/50">
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${isInventoryLocked ? 'text-gray-400' : 'text-black'}`}>Saldo em Armazém</span>
            </div>
            <div className="flex items-center justify-between mt-2.5 w-full">
              <h2 className={`text-xl md:text-2xl font-black leading-none ${isInventoryLocked ? 'text-gray-400' : 'text-orange-500'}`}>
                {formattedTotalWarehouse} <span className={`text-[10px] font-semibold ${isInventoryLocked ? 'text-gray-400' : 'text-orange-400'}`}>UN</span>
              </h2>
              <span className={`material-symbols-outlined p-1.5 rounded-lg ${isInventoryLocked ? 'text-gray-400 bg-gray-200' : 'text-orange-500 bg-orange-50'}`} style={{ fontSize: '29px' }}>warehouse</span>
            </div>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-gray-100 space-y-1">
            <p className={`text-[9px] font-bold uppercase tracking-wider ${isInventoryLocked ? 'text-gray-400' : 'text-black'}`}>Visão por Produto:</p>
            {products.length === 0 ? (
              <p className={`text-xs italic font-bold ${isInventoryLocked ? 'text-gray-400' : 'text-orange-455'}`}>Sem produtos cadastrados</p>
            ) : (
              products.slice(0, 3).map((p) => (
                <div key={p.id} className="flex justify-between text-[12px]">
                  <span className={`truncate max-w-[140px] text-[12px] font-bold ${isInventoryLocked ? 'text-gray-400' : 'text-orange-500'}`}>{p.description}</span>
                  <span className={`font-bold text-[12px] ${isInventoryLocked ? 'text-gray-400' : 'text-orange-500'}`}>{p.initialStock.toLocaleString('pt-BR')} <span className={`text-[10px] ${isInventoryLocked ? 'text-gray-400' : 'text-orange-400'}`}>{p.unit}</span></span>
                </div>
              ))
            )}
            {products.length > 3 && (
              <p className={`text-[8px] font-semibold ${isInventoryLocked ? 'text-gray-450' : 'text-orange-600'}`}>+{products.length - 3} outros materiais</p>
            )}
          </div>
        </div>

        {/* Card 2: Saldo em Trânsito / Transporte */}
        <div className={`p-4 pb-3 rounded-xl border-2 shadow-2xs min-h-[180px] flex flex-col justify-between transition-all ${
          isInventoryLocked 
            ? 'bg-gray-100 border-gray-300 text-gray-400 opacity-55 cursor-not-allowed select-none' 
            : 'bg-white border-blue-500/70'
        }`}>
          <div>
            <div className="text-center w-full pb-1 border-b border-gray-100/50">
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${isInventoryLocked ? 'text-gray-400' : 'text-black'}`}>Saldo em Transporte</span>
            </div>
            <div className="flex items-center justify-between mt-2.5 w-full">
              <h2 className={`text-xl md:text-2xl font-black leading-none ${isInventoryLocked ? 'text-gray-400' : 'text-blue-500'}`}>
                {totalTransporte.toLocaleString('pt-BR')} <span className={`text-[10px] font-semibold ${isInventoryLocked ? 'text-gray-400' : 'text-blue-400'}`}>UN</span>
              </h2>
              <span className={`material-symbols-outlined p-1.5 rounded-lg ${isInventoryLocked ? 'text-gray-400 bg-gray-200' : 'text-blue-500 bg-blue-50'}`} style={{ fontSize: '29px' }}>local_shipping</span>
            </div>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-gray-100 space-y-1">
            <p className={`text-[9px] font-bold uppercase tracking-wider ${isInventoryLocked ? 'text-gray-400' : 'text-black'}`}>Visão por Produto:</p>
            {products.slice(0, 3).map((p) => {
              const transQty = (activeTransports || []).reduce((sum, trp) => sum + (trp.stock?.[p.id]?.veiculo || 0), 0);
              return (
                <div key={p.id} className="flex justify-between text-[12px]">
                  <span className={`truncate max-w-[140px] text-[12px] font-bold ${isInventoryLocked ? 'text-gray-400' : 'text-blue-500'}`}>{p.description}</span>
                  <span className={`font-bold text-[12px] ${isInventoryLocked ? 'text-gray-400' : 'text-blue-500'}`}>{transQty.toLocaleString('pt-BR')} <span className={`text-[10px] ${isInventoryLocked ? 'text-gray-400' : 'text-blue-400'}`}>{p.unit}</span></span>
                </div>
              );
            })}
            {products.length === 0 && <p className={`text-xs italic ${isInventoryLocked ? 'text-gray-400' : 'text-blue-400'}`}>Nenhum em trânsito</p>}
          </div>
        </div>

        {/* Card 3: Saldo em Loja */}
        <div className={`p-4 pb-3 rounded-xl border-2 shadow-2xs min-h-[180px] flex flex-col justify-between transition-all ${
          isInventoryLocked 
            ? 'bg-gray-100 border-gray-300 text-gray-400 opacity-55 cursor-not-allowed select-none' 
            : 'bg-white border-purple-500/70'
        }`}>
          <div>
            <div className="text-center w-full pb-1 border-b border-gray-100/50">
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${isInventoryLocked ? 'text-gray-400' : 'text-black'}`}>Saldo em Loja</span>
            </div>
            <div className="flex items-center justify-between mt-2.5 w-full">
              <h2 className={`text-xl md:text-2xl font-black leading-none ${isInventoryLocked ? 'text-gray-400' : 'text-purple-500'}`}>
                {totalLoja.toLocaleString('pt-BR')} <span className={`text-[10px] font-semibold ${isInventoryLocked ? 'text-gray-400' : 'text-purple-400'}`}>UN</span>
              </h2>
              <span className={`material-symbols-outlined p-1.5 rounded-lg ${isInventoryLocked ? 'text-gray-400 bg-gray-200' : 'text-purple-500 bg-purple-50'}`} style={{ fontSize: '29px' }}>storefront</span>
            </div>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-gray-100 space-y-1">
            <p className={`text-[9px] font-bold uppercase tracking-wider ${isInventoryLocked ? 'text-gray-400' : 'text-black'}`}>Visão por Produto:</p>
            {products.slice(0, 3).map((p) => {
              const prodLoja = clients.reduce((sum, c) => {
                if (c.productBalances && c.productBalances[p.id] !== undefined) {
                  return sum + (c.productBalances[p.id] || 0);
                }
                const pIdx = products.findIndex(prod => prod.id === p.id);
                const pct = pIdx === 0 ? 0.5 : pIdx === 1 ? 0.35 : pIdx === 2 ? 0.15 : 0;
                return sum + Math.floor((c.saldoLoja || 0) * pct);
              }, 0);
              return (
                <div key={p.id} className="flex justify-between text-[12px]">
                  <span className={`truncate max-w-[140px] text-[12px] font-bold ${isInventoryLocked ? 'text-gray-400' : 'text-purple-500'}`}>{p.description}</span>
                  <span className={`font-bold text-[12px] ${isInventoryLocked ? 'text-gray-400' : 'text-purple-500'}`}>{prodLoja.toLocaleString('pt-BR')} <span className={`text-[10px] ${isInventoryLocked ? 'text-gray-400' : 'text-purple-400'}`}>{p.unit}</span></span>
                </div>
              );
            })}
            {products.length === 0 && <p className={`text-xs italic ${isInventoryLocked ? 'text-gray-400' : 'text-purple-400'}`}>Nenhum em loja</p>}
          </div>
        </div>

        {/* Card 4: Total Geral */}
        <div className={`p-4 pb-3 rounded-xl border-2 shadow-2xs min-h-[180px] flex flex-col justify-between transition-all ${
          isInventoryLocked 
            ? 'bg-gray-100 border-gray-300 text-gray-400 opacity-55 cursor-not-allowed select-none' 
            : 'bg-white border-green-500/70'
        }`}>
          <div>
            <div className="text-center w-full pb-1 border-b border-gray-100/50">
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${isInventoryLocked ? 'text-gray-400' : 'text-black'}`}>Total Geral</span>
            </div>
            <div className="flex items-center justify-between mt-2.5 w-full">
              <h2 className={`text-xl md:text-2xl font-black leading-none ${isInventoryLocked ? 'text-gray-400' : 'text-green-500'}`}>
                {totalGeralSoma.toLocaleString('pt-BR')} <span className={`text-[10px] font-semibold ${isInventoryLocked ? 'text-gray-400' : 'text-green-400'}`}>UN</span>
              </h2>
              <span className={`p-1.5 rounded-lg flex items-center justify-center ${isInventoryLocked ? 'bg-gray-200' : 'bg-green-50'}`}>
                <ThreeCubesSVG className={`w-[29px] h-[29px] ${isInventoryLocked ? 'text-gray-400' : 'text-green-500'}`} />
              </span>
            </div>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-gray-100 space-y-1 pr-1">
            <p className={`text-[9px] font-bold uppercase tracking-wider ${isInventoryLocked ? 'text-gray-400' : 'text-black'}`}>Visão por Produto:</p>
            {products.length === 0 ? (
              <p className={`text-xs italic font-bold ${isInventoryLocked ? 'text-gray-400' : 'text-green-400'}`}>Sem produtos cadastrados</p>
            ) : (
              products.slice(0, 3).map((p) => {
                const armazem = p.initialStock;
                const transporte = (activeTransports || []).reduce((sum, trp) => sum + (trp.stock?.[p.id]?.veiculo || 0), 0);
                const prodLoja = clients.reduce((sum, c) => {
                  if (c.productBalances && c.productBalances[p.id] !== undefined) {
                    return sum + (c.productBalances[p.id] || 0);
                  }
                  const pIdx = products.findIndex(prod => prod.id === p.id);
                  const pct = pIdx === 0 ? 0.5 : pIdx === 1 ? 0.35 : pIdx === 2 ? 0.15 : 0;
                  return sum + Math.floor((c.saldoLoja || 0) * pct);
                }, 0);
                const total = armazem + transporte + prodLoja;
                return (
                  <div key={p.id} className="flex justify-between text-[12px]">
                    <span className={`truncate max-w-[140px] text-[12px] font-bold ${isInventoryLocked ? 'text-gray-400' : 'text-green-500'}`}>{p.description}</span>
                    <span className={`font-bold text-[12px] ${isInventoryLocked ? 'text-gray-400' : 'text-green-500'}`}>
                      {total.toLocaleString('pt-BR')}{' '}
                      <span className={`text-[10px] ${isInventoryLocked ? 'text-gray-400' : 'text-green-400'}`}>{p.unit}</span>
                    </span>
                  </div>
                );
              })
            )}
            {products.length > 3 && (
              <p className={`text-[8px] font-semibold ${isInventoryLocked ? 'text-gray-450' : 'text-green-600'}`}>+{products.length - 3} outros materiais</p>
            )}
          </div>
        </div>
      </div>

      {/* MOVIMENTAÇÃO E FLUXO DO ARMAZÉM */}
      <section className="bg-white border-2 border-gray-500 rounded-2xl p-6 md:p-8 shadow-sm">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 text-left flex items-center justify-start gap-3 flex-wrap">
          <span className="material-symbols-outlined text-blue-600" style={{ fontSize: '33.6px' }}>hub</span>
          <span>MOVIMENTAÇÃO E FLUXO DO ARMAZÉM</span>
        </h4>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[16%_50%_34%] gap-6 items-stretch">
            
            {/* Left Column: Entrada, Saída, Ajuste */}
            <div className="flex flex-col gap-2 h-full lg:min-h-0">
              
              {/* Entrada via NF - Interactive Button */}
              <button
                type="button"
                disabled={isInventoryLocked}
                onClick={() => {
                  if (isInventoryLocked) {
                    alert("Aviso de Bloqueio Sistêmico Ativo: Não é possível registrar Entrada via NF enquanto houver um inventário ativo.");
                  } else {
                    openEntradaModal();
                  }
                }}
                className={`w-full ${isInventoryLocked ? 'bg-gray-150 border-gray-300 text-gray-400 cursor-not-allowed opacity-80' : 'bg-green-50 hover:bg-green-100/80 border-green-500 text-green-700 cursor-pointer'} border rounded-xl px-4 py-1.5 text-center flex flex-col justify-center h-[81px] relative shadow-3xs transition-all`}
              >
                {/* + Circle centered on the right border line */}
                <div className={`absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-5 h-5 flex items-center justify-center rounded-full ${isInventoryLocked ? 'bg-gray-400 border-gray-300' : 'bg-green-600 border-white'} text-white border shadow-xs font-black text-[10px]`}>
                  {isInventoryLocked ? '🔒' : '+'}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <GreenTruckSVG className={`w-5 h-5 ${isInventoryLocked ? 'text-gray-400' : 'text-green-600'}`} />
                  <span className={`text-[11px] font-extrabold ${isInventoryLocked ? 'text-gray-400' : 'text-green-700'} uppercase tracking-wider`}>Entrada Via NF</span>
                </div>
                <p className={`text-[8px] ${isInventoryLocked ? 'text-gray-400' : 'text-green-600'} font-semibold italic`}>
                  {isInventoryLocked ? 'SISTEMA BLOQUEADO' : 'Clique para registrar'}
                </p>
              </button>

              {/* Saída via NF - Interactive Button */}
              <button
                type="button"
                disabled={isInventoryLocked}
                onClick={() => {
                  if (isInventoryLocked) {
                    alert("Aviso de Bloqueio Sistêmico Ativo: Não é possível registrar Saída via NF enquanto houver um inventário ativo.");
                  } else {
                    openSaidaModal();
                  }
                }}
                className={`w-full ${isInventoryLocked ? 'bg-gray-150 border-gray-300 text-gray-400 cursor-not-allowed opacity-80' : 'bg-red-50 hover:bg-red-100/80 border-red-500 text-red-700 cursor-pointer'} border rounded-xl px-4 py-1.5 text-center flex flex-col justify-center h-[81px] relative shadow-3xs transition-all`}
              >
                {/* - Circle centered on the right border line */}
                <div className={`absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-5 h-5 flex items-center justify-center rounded-full ${isInventoryLocked ? 'bg-gray-400 border-gray-300' : 'bg-red-600 border-white'} text-white border shadow-xs font-black text-[10px]`}>
                  {isInventoryLocked ? '🔒' : '-'}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <RedTruckSVG className={`w-5 h-5 ${isInventoryLocked ? 'text-gray-400' : 'text-red-600'}`} />
                  <span className={`text-[11px] font-extrabold ${isInventoryLocked ? 'text-gray-400' : 'text-red-700'} uppercase tracking-wider`}>Saída Via NF</span>
                </div>
                <p className={`text-[8px] ${isInventoryLocked ? 'text-gray-400' : 'text-red-600'} font-semibold italic`}>
                  {isInventoryLocked ? 'SISTEMA BLOQUEADO' : 'Clique para registrar'}
                </p>
              </button>

              {/* Ajuste Inventário */}
              {userRole !== 'Administrativo' && userRole !== 'Logístico' && userRole !== 'Conferencia' && (
                <button
                  type="button"
                  onClick={() => {
                    if (isInventoryLocked) {
                      setIsAbertoWarningOpen(true);
                    } else {
                      setIsAbrirInventarioOpen(true);
                    }
                  }}
                  className="w-full bg-yellow-50 hover:bg-yellow-100/80 border border-yellow-500 rounded-xl px-4 py-1.5 text-center group transition-all flex flex-col justify-center h-[81px] relative shadow-3xs mt-auto cursor-pointer"
                >
                  {/* Two distinct small circles (one with + and one with -) centered on the right border line */}
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-0.5">
                    <div className="w-4 h-4 flex items-center justify-center rounded-full bg-yellow-500 text-white border border-white shadow-xs font-black text-[9px]">
                      +
                    </div>
                    <div className="w-4 h-4 flex items-center justify-center rounded-full bg-yellow-500 text-white border border-white shadow-xs font-black text-[9px] leading-none">
                      -
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-yellow-600 justify-center w-full">
                    <span className="material-symbols-outlined text-yellow-600 text-base">edit_note</span>
                    <h5 className="text-[11px] font-extrabold text-yellow-850 uppercase tracking-wider">Ajuste Inventário</h5>
                  </div>
                  <p className="text-[8px] text-yellow-600 font-semibold italic">Clique para abrir documento</p>
                </button>
              )}
            </div>

            {/* Middle Column: ESTOQUE EM ARMAZÉM */}
            <div className={`border-2 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between transition-all ${
              isInventoryLocked
                ? 'bg-gray-150 border-gray-300 text-gray-400 opacity-60 select-none pointer-events-none'
                : selectedStockType === 'necessidade'
                  ? 'border-blue-900 bg-blue-50'
                  : 'border-orange-500 bg-orange-50'
            }`}>
              
              {/* Header of Warehouse Box */}
              <div className={`flex flex-col sm:flex-row items-center justify-between border-b pb-4 mb-4 ${
                selectedStockType === 'necessidade' ? 'border-blue-100' : 'border-orange-100'
              }`}>
                <div className="flex items-center space-x-2.5">
                  <span className={`material-symbols-outlined p-1.5 rounded-lg ${
                    isInventoryLocked 
                      ? 'bg-gray-200 text-gray-400' 
                      : selectedStockType === 'necessidade'
                        ? 'text-blue-900 bg-blue-50'
                        : 'text-orange-500 bg-orange-50'
                  }`}>warehouse</span>
                  <div>
                    <h5 className="text-sm font-black text-slate-800 uppercase flex items-center gap-1.5">
                      ESTOQUE EM ARMAZÉM
                      {isInventoryLocked && (
                        <span className="bg-red-100 text-red-600 border border-red-200 text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase animate-pulse flex items-center gap-0.5">
                          <span>🔒</span> Bloqueado
                        </span>
                      )}
                    </h5>
                  </div>
                </div>
                
                {/* Switch / Chave Seletora */}
                <div className="mt-2.5 sm:mt-0 flex p-1 bg-gray-150 border border-gray-200 rounded-xl">
                  <button
                    type="button"
                    disabled={isInventoryLocked}
                    onClick={() => setSelectedStockType('fisico')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      selectedStockType === 'fisico'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Físico
                  </button>
                  <button
                    type="button"
                    disabled={isInventoryLocked}
                    onClick={() => setSelectedStockType('necessidade')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      selectedStockType === 'necessidade'
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Necessidade
                  </button>
                </div>
              </div>

              {/* Materials list based on selectedStockType */}
              {products.length === 0 ? (
                <div className="text-center py-6 text-gray-500 my-auto">
                  <p className="text-sm italic">Nenhum produto cadastrado no {activeDistributorName}.</p>
                  <p className="text-xs text-gray-400 mt-1">Siga para a Central de Cadastros para incluir os materiais.</p>
                </div>
              ) : (
                <div className="space-y-4 my-auto w-full">
                  {selectedStockType === 'fisico' ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-orange-800 flex items-center gap-1">
                          ESTOQUE FÍSICO ATUAL
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Quantidade</span>
                      </div>

                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {products.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-3 bg-orange-100/30 border border-orange-200/50 rounded-xl hover:border-orange-300 transition-all shadow-3xs"
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-800 truncate max-w-[185px] uppercase">{p.description}</span>
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{p.code}</span>
                            </div>
                            <span className="text-xs font-extrabold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg whitespace-nowrap">
                              {p.initialStock.toLocaleString('pt-BR')} <span className="text-[9px] font-medium text-orange-400">{p.unit}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 w-full flex flex-col justify-between h-full">
                      <div className="space-y-3 w-full">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-sky-800 flex items-center gap-1">
                            NECESSIDADE CADASTRADA
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase"></span>
                        </div>

                        <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-3xs max-h-72 overflow-y-auto">
                          <table className="w-full text-left text-[10px] border-collapse min-w-[320px]">
                            <thead>
                              <tr className="bg-slate-50 border-b border-gray-200 text-gray-500 font-extrabold uppercase tracking-wider text-[9px] sticky top-0 z-10">
                                <th className="py-1.5 px-2">Material</th>
                                <th className="py-1.5 px-2 text-center">Necessidade</th>
                                <th className="py-1.5 px-2 text-center">Saldo Total</th>
                                <th className="py-1.5 px-2 text-center">Diferença</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {products.map((p) => {
                                const necessity = p.necessityQty || 0;
                                const armazem = p.initialStock;
                                const transporte = (activeTransports || []).reduce((sum, trp) => sum + (trp.stock?.[p.id]?.veiculo || 0), 0);
                                const prodLoja = clients.reduce((sum, c) => {
                                  if (c.productBalances && c.productBalances[p.id] !== undefined) {
                                    return sum + (c.productBalances[p.id] || 0);
                                  }
                                  const pIdx = products.findIndex(prod => prod.id === p.id);
                                  const pct = pIdx === 0 ? 0.5 : pIdx === 1 ? 0.35 : pIdx === 2 ? 0.15 : 0;
                                  return sum + Math.floor((c.saldoLoja || 0) * pct);
                                }, 0);
                                const physical = armazem + transporte + prodLoja;
                                const diff = physical - necessity;

                                return (
                                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-1.5 px-2 font-semibold text-slate-800">
                                      <div className="font-bold text-slate-800 uppercase text-[10px] leading-tight">{p.description}</div>
                                    </td>
                                    <td className="py-1.5 px-2 text-center font-bold text-blue-900">
                                      {necessity.toLocaleString('pt-BR')}
                                    </td>
                                    <td className="py-1.5 px-2 text-center font-bold text-orange-600 bg-orange-50/25">
                                      {physical.toLocaleString('pt-BR')}
                                    </td>
                                    <td className={`py-1.5 px-2 text-center font-extrabold ${diff < 0 ? 'text-red-600 bg-red-50/20' : 'text-emerald-600 bg-emerald-50/20'}`}>
                                      {diff > 0 ? `+${diff.toLocaleString('pt-BR')}` : diff.toLocaleString('pt-BR')}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex justify-end mt-4">
                        <button
                          type="button"
                          onClick={() => setIsDetailedViewOpen(true)}
                          className="px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          Visão Detalhada
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: TRANSPORTE and SALDO EM LOJA */}
            <div className="flex flex-col gap-4 justify-between min-w-0 lg:max-w-[80%] w-full">
              {/* Transporte */}
              <div className={`border rounded-xl p-4 text-left flex flex-col justify-start h-full min-h-[140px] relative transition-all ${
                isInventoryLocked
                  ? 'bg-gray-150 border-gray-300 text-gray-400 opacity-60 select-none pointer-events-none'
                  : 'bg-blue-50 border-blue-500'
              }`}>
                {/* + and - Circles on left border line with reduced spacing */}
                <div className={`absolute -left-2.5 top-[43%] -translate-y-1/2 z-10 w-5 h-5 flex items-center justify-center rounded-full ${isInventoryLocked ? 'bg-gray-400 text-white' : 'bg-blue-600 text-white'} border border-white shadow-xs font-black text-[10px]`}>
                  +
                </div>
                <div className={`absolute -left-2.5 top-[57%] -translate-y-1/2 z-10 w-5 h-5 flex items-center justify-center rounded-full ${isInventoryLocked ? 'bg-gray-400 text-white' : 'bg-blue-600 text-white'} border border-white shadow-xs font-black text-[10px]`}>
                  -
                </div>
                
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-100 flex-shrink-0">
                  <button
                    type="button"
                    disabled={isInventoryLocked}
                    onClick={() => setViewingAllTransportsReport(true)}
                    className={`flex items-center gap-1.5 transition-colors ${
                      isInventoryLocked 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-blue-600 hover:text-blue-800 cursor-pointer group'
                    }`}
                    title={isInventoryLocked ? "Bloqueado por inventário" : "Clique para abrir relatório geral de transportes ativos"}
                  >
                    <span className={`material-symbols-outlined text-[18px] p-1.5 rounded-lg ${isInventoryLocked ? 'bg-gray-200 text-gray-400' : 'bg-blue-100 text-blue-600'} transition-transform`}>local_shipping</span>
                    <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1 ${isInventoryLocked ? 'text-gray-400' : 'text-blue-800'}`}>
                      Transporte
                      {isInventoryLocked && (
                        <span className="bg-red-100 text-red-600 border border-red-200 text-[9px] px-1 py-0.5 rounded font-extrabold normal-case animate-pulse flex items-center gap-0.5">
                          <span>🔒</span> Bloq.
                        </span>
                      )}
                    </span>
                  </button>
                  {(() => {
                    const openTransportsCount = (activeTransports || []).filter(t => 
                      t.statusTransporte === 'CRIADO' || 
                      t.statusTransporte === 'EM_ENTREGA' || 
                      t.statusTransporte === 'EM_LIQUIDACAO'
                    ).length;
                    return openTransportsCount > 0 ? (
                      <span className={`${isInventoryLocked ? 'bg-gray-400' : 'bg-blue-600'} text-white text-[12px] font-black px-1.5 py-0.5 rounded-full`}>
                        {openTransportsCount}
                      </span>
                    ) : null;
                  })()}
                </div>

                {(() => {
                  const productsWithTransport = products.map(p => {
                    const totalQty = (activeTransports || []).reduce((sum, trp) => {
                      return sum + (trp.stock?.[p.id]?.veiculo || 0);
                    }, 0);
                    return { ...p, totalQty };
                  });

                  if (products.length > 0) {
                    return (
                      <div className="flex-1 max-h-[140px] overflow-y-auto pr-1">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-blue-200 text-slate-500 uppercase font-black text-[9px] tracking-wider">
                              <th className="pb-1 text-left">Descrição do Produto</th>
                              <th className="pb-1 text-right">QTDE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productsWithTransport.map((p) => (
                              <tr 
                                key={p.id} 
                                className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors"
                              >
                                <td className="py-0.5 text-[10px] font-extrabold text-slate-700 uppercase truncate max-w-[145px]" title={p.description}>
                                  {p.description}
                                </td>
                                <td className={`py-0.5 text-right text-[10px] font-black whitespace-nowrap ${isInventoryLocked ? 'text-gray-400' : 'text-blue-700'}`}>
                                  {p.totalQty.toLocaleString('pt-BR')}{' '}
                                  <span className={`text-[8px] font-medium ${isInventoryLocked ? 'text-gray-400' : 'text-blue-400'}`}>{p.unit}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  } else {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
                        <p className={`text-[10px] font-bold italic ${isInventoryLocked ? 'text-gray-400' : 'text-blue-500'}`}>Aguardando novos transportes</p>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Saldo em Loja */}
              <div className={`border rounded-xl p-4 text-left flex flex-col justify-start h-full min-h-[237px] relative transition-all ${
                isInventoryLocked
                  ? 'bg-gray-150 border-gray-300 text-gray-400 opacity-60 select-none pointer-events-none'
                  : 'bg-purple-50 border-purple-500'
              }`}>
                {/* + and - Circles on top border line with reduced spacing */}
                <div className={`absolute left-[47%] -top-2.5 -translate-x-1/2 z-10 w-5 h-5 flex items-center justify-center rounded-full ${isInventoryLocked ? 'bg-gray-400 text-white' : 'bg-purple-600 text-white'} border border-white shadow-xs font-black text-[10px]`}>
                  +
                </div>
                <div className={`absolute left-[53%] -top-2.5 -translate-x-1/2 z-10 w-5 h-5 flex items-center justify-center rounded-full ${isInventoryLocked ? 'bg-gray-400 text-white' : 'bg-purple-600 text-white'} border border-white shadow-xs font-black text-[10px]`}>
                  -
                </div>
                
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-100 flex-shrink-0">
                  <div className={`flex items-center gap-1.5 ${isInventoryLocked ? 'text-gray-400' : 'text-purple-600'}`}>
                    <span className={`material-symbols-outlined text-[18px] p-1.5 rounded-lg ${isInventoryLocked ? 'bg-gray-200 text-gray-400' : 'bg-purple-100'}`}>storefront</span>
                    <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1 ${isInventoryLocked ? 'text-gray-400' : 'text-purple-800'}`}>
                      Saldo em Loja
                      {isInventoryLocked && (
                        <span className="bg-red-100 text-red-600 border border-red-200 text-[9px] px-1 py-0.5 rounded font-extrabold normal-case animate-pulse flex items-center gap-0.5">
                          <span>🔒</span> Bloq.
                        </span>
                      )}
                    </span>
                  </div>

                </div>

                {(() => {
                  const productsWithStore = products.map((p) => {
                    const totalQty = clients.reduce((sum, c) => {
                      if (c.productBalances && c.productBalances[p.id] !== undefined) {
                        return sum + (c.productBalances[p.id] || 0);
                      }
                      const pIdx = products.findIndex(prod => prod.id === p.id);
                      const pct = pIdx === 0 ? 0.5 : pIdx === 1 ? 0.35 : pIdx === 2 ? 0.15 : 0;
                      return sum + Math.floor((c.saldoLoja || 0) * pct);
                    }, 0);
                    return { ...p, totalQty };
                  });

                  if (products.length > 0) {
                    return (
                      <div className="flex-1 max-h-[237px] overflow-y-auto pr-1">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-purple-200 text-slate-500 uppercase font-black text-[9px] tracking-wider">
                              <th className="pb-1 text-left">Descrição do Produto</th>
                              <th className="pb-1 text-right">QTDE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productsWithStore.map((p) => (
                              <tr 
                                key={p.id} 
                                className="border-b border-gray-100 hover:bg-purple-50/50 transition-colors"
                              >
                                <td className="py-0.5 text-[10px] font-extrabold text-slate-700 uppercase truncate max-w-[145px]" title={p.description}>
                                  {p.description}
                                </td>
                                <td className="py-0.5 text-right text-[10px] font-black text-purple-700 whitespace-nowrap">
                                  {p.totalQty.toLocaleString('pt-BR')}{' '}
                                  <span className="text-[8px] font-medium text-purple-400">{p.unit}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  } else {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
                        <p className="text-[10px] text-purple-500 font-bold italic">Sem produtos cadastrados</p>
                      </div>
                    );
                  }
                })()}

                {/* Inventário em Loja Button (ROXO VIVO) */}
                {userRole !== 'Logístico' && userRole !== 'Conferencia' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAjusteClienteOpen(true);
                    }}
                    className="w-full mt-3 py-2 px-3 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg shadow-2xs hover:shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer pointer-events-auto"
                  >
                    <span className="material-symbols-outlined text-[13px]">edit_note</span>
                    Inventário em Loja
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* VERIFICAÇÕES */}
      <section className="bg-white border-2 border-gray-500 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-6 gap-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-left flex items-center justify-start gap-3">
            <span className="material-symbols-outlined text-indigo-600" style={{ fontSize: '33.6px' }}>verified</span>
            <span>VERIFICAÇÕES TEMPOTÁRIAS - EXCLUIR DEPOIS</span>
          </h4>

          <div className="flex items-center gap-3 flex-wrap">
            {showZerarSuccess && (
              <div className="px-3 py-1.5 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-800 text-[11px] font-bold flex items-center gap-2 animate-in fade-in duration-300">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                <span>Saldos zerados e estornados ao armazém!</span>
                <button type="button" onClick={() => setShowZerarSuccess(false)} className="hover:text-emerald-950 font-black ml-1">×</button>
              </div>
            )}

            {!showConfirmZerar ? (
              <button
                type="button"
                onClick={() => {
                  setShowConfirmZerar(true);
                  setShowZerarSuccess(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-black uppercase rounded-lg shadow-xs hover:shadow-sm transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>Zerar Saldos em Transporte</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 p-2 rounded-xl animate-in zoom-in-95 duration-200">
                <span className="text-[10px] font-black text-red-800 uppercase px-2">Confirmar Zerar?</span>
                <button
                  type="button"
                  onClick={() => {
                    zerarSaldosEmTransporte();
                    setShowConfirmZerar(false);
                    setShowZerarSuccess(true);
                    setTimeout(() => setShowZerarSuccess(false), 5000);
                  }}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase rounded-lg transition-all"
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmZerar(false)}
                  className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-slate-700 text-[10px] font-black uppercase rounded-lg transition-all"
                >
                  Não
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* VERIFICAR TRANSPORTES */}
          <div className="border-2 border-indigo-500 bg-indigo-50/5 rounded-2xl p-5 md:p-6 shadow-3xs flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2.5 border-b border-indigo-100 pb-4 mb-4">
                <span className="material-symbols-outlined text-indigo-600 bg-indigo-50 p-1.5 rounded-lg">local_shipping</span>
                <h5 className="text-sm font-black text-slate-800 uppercase">VERIFICAR TRANSPORTES</h5>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-xs italic">Nenhum produto cadastrado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-indigo-50 border-b border-indigo-200 text-indigo-900 font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="py-2 px-3 text-left">Descrição de Material</th>
                        <th className="py-2 px-3 text-right">Veículo</th>
                        <th className="py-2 px-3 text-right">Entrega</th>
                        <th className="py-2 px-3 text-right">Coleta</th>
                        <th className="py-2 px-3 text-right">Cliente</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-100 text-xs text-slate-700 bg-white">
                      {products.map((p) => {
                        const veiculoSum = (activeTransports || []).reduce((sum, trp) => sum + (trp.stock?.[p.id]?.veiculo || 0), 0);
                        const entregaSum = (activeTransports || []).reduce((sum, trp) => sum + (trp.stock?.[p.id]?.entrega || 0), 0);
                        const coletaSum = (activeTransports || []).reduce((sum, trp) => sum + (trp.stock?.[p.id]?.coleta || 0), 0);
                        const clienteSum = (activeTransports || []).reduce((sum, trp) => sum + (trp.stock?.[p.id]?.cliente || 0), 0);
                        const rowTotal = veiculoSum + coletaSum + clienteSum;

                        return (
                          <tr key={p.id} className="hover:bg-indigo-50/20 transition-colors">
                            <td className="py-2 px-3 font-semibold uppercase truncate max-w-[150px]" title={p.description}>
                              {p.description}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                              {veiculoSum.toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                              {entregaSum.toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                              {coletaSum.toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                              {clienteSum.toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-black text-indigo-700">
                              {rowTotal.toLocaleString('pt-BR')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      {(() => {
                        const totalVeiculo = products.reduce((sum, p) => sum + (activeTransports || []).reduce((s, t) => s + (t.stock?.[p.id]?.veiculo || 0), 0), 0);
                        const totalEntrega = products.reduce((sum, p) => sum + (activeTransports || []).reduce((s, t) => s + (t.stock?.[p.id]?.entrega || 0), 0), 0);
                        const totalColeta = products.reduce((sum, p) => sum + (activeTransports || []).reduce((s, t) => s + (t.stock?.[p.id]?.coleta || 0), 0), 0);
                        const totalCliente = products.reduce((sum, p) => sum + (activeTransports || []).reduce((s, t) => s + (t.stock?.[p.id]?.cliente || 0), 0), 0);
                        const totalGeral = totalVeiculo + totalColeta + totalCliente;

                        return (
                          <tr className="bg-indigo-50/70 border-t-2 border-indigo-200 text-xs font-black text-slate-900 font-mono">
                            <td className="py-2.5 px-3 text-left font-sans uppercase">Total</td>
                            <td className="py-2.5 px-3 text-right">{totalVeiculo.toLocaleString('pt-BR')}</td>
                            <td className="py-2.5 px-3 text-right">{totalEntrega.toLocaleString('pt-BR')}</td>
                            <td className="py-2.5 px-3 text-right">{totalColeta.toLocaleString('pt-BR')}</td>
                            <td className="py-2.5 px-3 text-right">{totalCliente.toLocaleString('pt-BR')}</td>
                            <td className="py-2.5 px-3 text-right text-indigo-800">{totalGeral.toLocaleString('pt-BR')}</td>
                          </tr>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* VERIFICAR CLIENTE */}
          <div className="border-2 border-purple-500 bg-purple-50/5 rounded-2xl p-5 md:p-6 shadow-3xs flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2.5 border-b border-purple-100 pb-4 mb-4">
                <span className="material-symbols-outlined text-purple-600 bg-purple-50 p-1.5 rounded-lg">people</span>
                <h5 className="text-sm font-black text-slate-800 uppercase">VERIFICAR CLIENTE</h5>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-xs italic">Nenhum produto cadastrado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-purple-50 border-b border-purple-200 text-purple-900 font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="py-2 px-3 text-left">Descrição de Material</th>
                        <th className="py-2 px-3 text-right">Contagem</th>
                        <th className="py-2 px-3 text-right">Loja</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-100 text-xs text-slate-700 bg-white">
                      {products.map((p) => {
                        const totalLojaLocal = clients.reduce((acc, c) => acc + (c.saldoLoja || 0), 0);
                        const totalContagemLocal = clients.reduce((acc, c) => acc + (c.saldoContagem || 0), 0);

                        const prodLoja = clients.reduce((acc, c) => {
                          if (c.productBalances && c.productBalances[p.id] !== undefined) {
                            return acc + (c.productBalances[p.id] || 0);
                          }
                          const pIdx = products.findIndex(prod => prod.id === p.id);
                          const pct = pIdx === 0 ? 0.5 : pIdx === 1 ? 0.35 : pIdx === 2 ? 0.15 : 0;
                          return acc + Math.floor((c.saldoLoja || 0) * pct);
                        }, 0);

                        const pIdx = products.findIndex(prod => prod.id === p.id);
                        let prodContagem = 0;
                        if (products.length > 0) {
                          if (pIdx === 0) {
                            prodContagem = Math.floor(totalContagemLocal * 0.5);
                          } else if (pIdx === 1) {
                            prodContagem = Math.floor(totalContagemLocal * 0.3);
                          } else if (pIdx === 2) {
                            prodContagem = Math.floor(totalContagemLocal * 0.1);
                          } else {
                            const remainingPct = 0.1 / Math.max(1, products.length - 3);
                            prodContagem = Math.floor(totalContagemLocal * remainingPct);
                          }
                        }

                        const rowTotal = prodContagem + prodLoja;

                        return (
                          <tr key={p.id} className="hover:bg-purple-50/20 transition-colors">
                            <td className="py-2 px-3 font-semibold uppercase truncate max-w-[150px]" title={p.description}>
                              {p.description}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                              {prodContagem.toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                              {prodLoja.toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-black text-purple-700">
                              {rowTotal.toLocaleString('pt-BR')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      {(() => {
                        const totalContagemLocal = clients.reduce((acc, c) => acc + (c.saldoContagem || 0), 0);

                        let sumLoja = 0;
                        let sumContagem = 0;

                        products.forEach((p, idx) => {
                          const prodLoja = clients.reduce((acc, c) => {
                            if (c.productBalances && c.productBalances[p.id] !== undefined) {
                              return acc + (c.productBalances[p.id] || 0);
                            }
                            const pIdx = products.findIndex(prod => prod.id === p.id);
                            const pct = pIdx === 0 ? 0.5 : pIdx === 1 ? 0.35 : pIdx === 2 ? 0.15 : 0;
                            return acc + Math.floor((c.saldoLoja || 0) * pct);
                          }, 0);
                          sumLoja += prodLoja;

                          if (idx === 0) {
                            sumContagem += Math.floor(totalContagemLocal * 0.5);
                          } else if (idx === 1) {
                            sumContagem += Math.floor(totalContagemLocal * 0.3);
                          } else if (idx === 2) {
                            sumContagem += Math.floor(totalContagemLocal * 0.1);
                          } else {
                            const remainingPct = 0.1 / Math.max(1, products.length - 3);
                            sumContagem += Math.floor(totalContagemLocal * remainingPct);
                          }
                        });

                        const totalGeral = sumContagem + sumLoja;

                        return (
                          <tr className="bg-purple-50/70 border-t-2 border-purple-200 text-xs font-black text-slate-900 font-mono">
                            <td className="py-2.5 px-3 text-left font-sans uppercase">Total</td>
                            <td className="py-2.5 px-3 text-right">{sumContagem.toLocaleString('pt-BR')}</td>
                            <td className="py-2.5 px-3 text-right">{sumLoja.toLocaleString('pt-BR')}</td>
                            <td className="py-2.5 px-3 text-right text-purple-800">{totalGeral.toLocaleString('pt-BR')}</td>
                          </tr>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Registrar Entrada via NF Modal */}
      {isEntradaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="bg-[#ecfbf6] w-full max-w-4xl rounded-2xl overflow-hidden border border-green-300 shadow-2xl flex flex-col max-h-[90vh] my-8">
            
            {/* Header bar */}
            <div className="bg-[#00c0a3] px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center gap-2">
                <GreenTruckSVG className="w-5 h-5 text-white" />
                <h3 className="text-base font-black uppercase tracking-wider">Registrar Entrada via NF</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsEntradaModalOpen(false)}
                className="text-white hover:text-black/70 transition-colors p-1 rounded-full hover:bg-white/20 flex items-center justify-center"
              >
                <span className="material-symbols-outlined font-bold text-xl">close</span>
              </button>
            </div>

            {/* Warning Message Banner */}
            {warningMessage && (
              <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-6 py-3 flex items-center gap-2 animate-in slide-in-from-top duration-300 flex-shrink-0">
                <span className="material-symbols-outlined text-amber-650 font-black text-lg">warning</span>
                <span className="text-xs font-black uppercase tracking-wide">{warningMessage}</span>
              </div>
            )}

            <form onSubmit={handleRegisterNF} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              
              {/* Row 1: NF Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-black text-emerald-855 uppercase tracking-wider mb-1.5">
                    Número da NF <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nfNumber}
                    onChange={e => setNfNumber(e.target.value)}
                    className="w-full bg-white border border-emerald-500 rounded-lg p-2 text-sm text-slate-800 font-bold focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-emerald-855 uppercase tracking-wider mb-1.5">
                    Data de Lançamento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={nfDate}
                    onChange={e => setNfDate(e.target.value)}
                    className="w-full bg-white border border-emerald-500 rounded-lg p-2 text-sm text-slate-800 font-bold focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-emerald-855 uppercase tracking-wider mb-1.5">
                    Origem / Fornecedor <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedSupplier}
                    onChange={e => setSelectedSupplier(e.target.value)}
                    className="w-full bg-white border border-emerald-500 rounded-lg p-2 text-sm text-slate-800 font-bold focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
                  >
                    <option value="">Selecione um Fornecedor (Obrigatório)...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.razaoSocial}>
                        {s.razaoSocial}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Quantities table & Responsibility info */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left side (cols 8): Informar a Quantidade Recebida */}
                <div className="lg:col-span-8 bg-white border border-emerald-500/30 rounded-xl p-4 shadow-3xs flex flex-col">
                  <h4 className="text-xs font-black text-emerald-855 uppercase tracking-wider mb-3 pb-2 border-b border-emerald-100 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">inventory_2</span>
                    Informar a Quantidade Recebida
                  </h4>
                  
                  {products.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">
                      {"Nenhum produto cadastrado para receber. Cadastre primeiro em 'Central de Cadastros'."}
                    </p>
                  ) : (
                    <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-emerald-50 text-emerald-900 text-[10px] font-black uppercase tracking-wider border-b border-emerald-200">
                            <th className="py-2.5 px-3">Código</th>
                            <th className="py-2.5 px-3">Material / Descrição</th>
                            <th className="py-2.5 px-3 text-center">UNIDADE</th>
                            <th className="py-2.5 px-3 text-center w-28">Quantidade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-100 text-xs text-slate-700">
                          {products.map(p => (
                            <tr key={p.id} className="hover:bg-emerald-50/20">
                              <td className="py-2 px-3 font-mono font-bold text-emerald-700">{p.code}</td>
                              <td className="py-2 px-3 font-semibold uppercase">{p.description}</td>
                              <td className="py-2 px-3 text-center font-bold text-slate-500">{p.unit}</td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={quantities[p.id] !== undefined ? quantities[p.id] : ''}
                                  onChange={e => handleQtyChange(p.id, e.target.value)}
                                  className="w-20 bg-white border border-emerald-500 rounded-lg p-1 text-center font-black text-slate-800 text-xs focus:ring-1 focus:ring-emerald-400 focus:outline-hidden"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Right side (cols 4): Responsible & Observations */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                  <div>
                    <label className="block text-xs font-black text-emerald-855 uppercase tracking-wider mb-1.5">
                      Responsável pelo Lançamento
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={getLoggedInUserName() || 'Marta TI'}
                      className="w-full bg-emerald-50 border border-emerald-500 rounded-lg p-2 text-sm text-slate-600 font-bold cursor-not-allowed"
                    />
                  </div>

                  <div className="flex-1 flex flex-col">
                    <label className="block text-xs font-black text-emerald-855 uppercase tracking-wider mb-1.5">
                      Observação Adicional
                    </label>
                    <textarea
                      placeholder="Alguma observação importante sobre o recebimento..."
                      value={observation}
                      onChange={e => setObservation(e.target.value)}
                      rows={4}
                      className="w-full flex-1 bg-white border border-emerald-500 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-400 focus:outline-hidden resize-none"
                    />
                  </div>
                </div>

              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-emerald-200 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEntradaModalOpen(false)}
                  className="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={suppliers.length === 0 || products.length === 0}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider text-white shadow-md transition-all ${
                    suppliers.length === 0 || products.length === 0
                      ? 'bg-emerald-300 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 active:scale-95'
                  }`}
                >
                  Registrar NF
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

        {/* Visualizar Carga de Transporte Modal */}
        {viewingTransport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white w-full max-w-3xl rounded-2xl overflow-hidden border border-blue-200 shadow-2xl flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-xl">zoom_in</span>
                  <h3 className="text-sm font-black uppercase tracking-wider">
                    Detalhamento da Carga • {viewingTransport.number}
                  </h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setViewingTransport(null)}
                  className="text-white hover:text-black/70 transition-colors p-1 rounded-full hover:bg-white/20 flex items-center justify-center"
                >
                  <span className="material-symbols-outlined font-bold text-lg">close</span>
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50 text-xs">
                {/* Summary details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3.5 border border-gray-200 rounded-xl">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Data Lançamento</p>
                    <p className="font-extrabold text-slate-800 text-[13px] mt-0.5">{viewingTransport.date}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Placa Veículo</p>
                    <p className="font-extrabold text-blue-600 text-[13px] mt-0.5">{viewingTransport.placa}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Motorista Autorizado</p>
                    <p className="font-extrabold text-slate-800 text-[13px] mt-0.5 truncate" title={viewingTransport.driver}>
                      {viewingTransport.driver}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Rota Lançada</p>
                    <p className="font-extrabold text-blue-700 text-[13px] mt-0.5 truncate" title={viewingTransport.route}>
                      {viewingTransport.route}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Products */}
                  <div className="bg-white border border-gray-200 rounded-xl shadow-3xs overflow-hidden flex flex-col">
                    <div className="bg-slate-100 px-3 py-2 border-b border-gray-200 font-bold text-slate-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">inventory_2</span>
                      <span>Materiais Carregados no Veículo</span>
                    </div>
                    <div className="p-3 divide-y divide-gray-100 overflow-y-auto max-h-56">
                      {products.map(p => {
                        const qty = viewingTransport.stock?.[p.id]?.veiculo || 0;
                        if (qty === 0) return null;
                        return (
                          <div key={p.id} className="py-2 flex items-center justify-between">
                            <div>
                              <p className="font-extrabold text-slate-800 uppercase">{p.description}</p>
                              <p className="text-[9px] text-gray-400 font-medium font-mono uppercase">CÓD: {p.code}</p>
                            </div>
                            <span className="bg-blue-50 border border-blue-200 text-blue-700 font-black px-2 py-0.5 rounded-md text-[11px]">
                              {qty} {p.unit}
                            </span>
                          </div>
                        );
                      })}
                      {Object.values(viewingTransport.stock || {}).every((s: any) => s.veiculo === 0) && (
                        <p className="text-center italic text-gray-400 py-4">Nenhum material carregado.</p>
                      )}
                    </div>
                  </div>

                  {/* Clients */}
                  <div className="bg-white border border-gray-200 rounded-xl shadow-3xs overflow-hidden flex flex-col">
                    <div className="bg-slate-100 px-3 py-2 border-b border-gray-200 font-bold text-slate-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">groups</span>
                      <span>Clientes Atendidos ({viewingTransport.selectedClientIds?.length || 0})</span>
                    </div>
                    <div className="p-3 space-y-2 overflow-y-auto max-h-56">
                      {(viewingTransport.selectedClientIds || []).map((cid: string) => {
                        const c = clients.find(cl => cl.id === cid);
                        if (!c) return null;
                        return (
                          <div key={c.id} className="p-2 border border-slate-100 rounded-lg bg-slate-50/50">
                            <p className="font-extrabold text-slate-800 uppercase">{c.razaoSocial}</p>
                            <p className="text-[9px] text-gray-400 mt-0.5 uppercase">Matrícula: {c.matricula} • {c.cidade}</p>
                          </div>
                        );
                      })}
                      {(!viewingTransport.selectedClientIds || viewingTransport.selectedClientIds.length === 0) && (
                        <p className="text-center italic text-gray-400 py-4">Nenhum cliente associado.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 border-t border-gray-200 px-6 py-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingTransport(null)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl uppercase tracking-wider transition-all shadow-3xs cursor-pointer text-xs"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Relatório de Transportes Ativos por Produto */}
        {viewingProductTransportsReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden border border-blue-200 shadow-2xl flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="bg-blue-600 px-5 py-4 flex items-center justify-between text-white flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-xl">assignment_turned_in</span>
                  <h3 className="text-xs font-black uppercase tracking-wider">
                    Relatório de Transportes Ativos
                  </h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setViewingProductTransportsReport(null)}
                  className="text-white hover:text-black/70 transition-colors p-1 rounded-full hover:bg-white/20 flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined font-bold text-lg">close</span>
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between shadow-4xs">
                  <div className="min-w-0">
                    <p className="text-[10px] text-blue-500 font-extrabold uppercase tracking-widest">Produto Selecionado</p>
                    <p className="font-extrabold text-slate-800 text-[13px] uppercase mt-0.5 truncate">{viewingProductTransportsReport.description}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">CÓDIGO: {viewingProductTransportsReport.code}</p>
                  </div>
                  <span className="bg-blue-600 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-3xs">
                    {(activeTransports || []).reduce((sum, t) => sum + (t.stock?.[viewingProductTransportsReport.id]?.veiculo || 0), 0).toLocaleString('pt-BR')} {viewingProductTransportsReport.unit}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Breakdown por Transporte Ativo</p>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {(() => {
                      const transportsWithProduct = (activeTransports || []).filter(t => {
                        const qty = t.stock?.[viewingProductTransportsReport.id]?.veiculo || 0;
                        return qty > 0;
                      });

                      if (transportsWithProduct.length === 0) {
                        return (
                          <div className="bg-white border border-gray-150 p-6 rounded-xl text-center text-xs text-gray-400 italic">
                            Nenhum transporte ativo com carga deste produto.
                          </div>
                        );
                      }

                      return transportsWithProduct.map(t => {
                        const qty = t.stock?.[viewingProductTransportsReport.id]?.veiculo || 0;
                        return (
                          <div key={t.id} className="bg-white border border-gray-150 rounded-xl p-3 flex items-center justify-between shadow-4xs hover:border-blue-200 transition-all">
                            <div className="flex flex-col text-xs min-w-0 pr-2">
                              <span className="font-extrabold text-slate-800">{t.number} • <span className="text-blue-600">{t.route}</span></span>
                              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">Placa: {t.placa} • {t.driver}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="bg-blue-50 text-blue-700 font-black text-xs px-2 py-1 rounded-lg">
                                {qty.toLocaleString('pt-BR')} {viewingProductTransportsReport.unit}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setViewingProductTransportsReport(null);
                                  setViewingTransport(t);
                                }}
                                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-4xs flex items-center gap-1"
                              >
                                Detalhar
                                <span className="material-symbols-outlined text-[10px] font-bold">arrow_forward</span>
                              </button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-100 border-t border-gray-200 px-5 py-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingProductTransportsReport(null)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-150 text-slate-700 font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer text-[10px]"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Relatório Geral de Transportes Ativos */}
        {viewingAllTransportsReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white w-full max-w-5xl rounded-2xl overflow-hidden border border-blue-200 shadow-2xl flex flex-col h-[92vh] my-4">
              {/* Header */}
              <div className="bg-blue-600 px-5 py-4 flex items-center justify-between text-white flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-xl">assignment_turned_in</span>
                  <h3 className="text-xs font-black uppercase tracking-wider">
                    Relatório Geral de Transportes Ativos
                  </h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setViewingAllTransportsReport(false)}
                  className="text-white hover:text-black/70 transition-colors p-1 rounded-full hover:bg-white/20 flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined font-bold text-lg">close</span>
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50">
                {(() => {
                  const allowedStatuses = ['CRIADO', 'EM_ENTREGA', 'EM_LIQUIDACAO'];
                  const filteredTransports = (activeTransports || []).filter(t => 
                    allowedStatuses.includes(t.statusTransporte)
                  );

                  const statusPriority: { [key: string]: number } = {
                    'EM_LIQUIDACAO': 1,
                    'EM_ENTREGA': 2,
                    'CRIADO': 3
                  };

                  const sortedTransports = [...filteredTransports].sort((a, b) => {
                    const priorityA = statusPriority[a.statusTransporte] || 99;
                    const priorityB = statusPriority[b.statusTransporte] || 99;
                    return priorityA - priorityB;
                  });

                  const getRouteNumber = (routeStr: string) => {
                    const match = routeStr.match(/\d+/);
                    return match ? match[0] : routeStr;
                  };

                  const getStatusLabel = (status: string) => {
                    switch (status) {
                      case 'CRIADO':
                        return { text: 'Criado', color: 'bg-blue-100 text-blue-800 border-blue-250' };
                      case 'EM_ENTREGA':
                        return { text: 'Em Entrega', color: 'bg-amber-100 text-amber-800 border-amber-250' };
                      case 'EM_LIQUIDACAO':
                        return { text: 'Em Liquidação', color: 'bg-purple-100 text-purple-800 border-purple-250' };
                      default:
                        return { text: status, color: 'bg-slate-100 text-slate-800 border-slate-250' };
                    }
                  };

                  return (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between shadow-4xs">
                        <div className="min-w-0">
                          <p className="text-[10px] text-blue-500 font-extrabold uppercase tracking-widest">Resumo Operacional</p>
                          <p className="font-extrabold text-slate-800 text-[13px] uppercase mt-0.5 truncate">Total de Veículos em Trânsito</p>
                        </div>
                        <span className="bg-blue-600 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-3xs">
                          {filteredTransports.length} Veículo(s)
                        </span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Tabela de Transportes</p>
                        
                        {sortedTransports.length === 0 ? (
                          <div className="bg-white border border-gray-150 p-6 rounded-xl text-center text-xs text-gray-400 italic">
                            Nenhum transporte ativo em execução no momento.
                          </div>
                        ) : (
                          <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-4xs">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-100 border-b border-gray-200 font-extrabold uppercase text-slate-750 tracking-wider">
                                  <th className="py-2.5 px-3">Nº Transp.</th>
                                  <th className="py-2.5 px-3">Placa</th>
                                  <th className="py-2.5 px-3">Motorista</th>
                                  <th className="py-2.5 px-3 text-center">Rota</th>
                                  <th className="py-2.5 px-2 text-center text-slate-600 bg-slate-50/50">Total</th>
                                  <th className="py-2.5 px-2 text-center text-green-700 bg-green-50/30">Entr.</th>
                                  <th className="py-2.5 px-2 text-center text-red-700 bg-red-50/30">Não Entr.</th>
                                  <th className="py-2.5 px-2 text-center text-amber-700 bg-amber-50/30">Pendente</th>
                                  <th className="py-2.5 px-2 text-center text-sky-700 bg-sky-50/30">Retirado</th>
                                  <th className="py-2.5 px-3 text-center">Status</th>
                                  <th className="py-2.5 px-3 text-center">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-150">
                                {sortedTransports.map((t) => {
                                  const routeNum = getRouteNumber(t.route);
                                  const statusInfo = getStatusLabel(t.statusTransporte);
                                  
                                  return (
                                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                                      <td className="py-3 px-3 font-bold text-slate-800">{t.number}</td>
                                      <td className="py-3 px-3 font-mono text-[11px] text-slate-700">{t.placa}</td>
                                      <td className="py-3 px-3 font-semibold text-slate-700 truncate max-w-[120px]" title={t.driver}>{t.driver}</td>
                                      <td className="py-3 px-3 text-center font-bold text-slate-800">{routeNum}</td>
                                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-600 bg-slate-50/30">{t.clienteTotal || 0}</td>
                                      <td className="py-3 px-2 text-center font-mono font-bold text-green-700 bg-green-50/10">{t.clienteEntregue || 0}</td>
                                      <td className="py-3 px-2 text-center font-mono font-bold text-red-700 bg-red-50/10">{t.clienteNaoEntregue || 0}</td>
                                      <td className="py-3 px-2 text-center font-mono font-bold text-amber-700 bg-amber-50/10">{t.clienteEmEntrega ?? 0}</td>
                                      <td className="py-3 px-2 text-center font-mono font-bold text-sky-700 bg-sky-50/10">{t.clientesRetirados || 0}</td>
                                      <td className="py-3 px-3 text-center">
                                        <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusInfo.color}`}>
                                          {statusInfo.text}
                                        </span>
                                      </td>
                                      <td className="py-3 px-3 text-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setViewingAllTransportsReport(false);
                                            setViewingTransport(t);
                                          }}
                                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-4xs flex items-center gap-1 mx-auto"
                                        >
                                          Detalhar
                                          <span className="material-symbols-outlined text-[10px] font-bold">arrow_forward</span>
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="bg-slate-100 border-t border-gray-200 px-5 py-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewingAllTransportsReport(false)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-150 text-slate-700 font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer text-[10px]"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Registrar Saída via NF Modal */}
      {isSaidaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="bg-[#fff5f5] w-full max-w-4xl rounded-2xl overflow-hidden border border-red-300 shadow-2xl flex flex-col max-h-[90vh] my-8">
            
            {/* Header bar */}
            <div className="bg-[#e53e3e] px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center gap-2">
                <RedTruckSVG className="w-5 h-5 text-white" />
                <h3 className="text-base font-black uppercase tracking-wider">Registrar Saída via NF</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsSaidaModalOpen(false)}
                className="text-white hover:text-black/70 transition-colors p-1 rounded-full hover:bg-white/20 flex items-center justify-center"
              >
                <span className="material-symbols-outlined font-bold text-xl">close</span>
              </button>
            </div>

            {/* Warning Message Banner */}
            {saidaWarningMessage && (
              <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-6 py-3 flex items-center gap-2 animate-in slide-in-from-top duration-300 flex-shrink-0">
                <span className="material-symbols-outlined text-amber-650 font-black text-lg">warning</span>
                <span className="text-xs font-black uppercase tracking-wide">{saidaWarningMessage}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSaidaNF} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              
              {/* Row 1: NF Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-black text-red-900 uppercase tracking-wider mb-1.5">
                    Número da NF <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={saidaNfNumber}
                    onChange={e => setSaidaNfNumber(e.target.value)}
                    className="w-full bg-white border border-red-500 rounded-lg p-2 text-sm text-slate-800 font-bold focus:ring-2 focus:ring-red-400 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-red-900 uppercase tracking-wider mb-1.5">
                    Data de Lançamento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={saidaNfDate}
                    onChange={e => setSaidaNfDate(e.target.value)}
                    className="w-full bg-white border border-red-500 rounded-lg p-2 text-sm text-slate-800 font-bold focus:ring-2 focus:ring-red-400 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-red-900 uppercase tracking-wider mb-1.5">
                    Destino <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedClient}
                    onChange={e => setSelectedClient(e.target.value)}
                    className="w-full bg-white border border-red-500 rounded-lg p-2 text-sm text-slate-800 font-bold focus:ring-2 focus:ring-red-400 focus:outline-hidden"
                  >
                    <option value="">Selecione um Fornecedor de Destino (Obrigatório)...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.razaoSocial}>
                        {s.razaoSocial}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Quantities table & Responsibility info */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left side (cols 8): Informar a Quantidade Enviada */}
                <div className="lg:col-span-8 bg-white border border-red-500/30 rounded-xl p-4 shadow-3xs flex flex-col">
                  <h4 className="text-xs font-black text-red-900 uppercase tracking-wider mb-3 pb-2 border-b border-red-100 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">inventory_2</span>
                    Informar a Quantidade Enviada
                  </h4>
                  
                  {products.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">
                      {"Nenhum produto cadastrado para receber. Cadastre primeiro em 'Central de Cadastros'."}
                    </p>
                  ) : (
                    <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-red-50 text-red-900 text-[10px] font-black uppercase tracking-wider border-b border-red-200">
                            <th className="py-2.5 px-3">Código</th>
                            <th className="py-2.5 px-3">Material / Descrição</th>
                            <th className="py-2.5 px-3 text-center">UNIDADE</th>
                            <th className="py-2.5 px-3 text-center w-28">Quantidade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100 text-xs text-slate-700">
                          {products.map(p => (
                            <tr key={p.id} className="hover:bg-red-50/20">
                              <td className="py-2 px-3 font-mono font-bold text-red-700">{p.code}</td>
                              <td className="py-2 px-3 font-semibold uppercase">{p.description}</td>
                              <td className="py-2 px-3 text-center font-bold text-slate-500">{p.unit}</td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={saidaQuantities[p.id] !== undefined ? saidaQuantities[p.id] : ''}
                                  onChange={e => handleSaidaQtyChange(p.id, e.target.value)}
                                  className="w-20 bg-white border border-red-500 rounded-lg p-1 text-center font-black text-slate-800 text-xs focus:ring-1 focus:ring-red-400 focus:outline-hidden"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Right side (cols 4): Responsible & Observations */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                  <div>
                    <label className="block text-xs font-black text-red-900 uppercase tracking-wider mb-1.5">
                      Responsável pelo Lançamento
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={getLoggedInUserName() || 'Marta TI'}
                      className="w-full bg-red-50 border border-red-500 rounded-lg p-2 text-sm text-slate-600 font-bold cursor-not-allowed"
                    />
                  </div>

                  <div className="flex-1 flex flex-col">
                    <label className="block text-xs font-black text-red-900 uppercase tracking-wider mb-1.5">
                      Observação Adicional
                    </label>
                    <textarea
                      placeholder="Alguma observação importante sobre a saída..."
                      value={saidaObservation}
                      onChange={e => setSaidaObservation(e.target.value)}
                      rows={4}
                      className="w-full flex-1 bg-white border border-red-500 rounded-lg p-2.5 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-red-400 focus:outline-hidden resize-none"
                    />
                  </div>
                </div>

              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-red-200 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSaidaModalOpen(false)}
                  className="px-5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={clients.length === 0 || products.length === 0}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider text-white shadow-md transition-all ${
                    clients.length === 0 || products.length === 0
                      ? 'bg-red-300 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 active:scale-95'
                  }`}
                >
                  Registrar NF
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Abrir Documento de Inventário Modal */}
      {isAbrirInventarioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-[#fef9c3] w-full max-w-2xl rounded-2xl overflow-hidden border-2 border-yellow-400 shadow-2xl flex flex-col animate-in scale-in duration-200">
            
            {/* Header with Bright Yellow Background */}
            <div className="bg-[#facc15] px-6 py-4 flex items-center justify-between text-slate-950 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-950 font-bold text-xl">edit_note</span>
                <h3 className="text-xs font-black uppercase tracking-widest">ABRIR DOCUMENTO DE INVENTÁRIO</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsAbrirInventarioOpen(false)}
                className="text-slate-950 hover:text-black/75 transition-colors p-1 rounded-full hover:bg-black/10 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined font-bold text-xl">close</span>
              </button>
            </div>

            {/* Content Body with light yellow background and inner outline box */}
            <div className="p-6 bg-[#fef9c3] flex flex-col gap-4">
              <div className="border border-[#eab308] rounded-2xl p-6 bg-yellow-100 space-y-4">
                
                {/* Warning Alert Title */}
                <div className="flex items-center gap-2.5 text-red-800">
                  <span className="material-symbols-outlined text-2xl font-bold text-red-800">warning</span>
                  <span className="text-xs font-black uppercase tracking-wider">
                    AVISO DE BLOQUEIO SISTÊMICO ATIVO
                  </span>
                </div>

                {/* Main text box */}
                <div className="bg-yellow-50 border-2 border-red-800 rounded-xl p-5 md:p-6 text-red-800 font-bold text-xs leading-relaxed text-justify">
                  {"Ao iniciar o procedimento de inventário para ajustes de diferenças em seu armazém, todas as movimentações sistêmicas serão bloqueadas até ser realizado o ajuste das diferenças, sendo assim, nesse período não será possível realizar Entradas e Saídas de NFs ou Entradas e Saídas de transporte de entrega para os clientes."}
                </div>

              </div>
            </div>

            {/* Footer with buttons on a slightly deeper light yellow bg */}
            <div className="bg-[#fef08a] px-6 py-4 border-t border-yellow-300/60 flex items-center justify-between flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsAbrirInventarioOpen(false);
                  setIsExcluirModalOpen(true);
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-red-600/10 active:scale-95"
              >
                EXCLUIR UM DOC. INVENTÁRIO
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAbrirInventarioOpen(false)}
                  className="px-5 py-2.5 border border-yellow-400 bg-white/90 hover:bg-white text-yellow-900 hover:text-yellow-950 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  VOLTAR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAbrirInventarioOpen(false);
                    setIsRegistrarAjusteOpen(true);
                    setInventoryLocked(true);
                    
                    // Initialize contagens to 0 for each product
                    const initialContagens: Record<string, string> = {};
                    products.forEach(p => {
                      initialContagens[p.id] = '0';
                    });
                    setContagens(initialContagens);
                    if (typeof window !== 'undefined') {
                      try {
                        localStorage.setItem('inv_saved_contagens', JSON.stringify(initialContagens));
                        localStorage.setItem('inv_saved_date', new Date().toISOString().split('T')[0]);
                      } catch (err) {
                        console.warn('Unable to write to localStorage:', err);
                      }
                    }
                    setIsAnalyzed(false);
                    setInvResponsible(getLoggedInUserName() || 'Marta TI');
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                >
                  CONTINUAR
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Registrar Ajuste de Inventário Modal */}
      {isRegistrarAjusteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-[#faf5e6] w-full max-w-6xl rounded-2xl overflow-hidden border border-amber-200 shadow-2xl flex flex-col">
            
            {/* Header with Bright Yellow Background */}
            <div className="bg-[#facc15] px-6 py-4 flex items-center justify-between text-slate-950 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-950 font-bold text-xl">fact_check</span>
                <h3 className="text-sm font-black uppercase tracking-wider">Registrar Ajuste de Inventário</h3>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsRegistrarAjusteOpen(false);
                  setInventoryLocked(false);
                }}
                className="text-slate-950 hover:text-black/75 transition-colors p-1 rounded-full hover:bg-black/10 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined font-bold text-xl">close</span>
              </button>
            </div>

            {/* Content Body with Palha background */}
            <div className="p-6 bg-[#faf5e6] flex flex-col gap-6 overflow-y-auto max-h-[75vh]">
              
              {/* Form Fields Header Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-[10px] md:text-xs font-black uppercase text-slate-700 tracking-wider mb-2 block">
                    Data de Inventário <span className="text-[#facc15]">*</span>
                  </label>
                  <input
                    type="date"
                    value={invDate}
                    onChange={(e) => setInvDate(e.target.value)}
                    className="bg-white border border-amber-200 text-slate-800 rounded-xl px-4 py-2.5 w-full text-xs font-bold focus:outline-none focus:border-yellow-500 [color-scheme:light]"
                  />
                </div>

                <div>
                  <label className="text-[10px] md:text-xs font-black uppercase text-slate-700 tracking-wider mb-2 block">
                    Nº Doc. Inventário <span className="text-[#facc15]">*</span>
                  </label>
                  <input
                    type="text"
                    value={invDocNumber}
                    disabled
                    readOnly
                    className="bg-yellow-400 border-2 border-yellow-500 text-black rounded-xl px-4 py-2.5 w-full font-bold font-mono tracking-wider cursor-not-allowed text-center"
                    style={{ fontSize: '14px' }}
                    placeholder="INV-XXXXXX"
                  />
                </div>

                <div>
                  <label className="text-[10px] md:text-xs font-black uppercase text-slate-700 tracking-wider mb-2 block">
                    Responsável pelo Lançamento <span className="text-[#facc15]">*</span>
                  </label>
                  <input
                    type="text"
                    value={invResponsible}
                    disabled
                    readOnly
                    className="bg-amber-100/50 border border-amber-200 text-slate-600 rounded-xl px-4 py-2.5 w-full text-xs font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Two columns Content grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* Left Column: Informar Quantidades */}
                <div className="border-2 border-yellow-500 rounded-2xl p-5 bg-yellow-50 flex flex-col gap-4 shadow-sm">
                  <h4 className="text-[11px] font-black text-amber-800 uppercase tracking-wider">
                    INFORMAR AS QUANTIDADES FÍSICAS
                  </h4>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-yellow-200 text-slate-500 font-extrabold uppercase tracking-wider text-[9px] pb-2">
                          <th className="py-2.5 px-1.5">CÓDIGO</th>
                          <th className="py-2.5 px-1.5">MATERIAL</th>
                          <th className="py-2.5 px-1.5 text-center">UM</th>
                          <th className="py-2.5 px-1.5 text-center">CONTAGEM FÍSICA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-yellow-100">
                        {products.map(p => (
                          <tr key={p.id} className="hover:bg-yellow-100/40 transition-colors">
                            <td className="py-3 px-1.5 font-bold text-slate-600 font-mono text-[11px]">
                              {p.code}
                            </td>
                            <td className="py-3 px-1.5 font-bold text-slate-800 uppercase text-[11px]">
                              {p.description}
                            </td>
                            <td className="py-3 px-1.5 text-center font-bold text-slate-500 text-[11px]">
                              {p.unit}
                            </td>
                            <td className="py-2 px-1.5 text-center">
                              <div className="flex justify-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={contagens[p.id] !== undefined ? contagens[p.id] : '0'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setContagens(prev => ({
                                      ...prev,
                                      [p.id]: val
                                    }));
                                  }}
                                  className="w-20 text-center bg-white border border-yellow-300 text-slate-900 font-extrabold text-xs py-1.5 px-3 rounded-xl focus:outline-none focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600"
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Column: Validação de Diferenças */}
                <div className="border-2 border-sky-500 rounded-2xl p-5 bg-sky-50 flex flex-col gap-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-sky-800 uppercase tracking-wider">
                      VALIDAÇÃO DE DIFERENÇAS
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAnalyzed(true)}
                      className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md shadow-sky-600/10 active:scale-95"
                    >
                      ANALISAR DIFERENÇA
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-sky-200 text-slate-500 font-extrabold uppercase tracking-wider text-[9px] pb-2">
                          <th className="py-2.5 px-1.5">CÓDIGO</th>
                          <th className="py-2.5 px-1.5">MATERIAL</th>
                          <th className="py-2.5 px-1.5 text-center">SALDO FÍSICO</th>
                          <th className="py-2.5 px-1.5 text-center">SALDO CONTÁBIL</th>
                          <th className="py-2.5 px-1.5 text-center">DIFERENÇA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sky-100">
                        {products.map(p => {
                          const physical = isAnalyzed ? Number(contagens[p.id] || 0) : null;
                          const book = isAnalyzed ? p.initialStock : null;
                          const diff = physical !== null && book !== null ? physical - book : null;

                          return (
                            <tr key={p.id} className="hover:bg-sky-100/40 transition-colors">
                              <td className="py-3 px-1.5 font-bold text-slate-600 font-mono text-[11px]">
                                {p.code}
                              </td>
                              <td className="py-3 px-1.5 font-bold text-slate-800 uppercase text-[11px]">
                                {p.description}
                              </td>
                              <td className="py-3 px-1.5 text-center font-bold text-slate-800 text-[11px]">
                                {physical !== null ? physical.toLocaleString('pt-BR') : '-'}
                              </td>
                              <td className="py-3 px-1.5 text-center font-bold text-slate-600 text-[11px]">
                                {book !== null ? book.toLocaleString('pt-BR') : '-'}
                              </td>
                              <td className="py-3 px-1.5 text-center font-extrabold text-[11px]">
                                {diff !== null ? (
                                  diff > 0 ? (
                                    <span className="text-emerald-600">+{diff.toLocaleString('pt-BR')}</span>
                                  ) : diff < 0 ? (
                                    <span className="text-red-600">{diff.toLocaleString('pt-BR')}</span>
                                  ) : (
                                    <span className="text-slate-600">0</span>
                                  )
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>

            {/* Footer with buttons */}
            <div className="bg-[#f0e9d2] px-6 py-4 border-t border-amber-200 flex items-center justify-between flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsRegistrarAjusteOpen(false);
                  setInventoryLocked(false);
                }}
                className="px-5 py-2.5 border border-amber-300 bg-white text-slate-700 hover:text-slate-950 hover:bg-amber-50 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveAndExit}
                  className="px-6 py-2.5 bg-[#facc15] hover:bg-yellow-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-yellow-500/15 active:scale-95"
                >
                  Salvar e Sair
                </button>

                <button
                  type="button"
                  onClick={handleSaveInventory}
                  disabled={!isAnalyzed}
                  className={`px-6 py-2.5 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md ${
                    isAnalyzed
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-emerald-600/10 active:scale-95'
                      : 'bg-emerald-950/20 text-emerald-700/40 cursor-not-allowed opacity-60 border border-emerald-900/10'
                  }`}
                >
                  Registrar Inventário
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Alerta de Documento de Inventário Aberto Modal */}
      {isAbertoWarningOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-[#fef9c3] w-full max-w-2xl rounded-2xl overflow-hidden border-2 border-yellow-400 shadow-2xl flex flex-col">
            
            {/* Header with Bright Yellow Background */}
            <div className="bg-[#facc15] px-6 py-4 flex items-center justify-between text-slate-950 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-950 font-extrabold text-xl">warning</span>
                <h3 className="text-xs font-black uppercase tracking-widest font-sans">
                  DOCUMENTO DE INVENTÁRIO: {invDocNumber}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsAbertoWarningOpen(false)}
                className="text-slate-950 hover:text-black/75 transition-colors p-1 rounded-full hover:bg-black/10 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined font-bold text-xl">close</span>
              </button>
            </div>

            {/* Content Body with light yellow background and inner outline box */}
            <div className="p-8 bg-[#fef9c3] flex flex-col gap-4">
              <div className="border border-[#eab308] rounded-2xl p-8 bg-[#fffbeb] shadow-inner text-center">
                <p className="text-slate-950 font-black text-sm md:text-base leading-relaxed max-w-lg mx-auto">
                  Já existe um documento de Inventário em Aberto, para dar seguimento nesse inventário clique em SIM ou clique em “Não” para excluir esse inventário
                </p>
              </div>
            </div>

            {/* Footer with buttons */}
            <div className="bg-[#fef08a] px-6 py-4 border-t border-yellow-300/60 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsAbertoWarningOpen(false);
                  setIsExcluirModalOpen(true);
                }}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-red-600/15"
              >
                NÃO
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAbertoWarningOpen(false);
                  setIsRegistrarAjusteOpen(true);
                }}
                className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/15 active:scale-95"
              >
                SIM
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Excluir Documento de Inventário Modal */}
      {isExcluirModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-[#fee2e2] w-full max-w-xl rounded-2xl overflow-hidden border-2 border-red-500 shadow-2xl flex flex-col">
            
            {/* Header with Vivid Red Background */}
            <div className="bg-red-600 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-white font-extrabold text-xl">delete</span>
                <h3 className="text-xs font-black uppercase tracking-widest font-sans">
                  EXCLUIR DOCUMENTO DE INVENTÁRIO
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsExcluirModalOpen(false)}
                className="text-white hover:text-white/80 transition-colors p-1 rounded-full hover:bg-black/10 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined font-bold text-xl">close</span>
              </button>
            </div>

            {/* Content Body with Light Red background */}
            <div className="p-8 flex flex-col gap-6 text-slate-900 bg-[#fee2e2]">
              <div className="border border-red-300 rounded-xl p-5 bg-red-100 text-slate-800 text-xs font-bold leading-relaxed text-justify">
                {"Informe o número do Documento de Inventário que você deseja excluir. Ao preencher um número válido, o status dele será alterado para “Eliminado”, suspendendo os bloqueios e impossibilitando novas edições."}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                  EXCLUIR DOCUMENTO (Nº DO DOC.)
                </label>
                <input
                  type="text"
                  value={invDocNumber}
                  onChange={(e) => setInvDocNumber(e.target.value)}
                  className="bg-white border-2 border-red-400 text-slate-900 rounded-xl px-4 py-3 w-full font-bold font-mono tracking-wider focus:outline-hidden focus:border-red-600 text-center text-sm shadow-inner"
                  placeholder="INV-XXXXXX"
                />
              </div>
            </div>

            {/* Footer with buttons on Light Red bg */}
            <div className="bg-red-100/60 px-6 py-4 border-t border-red-300 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsExcluirModalOpen(false)}
                className="px-6 py-2.5 border-2 border-red-400 hover:bg-red-200 text-red-900 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
              >
                VOLTAR
              </button>
              <button
                type="button"
                onClick={() => {
                  const docToEliminate = invDocNumber.trim();
                  if (!docToEliminate) {
                    alert('Por favor, informe um número de documento válido.');
                    return;
                  }
                  
                  // Set state
                  setEliminatedDocNumbers(prev => [...prev, docToEliminate]);
                  setEliminatedDocTemp(docToEliminate);
                  
                  // Disable lock
                  setInventoryLocked(false);
                  
                  // Clear active inventory details from storage
                  if (typeof window !== 'undefined') {
                    try {
                      localStorage.removeItem('inv_saved_contagens');
                      localStorage.removeItem('inv_saved_date');
                    } catch (err) {
                      console.warn('Unable to remove items from localStorage:', err);
                    }
                  }
                  
                  // Increment document number automatically to prevent re-editing the eliminated doc
                  if (docToEliminate === 'INV-000002') {
                    setInvDocNumber('INV-000003');
                  } else if (docToEliminate === 'INV-000003') {
                    setInvDocNumber('INV-000004');
                  } else {
                    setInvDocNumber('INV-000005');
                  }

                  // Show the beautiful notification
                  setShowEliminatedNotification(true);
                  setIsExcluirModalOpen(false);

                  // Auto hide after 4 seconds and return to dashboard
                  setTimeout(() => {
                    setShowEliminatedNotification(false);
                    setActiveView('dashboard');
                  }, 4000);
                }}
                className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md shadow-red-600/25 active:scale-95"
              >
                CONFIRMAR EXCLUSÃO
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating 4 Seconds Warning Notification for Eliminated Document */}
      {showEliminatedNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border-2 border-red-600 rounded-2xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center gap-4 text-center">
            <span className="material-symbols-outlined text-red-500 font-extrabold text-5xl animate-bounce">
              cancel
            </span>
            <h4 className="text-white font-black text-lg uppercase tracking-wider">
              Documento de Inventário Eliminado
            </h4>
            <p className="text-[#fca5a5] text-sm font-bold font-mono bg-red-950/50 px-4 py-2 rounded-xl border border-red-900/30">
              Nº {eliminatedDocTemp}
            </p>
            <p className="text-slate-300 text-xs">
              O status deste documento foi alterado para <strong className="text-red-400 font-black">&quot;Eliminado&quot;</strong>. A aplicação retornará para a tela inicial em instantes.
            </p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-red-500 h-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Visão Detalhada Modal */}
      {isDetailedViewOpen && (() => {
        const detailedItems = products.map((p) => {
          const description = p.description;
          const unitValue = p.valueR$ || 0;
          const necessity = p.necessityQty || 0;

          const armazem = p.initialStock;
          const transporte = (activeTransports || []).reduce((sum, trp) => sum + (trp.stock?.[p.id]?.veiculo || 0), 0);
          const prodLoja = clients.reduce((sum, c) => {
            if (c.productBalances && c.productBalances[p.id] !== undefined) {
              return sum + (c.productBalances[p.id] || 0);
            }
            const pIdx = products.findIndex(prod => prod.id === p.id);
            const pct = pIdx === 0 ? 0.5 : pIdx === 1 ? 0.35 : pIdx === 2 ? 0.15 : 0;
            return sum + Math.floor((c.saldoLoja || 0) * pct);
          }, 0);
          const physical = armazem + transporte + prodLoja;

          const retencaoAcima = physical - necessity;
          
          let retencaoAcimaVal: number | "" = "";
          let percentualRetencao: number | "" = "";
          let p0to10: number | "" = "";
          let p10to20: number | "" = "";
          let p20to30: number | "" = "";
          let p30Above: number | "" = "";
          let valorMulta: number | "" = "";

          if (retencaoAcima >= 0) {
            retencaoAcimaVal = retencaoAcima;
            const pct = necessity > 0 ? (retencaoAcima / necessity) : 0;
            percentualRetencao = pct;
            const pct100 = pct * 100;

            let multaQty = 0;
            if (pct100 >= 0 && pct100 <= 10.0) {
              p0to10 = 0; // 0% of Retenção Acima
              multaQty = 0;
            } else if (pct100 > 10.0 && pct100 <= 20.0) {
              p10to20 = Math.floor(0.25 * retencaoAcima);
              multaQty = p10to20;
            } else if (pct100 > 20.0 && pct100 <= 30.0) {
              p20to30 = Math.floor(0.35 * retencaoAcima);
              multaQty = p20to30;
            } else if (pct100 > 30.0) {
              p30Above = Math.floor(0.40 * retencaoAcima);
              multaQty = p30Above;
            }

            valorMulta = unitValue * multaQty;
          }

          return {
            id: p.id,
            description,
            unitValue,
            necessity,
            physical,
            retencaoAcimaVal,
            percentualRetencao,
            p0to10,
            p10to20,
            p20to30,
            p30Above,
            valorMulta,
          };
        });

        const sumNecessity = detailedItems.reduce((acc, item) => acc + item.necessity, 0);
        const sumPhysical = detailedItems.reduce((acc, item) => acc + item.physical, 0);
        const sumRetencaoAcima = detailedItems.reduce((acc, item) => acc + (typeof item.retencaoAcimaVal === 'number' ? item.retencaoAcimaVal : 0), 0);
        const sumValorMulta = detailedItems.reduce((acc, item) => acc + (typeof item.valorMulta === 'number' ? item.valorMulta : 0), 0);

        return (
          <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white border-2 border-blue-900 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 max-w-7xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 relative pointer-events-auto flex flex-col justify-between">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-blue-100 pb-4 gap-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-blue-900 text-3xl font-black">table_chart</span>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                      Visão Detalhada de Retenção e Multas
                    </h3>
                    <p className="text-[11px] text-blue-700 font-bold italic">
                      Análise de excedentes, percentuais de retenção e cálculo de multa por faixas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-3xs flex-1 my-4">
                <table className="w-full text-left text-[11px] border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-gray-500 font-extrabold uppercase tracking-wider text-[9px] sticky top-0 z-10">
                      <th className="py-2.5 px-3">Descrição do Material</th>
                      <th className="py-2.5 px-3 text-right">Valor Item (Necessidade)</th>
                      <th className="py-2.5 px-3 text-center">Qtd. Necessidade</th>
                      <th className="py-2.5 px-3 text-center">Saldo Total</th>
                      <th className="py-2.5 px-3 text-center">Retenção Acima</th>
                      <th className="py-2.5 px-3 text-center">% Retenção</th>
                      <th className="py-2.5 px-3 text-center bg-green-50/30">0 a 10% (0%)</th>
                      <th className="py-2.5 px-3 text-center bg-yellow-50/30">10,01 a 20% (25%)</th>
                      <th className="py-2.5 px-3 text-center bg-orange-50/30">20,01 a 30% (35%)</th>
                      <th className="py-2.5 px-3 text-center bg-red-50/30">30,01 ou Superior (40%)</th>
                      <th className="py-2.5 px-3 text-right">Valor Multa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {detailedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-800 uppercase text-[10px] truncate max-w-[200px]" title={item.description}>
                          {item.description}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-700 whitespace-nowrap">
                          {item.unitValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-blue-900 whitespace-nowrap">
                          {item.necessity.toLocaleString('pt-BR')}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-orange-600 bg-orange-50/20 whitespace-nowrap">
                          {item.physical.toLocaleString('pt-BR')}
                        </td>
                        <td className="py-2.5 px-3 text-center font-extrabold text-slate-800 bg-slate-50 whitespace-nowrap">
                          {typeof item.retencaoAcimaVal === 'number' ? item.retencaoAcimaVal.toLocaleString('pt-BR') : ''}
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-slate-700 whitespace-nowrap">
                          {typeof item.percentualRetencao === 'number' ? `${(item.percentualRetencao * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : ''}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-600 bg-green-50/10 whitespace-nowrap">
                          {typeof item.p0to10 === 'number' ? item.p0to10.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : ''}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-600 bg-yellow-50/10 whitespace-nowrap">
                          {typeof item.p10to20 === 'number' ? item.p10to20.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : ''}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-600 bg-orange-50/10 whitespace-nowrap">
                          {typeof item.p20to30 === 'number' ? item.p20to30.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : ''}
                        </td>
                        <td className="py-2.5 px-3 text-center font-semibold text-slate-600 bg-red-50/10 whitespace-nowrap">
                          {typeof item.p30Above === 'number' ? item.p30Above.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : ''}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-red-600 bg-red-50/20 whitespace-nowrap">
                          {typeof item.valorMulta === 'number' ? item.valorMulta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''}
                        </td>
                      </tr>
                    ))}
                    
                    {/* Summation Row */}
                    <tr className="bg-slate-50 border-t-2 border-gray-200 font-extrabold text-slate-900 sticky bottom-0 z-10">
                      <td className="py-3 px-3 font-black uppercase text-[10px]" colSpan={2}>
                        Total Geral
                      </td>
                      <td className="py-3 px-3 text-center font-black text-blue-900 text-xs">
                        {sumNecessity.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-3 text-center font-black text-orange-600 bg-orange-50/20 text-xs">
                        {sumPhysical.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-3 text-center font-black text-slate-800 bg-slate-50 text-xs">
                        {sumRetencaoAcima.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-3" colSpan={5}></td>
                      <td className="py-3 px-3 text-right font-black text-red-600 bg-red-50/20 text-xs">
                        {sumValorMulta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Back Button Footer */}
              <div className="flex items-center justify-end pt-4 border-t border-gray-100 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailedViewOpen(false);
                    setSelectedStockType('fisico');
                  }}
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Voltar
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
