'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { FileText, Lightbulb, GraduationCap } from 'lucide-react';

interface KnowledgeNavTabsProps {
  title?: string;
  description?: string;
}

export function KnowledgeNavTabs({
  title,
  description,
}: KnowledgeNavTabsProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const displayTitle = title || t('knowledge.title');
  const displayDescription = description || t('knowledge.knowledgeDescription');

  const tabs = [
    {
      href: '/knowledge/notes',
      label: t('knowledge.navNotes'),
      icon: FileText,
      active: pathname.startsWith('/knowledge/notes'),
    },
    {
      href: '/knowledge/lessons',
      label: t('knowledge.navLessons'),
      icon: Lightbulb,
      active: pathname.startsWith('/knowledge/lessons'),
    },
    {
      href: '/knowledge/learning',
      label: t('knowledge.navLearning'),
      icon: GraduationCap,
      active: pathname.startsWith('/knowledge/learning'),
    },
  ];

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{displayTitle}</h1>
          <p className="mt-1 text-xs text-slate-400">{displayDescription}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition whitespace-nowrap border-b-2 ${
                tab.active
                  ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <Icon className={`h-4 w-4 ${tab.active ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
