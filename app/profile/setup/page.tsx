"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

const genderOptions = [
  { value: "unspecified", label: "未設定" },
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "その他" },
];

const playFrequencyOptions = [
  { value: "", label: "未設定" },
  { value: "low", label: "月1-2回" },
  { value: "medium", label: "週1-2回" },
  { value: "high", label: "週3回以上" },
];

const drinkFrequencyOptions = [
  { value: "", label: "未設定" },
  { value: "never", label: "飲まない" },
  { value: "sometimes", label: "たまに" },
  { value: "often", label: "よく飲む" },
];

const avatarOptions = ["😀", "😎", "🥳", "🦊", "🐼", "🐧", "🦄", "🍀", "🎧", "🎮", "📚", "🏕️"];

const budgetOptions = [
  { id: "upto2000", label: "～2000円", min: 0, max: 2000 },
  { id: "2000to3000", label: "2000円～3000円", min: 2000, max: 3000 },
  { id: "3000to5000", label: "3000円～5000円", min: 3000, max: 5000 },
  { id: "5000to10000", label: "5000円～10000円", min: 5000, max: 10000 },
  { id: "over10000", label: "10000円～", min: 10000, max: null as number | null },
] as const;

type BudgetOptionId = (typeof budgetOptions)[number]["id"];
type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri";
type Slot = { daytime: boolean; night: boolean };
type WeekdaySlots = Record<WeekdayKey, Slot>;

const dayLabels: Record<WeekdayKey, string> = {
  mon: "月曜",
  tue: "火曜",
  wed: "水曜",
  thu: "木曜",
  fri: "金曜",
};

const defaultWeekdaySlots: WeekdaySlots = {
  mon: { daytime: false, night: false },
  tue: { daytime: false, night: false },
  wed: { daytime: false, night: false },
  thu: { daytime: false, night: false },
  fri: { daytime: false, night: false },
};

const detectBudgetOption = (min?: number | null, max?: number | null): BudgetOptionId => {
  const matched = budgetOptions.find((option) => option.min === (min ?? 0) && option.max === (max ?? null));
  return matched?.id ?? "3000to5000";
};

const toWeekdaySlots = (availability: unknown): WeekdaySlots => {
  if (!availability || typeof availability !== "object") {
    return defaultWeekdaySlots;
  }

  const record = availability as {
    weekdaySlots?: Partial<Record<WeekdayKey, Partial<Slot>>>;
    days?: string[];
    timeRanges?: { start?: string; end?: string }[];
  };

  if (record.weekdaySlots) {
    return {
      mon: {
        daytime: Boolean(record.weekdaySlots.mon?.daytime),
        night: Boolean(record.weekdaySlots.mon?.night),
      },
      tue: {
        daytime: Boolean(record.weekdaySlots.tue?.daytime),
        night: Boolean(record.weekdaySlots.tue?.night),
      },
      wed: {
        daytime: Boolean(record.weekdaySlots.wed?.daytime),
        night: Boolean(record.weekdaySlots.wed?.night),
      },
      thu: {
        daytime: Boolean(record.weekdaySlots.thu?.daytime),
        night: Boolean(record.weekdaySlots.thu?.night),
      },
      fri: {
        daytime: Boolean(record.weekdaySlots.fri?.daytime),
        night: Boolean(record.weekdaySlots.fri?.night),
      },
    };
  }

  const legacy = { ...defaultWeekdaySlots };
  const days = new Set(record.days ?? []);
  const startHour = Number((record.timeRanges?.[0]?.start ?? "19:00").split(":")[0]);
  const daytime = Number.isFinite(startHour) ? startHour < 17 : false;

  (["mon", "tue", "wed", "thu", "fri"] as WeekdayKey[]).forEach((day) => {
    if (!days.has(day)) return;
    if (daytime) {
      legacy[day].daytime = true;
    } else {
      legacy[day].night = true;
    }
  });

  return legacy;
};

