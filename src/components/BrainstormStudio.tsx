import React from 'react';
import { ScenarioPrompt } from '../types';
import {
  Lightbulb,
  Briefcase,
  Users,
  HeartPulse,
  Globe,
  Smile,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface BrainstormStudioProps {
  onSelectPrompt: (promptText: string) => void;
}

export const BrainstormStudio: React.FC<BrainstormStudioProps> = ({ onSelectPrompt }) => {
  const scenarios: ScenarioPrompt[] = [
    {
      id: 'ceo-audit',
      title: 'CEO Pitch & Business Model Stress-Test',
      badge: 'Strategic Pushback',
      category: 'strategy',
      description:
        'Have Angel analyze your product thesis, point out vulnerable assumptions, and calculate real leverage.',
      prompt:
        "Angel, I want you to stress-test my current business strategy. Don't be a yes-woman—critique my revenue assumptions, point out blind spots, and tell me if I'm wasting capital.",
    },
    {
      id: 'talent-negotiation',
      title: 'High-Stakes Executive Negotiation Rehearsal',
      badge: 'Talent & Compensation',
      category: 'negotiation',
      description:
        'Roleplay a tough salary, equity, or client pitch negotiation with Angel acting as the counterparty.',
      prompt:
        "Angel, let's roleplay a high-stakes negotiation. You are a senior partner evaluating my contract terms. Push back hard on my pricing and see how I defend my value.",
    },
    {
      id: 'cross-border',
      title: 'Cross-Border Expansion (Asia • Africa • US)',
      badge: 'Multicultural Fluency',
      category: 'culture',
      description:
        'Tap into Angel’s childhood and professional background spanning Korea, Nigeria, Ghana, South Africa, and the US.',
      prompt:
        "Angel, looking across the markets you know intimately—from Seoul to Lagos, Accra, and New York—what are the key cultural and operational nuances I need to respect before expanding?",
    },
    {
      id: 'clinical-wellness',
      title: 'Clinical & Cognitive Endurance Audit',
      badge: 'M.D. Insight',
      category: 'wellness',
      description:
        'Review burnout prevention, focus architecture, and circadian energy cycles with your resident medical mind.',
      prompt:
        'Angel, as a medical doctor and high-output strategist, audit my current routine. How do I sustain peak cognitive endurance and recovery without burning out?',
    },
    {
      id: 'unvarnished-truth',
      title: 'The Unvarnished Reality Check',
      badge: 'Direct & Honest',
      category: 'strategy',
      description:
        'Get raw, unfiltered feedback on a risky or questionable decision with no corporate fluff.',
      prompt:
        "Angel, give me your 100% unvarnished, direct take on something I'm planning. If you think it's foolish or unprofitable, don't sugarcoat it—tell me straight.",
    },
    {
      id: 'witty-banter',
      title: 'High-Style Banter & Corny One-Liners',
      badge: 'Classy Wit',
      category: 'humor',
      description:
        'Lighten the mood with Angel’s signature situational humor and playful teasing.',
      prompt:
        'Angel, drop everything for a second. Give me your finest corny one-liner and tell me what interesting world news or observation has caught your eye today.',
    },
  ];

  const getCategoryIcon = (category: ScenarioPrompt['category']) => {
    switch (category) {
      case 'strategy':
        return <Briefcase className="w-4 h-4 text-amber-400" />;
      case 'negotiation':
        return <Users className="w-4 h-4 text-blue-400" />;
      case 'culture':
        return <Globe className="w-4 h-4 text-teal-400" />;
      case 'wellness':
        return <HeartPulse className="w-4 h-4 text-rose-400" />;
      case 'humor':
        return <Smile className="w-4 h-4 text-yellow-400" />;
    }
  };

  return (
    <div
      id="brainstorm-studio-panel"
      className="flex flex-col h-full rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/40">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 font-mono">
            Strategy & Scenario Consultation
          </h3>
        </div>
        <p className="text-[11px] text-zinc-400 mt-1">
          Select a tailored briefing or roleplay scenario to immediately launch a voice discussion with Angel.
        </p>
      </div>

      {/* Grid */}
      <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3">
        {scenarios.map((s) => (
          <div
            key={s.id}
            onClick={() => onSelectPrompt(s.prompt)}
            className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-900/80 transition group cursor-pointer flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                  {getCategoryIcon(s.category)}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {s.badge}
                </span>
              </div>
              <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-amber-300 transition">
                {s.title}
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">{s.description}</p>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-zinc-800/60 text-[11px] text-amber-400/80 group-hover:text-amber-300 font-medium">
              <span>Launch with Angel</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
