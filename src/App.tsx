import { useMemo, useState } from 'react';
import { Pencil, Play, RefreshCw, Route } from 'lucide-react';
import {
  DEFAULT_LANE_COUNT,
  DEFAULT_PARTICIPANTS,
  DEFAULT_RESULTS,
  createLadder,
  createResultAssignments,
  traceLadder,
  validateNames,
  type Ladder,
  type PathSegment,
  type TraceResult,
} from './lib/amida';

type RevealedResult = {
  resultIndex: number;
  trace: TraceResult;
};

const SVG_WIDTH = 680;
const SVG_HEIGHT = 420;
const TOP = 28;
const BOTTOM = 392;
const LEFT = 52;
const RIGHT = 628;
const TRACE_INTERVAL_MS = import.meta.env.MODE === 'test' ? 1 : 260;

function App() {
  const [participants, setParticipants] = useState(DEFAULT_PARTICIPANTS);
  const [results, setResults] = useState(DEFAULT_RESULTS);
  const [ladder, setLadder] = useState<Ladder | null>(null);
  const [revealed, setRevealed] = useState<Record<number, RevealedResult>>({});
  const [activeTrace, setActiveTrace] = useState<TraceResult | null>(null);
  const [visibleSegmentCount, setVisibleSegmentCount] = useState(0);
  const [activeParticipant, setActiveParticipant] = useState<number | null>(
    null,
  );
  const [validationAttempted, setValidationAttempted] = useState(false);

  const validationErrors = useMemo(
    () => validateNames(participants, results),
    [participants, results],
  );
  const assignments = useMemo(
    () => (ladder ? createResultAssignments(ladder) : []),
    [ladder],
  );
  const isTracing = activeParticipant !== null;

  const handleCreate = () => {
    setValidationAttempted(true);

    if (validationErrors.length > 0) {
      return;
    }

    setLadder(createLadder(DEFAULT_LANE_COUNT));
    setRevealed({});
    setActiveTrace(null);
    setVisibleSegmentCount(0);
    setActiveParticipant(null);
  };

  const handleEdit = () => {
    setLadder(null);
    setRevealed({});
    setActiveTrace(null);
    setVisibleSegmentCount(0);
    setActiveParticipant(null);
  };

  const startTrace = (participantIndex: number) => {
    if (!ladder || isTracing) {
      return;
    }

    const trace = traceLadder(ladder, participantIndex);
    setActiveTrace(trace);
    setVisibleSegmentCount(0);
    setActiveParticipant(participantIndex);

    let nextCount = 0;
    const timer = window.setInterval(() => {
      nextCount += 1;
      setVisibleSegmentCount(nextCount);

      if (nextCount >= trace.segments.length) {
        window.clearInterval(timer);
        setRevealed((current) => ({
          ...current,
          [participantIndex]: {
            resultIndex: trace.endLane,
            trace,
          },
        }));
        setActiveParticipant(null);
      }
    }, TRACE_INTERVAL_MS);
  };

  const updateParticipant = (index: number, value: string) => {
    setParticipants((current) =>
      current.map((name, i) => (i === index ? value : name)),
    );
  };

  const updateResult = (index: number, value: string) => {
    setResults((current) =>
      current.map((name, i) => (i === index ? value : name)),
    );
  };

  const revealedCount = Object.keys(revealed).length;
  const allRevealed = ladder !== null && revealedCount === DEFAULT_LANE_COUNT;
  const visibleSegments =
    activeTrace?.segments.slice(0, visibleSegmentCount) ?? [];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold text-sky-700">Amida SPA</p>
          <h1 className="text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
            あみだくじ
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            参加者と結果を入力して、1人ずつ経路をたどりながら結果を確認します。
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <div className="space-y-5">
            <InputPanel
              participants={participants}
              results={results}
              disabled={ladder !== null}
              onParticipantChange={updateParticipant}
              onResultChange={updateResult}
            />

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isTracing}
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {ladder ? (
                    <RefreshCw size={18} aria-hidden="true" />
                  ) : (
                    <Play size={18} aria-hidden="true" />
                  )}
                  {ladder ? 'もう一度作る' : 'あみだを作る'}
                </button>
                {ladder ? (
                  <button
                    type="button"
                    onClick={handleEdit}
                    disabled={isTracing}
                    className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    <Pencil size={18} aria-hidden="true" />
                    入力を編集する
                  </button>
                ) : null}
              </div>
              {validationAttempted && validationErrors.length > 0 ? (
                <ul
                  className="mt-3 space-y-1 text-sm text-red-600"
                  aria-live="polite"
                >
                  {validationErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              ) : null}
            </section>

            {ladder ? (
              <TraceControls
                participants={participants}
                results={results}
                assignments={assignments}
                revealed={revealed}
                activeParticipant={activeParticipant}
                onTrace={startTrace}
              />
            ) : null}
          </div>

          <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">あみだ表示</h2>
                <p className="text-sm text-slate-500">
                  {ladder
                    ? `${revealedCount} / ${DEFAULT_LANE_COUNT}人の結果を表示済み`
                    : '入力後に生成できます'}
                </p>
              </div>
              <Route className="h-6 w-6 text-sky-600" aria-hidden="true" />
            </div>

            {ladder ? (
              <LadderBoard
                ladder={ladder}
                participants={participants}
                results={results}
                visibleSegments={visibleSegments}
                revealed={revealed}
              />
            ) : (
              <div className="flex aspect-[4/3] min-h-[360px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                「あみだを作る」でここに表示されます
              </div>
            )}
          </section>
        </section>

        {ladder ? (
          <ResultsPanel
            participants={participants}
            results={results}
            revealed={revealed}
            allRevealed={allRevealed}
          />
        ) : null}
      </div>
    </main>
  );
}

