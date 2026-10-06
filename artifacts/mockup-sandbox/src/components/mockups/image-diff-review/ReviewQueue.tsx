import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Columns2,
  FileImage,
  FolderOpen,
  Image as ImageIcon,
  Info,
  Keyboard,
  LayoutGrid,
  ListFilter,
  Maximize2,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import "./review-queue.css";

type Photo = {
  name: string;
  size: string;
  dimensions: string;
  date: string;
  camera: string;
  src: string;
};

type Pair = {
  id: string;
  title: string;
  similarity: number;
  recovered: string;
  left: Photo;
  right: Photo;
  verdict: "review" | "keep-left" | "keep-right";
};

const initialPairs: Pair[] = [
  {
    id: "01",
    title: "Alpine pass · frame 8842",
    similarity: 94,
    recovered: "4.1 MB",
    left: {
      name: "DSC_8842.JPG",
      size: "8.4 MB",
      dimensions: "6000 × 4000",
      date: "15 Nov 2023 · 08:42",
      camera: "Fujifilm X-T5",
      src: "/__mockup/images/imagediff-queue-landscape-a.png",
    },
    right: {
      name: "DSC_8843.JPG",
      size: "4.3 MB",
      dimensions: "6000 × 4000",
      date: "15 Nov 2023 · 08:42",
      camera: "Fujifilm X-T5",
      src: "/__mockup/images/imagediff-queue-landscape-b.png",
    },
    verdict: "review",
  },
  {
    id: "02",
    title: "Shinjuku after rain · 02",
    similarity: 87,
    recovered: "12.2 MB",
    left: {
      name: "TOKYO_NIGHT_V1.PNG",
      size: "24.8 MB",
      dimensions: "3840 × 2160",
      date: "01 Dec 2023 · 22:15",
      camera: "Sony A7 IV",
      src: "/__mockup/images/imagediff-queue-city-a.png",
    },
    right: {
      name: "TOKYO_NIGHT_V2.PNG",
      size: "12.6 MB",
      dimensions: "3840 × 2160",
      date: "01 Dec 2023 · 22:18",
      camera: "Sony A7 IV",
      src: "/__mockup/images/imagediff-queue-city-b.png",
    },
    verdict: "review",
  },
  {
    id: "03",
    title: "Alpine pass · backup",
    similarity: 100,
    recovered: "4.2 MB",
    left: {
      name: "BACKUP_DSC_8842.JPG",
      size: "4.2 MB",
      dimensions: "6000 × 4000",
      date: "16 Nov 2023 · 10:00",
      camera: "Fujifilm X-T5",
      src: "/__mockup/images/imagediff-queue-landscape-a.png",
    },
    right: {
      name: "DSC_8842_COPY.JPG",
      size: "8.4 MB",
      dimensions: "6000 × 4000",
      date: "15 Nov 2023 · 08:42",
      camera: "Fujifilm X-T5",
      src: "/__mockup/images/imagediff-queue-landscape-a.png",
    },
    verdict: "review",
  },
  {
    id: "04",
    title: "Shinjuku after rain · 03",
    similarity: 82,
    recovered: "3.6 MB",
    left: {
      name: "IMG_2901.HEIC",
      size: "6.1 MB",
      dimensions: "4032 × 3024",
      date: "01 Dec 2023 · 22:24",
      camera: "iPhone 15 Pro",
      src: "/__mockup/images/imagediff-queue-city-a.png",
    },
    right: {
      name: "IMG_2904.HEIC",
      size: "2.5 MB",
      dimensions: "4032 × 3024",
      date: "01 Dec 2023 · 22:31",
      camera: "iPhone 15 Pro",
      src: "/__mockup/images/imagediff-queue-city-b.png",
    },
    verdict: "review",
  },
];

function PhotoImage({ photo, className = "" }: { photo: Photo; className?: string }) {
  return <img className={className} src={photo.src} alt={photo.name} draggable={false} />;
}

