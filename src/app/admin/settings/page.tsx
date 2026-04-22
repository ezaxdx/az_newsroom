"use client";

import { useState, useEffect } from "react";
import { Plus, X, Sparkles, Save, Loader2 } from "lucide-react";

type CategorySetting = {
  audience: string;
  persona: string;
  keywords: string[];
};
type SettingsMap = Record<string, CategorySetting>;

/* 카테고리 추가 시 기본 페르소나 */
function makeDefault(cat: string): CategorySetting {
  return {
    audience: `${cat} 업계 종사자`,
    persona: `당신은 ${cat} 전문 에디터입니다. 업계 종사자 관점에서 핵심 시사점을 분석합니다.`,
    keywords: [],
  };
}

/* 기본 프리셋 (AI·MICE·TOURISM만 제공, 나머지는 makeDefault) */
const PRESETS: Record<string, { label: string; prompt: string }[]> = {
  AI: [
    { label: "AI 리서처", prompt: "이 뉴스를 AI 기술 리서처의 관점에서 분석해줘. 기술 실현 가능성, 산업 적용 가능성, 데이터 파이프라인 측면을 중심으로 시사점을 도출해." },
    { label: "AI 스타트업 창업자", prompt: "이 뉴스를 AI 스타트업 창업자의 관점에서 분석해줘. 시장 진입 타이밍, 차별화 포인트, 자본 효율성 측면의 인사이트를 제공해." },
  ],
  MICE: [
    { label: "MICE 기획자", prompt: "이 뉴스를 MICE 행사 기획자의 관점에서 분석해줘. 운영 효율, 참가자 경험, 비용 최적화 측면에서 실질적인 시사점을 도출해." },
    { label: "컨벤션 센터 운영자", prompt: "이 뉴스를 컨벤션 센터 운영자의 관점에서 분석해줘. 공간 활용률, 운영 자동화, 서비스 품질 측면에서 적용 가능한 인사이트를 제공해." },
  ],
  TOURISM: [
    { label: "관광 스타트업 대표", prompt: "이 뉴스를 관광 스타트업 대표의 관점에서 분석해줘. 시장 기회, 경쟁 우위, 투자 유치 가능성 측면을 중심으로 해석해." },
    { label: "지자체 관광 담당자", prompt: "이 뉴스를 지자체 관광 담당자의 관점에서 분석해줘. 방문객 유치 전략, 체류시간 연장, 지역 경제 파급 효과 측면의 시사점을 도출해." },
  ],
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [navCategories, setNavCategories] = useState<string[]>(["AI", "MICE", "TOURISM"]);
  const [carouselSec, setCarouselSec] = useState(5);
  const [settings, setSettings] = useState<SettingsMap>({});
  const [activeTab, setActiveTab] = useState("AI");

  const [newCat, setNewCat] = useState("");
  const [newKeyword, setNewKeyword] = useState("");

  /* ── DB에서 로드 ── */
  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => {
        const cats: string[] = d.categories ?? ["AI", "MICE", "TOURISM"];
        setNavCategories(cats);
        setCarouselSec(d.carouselSec ?? 5);
        setActiveTab(cats[0] ?? "AI");

        const saved: SettingsMap = d.categorySettings ?? {};
        const merged: SettingsMap = {};
        for (const cat of cats) {
          merged[cat] = saved[cat] ?? makeDefault(cat);
        }
        setSettings(merged);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ── 카테고리 추가 ── */
  const addCategory = () => {
    const cat = newCat.trim().toUpperCase();
    if (!cat || navCategories.includes(cat)) return;
    setNavCategories((prev) => [...prev, cat]);
    setSettings((prev) => ({ ...prev, [cat]: makeDefault(cat) }));
    setActiveTab(cat);
    setNewCat("");
  };

  /* ── 카테고리 삭제 ── */
  const removeCategory = (cat: string) => {
    if (navCategories.length <= 1) { alert("카테고리는 최소 1개 필요합니다."); return; }
    if (!confirm(`"${cat}" 카테고리를 삭제할까요?`)) return;
    setNavCategories((prev) => prev.filter((c) => c !== cat));
    if (activeTab === cat) setActiveTab(navCategories.find((c) => c !== cat) ?? "");
  };

  /* ── 페르소나 수정 ── */
  const current = settings[activeTab] ?? makeDefault(activeTab);
  const update = (patch: Partial<CategorySetting>) =>
    setSettings((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], ...patch } }));

  const addKeyword = () => {
    const k = newKeyword.trim();
    if (!k || current.keywords.includes(k)) return;
    update({ keywords: [...current.keywords, k] });
    setNewKeyword("");
  };

  /* ── 전체 저장 ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: navCategories, carouselSec, categorySettings: settings }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin" style={{ color: "var(--on-surface-variant)" }} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight m-0">큐레이션 설정</h2>
          <p className="text-sm m-0 mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            카테고리 추가/삭제 후 저장하면 뉴스룸 전체에 반영됩니다
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 h-9 px-5 rounded-md text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
          style={{ background: saved ? "#16a34a" : "var(--primary)", color: "#fff" }}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? "저장 중..." : saved ? "저장됨 ✓" : "전체 저장"}
        </button>
      </div>

      {/* ── 카테고리 관리 ── */}
      <div className="p-5 rounded-lg mb-8 flex flex-col gap-4" style={{ background: "var(--surface-container-lowest)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold tracking-[0.05em] uppercase m-0 mb-0.5"
              style={{ color: "var(--on-surface-variant)" }}>
              상단 네비게이션 카테고리
            </p>
            <p className="text-xs m-0" style={{ color: "var(--on-surface-variant)" }}>
              추가/삭제 후 전체 저장을 눌러야 반영됩니다
            </p>
          </div>
          {/* 카테고리 추가 인풋 */}
          <div className="flex gap-2">
            <input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCategory()}
              placeholder="새 카테고리명"
              className="h-8 px-3 rounded-md text-sm outline-none w-32"
              style={{
                background: "var(--surface-container-low)",
                border: "1px solid var(--surface-container-high)",
                color: "var(--on-surface)",
              }}
            />
            <button
              onClick={addCategory}
              className="flex items-center gap-1 h-8 px-3 rounded-md text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: "var(--primary)", color: "#fff", border: "none", cursor: "pointer" }}
            >
              <Plus size={13} /> 추가
            </button>
          </div>
        </div>

        {/* 카테고리 칩 목록 */}
        <div className="flex flex-wrap gap-2">
          {navCategories.map((cat) => (
            <span
              key={cat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase"
              style={{ background: "var(--primary)", color: "#fff" }}
            >
              {cat}
              <button
                onClick={() => removeCategory(cat)}
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex", opacity: 0.8 }}
                title={`${cat} 삭제`}
              >
                <X size={11} color="#fff" />
              </button>
            </span>
          ))}
        </div>

        {/* 히어로 롤링 간격 */}
        <div className="flex items-center gap-3 pt-3" style={{ borderTop: "1px solid var(--surface-container-high)" }}>
          <label className="flex items-center gap-2 text-xs" style={{ color: "var(--on-surface-variant)" }}>
            <span className="font-semibold">히어로 롤링 간격</span>
            <input
              type="number"
              min={2}
              max={60}
              value={carouselSec}
              onChange={(e) => setCarouselSec(Math.max(2, Math.min(60, Number(e.target.value))))}
              className="w-16 h-7 px-2 rounded-md text-xs text-center outline-none"
              style={{
                background: "var(--surface-container-highest)",
                border: "1px solid var(--surface-container-high)",
                color: "var(--on-surface)",
              }}
            />
            <span>초</span>
          </label>
        </div>
      </div>

      {/* ── 페르소나 설정 (카테고리별 탭) ── */}
      {navCategories.length > 0 && (
        <>
          <div
            className="flex gap-0.5 mb-6 p-1 rounded-lg overflow-x-auto"
            style={{ background: "var(--surface-container-highest)" }}
          >
            {navCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveTab(cat); setNewKeyword(""); }}
                className="flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide uppercase transition-all"
                style={{
                  background: activeTab === cat ? "var(--surface-container-lowest)" : "transparent",
                  color: activeTab === cat ? "var(--on-surface)" : "var(--on-surface-variant)",
                  boxShadow: activeTab === cat ? "0 1px 4px rgba(26,28,29,0.07)" : "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-5">
            {/* 타겟 독자 */}
            <div className="p-5 rounded-lg flex flex-col gap-3" style={{ background: "var(--surface-container-lowest)" }}>
              <label className="text-[0.72rem] font-semibold tracking-[0.05em] uppercase" style={{ color: "var(--on-surface-variant)" }}>
                타겟 독자
              </label>
              <input
                value={current.audience}
                onChange={(e) => update({ audience: e.target.value })}
                className="h-9 px-3 rounded-md text-sm outline-none"
                style={{ background: "var(--surface-container-low)", border: "1px solid transparent", color: "var(--on-surface)" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "transparent")}
              />
            </div>

            {/* AI 페르소나 */}
            <div className="p-5 rounded-lg flex flex-col gap-3" style={{ background: "var(--surface-container-lowest)" }}>
              <div className="flex items-center gap-2">
                <Sparkles size={14} style={{ color: "var(--on-surface-variant)" }} />
                <label className="text-[0.72rem] font-semibold tracking-[0.05em] uppercase" style={{ color: "var(--on-surface-variant)" }}>
                  AI 페르소나 프롬프트
                </label>
              </div>

              {PRESETS[activeTab] && (
                <div className="flex gap-2 flex-wrap">
                  {PRESETS[activeTab].map(({ label, prompt }) => (
                    <button
                      key={label}
                      onClick={() => update({ persona: prompt })}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                      style={{
                        background: current.persona === prompt ? "var(--primary)" : "var(--surface-container-highest)",
                        color: current.persona === prompt ? "#fff" : "var(--on-surface-variant)",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <textarea
                value={current.persona}
                onChange={(e) => update({ persona: e.target.value })}
                rows={5}
                className="px-3 py-2.5 rounded-md text-sm outline-none resize-none leading-relaxed"
                style={{
                  background: "var(--surface-container-low)",
                  border: "1px solid transparent",
                  color: "var(--on-surface)",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "transparent")}
              />
              <p className="text-[0.7rem] m-0" style={{ color: "var(--on-surface-variant)" }}>
                이 프롬프트가 <strong>{activeTab}</strong> 카테고리 기사의 AI 생성에 사용됩니다.
              </p>
            </div>

            {/* 강조 키워드 */}
            <div className="p-5 rounded-lg flex flex-col gap-3" style={{ background: "var(--surface-container-lowest)" }}>
              <label className="text-[0.72rem] font-semibold tracking-[0.05em] uppercase" style={{ color: "var(--on-surface-variant)" }}>
                강조 키워드
              </label>
              <div className="flex flex-wrap gap-2">
                {current.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                    style={{ background: "var(--surface-container-highest)", color: "var(--on-surface)" }}
                  >
                    {kw}
                    <button
                      onClick={() => update({ keywords: current.keywords.filter((k) => k !== kw) })}
                      style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
                    >
                      <X size={12} style={{ color: "var(--on-surface-variant)" }} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                  placeholder="키워드 입력 후 Enter"
                  className="h-8 flex-1 px-3 rounded-md text-sm outline-none"
                  style={{ background: "var(--surface-container-low)", border: "1px solid transparent", color: "var(--on-surface)" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "transparent")}
                />
                <button
                  onClick={addKeyword}
                  className="h-8 w-8 flex items-center justify-center rounded-md"
                  style={{ background: "var(--surface-container-highest)", border: "none", cursor: "pointer" }}
                >
                  <Plus size={14} style={{ color: "var(--on-surface)" }} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