type InputPanelProps = {
  participants: string[];
  results: string[];
  disabled: boolean;
  onParticipantChange: (index: number, value: string) => void;
  onResultChange: (index: number, value: string) => void;
};

function InputPanel({
  participants,
  results,
  disabled,
  onParticipantChange,
  onResultChange,
}: InputPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">入力</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <FieldGroup
          title="参加者"
          prefix="参加者"
          values={participants}
          disabled={disabled}
          onChange={onParticipantChange}
        />
        <FieldGroup
          title="結果"
          prefix="結果"
          values={results}
          disabled={disabled}
          onChange={onResultChange}
        />
      </div>
    </section>
  );
}

type FieldGroupProps = {
  title: string;
  prefix: string;
  values: string[];
  disabled: boolean;
  onChange: (index: number, value: string) => void;
};

function FieldGroup({
  title,
  prefix,
  values,
  disabled,
  onChange,
}: FieldGroupProps) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      <div className="grid gap-2">
        {values.map((value, index) => (
          <label
            key={`${prefix}-${index}`}
            className="grid gap-1 text-sm text-slate-600"
          >
            <span>
              {prefix}
              {index + 1}
            </span>
            <input
              value={value}
              disabled={disabled}
              aria-label={`${prefix}${index + 1}`}
              onChange={(event) => onChange(index, event.target.value)}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

type TraceControlsProps = {
  participants: string[];
  results: string[];
  assignments: number[];
  revealed: Record<number, RevealedResult>;
  activeParticipant: number | null;
  onTrace: (index: number) => void;
};

function TraceControls({
  participants,
  results,
  assignments,
  revealed,
  activeParticipant,
  onTrace,
}: TraceControlsProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">経路表示</h2>
      <div className="mt-4 grid gap-2">
        {participants.map((participant, index) => {
          const item = revealed[index];
          const isActive = activeParticipant === index;
          const isTracing = activeParticipant !== null;

          return (
            <div
              key={`trace-${index}`}
              className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-slate-200 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">
                  {participant}
                </p>
                <p className="text-sm text-slate-500">
                  {item
                    ? `結果: ${results[item.resultIndex]}`
                    : `結果: ${assignments[index] === undefined ? '未生成' : '未表示'}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onTrace(index)}
                disabled={isTracing}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <Play size={16} aria-hidden="true" />
                {isActive ? '表示中' : item ? '再度たどる' : 'たどる'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

type LadderBoardProps = {
  ladder: Ladder;
  participants: string[];
  results: string[];
  visibleSegments: PathSegment[];
  revealed: Record<number, RevealedResult>;
};

function LadderBoard({
  ladder,
  participants,
  results,
  visibleSegments,
  revealed,
}: LadderBoardProps) {
  const laneX = (lane: number) =>
    LEFT + (lane * (RIGHT - LEFT)) / (ladder.laneCount - 1);
  const levelY = (level: number) =>
    TOP + (level * (BOTTOM - TOP)) / ladder.levelCount;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[620px]">
        <div className="grid grid-cols-5 gap-2 pb-2 text-center text-sm font-semibold text-slate-700">
          {participants.map((participant, index) => (
            <span key={`top-${index}`} className="truncate px-1">
              {participant}
            </span>
          ))}
        </div>

        <svg
          role="img"
          aria-label="生成されたあみだくじ"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="h-auto w-full rounded-lg bg-slate-50"
        >
          {Array.from({ length: ladder.laneCount }, (_, lane) => (
            <line
              key={`lane-${lane}`}
              x1={laneX(lane)}
              y1={TOP}
              x2={laneX(lane)}
              y2={BOTTOM}
              stroke="#94a3b8"
              strokeWidth="4"
              strokeLinecap="round"
            />
          ))}

          {ladder.lines.map((line) => (
            <line
              key={line.id}
              x1={laneX(line.fromLane)}
              y1={levelY(line.level)}
              x2={laneX(line.toLane)}
              y2={levelY(line.level)}
              stroke="#64748b"
              strokeWidth="4"
              strokeLinecap="round"
            />
          ))}

          {Object.entries(revealed).map(([participantIndex, item]) => (
            <g key={`revealed-${participantIndex}`} opacity="0.28">
              {item.trace.segments.map((segment, index) => (
                <PathLine
                  key={`${participantIndex}-${index}`}
                  segment={segment}
                  laneX={laneX}
                  levelY={levelY}
                  color="#0ea5e9"
                  width={6}
                />
              ))}
            </g>
          ))}

          {visibleSegments.map((segment, index) => (
            <PathLine
              key={`active-${index}`}
              segment={segment}
              laneX={laneX}
              levelY={levelY}
              color="#dc2626"
              width={8}
            />
          ))}
        </svg>

        <div className="grid grid-cols-5 gap-2 pt-2 text-center text-sm font-semibold text-slate-700">
          {results.map((result, index) => {
            const isRevealed = Object.values(revealed).some(
              (item) => item.resultIndex === index,
            );

            return (
              <span key={`bottom-${index}`} className="truncate px-1">
                {isRevealed ? result : '???'}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type PathLineProps = {
  segment: PathSegment;
  laneX: (lane: number) => number;
  levelY: (level: number) => number;
  color: string;
  width: number;
};

function PathLine({ segment, laneX, levelY, color, width }: PathLineProps) {
  if (segment.kind === 'vertical') {
    return (
      <line
        x1={laneX(segment.lane)}
        y1={levelY(segment.fromLevel)}
        x2={laneX(segment.lane)}
        y2={levelY(segment.toLevel)}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
      />
    );
  }

  return (
    <line
      x1={laneX(segment.fromLane)}
      y1={levelY(segment.level)}
      x2={laneX(segment.toLane)}
      y2={levelY(segment.level)}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
    />
  );
}

type ResultsPanelProps = {
  participants: string[];
  results: string[];
  revealed: Record<number, RevealedResult>;
  allRevealed: boolean;
};

function ResultsPanel({
  participants,
  results,
  revealed,
  allRevealed,
}: ResultsPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-950">
          {allRevealed ? '最終結果一覧' : '結果'}
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {participants.map((participant, index) => {
          const item = revealed[index];

          return (
            <div
              key={`result-${index}`}
              className="rounded-lg border border-slate-200 p-3"
            >
              <p className="truncate text-sm font-semibold text-slate-950">
                {participant}
              </p>
              <p className="mt-2 text-xl font-bold text-sky-700">
                {item ? results[item.resultIndex] : '???'}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default App;
