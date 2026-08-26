import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import { currentCourseProfile, searchSkills } from '@amat19/course-content';

type Group = 'Study' | 'Labs' | 'Lessons' | 'Reference' | 'Actions';
type Result = { id: string; title: string; subtitle: string; href: string; group: Group };

const fixed: Result[] = [
  { id: 'study', title: 'Study Queue', subtitle: 'Recommended next work and recent sessions', href: '/study', group: 'Study' },
  { id: 'course', title: 'Course Map', subtitle: 'Five connected AMAT 19 modules', href: '/course', group: 'Study' },
  { id: 'practice', title: 'Mixed Practice', subtitle: 'Adaptive whole-course retrieval', href: '/practice', group: 'Actions' },
  { id: 'exam', title: 'Mixed Course Check', subtitle: 'Generated assessment with delayed feedback', href: '/exam', group: 'Actions' },
  { id: 'progress', title: 'Progress', subtitle: 'Skill-level learning evidence', href: '/progress', group: 'Study' },
  { id: 'saved', title: 'Saved', subtitle: 'Bookmarks and saved problems', href: '/saved', group: 'Actions' },
  { id: 'reference', title: 'Formula & Notation Reference', subtitle: 'Symbols, formulas, and repair links', href: '/reference', group: 'Reference' },
  { id: 'settings', title: 'Settings', subtitle: 'Notation, motion, practice, and display preferences', href: '/settings', group: 'Actions' },
];

const groupOrder: Group[] = ['Study', 'Labs', 'Lessons', 'Reference', 'Actions'];

function includesQuery(result: Result, query: string) {
  return `${result.title} ${result.subtitle} ${result.group}`.toLowerCase().includes(query);
}

function isPresent<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

function getSearchResults(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return fixed;

  const fixedResults = fixed.filter((result) => includesQuery(result, normalized));
  const labResults = currentCourseProfile.labs
    .filter((lab) => `${lab.title} ${lab.skillIds.join(' ')} ${lab.module}`.toLowerCase().includes(normalized))
    .map((lab) => ({
      id: `lab-${lab.id}`,
      title: lab.title,
      subtitle: `${lab.module} · ${lab.status}`,
      href: lab.href,
      group: 'Labs' as const,
    }));
  const skillResults = searchSkills(normalized).flatMap((skill) => [
    skill.labHref ? {
      id: `skill-lab-${skill.id}`,
      title: skill.title,
      subtitle: `${skill.description} · Open the lab`,
      href: skill.labHref,
      group: 'Labs' as const,
    } : null,
    skill.lessonHref ? {
      id: `skill-lesson-${skill.id}`,
      title: skill.title,
      subtitle: `${skill.description} · Read the lesson`,
      href: skill.lessonHref,
      group: 'Lessons' as const,
    } : null,
  ].filter(isPresent));

  const seen = new Set<string>();
  return [...fixedResults, ...labResults, ...skillResults].filter((result) => {
    const key = `${result.group}:${result.href}:${result.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 20);
}

export default function CommandPalette() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hydrated, setHydrated] = useState(false);
  const results = useMemo(() => getSearchResults(input), [input]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [input]);

  useEffect(() => {
    setHydrated(true);
    const open = () => {
      if (dialogRef.current?.open) return;
      setInput('');
      setActiveIndex(-1);
      dialogRef.current?.showModal();
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

  function close() {
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
    <dialog ref={dialogRef} className="command-dialog" aria-labelledby="command-dialog-title" data-hydrated={hydrated ? 'true' : undefined}>
      <div className="command-dialog__header">
        <h2 id="command-dialog-title" className="sr-only">Search AMAT 19</h2>
        <Search size={18} aria-hidden="true" />
        <input
          ref={inputRef}
          className="command-dialog__input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search skills, labs, or pages…"
          aria-label="Search skills, labs, or pages"
          aria-controls="command-dialog-results"
          aria-activedescendant={activeIndex >= 0 ? `command-result-${results[activeIndex]?.id}` : undefined}
          autoComplete="off"
        />
        <button className="site-nav__command" type="button" onClick={close} aria-label="Close search">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="command-dialog__list" id="command-dialog-results" aria-live="polite">
        {grouped.length ? grouped.map(({ group, results: groupResults }) => (
          <section className="command-group" key={group} aria-labelledby={`command-group-${group}`}>
            <h3 className="command-group__title" id={`command-group-${group}`}>{group}</h3>
            <div className="command-group__items">
              {groupResults.map(({ result, index }) => (
                <a
                  className="command-result"
                  id={`command-result-${result.id}`}
                  key={result.id}
                  href={result.href}
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
            <strong>No matching study tool.</strong>
            <p>Try “conditional”, “rref”, “annuity”, or “proof”.</p>
          </div>
        )}
      </div>
      <p className="command-dialog__hint" aria-live="polite">
        {results.length ? `${results.length} result${results.length === 1 ? '' : 's'} · use ↑ ↓ and Enter` : 'No results'}
      </p>
    </dialog>
  );
}