export default function ReviewQueue() {
  const [pairs, setPairs] = useState(initialPairs);
  const [activeId, setActiveId] = useState(initialPairs[0].id);
  const [mode, setMode] = useState<"split" | "wipe">("split");
  const [wipePosition, setWipePosition] = useState(53);
  const [threshold, setThreshold] = useState(80);
  const [query, setQuery] = useState("");
  const [showOnlyReview, setShowOnlyReview] = useState(false);
  const [folderName, setFolderName] = useState("Weekend archive");
  const [fileCount, setFileCount] = useState(1248);
  const [notice, setNotice] = useState("");
  const folderInput = useRef<HTMLInputElement>(null);
  const activePair = pairs.find((pair) => pair.id === activeId) ?? pairs[0];
  const visiblePairs = useMemo(
    () => pairs.filter((pair) => {
      const matchesThreshold = pair.similarity >= threshold;
      const matchesQuery = `${pair.title} ${pair.left.name} ${pair.right.name}`.toLowerCase().includes(query.toLowerCase());
      return matchesThreshold && matchesQuery && (!showOnlyReview || pair.verdict === "review");
    }),
    [pairs, threshold, query, showOnlyReview],
  );
  const reviewedCount = pairs.filter((pair) => pair.verdict !== "review").length;
  const decide = (verdict: Pair["verdict"]) => {
    setPairs((current) => current.map((pair) => pair.id === activeId ? { ...pair, verdict } : pair));
    const next = visiblePairs.find((pair) => pair.id !== activeId && pair.verdict === "review");
    if (next) setActiveId(next.id);
    setNotice(verdict === "keep-left" ? "Left copy kept. Right copy queued for removal." : verdict === "keep-right" ? "Right copy kept. Left copy queued for removal." : "Pair returned to your review queue.");
  };

  const movePair = (direction: -1 | 1) => {
    const index = visiblePairs.findIndex((pair) => pair.id === activeId);
    const next = visiblePairs[(index + direction + visiblePairs.length) % visiblePairs.length];
    if (next) setActiveId(next.id);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "ArrowRight") movePair(1);
      if (event.key === "ArrowLeft") movePair(-1);
      if (event.key.toLowerCase() === "a") decide("keep-left");
      if (event.key.toLowerCase() === "d") decide("keep-right");
      if (event.key === "Escape") setNotice("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (visiblePairs.length && !visiblePairs.some((pair) => pair.id === activeId)) {
      setActiveId(visiblePairs[0].id);
    }
  }, [visiblePairs, activeId]);

  const selectFolder = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setFolderName(files[0].webkitRelativePath.split("/")[0] || "Selected folder");
    setFileCount(files.length);
    setNotice(`Ready to compare ${files.length.toLocaleString()} files. Analysis stays on this device.`);
  };

  const applyExact = () => {
    const exact = pairs.filter((pair) => pair.similarity === 100 && pair.verdict === "review");
    setPairs((current) => current.map((pair) => pair.similarity === 100
      ? { ...pair, verdict: pair.left.size < pair.right.size ? "keep-left" : "keep-right" }
      : pair));
    setNotice(exact.length ? `${exact.length} exact match${exact.length > 1 ? "es" : ""} sorted by file size. Review before applying.` : "No unreviewed exact matches in this archive.");
  };

  return (
    <div className="rq-shell">
      <header className="rq-topbar">
        <div className="rq-brand">
          <div className="rq-mark"><ImageIcon size={17} strokeWidth={1.7} /></div>
          <span>imagediff<span className="rq-brand-light"> / review</span></span>
        </div>
        <div className="rq-breadcrumb">
          <span>LIBRARY</span><ChevronRight size={13} /><strong>{folderName}</strong>
          <span className="rq-local"><i /> LOCAL ONLY</span>
        </div>
        <div className="rq-top-actions">
          <button className="rq-quiet-button" onClick={() => setNotice("Keyboard: ← → browse pairs · A keep left · D keep right")}><Keyboard size={15} /> Shortcuts</button>
          <button className="rq-icon-button" aria-label="Help" onClick={() => setNotice("Compare near-duplicates, choose the original, then review the removal list before applying.")}><CircleHelp size={17} /></button>
          <div className="rq-avatar">M</div>
        </div>
      </header>

      <div className="rq-workspace">
        <aside className="rq-queue">
          <div className="rq-queue-head">
            <div className="rq-overline">YOUR LIBRARY</div>
            <button className="rq-icon-button rq-small" aria-label="Choose folder" onClick={() => folderInput.current?.click()}><FolderOpen size={16} /></button>
            <input ref={folderInput} className="rq-hidden" type="file" multiple {...({ webkitdirectory: "", directory: "" } as object)} onChange={selectFolder} />
          </div>
          <button className="rq-library-active" onClick={() => setShowOnlyReview(false)}>
            <span className="rq-library-icon"><FolderOpen size={16} /></span>
            <span className="rq-library-name">{folderName}<small>{fileCount.toLocaleString()} images</small></span>
            <ChevronDown size={14} />
          </button>

          <div className="rq-queue-summary">
            <div className="rq-queue-title">
              <span>Review queue</span>
              <span className="rq-count">{visiblePairs.length.toString().padStart(2, "0")}</span>
            </div>
            <div className="rq-progress"><span style={{ width: `${Math.max(0, Math.min(100, reviewedCount / pairs.length * 100))}%` }} /></div>
            <div className="rq-progress-label"><span>{reviewedCount} of {pairs.length} resolved</span><span>{Math.round(reviewedCount / pairs.length * 100)}%</span></div>
          </div>

          <div className="rq-list-tools">
            <label className="rq-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a pair…" /><kbd>⌘ K</kbd></label>
            <button className={`rq-filter-button ${showOnlyReview ? "is-active" : ""}`} aria-label="Toggle unresolved filter" onClick={() => setShowOnlyReview((value) => !value)}><ListFilter size={15} /></button>
          </div>

          <div className="rq-pair-list">
            {visiblePairs.map((pair, index) => (
              <button key={pair.id} className={`rq-pair-row ${activeId === pair.id ? "is-selected" : ""}`} onClick={() => setActiveId(pair.id)}>
                <span className="rq-row-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="rq-thumb-pair">
                  <PhotoImage photo={pair.left} />
                  <PhotoImage photo={pair.right} />
                </span>
                <span className="rq-pair-copy">
                  <strong>{pair.title}</strong>
                  <span>{pair.similarity}% match <i /> {pair.recovered} recoverable</span>
                </span>
                {pair.verdict !== "review" ? <span className="rq-done"><Check size={13} /></span> : <span className={`rq-match-dot ${pair.similarity === 100 ? "exact" : ""}`} />}
              </button>
            ))}
            {!visiblePairs.length && <div className="rq-empty">Nothing in this view.<button onClick={() => { setQuery(""); setThreshold(0); setShowOnlyReview(false); }}>Show all pairs</button></div>}
          </div>

          <div className="rq-queue-footer">
            <button className="rq-add-folder" onClick={() => folderInput.current?.click()}><FolderOpen size={15} /> Open another folder</button>
            <div className="rq-storage-note"><ShieldCheck size={14} /><span>Files never leave your device</span></div>
          </div>
        </aside>

        <main className="rq-main">
          <div className="rq-main-head">
            <div className="rq-title-block">
              <div className="rq-kicker"><span>PAIR {activePair?.id ?? "—"}</span><i /> IMAGE REVIEW</div>
              <h1>{activePair?.title ?? "Review your archive"}</h1>
              <p>Two files, one decision. Keep the version worth keeping.</p>
            </div>
            <div className="rq-main-actions">
              <button className="rq-outline-button" onClick={applyExact}><Sparkles size={15} /> Sort exact matches</button>
              <button className="rq-more-button" aria-label="More options" onClick={() => setNotice("The deletion list stays reviewable until you apply changes.")}><Settings2 size={17} /></button>
            </div>
          </div>

          {activePair ? (
            <>
              <section className="rq-comparison">
                <div className="rq-canvas-top">
                  <div className="rq-score"><span className={activePair.similarity === 100 ? "rq-score-perfect" : ""}>{activePair.similarity}%</span><div><strong>visual match</strong><small>{activePair.similarity === 100 ? "Identical appearance" : "Likely alternate export"}</small></div></div>
                  <div className="rq-canvas-tools">
                    <div className="rq-mode-switch">
                      <button className={mode === "split" ? "is-active" : ""} onClick={() => setMode("split")}><Columns2 size={14} /> Split</button>
                      <button className={mode === "wipe" ? "is-active" : ""} onClick={() => setMode("wipe")}><SlidersHorizontal size={14} /> Wipe</button>
                    </div>
                    <button className="rq-zoom-button" onClick={() => setNotice("Preview fitted to frame.")}><Maximize2 size={15} /></button>
                  </div>
                </div>
                {mode === "split" ? (
                  <div className="rq-image-stage">
                    <div className="rq-image-half"><PhotoImage photo={activePair.left} /><span className="rq-image-tag"><i>A</i> ORIGINAL</span></div>
                    <div className="rq-image-half"><PhotoImage photo={activePair.right} /><span className="rq-image-tag"><i>B</i> COPY</span></div>
                    <span className="rq-seam" />
                  </div>
                ) : (
                  <div className="rq-image-stage rq-wipe-stage">
                    <PhotoImage photo={activePair.right} className="rq-wipe-under" />
                    <div className="rq-wipe-top" style={{ width: `${wipePosition}%` }}><PhotoImage photo={activePair.left} /></div>
                    <div className="rq-wipe-handle" style={{ left: `${wipePosition}%` }}><span /></div>
                    <input className="rq-wipe-range" type="range" min="10" max="90" value={wipePosition} onChange={(event) => setWipePosition(Number(event.target.value))} aria-label="Adjust image comparison split" />
                    <span className="rq-wipe-label rq-wipe-a">A · ORIGINAL</span><span className="rq-wipe-label rq-wipe-b">B · COPY</span>
                  </div>
                )}
                <div className="rq-image-captions">
                  <div className="rq-caption"><span className="rq-caption-key">A</span><span><strong>{activePair.left.name}</strong><small>{activePair.left.dimensions} · {activePair.left.size}</small></span></div>
                  <div className="rq-caption-center"><span>VS</span><span className="rq-similarity-line" /></div>
                  <div className="rq-caption rq-caption-right"><span className="rq-caption-key rq-key-b">B</span><span><strong>{activePair.right.name}</strong><small>{activePair.right.dimensions} · {activePair.right.size}</small></span></div>
                </div>
              </section>

              <section className="rq-verdict">
                <div className="rq-verdict-question"><span>THE VERDICT</span><strong>Which file stays?</strong></div>
                <button className="rq-keep-button" onClick={() => decide("keep-left")}><span className="rq-keep-key">A</span><span>Keep original<small>{activePair.left.name}</small></span><ArrowLeft size={16} /></button>
                <button className="rq-keep-button" onClick={() => decide("keep-right")}><span className="rq-keep-key">D</span><span>Keep copy<small>{activePair.right.name}</small></span><ArrowRight size={16} /></button>
                <button className="rq-skip-button" onClick={() => movePair(1)}>Skip <ArrowRight size={14} /></button>
              </section>
            </>
          ) : (
            <div className="rq-finished"><span className="rq-finish-mark"><Check size={25} /></span><h2>Queue cleared.</h2><p>Every visible pair has a verdict. Your originals are still untouched.</p><button onClick={() => setShowOnlyReview(false)}>Review resolved pairs</button></div>
          )}

          <div className="rq-bottom-line">
            <span><Info size={13} /> Similarity is visual; it does not indicate byte-for-byte identity.</span>
            <span><span className="rq-keycap">←</span><span className="rq-keycap">→</span> browse pairs</span>
          </div>
        </main>

        <aside className="rq-inspector">
          <div className="rq-inspector-head"><span>PAIR DETAILS</span><button className="rq-icon-button rq-small" onClick={() => setNotice("Metadata is read from the selected image files.")} aria-label="Details information"><Info size={15} /></button></div>
          <div className="rq-inspector-score"><div className="rq-ring"><span>{activePair?.similarity ?? 0}<small>%</small></span></div><div><strong>Near duplicate</strong><span>{activePair?.similarity === 100 ? "Same visual content" : "Similar composition"}</span></div></div>
          <div className="rq-detail-section">
            <div className="rq-detail-title"><span>FILE A</span><span className="rq-detail-original">ORIGINAL</span></div>
            <div className="rq-file-name"><FileImage size={15} /><strong>{activePair?.left.name}</strong></div>
            <dl><div><dt>File size</dt><dd>{activePair?.left.size}</dd></div><div><dt>Dimensions</dt><dd>{activePair?.left.dimensions}</dd></div><div><dt>Captured</dt><dd>{activePair?.left.date}</dd></div><div><dt>Camera</dt><dd>{activePair?.left.camera}</dd></div></dl>
          </div>
          <div className="rq-detail-section rq-detail-b">
            <div className="rq-detail-title"><span>FILE B</span><span className="rq-detail-copy">COPY</span></div>
            <div className="rq-file-name"><FileImage size={15} /><strong>{activePair?.right.name}</strong></div>
            <dl><div><dt>File size</dt><dd>{activePair?.right.size}</dd></div><div><dt>Dimensions</dt><dd>{activePair?.right.dimensions}</dd></div><div><dt>Captured</dt><dd>{activePair?.right.date}</dd></div><div><dt>Camera</dt><dd>{activePair?.right.camera}</dd></div></dl>
          </div>
          <div className="rq-recovery">
            <div className="rq-recovery-icon"><ArrowDownToLine size={16} /></div>
            <div><span>SPACE TO RECLAIM</span><strong>{activePair?.recovered ?? "—"}</strong></div>
            <small>if copy is removed</small>
          </div>
          <div className="rq-threshold">
            <div className="rq-threshold-head"><span>SIMILARITY FILTER</span><strong>{threshold}%+</strong></div>
            <input type="range" min="0" max="100" step="1" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} aria-label="Minimum similarity threshold" />
            <div className="rq-threshold-labels"><span>More results</span><span>Exact only</span></div>
          </div>
          <div className="rq-inspector-bottom">
            <button onClick={() => decide("review")}><X size={14} /> Clear this decision</button>
            <span><LayoutGrid size={13} /> {pairs.length} pairs in this scan</span>
          </div>
        </aside>
      </div>

      <footer className="rq-footer">
        <div><span className="rq-footer-dot" /> REVIEWING LOCALLY <i /> {folderName}</div>
        <div className="rq-footer-progress"><span>{reviewedCount} / {pairs.length} pairs reviewed</span><span className="rq-footer-bar"><i style={{ width: `${reviewedCount / pairs.length * 100}%` }} /></span></div>
        <button className="rq-apply-button" onClick={() => setNotice(reviewedCount ? `${reviewedCount} decision${reviewedCount > 1 ? "s" : ""} ready. Open the removal list to confirm before deleting.` : "Choose which version to keep before applying changes.")}><Trash2 size={14} /> Review removals <span>{pairs.filter((pair) => pair.verdict === "keep-left" || pair.verdict === "keep-right").length}</span></button>
      </footer>

      {notice && <div className="rq-toast"><span><Check size={14} /></span>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss message"><X size={14} /></button></div>}
    </div>
  );
}
