import { useState, useRef, useEffect } from 'react';
import { Cliente, Orcamento, Empresa } from '../types';
import { ItemOrcamento } from '../types';
import BudgetItemForm from '../components/BudgetItemForm';
import { generatePDF } from '../utils/pdfGenerator';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, getDocs } from 'firebase/firestore';

const NewBudget = () => {
  const { id } = useParams(); // Captura o ID do orçamento da URL, se existir
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Carregar dados salvos do localStorage ao iniciar
  const getSavedEmpresa = (): Empresa => {
    const savedEmpresa = localStorage.getItem('empresa');
    if (savedEmpresa) {
      return JSON.parse(savedEmpresa);
    }
    return {
      nome: 'Sua Empresa',
      cnpj: '00.000.000/0000-00',
      telefone: '(99) 99999-9999',
      email: 'contato@suaempresa.com.br'
    };
  };

  const getNextOrcamentoNumber = (): string => {
    const ano = new Date().getFullYear();
    
    // Tentar pegar o número atual do localStorage
    const currentNumberKey = `orcamento_number_${ano}`;
    let currentNumber = parseInt(localStorage.getItem(currentNumberKey) || '0', 10);
    
    // Incrementar o número
    currentNumber += 1;
    
    // Salvar o novo número
    localStorage.setItem(currentNumberKey, currentNumber.toString());
    
    // Formatar o número (ex: 2025-0001)
    return `${ano}-${currentNumber.toString().padStart(4, '0')}`;
  };

  // Carregar orçamentos salvos do localStorage
  const getSavedOrcamentos = (): Orcamento[] => {
    const savedOrcamentos = localStorage.getItem('orcamentos');
    if (savedOrcamentos) {
      return JSON.parse(savedOrcamentos);
    }
    return [];
  };

  const [cliente, setCliente] = useState<Cliente>({ nome: '' });
  const [itens, setItens] = useState<ItemOrcamento[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [empresa, setEmpresa] = useState<Empresa>(getSavedEmpresa());
  const [mostrarConfiguracoes, setMostrarConfiguracoes] = useState(false);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>(getSavedOrcamentos());
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  
  const orcamentoRef = useRef<HTMLDivElement>(null);
  const numeroOrcamento = useRef<string>(getNextOrcamentoNumber());

  // Salvar empresa no localStorage sempre que for atualizada
  useEffect(() => {
    localStorage.setItem('empresa', JSON.stringify(empresa));
  }, [empresa]);

  // Salvar orcamentos no localStorage sempre que forem atualizados
  useEffect(() => {
    localStorage.setItem('orcamentos', JSON.stringify(orcamentos));
  }, [orcamentos]);

  // Garantir que os itens tenham IDs válidos
  const garantirIdsItens = (listaItens: ItemOrcamento[]): ItemOrcamento[] => {
    if (!listaItens || !Array.isArray(listaItens)) {
      console.warn('Lista de itens inválida:', listaItens);
      return [];
    }
    
    return listaItens.map(item => {
      if (!item.id) {
        // Gerar ID único se não existir
        return {
          ...item,
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        };
      }
      return item;
    });
  };

  // Carregar orçamento existente se estivermos no modo de edição
  useEffect(() => {
    const loadExistingOrcamento = async (userId: string, orcamentoId: string) => {
      console.log("=== Iniciando carregamento do orçamento ===");
      console.log("ID recebido:", orcamentoId);
      console.log("UserID:", userId);
      
      setLoading(true);
      try {
        // Verificar o formato do ID recebido
        if (!orcamentoId || orcamentoId.trim() === '') {
          console.error("ID do orçamento inválido:", orcamentoId);
          return;
        }
        
        // PRIMEIRO: Verificar se há dados no sessionStorage (prioridade máxima)
        try {
          const sessionOrcamento = sessionStorage.getItem('orcamento_em_edicao');
          if (sessionOrcamento) {
            const orcamentoData = JSON.parse(sessionOrcamento);
            console.log('Orçamento encontrado no sessionStorage:', orcamentoData);
            
            // Verificar se é o mesmo ID
            if (orcamentoData.id === orcamentoId) {
              console.log('ID do orçamento no sessionStorage corresponde ao solicitado');
              
              // Atualizar o state com os dados do orçamento
              if (typeof orcamentoData.cliente === 'string') {
                // Se cliente for apenas uma string, criar um objeto
                setCliente({ nome: orcamentoData.cliente });
              } else {
                setCliente(orcamentoData.cliente || { nome: '' });
              }
              
              // Garantir que os itens tenham IDs válidos
              setItens(garantirIdsItens(orcamentoData.itens || []));
              
              setObservacoes(orcamentoData.observacoes || '');
              
              if (orcamentoData.empresa) {
                setEmpresa(orcamentoData.empresa);
              }
              
              // Atualizar o número do orçamento - verificar múltiplos campos possíveis
              if (orcamentoData.numeroOrcamento) {
                numeroOrcamento.current = orcamentoData.numeroOrcamento;
              } else if (orcamentoData.numero) {
                numeroOrcamento.current = orcamentoData.numero;
              } else {
                numeroOrcamento.current = orcamentoData.id;
              }
              
              setEditMode(true);
              console.log("Modo de edição ativado via sessionStorage");
              
              // Limpar o sessionStorage para não interferir em futuras edições
              sessionStorage.removeItem('orcamento_em_edicao');
              
              setLoading(false);
              return;
            } else {
              console.log('ID do orçamento no sessionStorage não corresponde ao solicitado');
              // Continuar com outras fontes de dados
            }
          } else {
            console.log('Nenhum orçamento encontrado no sessionStorage');
          }
        } catch (sessionError) {
          console.error('Erro ao acessar sessionStorage:', sessionError);
          // Continuar com outras fontes de dados
        }
        
        console.log(`Tentando carregar orçamento do localStorage e Firestore para ID: ${orcamentoId}`);
        
        // SEGUNDO: tenta buscar do localStorage (para compatibilidade)
        const savedOrcamentos = getSavedOrcamentos();
        console.log("Orçamentos no localStorage:", savedOrcamentos.length);
        
        // Verificar todos os orçamentos e seus IDs
        savedOrcamentos.forEach((orc, index) => {
          console.log(`Orçamento ${index} - ID: ${orc.id}, Cliente: ${typeof orc.cliente === 'string' ? orc.cliente : orc.cliente.nome}`);
        });
        
        const localOrcamento = savedOrcamentos.find(orc => orc.id === orcamentoId);
        
        if (localOrcamento) {
          console.log('Orçamento encontrado no localStorage:', localOrcamento);
          // Atualizar o state com os dados do orçamento do localStorage
          setCliente(localOrcamento.cliente || { nome: '' });
          
          // Garantir que os itens tenham IDs válidos
          setItens(garantirIdsItens(localOrcamento.itens || []));
          
          setObservacoes(localOrcamento.observacoes || '');
          
          if (localOrcamento.empresa) {
            setEmpresa(localOrcamento.empresa);
          }
          
          // Atualizar o número do orçamento - verificar múltiplos campos possíveis
          if (localOrcamento.numeroOrcamento) {
            numeroOrcamento.current = localOrcamento.numeroOrcamento;
          } else if (localOrcamento.numero) {
            numeroOrcamento.current = localOrcamento.numero;
          } else if (localOrcamento.id) {
            numeroOrcamento.current = localOrcamento.id;
          }
          
          setEditMode(true);
          console.log("Modo de edição ativado via localStorage");
          return;
        } else {
          console.log("Orçamento não encontrado no localStorage, tentando no Firestore");
        }
        
        // Se não encontrou no localStorage, tenta no Firestore
        // Tenta diferentes caminhos no Firestore para encontrar o orçamento
        try {
          let orcamentoRef = doc(db, `users/${userId}/orcamentos/${orcamentoId}`);
          console.log("Tentando caminho principal:", `users/${userId}/orcamentos/${orcamentoId}`);
          
          let orcamentoSnap = await getDoc(orcamentoRef);
          
          if (!orcamentoSnap.exists()) {
            // Tenta outro caminho alternativo
            console.log("Não encontrado no caminho principal, tentando caminho alternativo");
            orcamentoRef = doc(db, `orcamentos/${orcamentoId}`);
            orcamentoSnap = await getDoc(orcamentoRef);
          }
          
          if (orcamentoSnap.exists()) {
            console.log('Orçamento encontrado no Firestore:', orcamentoSnap.data());
            const orcamentoData = orcamentoSnap.data() as any;
            
            // Atualizar o state com os dados do orçamento
            if (typeof orcamentoData.cliente === 'string') {
              setCliente({ nome: orcamentoData.cliente });
            } else {
              setCliente(orcamentoData.cliente || { nome: '' });
            }
            
            // Garantir que os itens têm a estrutura correta
            setItens(garantirIdsItens(orcamentoData.itens || []));
            setObservacoes(orcamentoData.observacoes || '');
            
            if (orcamentoData.empresa) {
              setEmpresa(orcamentoData.empresa);
            }
            
            // Atualizar o número do orçamento - verificar múltiplos campos possíveis
            if (orcamentoData.numeroOrcamento) {
              numeroOrcamento.current = orcamentoData.numeroOrcamento;
            } else if (orcamentoData.numero) {
              numeroOrcamento.current = orcamentoData.numero;
            } else {
              numeroOrcamento.current = orcamentoId;
            }
            
            setEditMode(true);
            console.log("Modo de edição ativado via Firestore, número do orçamento:", numeroOrcamento.current);
          } else {
            console.error("Orçamento não encontrado em nenhum lugar");
            
            // IMPORTANTE: Verificar os dados de orçamentos existentes
            try {
              const orcamentosCollection = collection(db, `users/${userId}/orcamentos`);
              const orcamentosQuery = query(orcamentosCollection);
              const querySnapshot = await getDocs(orcamentosQuery);
              
              console.log(`Encontrados ${querySnapshot.size} orçamentos na coleção do usuário`);
              querySnapshot.forEach(doc => {
                console.log(`Orçamento ID: ${doc.id}, Dados:`, doc.data());
              });
            } catch (e) {
              console.error("Erro ao listar orçamentos para debug:", e);
            }
            
            alert("Orçamento não encontrado! Criando um novo.");
            // Não redireciona, apenas mantém na tela para criar um novo
          }
        } catch (firestoreError) {
          console.error("Erro ao acessar Firestore:", firestoreError);
          alert("Erro ao acessar banco de dados. Verifique sua conexão.");
        }
      } catch (error) {
        console.error("Erro geral ao carregar orçamento:", error);
        alert("Erro ao carregar orçamento. Criando um novo orçamento.");
      } finally {
        setLoading(false);
      }
    };
    
    // Verificar se estamos no modo de edição (tem um ID na URL)
    if (id) {
      console.log("ID do orçamento na URL:", id);
      // Adicionar verificação para garantir que é um ID válido
      if (!id || id.trim() === '') {
        console.error("ID inválido na URL:", id);
        alert("ID de orçamento inválido. Criando um novo orçamento.");
        navigate('/novo-orcamento');
        return;
      }
      
      // Verifica autenticação e carrega o orçamento
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          loadExistingOrcamento(user.uid, id);
        } else {
          console.log("Usuário não logado, redirecionando para login");
          navigate('/login');
        }
      });
      
      return () => unsubscribe();
    } else {
      console.log("Modo de novo orçamento - sem ID na URL");
    }
  }, [id, navigate]);

  const handleClienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCliente((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmpresaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmpresa((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddItem = (item: ItemOrcamento) => {
    // Garantir que o item tenha um ID único
    const itemComId = {
      ...item,
      id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
    console.log('Adicionando item ao orçamento:', itemComId);
    setItens([...itens, itemComId]);
  };

  const handleRemoveItem = (id: string) => {
    console.log('Removendo item com ID:', id);
    const itensAtualizados = itens.filter(item => item.id !== id);
    setItens(itensAtualizados);
  };

  const calcularSubtotal = (item: ItemOrcamento) => {
    return item.quantidade * item.precoUnitario;
  };

  const calcularTotal = () => {
    return itens.reduce((total, item) => total + calcularSubtotal(item), 0);
  };

  const handleGerarPDF = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      console.log("=== Gerando orçamento ===");
      console.log("Cliente:", cliente);
      console.log("Itens:", itens);
      
      // Garantir que todos os itens tenham IDs válidos
      const itensProcessados = garantirIdsItens(itens);
      
      // Criar o ID do orçamento se estiver criando um novo
      const id = `orcamento_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      
      // Estrutura completa do orçamento
      const orcamento: Orcamento = {
        id,
        numero: numeroOrcamento.current, // Campo usado na listagem
        numeroOrcamento: numeroOrcamento.current, // Campo usado internamente
        cliente,
        itens: itensProcessados,
        observacoes,
        empresa,
        dataCriacao: new Date(),
        data: new Date(),
        valor: calcularTotal(),
        status: 'Pendente' as 'Pendente' // Status padrão para orçamentos
      };
      
      console.log("Estrutura do orçamento gerado:", orcamento);
      
      // Adicionar o orçamento à lista local
      const novaLista = [...orcamentos, orcamento];
      setOrcamentos(novaLista);
      console.log("Orçamento adicionado à lista local");
      
      // Tentar salvar no Firestore se o usuário estiver logado
      const user = auth.currentUser;
      if (user) {
        try {
          console.log('Usuário autenticado, salvando no Firestore:', user.uid);
          const orcamentoRef = doc(collection(db, `users/${user.uid}/orcamentos`));
          const docId = orcamentoRef.id;
          
          // Atualizar o ID para usar o gerado pelo Firestore
          orcamento.id = docId;
          
          // Salvar com o ID do Firestore
          await setDoc(orcamentoRef, {
            id: docId,
            numero: orcamento.numero,
            numeroOrcamento: orcamento.numeroOrcamento,
            cliente: orcamento.cliente,
            itens: orcamento.itens,
            observacoes: orcamento.observacoes,
            empresa: orcamento.empresa,
            dataCriacao: orcamento.dataCriacao,
            data: orcamento.data,
            valor: orcamento.valor,
            status: orcamento.status
          });
          console.log('Orçamento salvo no Firestore com ID:', docId);
          
          // Atualizar a lista local com o novo ID
          const listaAtualizada = orcamentos.filter(orc => orc.id !== id); // Remover versão anterior
          setOrcamentos([...listaAtualizada, { ...orcamento, id: docId }]);
          
          // Definir flag para atualizar o Dashboard quando retornar
          sessionStorage.setItem('dashboard_needs_refresh', 'true');
          console.log('Flag de atualização definida para o Dashboard');
        } catch (error) {
          console.error("Erro ao salvar no Firestore:", error);
          // Continuar com o salvamento local apenas
        }
      } else {
        console.log('Usuário não autenticado, salvando apenas localmente');
      }
      
      // Gerar o PDF
      await generatePDF(orcamento, null, null);
      console.log("PDF gerado com sucesso");
      
      // Limpar o formulário após gerar o PDF
      limparFormulario();
      
      // Definir flag para atualizar o Dashboard quando retornar (mesmo se não autenticado)
      sessionStorage.setItem('dashboard_needs_refresh', 'true');
      
      // Perguntar ao usuário se deseja voltar ao Dashboard
      const confirmacao = window.confirm('Orçamento criado com sucesso! Deseja voltar ao Dashboard?');
      if (confirmacao) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Erro ao gerar orçamento:", error);
      alert("Ocorreu um erro ao gerar o orçamento. Verifique o console para mais detalhes.");
    } finally {
      setLoading(false);
    }
  };

  // Nova função para salvar alterações do orçamento
  const handleSalvarAlteracoes = async () => {
    if (!id) {
      console.error("Tentativa de salvar alterações sem um ID válido");
      alert("Erro: ID do orçamento ausente. Por favor, tente novamente.");
      return;
    }
    
    if (loading) return;
    
    setLoading(true);
    try {
      console.log("=== Salvando alterações do orçamento ===");
      console.log("ID:", id);
      console.log("Número:", numeroOrcamento.current);
      console.log("Cliente:", cliente);
      console.log("Itens:", itens);
      
      // Garantir que cada item tenha um ID
      const itensProcessados = garantirIdsItens(itens);
      
      // Estrutura do orçamento atualizado - ajustando para formato compatível com o Dashboard
      // IMPORTANTE: Preservar exatamente o mesmo ID
      const orcamentoAtualizado = {
        id: id, // Garantir que o ID é exatamente o mesmo
        numero: numeroOrcamento.current, // Campo usado na listagem do Dashboard
        numeroOrcamento: numeroOrcamento.current, // Campo usado internamente
        cliente,
        itens: itensProcessados,
        observacoes,
        empresa,
        dataCriacao: new Date(), // Manter a data de criação original seria melhor, mas definimos como agora por segurança
        data: new Date(),
        valor: calcularTotal(),
        status: 'Pendente' as 'Pendente' // Status padrão para orçamentos
      };
      
      console.log("Estrutura do orçamento atualizado:", orcamentoAtualizado);
      
      // Salvar no localStorage primeiro (para compatibilidade)
      // Pegar orçamentos atuais
      const orcamentosAtuais = getSavedOrcamentos();
      // Encontrar o índice do orçamento a ser atualizado
      const index = orcamentosAtuais.findIndex(orc => orc.id === id);
      
      if (index !== -1) {
        // Atualizar o orçamento existente
        console.log("Atualizando orçamento existente no localStorage");
        orcamentosAtuais[index] = orcamentoAtualizado;
      } else {
        // Adicionar como novo se não encontrado
        console.log("Adicionando novo orçamento no localStorage");
        orcamentosAtuais.push(orcamentoAtualizado);
      }
      
      // Salvar de volta no localStorage
      localStorage.setItem('orcamentos', JSON.stringify(orcamentosAtuais));
      console.log("Orçamento salvo no localStorage");
      
      // Atualizar o estado local
      setOrcamentos(orcamentosAtuais);
      
      // Tentar salvar no Firestore se o usuário estiver logado
      const user = auth.currentUser;
      if (user) {
        try {
          console.log('Salvando no Firestore:', orcamentoAtualizado);
          
          // Tentar diferentes caminhos no Firestore
          try {
            // Primeira tentativa: caminho padrão com ID específico
            const orcamentoRef = doc(db, `users/${user.uid}/orcamentos/${id}`);
            console.log('Atualizando documento no caminho:', `users/${user.uid}/orcamentos/${id}`);
            await setDoc(orcamentoRef, orcamentoAtualizado, { merge: true });
            console.log('Orçamento atualizado no Firestore (caminho padrão)');
            
            // Definir flag para atualizar o Dashboard quando retornar
            sessionStorage.setItem('dashboard_needs_refresh', 'true');
          } catch (firestoreError) {
            console.error("Erro ao salvar no Firestore (caminho padrão):", firestoreError);
            // Segunda tentativa: caminho alternativo
            try {
              const orcamentoRef = doc(db, `orcamentos/${id}`);
              console.log('Tentando caminho alternativo:', `orcamentos/${id}`);
              await setDoc(orcamentoRef, orcamentoAtualizado, { merge: true });
              console.log('Orçamento atualizado no Firestore (caminho alternativo)');
              
              // Definir flag para atualizar o Dashboard quando retornar
              sessionStorage.setItem('dashboard_needs_refresh', 'true');
            } catch (error) {
              console.error("Erro ao salvar no Firestore (caminho alternativo):", error);
              // Apenas log, não alerta o usuário pois já salvamos no localStorage
            }
          }
        } catch (error) {
          console.error("Erro ao salvar no Firestore:", error);
          // Já salvou no localStorage, então não é um erro crítico
        }
      }
      
      alert("Orçamento atualizado com sucesso!");
      
      // Perguntar ao usuário se deseja voltar ao Dashboard
      const confirmacao = window.confirm('Deseja voltar ao Dashboard?');
      if (confirmacao) {
        // Garantir que a flag de atualização esteja definida antes de navegar
        sessionStorage.setItem('dashboard_needs_refresh', 'true');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
      alert("Erro ao salvar alterações. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarWhatsApp = () => {
    if (!cliente.whatsapp) {
      alert('Digite o número de WhatsApp do cliente para enviar!');
      return;
    }

    const telefone = cliente.whatsapp.replace(/\D/g, '');
    const total = calcularTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const mensagem = encodeURIComponent(
      `Olá ${cliente.nome}, aqui é da ${empresa.nome}. Segue o orçamento solicitado no valor total de ${total}. Orçamento Nº ${numeroOrcamento.current}. Estou à disposição para qualquer dúvida.`
    );
    
    window.open(`https://wa.me/${telefone}?text=${mensagem}`, '_blank');
  };

  const handleEnviarEmail = async () => {
    if (!cliente.email) {
      alert('Digite o email do cliente para enviar!');
      return;
    }

    setEmailStatus('Enviando email...');

    // Gerar o PDF primeiro
    const orcamento: Orcamento = {
      id: numeroOrcamento.current,
      cliente,
      itens,
      observacoes,
      data: new Date(),
      empresa
    };

    try {
      // Salvar o orçamento
      if (!orcamentos.some(orc => orc.id === orcamento.id)) {
        setOrcamentos(prev => [...prev, orcamento]);
      }

      // Gerar o PDF e enviar por email usando mailto do Gmail
      await generatePDF(orcamento, null, null);
      
      const total = calcularTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const assunto = encodeURIComponent(`Orçamento ${numeroOrcamento.current} - ${empresa.nome}`);
      const corpo = encodeURIComponent(
        `Olá ${cliente.nome},\n\n` +
        `Segue em anexo o orçamento solicitado no valor total de ${total}.\n\n` +
        `Orçamento Nº ${numeroOrcamento.current}.\n\n` +
        `Qualquer dúvida estamos à disposição.\n\n` +
        `Atenciosamente,\n${empresa.nome}\n${empresa.telefone}`
      );
      
      // Abrir Gmail diretamente com URL específica
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${cliente.email}&su=${assunto}&body=${corpo}`, '_blank');
      
      setEmailStatus('Email preparado no Gmail! Anexe o PDF baixado.');
      
      // Limpar mensagem após alguns segundos
      setTimeout(() => {
        setEmailStatus(null);
      }, 5000);
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      setEmailStatus('Erro ao preparar email.');
      
      setTimeout(() => {
        setEmailStatus(null);
      }, 5000);
    }
  };

  const formatarMoeda = (valor: number) => {
    return `R$ ${valor.toString().replace('.', ',')}`;
  };

  const limparFormulario = () => {
    setCliente({ nome: '' });
    setItens([]);
    setObservacoes('');
    // Atualizar para o próximo número de orçamento disponível
    numeroOrcamento.current = getNextOrcamentoNumber();
    setEditMode(false);
    console.log('Formulário limpo e pronto para novo orçamento');
  };

  return (
    <div className="container">
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{editMode ? 'Salvando orçamento...' : 'Carregando orçamento...'}</p>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1>{editMode ? 'Editar Orçamento' : 'Sistema de Orçamentos'}</h1>
            <div className="flex justify-between">
              <button
                className="btn btn-secondary"
                onClick={limparFormulario}
              >
                Novo Orçamento
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setMostrarConfiguracoes(!mostrarConfiguracoes)}
              >
                {mostrarConfiguracoes ? 'Fechar Configurações' : 'Configurar Empresa'}
              </button>
            </div>
          </div>

          {mostrarConfiguracoes && (
            <div className="card mb-6">
              <h2 className="mb-4">Dados da Empresa</h2>
              <div className="grid grid-cols-1 grid-cols-2 mb-6">
                <div className="form-group">
                  <label className="form-label">Nome da Empresa</label>
                  <input 
                    type="text" 
                    name="nome" 
                    className="form-input"
                    value={empresa.nome}
                    onChange={handleEmpresaChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">CNPJ</label>
                  <input 
                    type="text" 
                    name="cnpj" 
                    className="form-input"
                    value={empresa.cnpj}
                    onChange={handleEmpresaChange}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input 
                    type="tel" 
                    name="telefone" 
                    className="form-input"
                    value={empresa.telefone}
                    onChange={handleEmpresaChange}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input 
                    type="email" 
                    name="email" 
                    className="form-input"
                    value={empresa.email}
                    onChange={handleEmpresaChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Formulário de Orçamento */}
          <div className="card mb-6">
            <h2 className="mb-4">Dados do Cliente</h2>
            
            <div className="grid grid-cols-1 grid-cols-2 mb-6">
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input 
                  type="text" 
                  name="nome" 
                  className="form-input"
                  value={cliente.nome}
                  onChange={handleClienteChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">WhatsApp</label>
                <input 
                  type="tel" 
                  name="whatsapp" 
                  className="form-input"
                  value={cliente.whatsapp || ''}
                  onChange={handleClienteChange}
                  placeholder="(99) 99999-9999"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 mb-4">
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input 
                  type="email" 
                  name="email" 
                  className="form-input"
                  value={cliente.email || ''}
                  onChange={handleClienteChange}
                  placeholder="cliente@exemplo.com"
                />
              </div>
            </div>
          </div>
          
          {/* Adicionar Itens */}
          <BudgetItemForm onSubmit={handleAddItem} />
          
          {/* Visualização do Orçamento */}
          <div 
            ref={orcamentoRef}
            id="orcamento-preview" 
            className="card mt-6 orcamento-document"
          >
            {/* Cabeçalho do Orçamento */}
            <div className="orcamento-header mb-6">
              <div className="flex">
                <div className="empresa-info">
                  <h2>{empresa.nome}</h2>
                  {empresa.cnpj && <p><strong>CNPJ:</strong> {empresa.cnpj}</p>}
                  <p>
                    {empresa.telefone && <span>{empresa.telefone}</span>}
                    {empresa.email && <span> • {empresa.email}</span>}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="orcamento-title text-center mb-6">
              <h2 className="orcamento-heading">ORÇAMENTO</h2>
              <p className="orcamento-number">Nº {numeroOrcamento.current}</p>
              <p className="orcamento-date">Data: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            
            {cliente.nome && (
              <div className="mb-6 cliente-section">
                <h3 className="mb-2 section-title">CLIENTE</h3>
                <div className="cliente-data">
                  <p><strong>Nome:</strong> {cliente.nome}</p>
                  {cliente.whatsapp && <p><strong>WhatsApp:</strong> {cliente.whatsapp}</p>}
                  {cliente.email && <p><strong>E-mail:</strong> {cliente.email}</p>}
                </div>
              </div>
            )}
            
            <div className="mb-6 itens-section">
              <h3 className="mb-2 section-title">ITENS DO ORÇAMENTO</h3>
              
              {itens.length === 0 ? (
                <p className="no-items">Nenhum item adicionado</p>
              ) : (
                <div className="items-table-container">
                  <table border={1} cellPadding={10} cellSpacing={0} style={{width: '100%', borderCollapse: 'collapse'}}>
                    <tr style={{backgroundColor: '#2980b9', color: 'white'}}>
                      <td width="60" align="center">Item</td>
                      <td align="left">Descrição</td>
                      <td width="60" align="center">Qtd.</td>
                      <td width="100" align="right">Preço Unit.</td>
                      <td width="100" align="right">Subtotal</td>
                      <td width="100" align="center">Ações</td>
                    </tr>
                    {itens.map((item, index) => (
                      <tr key={item.id}>
                        <td align="center">{index + 1}</td>
                        <td align="left">
                          <div className="item-content">
                            <span className="item-descricao">{item.descricao}</span>
                            {item.detalhes && <span className="item-detalhes"> - {item.detalhes}</span>}
                          </div>
                        </td>
                        <td align="center">{item.quantidade}</td>
                        <td align="right">{formatarMoeda(item.precoUnitario)}</td>
                        <td align="right">{formatarMoeda(calcularSubtotal(item))}</td>
                        <td align="center">
                          <button 
                            onClick={() => handleRemoveItem(item.id)}
                            className="btn btn-danger"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr style={{borderTop: '2px solid #e5e7eb'}}>
                      <td colSpan={4} align="right"><strong>TOTAL:</strong></td>
                      <td align="right" style={{position: 'relative'}}>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: '#f9fafb',
                          zIndex: -1
                        }}></div>
                        <span style={{color: '#2563EB', fontWeight: 'bold'}}>{formatarMoeda(calcularTotal())}</span>
                      </td>
                      <td></td>
                    </tr>
                  </table>
                </div>
              )}
            </div>
            
            <div className="mb-6 observacoes-section">
              <h3 className="mb-2 section-title">OBSERVAÇÕES</h3>
              <textarea
                className="form-textarea observacoes-textarea"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Validade do orçamento, prazo de entrega, forma de pagamento..."
              ></textarea>
            </div>
            
            <div className="assinatura-section">
              <div className="assinatura-linha"></div>
              <p className="assinatura-nome">{empresa.nome}</p>
            </div>
          </div>
          
          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6 buttons-container">
            {editMode ? (
              <button
                onClick={handleSalvarAlteracoes}
                disabled={itens.length === 0 || !cliente.nome || loading}
                className="btn btn-primary btn-large"
              >
                <span className="mr-2">💾</span> {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            ) : (
              <button
                onClick={handleGerarPDF}
                disabled={itens.length === 0 || !cliente.nome || loading}
                className="btn btn-success btn-large"
              >
                <span className="mr-2">📄</span> {loading ? 'Criando Orçamento...' : 'Gerar PDF'}
              </button>
            )}
            
            <button
              onClick={handleEnviarWhatsApp}
              disabled={itens.length === 0 || !cliente.nome || !cliente.whatsapp || loading}
              className="btn btn-success btn-large"
            >
              <span className="mr-2">📱</span> Enviar por WhatsApp
            </button>
            
            <button
              onClick={handleEnviarEmail}
              disabled={itens.length === 0 || !cliente.nome || !cliente.email || loading}
              className="btn btn-success btn-large"
            >
              <span className="mr-2">📧</span> Enviar por Gmail
            </button>
            
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary btn-large"
            >
              <span className="mr-2">🏠</span> Voltar para Dashboard
            </button>
          </div>
          
          {emailStatus && (
            <div className="mt-4 text-center">
              <p className="email-status">{emailStatus}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NewBudget; 