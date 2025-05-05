import { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, doc, getDoc, orderBy, limit, deleteDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Dashboard.css';
import { buscarClientes } from '../utils/pdfGenerator';
import { checkOfflineOrcamentos, setupOfflineSyncListeners } from '../utils/offlineSync';
import ConnectionStatus from './ConnectionStatus';
import { otimizarAplicativo } from '../utils/optimize';
import { getFirestoreData } from '../utils/firestoreUtils';
import { useConfig } from '../context/ConfigContext';

// Tipo para dados do usuário
interface UserData {
  nome: string;
  email: string;
  empresa: string;
}

// Tipo simplificado para orçamentos
interface Orcamento {
  id: string;
  numero: string;
  numeroOrcamento?: string;
  cliente: string | { nome: string; email?: string; telefone?: string; };
  valor: number;
  dataCriacao: any; // Mudando para any porque pode ser string, timestamp ou Date
  status: 'Enviado' | 'Aprovado' | 'Recusado' | 'Pendente';
}

// Tipo para clientes
interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
}

// Status descriptions for tooltips
const STATUS_DESCRIPTIONS = {
  'Pendente': 'Orçamento em elaboração, ainda não enviado ao cliente',
  'Enviado': 'Orçamento enviado ao cliente, aguardando resposta',
  'Aprovado': 'Orçamento aprovado pelo cliente',
  'Recusado': 'Orçamento recusado pelo cliente'
};

// Função para obter as iniciais do nome do usuário
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Função para gerar cor baseada no nome
const getRandomColor = (name: string) => {
  const colors = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b'
  ];
  
  // Gerar um índice baseado no nome para sempre ter a mesma cor
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash % colors.length);
  return colors[index];
};

