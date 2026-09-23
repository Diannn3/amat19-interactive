import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import { currentCourseProfile, searchSkills } from '@amat19/course-content';
import { learnerModuleLabel } from '../../lib/learner-labels';

type Group = 'Workspace' | 'Workbenches' | 'Lessons' | 'Library' | 'Checks';
type Result = { id: string; title: string; subtitle: string; href: string; group: Group };

const fixed: Result[] = [
  { id: 'study', title: 'Study Queue', subtitle: 'Recommended next work and recent sessions', href: '/study', group: 'Workspace' },
  { id: 'course', title: 'Course Map', subtitle: 'Five connected AMAT 19 modules', href: '/course', group: 'Workspace' },
  { id: 'exam', title: 'Mixed Course Check', subtitle: 'Whole-course check with feedback after submission', href: '/exam', group: 'Checks' },
  { id: 'progress', title: 'Progress', subtitle: 'Skill-level learning evidence', href: '/progress', group: 'Workspace' },
  { id: 'saved', title: 'Saved', subtitle: 'Bookmarks and saved problems', href: '/saved', group: 'Library' },
  { id: 'reference', title: 'Formula & Notation Reference', subtitle: 'Symbols, formulas, and repair links', href: '/reference', group: 'Library' },
  { id: 'settings', title: 'Settings', subtitle: 'Notation, motion, and display preferences', href: '/settings', group: 'Library' },
];

const groupOrder: Group[] = ['Workspace', 'Workbenches', 'Lessons', 'Library', 'Checks'];

function includesQuery(result: Result, query: string) {
  return `${result.title} ${result.subtitle} ${result.group}`.toLowerCase().includes(query);
}

function getSearchResults(query: string) {
  const normalized = query.trim().toLowerCase();
  const workbenchResults = currentCourseProfile.workbenches
    .filter((workbench) => {
      const absorbedLabIds = new Set(workbench.absorbedLabIds);
      const labs = currentCourseProfile.labs.filter((lab) => absorbedLabIds.has(lab.id));
      const skillIds = new Set(labs.flatMap((lab) => lab.skillIds));
      const skills = currentCourseProfile.skills.filter((skill) => skillIds.has(skill.id));
      return [
        workbench.title,
        workbench.description,
        workbench.notation,
        learnerModuleLabel(workbench.id),
        ...labs.map((lab) => lab.title),
        ...skills.flatMap((skill) => [skill.title, skill.description]),
      ].join(' ').toLowerCase().includes(normalized);
    })
    .map((workbench) => ({
      id: `workbench-${workbench.id}`,
      title: workbench.title,
      subtitle: `${learnerModuleLabel(workbench.id)} · ${workbench.description}`,
      href: workbench.href,
      group: 'Workbenches' as const,
    }));

  if (!normalized) return [...fixed, ...workbenchResults];

  const fixedResults = fixed.filter((result) => includesQuery(result, normalized));
  const lessonResults = searchSkills(normalized).flatMap((skill) => [
    skill.lessonHref ? {
      id: `skill-lesson-${skill.id}`,
      title: skill.title,
      subtitle: `${skill.description} · Read the lesson`,
      href: skill.lessonHref,
      group: 'Lessons' as const,
    } : null,
  ]).filter((result): result is NonNullable<typeof result> => result !== null);

  const seen = new Set<string>();
  return [...fixedResults, ...workbenchResults, ...lessonResults].filter((result) => {
    const key = `${result.group}:${result.href}:${result.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 20);
}

export default function CommandPalette() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [input, setInput] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hydrated, setHydrated] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const results = useMemo(() => getSearchResults(input), [input]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [input]);

  useEffect(() => {
    setHydrated(true);
    const open = (event?: Event) => {
      if (dialogRef.current?.open) return;
      const detail = event instanceof CustomEvent ? event.detail as { trigger?: unknown } | null : null;
      const activeElement = document.activeElement;
      openerRef.current = detail?.trigger instanceof HTMLElement
        ? detail.trigger
        : activeElement instanceof HTMLElement && activeElement !== document.body
        ? activeElement
        : document.querySelector<HTMLElement>('[data-command-button]');
      setInput('');
      setActiveIndex(-1);
      dialogRef.current?.showModal();
      setDialogOpen(true);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    };
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener('amat:command', open);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('amat:command', open);
      window.removeEventListener('keydown', key);
    };
  }, []);

  function restoreFocus() {
    const opener = openerRef.current;
    if (!opener?.isConnected) return;
    window.setTimeout(() => opener.focus({ preventScroll: true }), 0);
  }

  function close() {
    setDialogOpen(false);
    dialogRef.current?.close();
  }

  function selectActive() {
    const result = results[activeIndex];
    if (result) window.location.assign(result.href);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => results.length ? (index + 1) % results.length : -1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => results.length ? (index - 1 + results.length) % results.length : -1);
    } else if (event.key === 'Home' && results.length) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End' && results.length) {
      event.preventDefault();
      setActiveIndex(results.length - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      selectActive();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  }

  const grouped = groupOrder.map((group) => ({
    group,
    results: results.map((result, index) => ({ result, index })).filter(({ result }) => result.group === group),
  })).filter((entry) => entry.results.length > 0);

  return (
    <dialog ref={dialogRef} className="command-dialog" aria-labelledby="command-dialog-title" onClose={() => { setDialogOpen(false); restoreFocus(); }} data-hydrated={hydrated ? 'true' : undefined}>
      <div className="command-dialog__header">
        <h2 id="command-dialog-title" className="sr-only">Search AMAT 19</h2>
        <Search size={18} aria-hidden="true" />
        <input
          ref={inputRef}
          className="command-dialog__input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search skills, workbenches, or pages…"
          aria-label="Search skills, workbenches, or pages"
          role="combobox"
          aria-expanded={dialogOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls="command-dialog-results"
          aria-activedescendant={activeIndex >= 0 ? `command-result-${results[activeIndex]?.id}` : undefined}
          autoComplete="off"
        />
        <button className="command-dialog__close" type="button" onClick={close} aria-label="Close search">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="command-dialog__list" id="command-dialog-results" role="listbox" aria-label="Study results">
        {grouped.length ? grouped.map(({ group, results: groupResults }) => (
          <section className="command-group" key={group} role="group" aria-label={group}>
            <span className="command-group__title" aria-hidden="true">{group}</span>
            <div className="command-group__items">
              {groupResults.map(({ result, index }) => (
                <a
                  className="command-result"
                  id={`command-result-${result.id}`}
                  key={result.id}
                  href={result.href}
                  role="option"
                  aria-selected={activeIndex === index ? 'true' : 'false'}
                  data-active={activeIndex === index ? 'true' : 'false'}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={close}
                >
                  <span><strong>{result.title}</strong><small>{result.subtitle}</small></span>
                  <small>{result.group}</small>
                </a>
              ))}
            </div>
          </section>
        )) : (
          <div className="empty-state">
            <BookOpen aria-hidden="true" />
            <strong>No matching course result.</strong>
            <p>Try “conditional”, “row reduction”, “annuity”, or “proof”.</p>
          </div>
        )}
      </div>
      <p className="command-dialog__hint" aria-live="polite">
        {results.length ? `${results.length} result${results.length === 1 ? '' : 's'} · use ↑ ↓ and Enter` : 'No results'}
      </p>
    </dialog>
  );
}
