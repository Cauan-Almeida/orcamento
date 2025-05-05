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
  placeholder = 'Digite o valor',
  className = '',
}) => {
  // Estado interno do componente
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Converte string para número
  const converterParaNumero = (texto: string): number => {
    if (!texto) return 0;
    
    // Permite tanto ponto quanto vírgula como separador decimal
    const valorLimpo = texto
      .replace(/[^\d.,]/g, '')
      .replace(',', '.');
    
    return parseFloat(valorLimpo) || 0;
  };

  // Inicializa o valor exibido com base na propriedade value
  useEffect(() => {
    if (propValue !== undefined) {
      // Mantém o valor como string para preservar a forma que o usuário digitou
      setDisplayValue(propValue.toString().replace('.', ','));
    }
  }, [propValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    
    // Permite apenas números, vírgulas e pontos
    const regex = /^[\d.,]*$/;
    if (!regex.test(value) && value !== '') {
      return;
    }
    
    // Atualiza o estado com o valor digitado sem formatação
    setDisplayValue(value);
    
    // Notifica o componente pai se fornecido
    if (onChange) {
      const valorNumerico = converterParaNumero(value);
      onChange(valorNumerico);
    }
  };

  // Apenas converte o valor para número quando o input perde o foco
  const handleBlur = () => {
    if (!displayValue) {
      if (onChange) {
        onChange(0);
      }
      return;
    }
    
    if (onChange) {
      const valorNumerico = converterParaNumero(displayValue);
      onChange(valorNumerico);
    }
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
        className="form-input"
      />
    </div>
  );
};

export default InputMoeda; 