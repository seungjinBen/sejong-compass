import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { Code } from '@/api/backend';

interface Props {
  options: Code[] | undefined;
  value: string[];
  onChange: (codes: string[]) => void;
  placeholder?: string;
  max?: number;
}

/** 코드표에서 검색해 여러 개를 고르는 칩 입력 */
export function CodeMultiSelect({ options, value, onChange, placeholder = '검색 후 선택', max = 100 }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const nameOf = useMemo(() => new Map((options ?? []).map((o) => [o.code, o.name])), [options]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const selected = new Set(value);
    return (options ?? [])
      .filter((o) => !selected.has(o.code) && (q === '' || o.name.toLowerCase().includes(q)))
      .slice(0, 12);
  }, [options, query, value]);

  function add(code: string) {
    if (value.includes(code) || value.length >= max) return;
    onChange([...value, code]);
    setQuery('');
  }

  return (
    <div className="relative">
      <div className="border border-gray-200 rounded-lg p-2 flex flex-wrap gap-1.5 min-h-[42px] bg-white focus-within:border-primary">
        {value.map((code) => (
          <span
            key={code}
            className="flex items-center gap-1 bg-primary-light text-primary text-xs px-2 py-1 rounded-full"
          >
            {nameOf.get(code) ?? code}
            <button type="button" onClick={() => onChange(value.filter((v) => v !== code))} aria-label="제거">
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const first = matches[0];
              if (first) add(first.code);
            }
          }}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] text-xs outline-none bg-transparent"
        />
      </div>
      {open && matches.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg text-xs">
          {matches.map((o) => (
            <li key={o.code}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(o.code)}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-50"
              >
                {o.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
