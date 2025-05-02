import React, { useState, useRef, useEffect } from 'react';

interface InputMoedaProps {
  value?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
  className?: string;
}

const InputMoeda: React.FC<InputMoedaProps> = ({
  value: propValue,
  onChange,
  placeholder = 'R$ 0,00',
  className = '',
}) => {
  // Estado interno do componente
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFormatting, setIsFormatting] = useState(false);

  // Formatar valor completo para o padrão brasileiro (usado apenas no onBlur)
  const formatarValorCompleto = (valor: string): string => {
    if (!valor) return '';
    
    // Remove todos os caracteres não numéricos, exceto vírgula
    let numeroLimpo = valor.replace(/[^\d,]/g, '');
    
    // Substitui múltiplas vírgulas por uma única
    numeroLimpo = numeroLimpo.replace(/,+/g, ',');
    
    // Se não tiver vírgula, assume zero casas decimais
    if (!numeroLimpo.includes(',')) {
      numeroLimpo += ',00';
    } else {
      // Garante até duas casas decimais após a vírgula
      const [inteiro, decimal] = numeroLimpo.split(',');
      if (decimal.length > 2) {
        numeroLimpo = `${inteiro},${decimal.substring(0, 2)}`;
      } else if (decimal.length === 1) {
        numeroLimpo = `${inteiro},${decimal}0`;
      }
    }
    
    // Adiciona separadores de milhar
    let [parteInteira, parteDecimal] = numeroLimpo.split(',');
    
    // Se tiver parteInteira vazia, use 0
    if (!parteInteira) parteInteira = '0';
    
    // Adiciona pontos como separadores de milhar
    parteInteira = parteInteira.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${parteInteira},${parteDecimal}`;
  };

  // Converte string formatada para número
  const converterParaNumero = (texto: string): number => {
    if (!texto) return 0;
    
    const valorLimpo = texto
      .replace(/\./g, '')
      .replace(',', '.');
    
    return parseFloat(valorLimpo) || 0;
  };

  // Inicializa o valor exibido com base na propriedade value
  useEffect(() => {
    if (propValue !== undefined && !isFormatting) {
      const formatted = propValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      setDisplayValue(formatted);
    }
  }, [propValue, isFormatting]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    
    // Permite apenas números, vírgulas e pontos
    const regex = /^[\d.,]*$/;
    if (!regex.test(value) && value !== '') {
      return;
    }
    
    // Simplesmente atualiza o estado com o valor digitado
    setDisplayValue(value);
    
    // Notifica o componente pai se fornecido
    if (onChange) {
      onChange(converterParaNumero(value));
    }
  };

  // Formata apenas quando o input perde o foco
  const handleBlur = () => {
    if (!displayValue) {
      if (onChange) {
        onChange(0);
      }
      return;
    }
    
    setIsFormatting(true);
    const valorFormatado = formatarValorCompleto(displayValue);
    setDisplayValue(valorFormatado);
    
    if (onChange) {
      onChange(converterParaNumero(valorFormatado));
    }
    setIsFormatting(false);
  };

  return (
    <div className={`input-moeda-container ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="input-moeda"
      />
    </div>
  );
};

export default InputMoeda; 