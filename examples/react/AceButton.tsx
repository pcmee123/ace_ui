import type { ButtonHTMLAttributes } from 'react';
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'soft'|'ghost'|'danger'; size?: 'sm'|'lg'; loading?: boolean };
export function AceButton({variant,size,loading,disabled,className='',children,type='button',...props}: Props) {
  return <button {...props} type={type} className={['ace-btn',variant&&`ace-btn--${variant}`,size&&`ace-btn--${size}`,className].filter(Boolean).join(' ')} disabled={disabled||loading} aria-busy={loading||undefined}>
    {loading&&<i className="ace-spinner" aria-hidden="true"/>}{children}
  </button>;
}