// Função utilitária para formatar a data
const formatarData = (data: any): string => {
  if (!data) return 'Data não disponível';
  
  try {
    // Se for timestamp do Firestore
    if (data && typeof data.toDate === 'function') {
      return data.toDate().toLocaleDateString('pt-BR');
    }
    
    // Se for string ISO
    if (typeof data === 'string') {
      return new Date(data).toLocaleDateString('pt-BR');
    }
    
    // Se já for Date
    if (data instanceof Date) {
      return data.toLocaleDateString('pt-BR');
    }
    
    // Caso não consiga converter
    return 'Data inválida';
  } catch (error) {
    console.error("Erro ao formatar data:", error, data);
    return 'Erro na data';
  }
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const { config } = useConfig();
  const navigate = useNavigate();

  // Referência para o ID do usuário atual
  const userIdRef = useRef<string | null>(null);

  // Estado para controlar qual menu de status está aberto
  const [menuAberto, setMenuAberto] = useState<string | null>(null);

  // Função para excluir orçamento
  const apagarOrcamento = async (orcamentoId: string) => {
    try {
      // Confirmar com o usuário
      if (!window.confirm('Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.')) {
        return;
      }

      setLoading(true);
      console.log('Apagando orçamento:', orcamentoId);
      
      const user = auth.currentUser;
      if (!user) {
        alert('Você precisa estar logado para excluir um orçamento.');
        return;
      }
      
      // Tentar excluir no Firestore
      try {
        const orcamentoRef = doc(db, `users/${user.uid}/orcamentos/${orcamentoId}`);
        await deleteDoc(orcamentoRef);
        console.log('Orçamento excluído do Firestore com sucesso');
      } catch (firestoreError) {
        console.error('Erro ao excluir do Firestore:', firestoreError);
        
        // Tentar caminho alternativo
        try {
          const orcamentoRef = doc(db, `orcamentos/${orcamentoId}`);
          await deleteDoc(orcamentoRef);
          console.log('Orçamento excluído do Firestore (caminho alternativo) com sucesso');
        } catch (error) {
          console.error('Erro ao excluir do Firestore (caminho alternativo):', error);
          // Continuar mesmo com erro, para pelo menos atualizar a interface
        }
      }
      
      // Remover do localStorage também
      try {
        const orcamentosLocais = JSON.parse(localStorage.getItem('orcamentos') || '[]');
        const orcamentosAtualizados = orcamentosLocais.filter((orc: any) => orc.id !== orcamentoId);
        localStorage.setItem('orcamentos', JSON.stringify(orcamentosAtualizados));
        console.log('Orçamento removido do localStorage');
      } catch (error) {
        console.error('Erro ao remover do localStorage:', error);
      }
      
      // Atualizar a listagem de orçamentos
      setOrcamentos(orcamentos.filter(orc => orc.id !== orcamentoId));
      alert('Orçamento excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
      alert('Ocorreu um erro ao excluir o orçamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para atualizar status do orçamento
  const atualizarStatus = async (orcamentoId: string, novoStatus: 'Enviado' | 'Aprovado' | 'Recusado' | 'Pendente') => {
    try {
      setLoading(true);
      console.log(`Atualizando status do orçamento ${orcamentoId} para ${novoStatus}`);
      
      const user = auth.currentUser;
      if (!user) {
        alert('Você precisa estar logado para atualizar o status do orçamento.');
        return;
      }
      
      // Atualizar no Firestore
      try {
        const orcamentoRef = doc(db, `users/${user.uid}/orcamentos/${orcamentoId}`);
        await updateDoc(orcamentoRef, { status: novoStatus });
        console.log('Status atualizado no Firestore com sucesso');
      } catch (firestoreError) {
        console.error('Erro ao atualizar status no Firestore:', firestoreError);
        
        // Tentar caminho alternativo
        try {
          const orcamentoRef = doc(db, `orcamentos/${orcamentoId}`);
          await updateDoc(orcamentoRef, { status: novoStatus });
          console.log('Status atualizado no Firestore (caminho alternativo) com sucesso');
        } catch (error) {
          console.error('Erro ao atualizar status no Firestore (caminho alternativo):', error);
          // Continuar mesmo com erro, para pelo menos atualizar a interface
        }
      }
      
      // Atualizar no localStorage também
      try {
        const orcamentosLocais = JSON.parse(localStorage.getItem('orcamentos') || '[]');
        const orcamentosAtualizados = orcamentosLocais.map((orc: any) => 
          orc.id === orcamentoId ? { ...orc, status: novoStatus } : orc
        );
        localStorage.setItem('orcamentos', JSON.stringify(orcamentosAtualizados));
        console.log('Status atualizado no localStorage');
      } catch (error) {
        console.error('Erro ao atualizar status no localStorage:', error);
      }
      
      // Atualizar a listagem de orçamentos
      setOrcamentos(orcamentos.map(orc => 
        orc.id === orcamentoId ? { ...orc, status: novoStatus } : orc
      ));
      
      alert(`Status do orçamento atualizado para ${novoStatus}`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Ocorreu um erro ao atualizar o status. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para formatar valor monetário conforme configurações
  const formatarDinheiro = (valor: number) => {
    return new Intl.NumberFormat(config.idioma, { 
      style: 'currency', 
      currency: config.formatoMonetario
    }).format(valor);
  };

  // Adicionar handler para atualizar os dados quando a página ganhar foco
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userIdRef.current) {
        console.log('Página em foco, recarregando orçamentos');
        loadOrcamentos(userIdRef.current);
      }
    };

    // Também recarregar quando o componente for montado ou a rota for acessada
    const handleFocus = () => {
      if (userIdRef.current) {
        console.log('Janela em foco, recarregando orçamentos');
        loadOrcamentos(userIdRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Verificar flag de atualização quando o componente for montado
  useEffect(() => {
    // Verificar se há necessidade de atualizar quando o Dashboard for aberto
    const needsRefresh = sessionStorage.getItem('dashboard_needs_refresh');
    if (needsRefresh === 'true' && userIdRef.current) {
      console.log('Flag de atualização detectada, recarregando orçamentos');
      loadOrcamentos(userIdRef.current);
      // Limpar a flag após atualizar
      sessionStorage.removeItem('dashboard_needs_refresh');
    }
  }, []);

  useEffect(() => {
    // Monitorar estado de autenticação
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Armazenar ID do usuário na referência
          userIdRef.current = user.uid;
          
          // Executar otimização do aplicativo para melhorar desempenho
          otimizarAplicativo();
          
          // Configurar listeners de sincronização offline
          setupOfflineSyncListeners(user.uid);
          
          // Verificar e sincronizar orçamentos offline
          if (navigator.onLine) {
            await checkOfflineOrcamentos(user.uid);
          }
          
          // Buscar dados do usuário
          await loadUserData(user.uid);
          
          // Buscar orçamentos do usuário
          await loadOrcamentos(user.uid);
          
          // Carregar clientes do usuário
          try {
            const clientesData = await buscarClientes(user.uid);
            setClientes(clientesData as Cliente[]);
          } catch (error) {
            console.error("Erro ao carregar clientes:", error);
            // Continuar mesmo com erro, para não bloquear a interface
          }
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
          
          // Se falhar ao carregar, ainda criar um estado básico para o usuário
          // para que o app funcione e possa tentar recuperar os dados depois
          setUserData({
            nome: user.displayName || 'Usuário',
            email: user.email || '',
            empresa: 'Minha Empresa'
          });
        } finally {
          setLoading(false);
        }
      } else {
        // Usuário não está logado, redirecionar para login
        navigate('/login');
      }
    });

    // Cleanup da inscrição ao desmontar o componente
    return () => unsubscribe();
  }, [navigate]);

  // Função para carregar orçamentos do usuário
  const loadOrcamentos = async (userId: string) => {
    setLoading(true);
    try {
      const constraints = [
        orderBy('dataCriacao', 'desc'),
        limit(10)
      ];
      
      const orcamentosData = await getFirestoreData(
        `users/${userId}/orcamentos`, 
        undefined, 
        constraints
      ) as any[];
      
      // Processar os orçamentos para garantir estrutura consistente
      const orcamentosProcessados = orcamentosData.map(orc => {
        // Garantir que cada orçamento tenha o campo numero apropriado
        return {
          ...orc,
          // Se não tiver numero, usar numeroOrcamento ou id
          numero: orc.numero || orc.numeroOrcamento || orc.id,
          // Se o status for indefinido, definir como Pendente
          status: orc.status || 'Pendente'
        };
      });
      
      setOrcamentos(orcamentosProcessados);
      console.log('Orçamentos carregados e processados:', orcamentosProcessados.length);
    } catch (error) {
      console.error("Erro ao carregar orçamentos:", error);
      setOrcamentos([]);
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar dados do usuário
  const loadUserData = async (userId: string) => {
    try {
      const userData = await getFirestoreData('users', userId) as any;
      setUserData(userData);
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
    }
  };

  // Função para fazer logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  // Armazenar um orçamento no sessionStorage antes de editar
  const prepararParaEditar = (orcamento: Orcamento) => {
    try {
      console.log("=== Preparando orçamento para edição ===");
      console.log("ID original:", orcamento.id);
      
      // Garantir que o orçamento tenha todos os campos necessários
      const orcamentoCompleto = {
        ...orcamento,
        // Garantir que tenhamos tanto numero quanto numeroOrcamento
        numero: orcamento.numero || '',
        numeroOrcamento: orcamento.numeroOrcamento || orcamento.numero || orcamento.id,
        // Se cliente for string, converter para objeto
        cliente: typeof orcamento.cliente === 'string' 
          ? { nome: orcamento.cliente } 
          : orcamento.cliente,
        // Garantir status
        status: orcamento.status || 'Pendente',
        // Garantir que tenha uma chave 'id' explícita
        id: orcamento.id,
      };
      
      console.log("Orçamento completo preparado:", orcamentoCompleto);
      
      // Armazenar no localStorage para persistir entre sessões
      const orcamentos = JSON.parse(localStorage.getItem('orcamentos') || '[]');
      const orcamentoExiste = orcamentos.find((orc: any) => orc.id === orcamento.id);
      
      // Se o orçamento não existe no localStorage, adicionar
      if (!orcamentoExiste) {
        console.log("Orçamento não encontrado no localStorage, buscando no Firestore");
        
        // Buscar o orçamento completo do Firestore antes de adicionar
        const user = auth.currentUser;
        if (user) {
          // Buscar dados completos do Firestore e então adicionar ao localStorage
          console.log("Buscando orçamento no Firestore:", `users/${user.uid}/orcamentos/${orcamento.id}`);
          
          getDoc(doc(db, `users/${user.uid}/orcamentos/${orcamento.id}`))
            .then((docSnap) => {
              if (docSnap.exists()) {
                const orcamentoFirestore = docSnap.data();
                console.log("Orçamento encontrado no Firestore:", orcamentoFirestore);
                
                // Mesclar dados do Firestore com o orçamento local
                const orcamentoMesclado = {
                  ...orcamentoFirestore,
                  id: orcamento.id, // Garantir que o ID seja preservado
                  numero: orcamentoFirestore.numero || orcamentoFirestore.numeroOrcamento || orcamento.id,
                  numeroOrcamento: orcamentoFirestore.numeroOrcamento || orcamentoFirestore.numero || orcamento.id,
                  // Se cliente for string, converter para objeto
                  cliente: typeof orcamentoFirestore.cliente === 'string' 
                    ? { nome: orcamentoFirestore.cliente } 
                    : orcamentoFirestore.cliente || { nome: '' },
                };
                
                console.log("Orçamento mesclado para localStorage:", orcamentoMesclado);
                orcamentos.push(orcamentoMesclado);
                localStorage.setItem('orcamentos', JSON.stringify(orcamentos));
                console.log('Orçamento completo adicionado ao localStorage para edições futuras');
                
                // Atualizar o sessionStorage também com o orçamento mesclado
                sessionStorage.setItem('orcamento_em_edicao', JSON.stringify(orcamentoMesclado));
                console.log('Orçamento mesclado salvo no sessionStorage');
              } else {
                console.log("Orçamento não encontrado no Firestore, usando dados da listagem");
                orcamentos.push(orcamentoCompleto);
                localStorage.setItem('orcamentos', JSON.stringify(orcamentos));
                
                // Continuar usando o sessionStorage para a sessão atual
                sessionStorage.setItem('orcamento_em_edicao', JSON.stringify(orcamentoCompleto));
              }
            })
            .catch(error => {
              console.error('Erro ao buscar orçamento completo:', error);
              // Em caso de erro, usar o orçamento da listagem
              console.log("Usando dados da listagem devido a erro");
              orcamentos.push(orcamentoCompleto);
              localStorage.setItem('orcamentos', JSON.stringify(orcamentos));
              
              // Continuar usando o sessionStorage para a sessão atual
              sessionStorage.setItem('orcamento_em_edicao', JSON.stringify(orcamentoCompleto));
            });
        } else {
          // Sem usuário logado, usar os dados da listagem
          console.log("Usuário não autenticado, usando dados da listagem");
          orcamentos.push(orcamentoCompleto);
          localStorage.setItem('orcamentos', JSON.stringify(orcamentos));
          
          // Continuar usando o sessionStorage para a sessão atual
          sessionStorage.setItem('orcamento_em_edicao', JSON.stringify(orcamentoCompleto));
        }
      } else {
        console.log("Orçamento encontrado no localStorage, usando dados existentes");
        // Continuar usando o sessionStorage para a sessão atual
        sessionStorage.setItem('orcamento_em_edicao', JSON.stringify(orcamentoCompleto));
      }
      
      console.log('Orçamento armazenado para edição - ID:', orcamento.id);
    } catch (error) {
      console.error('Erro ao armazenar orçamento:', error);
      // Em caso de erro, tentar salvar o objeto original
      sessionStorage.setItem('orcamento_em_edicao', JSON.stringify(orcamento));
    }
  };

  // Função para alternar o menu de status
  const toggleStatusMenu = (orcamentoId: string) => {
    if (menuAberto === orcamentoId) {
      setMenuAberto(null);
    } else {
      setMenuAberto(orcamentoId);
    }
  };
  
  // Função para fechar o menu quando clicar fora
  useEffect(() => {
    const fecharMenuAoClicarFora = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.status-menu') && !target.closest('.status-dropdown')) {
        setMenuAberto(null);
      }
    };
    
    document.addEventListener('click', fecharMenuAoClicarFora);
    
    return () => {
      document.removeEventListener('click', fecharMenuAoClicarFora);
    };
  }, []);

  // Calcular valores totais para estatísticas
  const calcularEstatisticas = () => {
    const valorTotal = orcamentos.reduce((acc, o) => acc + (isNaN(o.valor) ? 0 : o.valor), 0);
    const valorAprovados = orcamentos
      .filter(o => o.status === 'Aprovado')
      .reduce((acc, o) => acc + (isNaN(o.valor) ? 0 : o.valor), 0);
    const qtdAprovados = orcamentos.filter(o => o.status === 'Aprovado').length;
      
    return {
      valorTotal,
      valorAprovados,
      qtdAprovados
    };
  };
  
  const estatisticas = calcularEstatisticas();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando seus dados...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <ConnectionStatus />
      
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo">
          <img src="/images/FAVEICON-USE.png" alt="Orçamento PRO" className="logo-img" />
          <h1>Orçamento<span className="logo-pro">PRO</span></h1>
        </div>
        <div className="user-menu">
          <span className="user-name">Olá, {userData?.nome ? userData.nome.split(' ')[0] : 'Usuário'}</span>
          <div 
            className="user-avatar"
            style={{ backgroundColor: getRandomColor(userData?.nome || 'User') }}
          >
            {getInitials(userData?.nome || 'U')}
          </div>
          <div className="user-dropdown">
            <ul>
              <li><Link to="/perfil">Meu Perfil</Link></li>
              <li><Link to="/configuracoes">Configurações</Link></li>
              <li><button onClick={handleLogout}>Sair</button></li>
            </ul>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="dashboard-content">
        <div className="dashboard-sidebar">
          <nav className="dashboard-nav">
            <ul>
              <li className="active"><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/orcamentos">Orçamentos</Link></li>
              <li><Link to="/clientes">Clientes</Link></li>
              <li><Link to="/produtos">Produtos</Link></li>
              <li><Link to="/configuracoes">Configurações</Link></li>
            </ul>
          </nav>

          <div className="empresa-info">
            <h3>{userData?.empresa}</h3>
            <p>{userData?.email}</p>
          </div>
        </div>

        <div className="dashboard-main">
          <div className="dashboard-header-content">
            <h1>Dashboard</h1>
            <Link to="/novo-orcamento" className="btn btn-primary">Novo Orçamento</Link>
          </div>

          {/* Cards informativos */}
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>Total de Orçamentos</h3>
                <p className="stat-value">{orcamentos.length}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>Orçamentos Aprovados</h3>
                <p className="stat-value">{estatisticas.qtdAprovados}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>Clientes</h3>
                <p className="stat-value">
                  {clientes.length}
                </p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <h3>Valor Total</h3>
                <p className="stat-value">
                  {formatarDinheiro(estatisticas.valorTotal)}
                </p>
              </div>
            </div>
            <div className="stat-card approved-value">
              <div className="stat-icon">💵</div>
              <div className="stat-info">
                <h3>Valor Aprovado</h3>
                <p className="stat-value">
                  {formatarDinheiro(estatisticas.valorAprovados)}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de orçamentos recentes */}
          <div className="recent-section">
            <div className="section-header">
              <h2>Orçamentos Recentes</h2>
              <Link to="/orcamentos" className="view-all">Ver todos</Link>
            </div>

            {orcamentos.length > 0 ? (
              <div className="recent-list">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nº</th>
                      <th>Cliente</th>
                      <th>Valor</th>
                      <th>Data</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orcamentos.slice(0, 5).map((orcamento) => (
                      <tr key={orcamento.id}>
                        <td>{orcamento.numeroOrcamento || orcamento.numero || orcamento.id}</td>
                        <td>{typeof orcamento.cliente === 'string' ? orcamento.cliente : orcamento.cliente.nome}</td>
                        <td className="valor-col">{formatarDinheiro(Number(orcamento.valor || 0))}</td>
                        <td>{formatarData(orcamento.dataCriacao)}</td>
                        <td>
                          <span 
                            className={`status-badge ${orcamento.status?.toLowerCase() || 'pendente'}`}
                            title={STATUS_DESCRIPTIONS[orcamento.status || 'Pendente']}
                          >
                            {orcamento.status || 'Pendente'}
                          </span>
                        </td>
                        <td className="actions">
                          <Link 
                            to={`/orcamentos/${orcamento.id}`} 
                            className="btn-icon view"
                            title="Visualizar orçamento"
                          >
                            👁️
                          </Link>
                          <Link 
                            to={`/novo-orcamento/${orcamento.id}`} 
                            className="btn-icon edit"
                            title="Editar orçamento"
                            onClick={() => prepararParaEditar(orcamento)}
                          >
                            ✏️
                          </Link>
                          
                          {/* Menu de status */}
                          <div className="status-menu">
                            <button 
                              className="btn-icon status" 
                              title="Alterar status" 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStatusMenu(orcamento.id);
                              }}
                            >
                              🔄
                            </button>
                            {menuAberto === orcamento.id && (
                              <div className="status-dropdown">
                                <button 
                                  className={`status-option ${orcamento.status === 'Pendente' ? 'active' : ''}`}
                                  onClick={() => atualizarStatus(orcamento.id, 'Pendente')}
                                >
                                  Pendente
                                </button>
                                <button 
                                  className={`status-option ${orcamento.status === 'Enviado' ? 'active' : ''}`}
                                  onClick={() => atualizarStatus(orcamento.id, 'Enviado')}
                                >
                                  Enviado
                                </button>
                                <button 
                                  className={`status-option ${orcamento.status === 'Aprovado' ? 'active' : ''}`}
                                  onClick={() => atualizarStatus(orcamento.id, 'Aprovado')}
                                >
                                  Aprovado
                                </button>
                                <button 
                                  className={`status-option ${orcamento.status === 'Recusado' ? 'active' : ''}`}
                                  onClick={() => atualizarStatus(orcamento.id, 'Recusado')}
                                >
                                  Recusado
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <button 
                            className="btn-icon delete"
                            title="Excluir orçamento"
                            onClick={() => apagarOrcamento(orcamento.id)}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>Você ainda não tem orçamentos</h3>
                <p>Comece criando seu primeiro orçamento agora mesmo!</p>
                <Link to="/novo-orcamento" className="btn btn-primary">Criar Orçamento</Link>
              </div>
            )}
          </div>

          {/* Lista de clientes recentes */}
          <div className="recent-section">
            <div className="section-header">
              <h2>Seus Clientes</h2>
              <Link to="/clientes" className="view-all">Ver todos</Link>
            </div>

            {clientes.length > 0 ? (
              <div className="clients-grid">
                {clientes.slice(0, 4).map((cliente, index) => (
                  <div key={index} className="client-card">
                    <div className="client-avatar">
                      {cliente.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="client-info">
                      <h3>{cliente.nome}</h3>
                      <p>{cliente.telefone || 'Sem telefone'}</p>
                      <p className="client-email">{cliente.email || 'Sem email'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>Sem clientes cadastrados</h3>
                <p>Seus clientes aparecerão aqui quando você criar orçamentos.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 