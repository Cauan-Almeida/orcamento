import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { ItemOrcamento, Cliente, Empresa } from '../types';
import Budget from '../components/Budget';
import ClientForm from '../components/ClientForm';
import { salvarOrcamentoFirestore } from '../utils/pdfGenerator';
import { generatePDF } from '../utils/pdfGenerator';
import '../styles/NovoOrcamento.css';
import ConnectionStatus from '../components/ConnectionStatus';

const NovoOrcamento = () => {
  const [cliente, setCliente] = useState<Cliente>({ nome: '', telefone: '', email: '' });
  const [itens, setItens] = useState<ItemOrcamento[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState<Empresa>({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        
        try {
          // Carregar dados da empresa
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              if (userData.empresa) {
                setEmpresa({
                  nome: userData.empresa || '',
                  cnpj: userData.cnpj || '',
                  telefone: userData.telefone || '',
                  email: userData.email || '',
                  endereco: userData.endereco || ''
                });
              }
            }
          } catch (error) {
            console.error("Erro ao carregar dados da empresa:", error);
            // Continuar com valores padrão se não conseguir carregar
          }
          
          // Carregar último cliente usado
          try {
            const savedCliente = localStorage.getItem('lastCliente');
            if (savedCliente) {
              try {
                setCliente(JSON.parse(savedCliente));
              } catch (e) {
                console.error('Erro ao carregar cliente:', e);
              }
            }
          } catch (error) {
            console.error("Erro ao carregar cliente do localStorage:", error);
          }
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleClienteSubmit = (clienteData: Cliente) => {
    setCliente(clienteData);
    localStorage.setItem('lastCliente', JSON.stringify(clienteData));
  };

  const handleItensChange = (novosItens: ItemOrcamento[]) => {
    setItens(novosItens);
  };

  const handleObservacoesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setObservacoes(e.target.value);
  };

  const salvarOrcamento = async () => {
    if (!cliente.nome || itens.length === 0) {
      alert('Por favor, preencha os dados do cliente e adicione pelo menos um item ao orçamento.');
      return;
    }

    if (!userId) {
      alert('Você precisa estar logado para salvar um orçamento.');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);

      const dataAtual = new Date();
      const anoAtual = dataAtual.getFullYear();
      const contadorKey = `orcamento_contador_${anoAtual}`;
      let proximoNumero = 1;

      const savedContador = localStorage.getItem(contadorKey);
      if (savedContador) {
        proximoNumero = parseInt(savedContador, 10) + 1;
      }
      
      const numeroFormatado = `${anoAtual}/${proximoNumero.toString().padStart(3, '0')}`;
      localStorage.setItem(contadorKey, proximoNumero.toString());

      const novoOrcamento = {
        id: uuidv4(),
        numeroOrcamento: numeroFormatado,
        cliente,
        itens,
        observacoes,
        data: dataAtual,
        empresa,
        firestoreId: undefined
      };

      try {
        // Salvar no Firestore
        const orcamentoId = await salvarOrcamentoFirestore(userId, novoOrcamento);
        
        // Gerar PDF
        generatePDF({...novoOrcamento, firestoreId: orcamentoId}, userId, () => {
          alert('Orçamento salvo e PDF gerado com sucesso!');
          
          // Limpar formulário
          setItens([]);
          setObservacoes('');
          
          // Redirecionar para o dashboard
          navigate('/dashboard');
        });
      } catch (error) {
        console.error("Erro ao salvar no Firestore ou gerar PDF:", error);
        
        // Se estivermos offline, salvar no localStorage para sincronizar depois
        const offlineOrcamentos = JSON.parse(localStorage.getItem('offline_orcamentos') || '[]');
        offlineOrcamentos.push({...novoOrcamento, pendingSave: true});
        localStorage.setItem('offline_orcamentos', JSON.stringify(offlineOrcamentos));
        
        alert("Você está offline. O orçamento foi salvo localmente e será sincronizado quando você estiver online novamente.");
        
        // Limpar formulário
        setItens([]);
        setObservacoes('');
        
        // Redirecionar para o dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error);
      alert("Ocorreu um erro ao salvar o orçamento. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const cancelar = () => {
    if (itens.length > 0 && !window.confirm("Tem certeza que deseja cancelar? Todos os dados preenchidos serão perdidos.")) {
      return;
    }
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="novo-orcamento-container">
      <ConnectionStatus />
      
      <header className="novo-orcamento-header">
        <h1>Novo Orçamento</h1>
        <div className="acoes">
          <button className="btn btn-secondary" onClick={cancelar}>Cancelar</button>
          <button className="btn btn-primary" onClick={salvarOrcamento}>Salvar e Gerar PDF</button>
        </div>
      </header>

      <div className="novo-orcamento-content">
        <ClientForm cliente={cliente} onSubmit={handleClienteSubmit} />
        
        <Budget 
          itens={itens}
          observacoes={observacoes}
          onItensChange={handleItensChange}
          onObservacoesChange={handleObservacoesChange}
        />
      </div>
    </div>
  );
};

export default NovoOrcamento; 