export default function ProfileSetupPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarIcon, setAvatarIcon] = useState(avatarOptions[0]);
  const [gender, setGender] = useState("unspecified");
  const [birthDate, setBirthDate] = useState("");
  const [playFrequency, setPlayFrequency] = useState("");
  const [drinkFrequency, setDrinkFrequency] = useState("");
  const [budgetOption, setBudgetOption] = useState<BudgetOptionId>("3000to5000");
  const [ngFoods, setNgFoods] = useState<string[]>([]);
  const [favoriteAreas, setFavoriteAreas] = useState<string[]>([]);
  const [favoritePlaces, setFavoritePlaces] = useState<string[]>([]);
  const [weekdaySlots, setWeekdaySlots] = useState<WeekdaySlots>(defaultWeekdaySlots);
  const [message, setMessage] = useState<string | null>(null);
  const [customArea, setCustomArea] = useState("");
  const [customPlace, setCustomPlace] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUserId = data.session?.user?.id ?? null;
      setUserId(currentUserId);

      if (currentUserId) {
        const response = await fetch(`/api/profiles/${currentUserId}`);
        if (response.ok) {
          const profile = await response.json();
          setDisplayName(profile.displayName ?? "");
          setAvatarIcon(profile.avatarIcon ?? avatarOptions[0]);
          setGender(profile.gender ?? "unspecified");
          setBirthDate(profile.birthDate ? profile.birthDate.slice(0, 10) : "");
          setPlayFrequency(profile.playFrequency ?? "");
          setDrinkFrequency(profile.drinkFrequency ?? "");
          setBudgetOption(detectBudgetOption(profile.budgetMin, profile.budgetMax));
          setNgFoods(profile.ngFoods ?? []);
          setFavoriteAreas(profile.favoriteAreas ?? []);
          setFavoritePlaces(profile.favoritePlaces ?? []);
          setWeekdaySlots(toWeekdaySlots(profile.availability));
        }
      }
    };

    loadUser();
  }, []);

  const toggleItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const toggleSlot = (day: WeekdayKey, key: keyof Slot) => {
    setWeekdaySlots((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [key]: !prev[day][key],
      },
    }));
  };

  const handleSubmit = async () => {
    if (!userId || !displayName) {
      setMessage("ログイン後に表示名を入力してください。");
      return;
    }

    const selectedBudget = budgetOptions.find((option) => option.id === budgetOption) ?? budgetOptions[2];

    const response = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        displayName,
        avatarIcon,
        gender,
        birthDate: birthDate || undefined,
        playFrequency: playFrequency || undefined,
        drinkFrequency: drinkFrequency || undefined,
        budgetMin: selectedBudget.min,
        budgetMax: selectedBudget.max,
        ngFoods,
        favoriteAreas,
        favoritePlaces,
        availability: {
          weekdaySlots,
        },
      }),
    });

    if (response.ok) {
      setMessage("保存しました。");
    } else {
      setMessage("保存に失敗しました。");
    }
  };

  return (
    <div className="min-h-screen pb-4">
      <header className="sticky top-0 z-40 border-b border-orange-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-4 sm:max-w-4xl sm:px-6">
          <Link href="/" className="text-sm font-semibold text-[var(--muted)]">
            ← フィード
          </Link>
          <span className="text-xs font-semibold tracking-[0.18em] text-[#b08b66]">PROFILE</span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6 sm:max-w-4xl sm:px-6">
        {!userId && (
          <div className="mb-5 rounded-3xl bg-white/80 p-4 text-sm text-[var(--muted)] shadow-sm">
            プロフィールを保存するにはログインが必要です。
            <Link href="/onboarding" className="ml-2 text-[var(--accent)]">
              ログインへ
            </Link>
          </div>
        )}

        <div className="pt-2">
          <div className="mb-5">
            <h1 className="text-2xl font-semibold">プロフィール設定</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">アイコンと好みを選ぶだけでプロフィール設定できます。</p>
          </div>

          <div className="space-y-5">
            <section className="border-t border-orange-100 py-4">
              <h2 className="text-sm font-semibold">アイコン</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {avatarOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setAvatarIcon(option)}
                    className={`grid h-10 w-10 place-items-center rounded-full text-lg ${
                      avatarIcon === option
                        ? "bg-[var(--accent)] text-white shadow-md"
                        : "bg-white shadow-sm"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </section>

            <section className="border-t border-orange-100 py-4">
              <h2 className="text-sm font-semibold">基本情報</h2>
              <div className="mt-3 grid gap-3">
                <label className="flex flex-col gap-2 text-sm">
                  表示名
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="rounded-2xl bg-white px-4 py-3 shadow-sm"
                    placeholder="ニックネーム"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  生年月日
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(event) => setBirthDate(event.target.value)}
                    className="rounded-2xl bg-white px-4 py-3 shadow-sm"
                  />
                </label>
                <ChipRow title="性別" options={genderOptions} selected={gender} onSelect={setGender} />
              </div>
            </section>

            <section className="border-t border-orange-100 py-4">
              <h2 className="text-sm font-semibold">ライフスタイル</h2>
              <div className="mt-3 space-y-4">
                <ChipRow title="遊ぶ頻度" options={playFrequencyOptions} selected={playFrequency} onSelect={setPlayFrequency} />
                <ChipRow title="飲む頻度" options={drinkFrequencyOptions} selected={drinkFrequency} onSelect={setDrinkFrequency} />
              </div>
            </section>

            <section className="border-t border-orange-100 py-4">
              <h2 className="text-sm font-semibold">普段の遊びにかかる費用は？</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {budgetOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setBudgetOption(option.id)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold ${
                      budgetOption === option.id
                        ? "bg-[var(--accent)] text-white"
                        : "bg-white text-[var(--muted)] shadow-sm"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <MultiSelectRow
              title="NG食材"
              options={["辛いもの", "甲殻類", "乳製品", "パクチー", "生魚", "香草系", "揚げ物", "炭酸"]}
              selected={ngFoods}
              onToggle={(value) => toggleItem(setNgFoods, value)}
            />

            <MultiSelectRow
              title="よく行くエリア"
              options={[...new Set(["渋谷", "恵比寿", "新宿", "池袋", "銀座", "下北沢", "中目黒", "上野", ...favoriteAreas])]} 
              selected={favoriteAreas}
              onToggle={(value) => toggleItem(setFavoriteAreas, value)}
              addInputValue={customArea}
              setAddInputValue={setCustomArea}
              onAddValue={() => {
                if (!customArea.trim()) return;
                if (!favoriteAreas.includes(customArea.trim())) {
                  setFavoriteAreas((prev) => [...prev, customArea.trim()]);
                }
                setCustomArea("");
              }}
              addPlaceholder="エリアを追加"
            />

            <MultiSelectRow
              title="好きなお店ジャンル"
              options={[...new Set(["居酒屋", "イタリアン", "焼肉", "カフェ", "クラフトビール", "和食", "中華", "BAR", ...favoritePlaces])]} 
              selected={favoritePlaces}
              onToggle={(value) => toggleItem(setFavoritePlaces, value)}
              addInputValue={customPlace}
              setAddInputValue={setCustomPlace}
              onAddValue={() => {
                if (!customPlace.trim()) return;
                if (!favoritePlaces.includes(customPlace.trim())) {
                  setFavoritePlaces((prev) => [...prev, customPlace.trim()]);
                }
                setCustomPlace("");
              }}
              addPlaceholder="ジャンルを追加"
            />

            <section className="border-t border-orange-100 py-4">
              <h2 className="text-sm font-semibold">遊べる曜日</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">平日ごとに「日中」「夜」を選べます。</p>
              <div className="mt-3 space-y-3">
                {(["mon", "tue", "wed", "thu", "fri"] as WeekdayKey[]).map((day) => (
                  <div key={day} className="flex items-center justify-between rounded-2xl bg-white px-3 py-3 shadow-sm">
                    <span className="text-sm font-semibold">{dayLabels[day]}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSlot(day, "daytime")}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          weekdaySlots[day].daytime
                            ? "bg-[var(--accent)] text-white"
                            : "bg-[#f4f4f3] text-[var(--muted)]"
                        }`}
                      >
                        日中
                      </button>
                      <button
                        onClick={() => toggleSlot(day, "night")}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          weekdaySlots[day].night
                            ? "bg-[var(--accent)] text-white"
                            : "bg-[#f4f4f3] text-[var(--muted)]"
                        }`}
                      >
                        夜
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {message && <p className="mt-6 text-sm text-[var(--accent)]">{message}</p>}

          <button
            onClick={handleSubmit}
            disabled={!userId}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-rounded">save</span>
            保存する
          </button>
        </div>
      </main>
    </div>
  );
}

type ChipOption = { value: string; label: string };

function ChipRow({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: ChipOption[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[var(--foreground)]">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value || "unset"}
            onClick={() => onSelect(option.value)}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              selected === option.value
                ? "bg-[var(--accent)] text-white"
                : "bg-white text-[var(--muted)] shadow-sm"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiSelectRow({
  title,
  options,
  selected,
  onToggle,
  addInputValue,
  setAddInputValue,
  onAddValue,
  addPlaceholder,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  addInputValue?: string;
  setAddInputValue?: (value: string) => void;
  onAddValue?: () => void;
  addPlaceholder?: string;
}) {
  return (
    <section className="border-t border-orange-100 py-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onToggle(option)}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              selected.includes(option)
                ? "bg-[var(--accent)] text-white"
                : "bg-white text-[var(--muted)] shadow-sm"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {setAddInputValue && onAddValue && addPlaceholder && (
        <div className="mt-3 flex gap-2">
          <input
            value={addInputValue}
            onChange={(event) => setAddInputValue(event.target.value)}
            placeholder={addPlaceholder}
            className="flex-1 rounded-full bg-white px-4 py-2 text-sm shadow-sm"
          />
          <button
            onClick={onAddValue}
            className="rounded-full bg-orange-100 px-4 py-2 text-xs font-semibold text-[var(--accent)] shadow-sm"
          >
            追加
          </button>
        </div>
      )}
    </section>
  );
}
