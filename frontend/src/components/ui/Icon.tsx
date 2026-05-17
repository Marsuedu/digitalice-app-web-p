import type { SVGProps } from 'react';
import type { ReactElement } from 'react';

type IconName = 'dashboard' | 'products' | 'students' | 'teachers' | 'enrollments' | 'payments' | 'settings' | 'search' | 'plus' | 'edit' | 'delete' | 'chart' | 'mail' | 'file';

type Props = SVGProps<SVGSVGElement> & {
  name: IconName;
};

export function Icon({ name, ...props }: Props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {paths[name]}
    </svg>
  );
}

const paths: Record<IconName, ReactElement> = {
  dashboard: <><rect x="3" y="3" width="7" height="8" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="15" width="7" height="6" rx="1" /></>,
  products: <><path d="M4 19V5" /><path d="M8 19V7" /><path d="M12 19V4" /><path d="M16 19v-9" /><path d="M20 19V8" /></>,
  students: <><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /></>,
  teachers: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 14.5-4 16 0" /></>,
  enrollments: <><path d="M6 3h9l3 3v15H6z" /><path d="M14 3v4h4" /><path d="M9 13h6" /><path d="M9 17h4" /></>,
  payments: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /><path d="M7 15h4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.8 1.8 0 0 0 .3 2l.1.1-2 2-.1-.1a1.8 1.8 0 0 0-2-.3 1.8 1.8 0 0 0-1 1.6V21h-3v-.2a1.8 1.8 0 0 0-1-1.6 1.8 1.8 0 0 0-2 .3l-.1.1-2-2 .1-.1a1.8 1.8 0 0 0 .3-2 1.8 1.8 0 0 0-1.6-1H5v-3h.2a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0-.3-2l-.1-.1 2-2 .1.1a1.8 1.8 0 0 0 2 .3 1.8 1.8 0 0 0 1-1.6V3h3v.2a1.8 1.8 0 0 0 1 1.6 1.8 1.8 0 0 0 2-.3l.1-.1 2 2-.1.1a1.8 1.8 0 0 0-.3 2 1.8 1.8 0 0 0 1.6 1h.2v3h-.2a1.8 1.8 0 0 0-1.4 1.5Z" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
  delete: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 15H6L5 6" /></>,
  chart: <><path d="M4 19V5" /><path d="M4 19h16" /><rect x="7" y="11" width="3" height="5" /><rect x="12" y="7" width="3" height="9" /><rect x="17" y="9" width="3" height="7" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  file: <><path d="M6 3h9l3 3v15H6z" /><path d="M14 3v4h4" /></>,
};
