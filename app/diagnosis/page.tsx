"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { hasAnyWeekdayAvailability } from "@/lib/availability";
import { ProgressBar } from "@/components/features/profile/progress-bar";
import { QuestionCard } from "@/components/features/diagnosis/question-card";
import { ResultCard } from "@/components/features/diagnosis/result-card";
import { DIAGNOSIS_QUESTIONS } from "@/lib/community-diagnosis/questions";
import {
  computeDiagnosis,
  type DiagnosisRating,
  type DiagnosisAnswers,
  type DiagnosisResult,
} from "@/lib/community-diagnosis/scoring";
import { getCommunityType } from "@/lib/community-diagnosis/types";

type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type Slot = { daytime: boolean; night: boolean };
type WeekdaySlots = Record<WeekdayKey, Slot>;

type PlaceResult = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  photoUrl?: string;
};

type ProfileResponse = {
  gender?: string | null;
  birthDate?: string | null;
  playFrequency?: string | null;
  drinkFrequency?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  ngFoods?: string[];
  favoriteAreas?: string[];
  favoritePlaces?: string[];
  availability?: unknown;
};

type ProfileFieldKey =
  | "gender"
  | "birthDate"
  | "playFrequency"
  | "drinkFrequency"
  | "budget"
  | "ngFoods"
  | "favoriteAreas"
  | "favoritePlaces"
  | "frequentPlaces"
  | "availability";

type Phase = "loading" | "login" | "intro" | "profile" | "questions" | "computing" | "result";

const genderOptions = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "その他" },
  { value: "unspecified", label: "未設定" },
] as const;

const playFrequencyOptions = [
  { value: "low", label: "月1-2回" },
  { value: "medium", label: "週1-2回" },
  { value: "high", label: "週3回以上" },
] as const;

const drinkFrequencyOptions = [
  { value: "never", label: "飲まない" },
  { value: "sometimes", label: "たまに" },
  { value: "often", label: "よく飲む" },
] as const;

const budgetOptions = [
  { id: "upto2000", label: "～2000円", min: 0, max: 2000 },
  { id: "2000to3000", label: "2000円～3000円", min: 2000, max: 3000 },
  { id: "3000to5000", label: "3000円～5000円", min: 3000, max: 5000 },
  { id: "5000to10000", label: "5000円～10000円", min: 5000, max: 10000 },
  { id: "over10000", label: "10000円～", min: 10000, max: null as number | null },
] as const;

type BudgetOptionId = (typeof budgetOptions)[number]["id"];

const NG_FOOD_NONE_OPTION = "なし";

const ngFoodOptions = [
  NG_FOOD_NONE_OPTION,
  "辛いもの",
  "甲殻類",
  "乳製品",
  "パクチー",
  "生魚",
  "香草系",
  "揚げ物",
  "炭酸",
] as const;

const genreOptions = [
  "居酒屋",
  "イタリアン",
  "焼肉",
  "カフェ",
  "クラフトビール",
  "和食",
  "中華",
  "BAR",
] as const;

const dayLabels: Record<WeekdayKey, string> = {
  mon: "月",
  tue: "火",
  wed: "水",
  thu: "木",
  fri: "金",
  sat: "土",
  sun: "日",
};

const defaultWeekdaySlots: WeekdaySlots = {
  mon: { daytime: false, night: false },
  tue: { daytime: false, night: false },
  wed: { daytime: false, night: false },
  thu: { daytime: false, night: false },
  fri: { daytime: false, night: false },
  sat: { daytime: false, night: false },
  sun: { daytime: false, night: false },
};

const profileFieldTitles: Record<ProfileFieldKey, string> = {
  gender: "性別を教えてください",
  birthDate: "誕生日はいつ?",
  playFrequency: "友達と遊ぶ頻度は?",
  drinkFrequency: "お酒はどのくらい飲む?",
  budget: "1回の飲み会の予算感は?",
  ngFoods: "苦手な食べ物はある?",
  favoriteAreas: "よく行くエリアは?",
  favoritePlaces: "好きなお店ジャンルは?",
  frequentPlaces: "よく飲みに行くお店を教えてください",
  availability: "集まりやすい曜日・時間帯は?",
};

const chipClass = (selected: boolean) =>
  `rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
    selected
      ? "border-[var(--accent)] bg-orange-50 text-[var(--accent)]"
      : "border-gray-200 bg-white text-[var(--foreground)]"
  }`;

export default function CommunityDiagnosisPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [existingAvailability, setExistingAvailability] = useState<unknown>(null);
  const [missingFields, setMissingFields] = useState<ProfileFieldKey[]>([]);
  const [profileStepIndex, setProfileStepIndex] = useState(0);
  const [answeredFields, setAnsweredFields] = useState<ProfileFieldKey[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<DiagnosisAnswers>({});
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const submittedRef = useRef(false);

  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [playFrequency, setPlayFrequency] = useState("");
  const [drinkFrequency, setDrinkFrequency] = useState("");
  const [budgetOption, setBudgetOption] = useState<BudgetOptionId | null>(null);
  const [ngFoods, setNgFoods] = useState<string[]>([]);
  const [favoriteAreas, setFavoriteAreas] = useState<string[]>([]);
  const [areaInput, setAreaInput] = useState("");
  const [favoritePlaces, setFavoritePlaces] = useState<string[]>([]);
  const [frequentPlaces, setFrequentPlaces] = useState<PlaceResult[]>([]);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [placeSearchMessage, setPlaceSearchMessage] = useState<string | null>(null);
  const [weekdaySlots, setWeekdaySlots] = useState<WeekdaySlots>(defaultWeekdaySlots);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUserId = data.session?.user?.id ?? null;
      setUserId(currentUserId);

      if (!currentUserId) {
        setPhase("login");
        return;
      }

      const allFields: ProfileFieldKey[] = [
        "gender",
        "birthDate",
        "playFrequency",
        "drinkFrequency",
        "budget",
        "ngFoods",
        "favoriteAreas",
        "favoritePlaces",
        "frequentPlaces",
        "availability",
      ];

      const response = await fetch(
        `/api/profiles/${currentUserId}?viewerId=${encodeURIComponent(currentUserId)}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        setMissingFields(allFields);
        setPhase("intro");
        return;
      }

      const profile = (await response.json()) as ProfileResponse;
      setExistingAvailability(profile.availability ?? null);

      const missing = allFields.filter((field) => {
        switch (field) {
          case "gender":
            return !profile.gender || profile.gender === "unspecified";
          case "birthDate":
            return !profile.birthDate;
          case "playFrequency":
            return !profile.playFrequency;
          case "drinkFrequency":
            return !profile.drinkFrequency;
          case "budget":
            return profile.budgetMin == null && profile.budgetMax == null;
          case "ngFoods":
            return (profile.ngFoods ?? []).length === 0;
          case "favoriteAreas":
            return (profile.favoriteAreas ?? []).length === 0;
          case "favoritePlaces":
            return (profile.favoritePlaces ?? []).length === 0;
          case "frequentPlaces": {
            const avail = profile.availability as { frequentPlaces?: unknown[] } | null;
            return !avail?.frequentPlaces?.length;
          }
          case "availability":
            return !hasAnyWeekdayAvailability(profile.availability);
        }
      });

      setMissingFields(missing);
      setPhase("intro");
    };

    load();
  }, []);

  const totalSteps = missingFields.length + DIAGNOSIS_QUESTIONS.length;

  const currentStep = useMemo(() => {
    if (phase === "profile") return profileStepIndex + 1;
    if (phase === "questions") return missingFields.length + questionIndex + 1;
    if (phase === "computing" || phase === "result") return totalSteps;
    return 0;
  }, [phase, profileStepIndex, questionIndex, missingFields.length, totalSteps]);

  const currentField = missingFields[profileStepIndex];

  const isCurrentFieldAnswered = useMemo(() => {
    switch (currentField) {
      case "gender":
        return gender.length > 0;
      case "birthDate":
        return birthDate.length > 0;
      case "playFrequency":
        return playFrequency.length > 0;
      case "drinkFrequency":
        return drinkFrequency.length > 0;
      case "budget":
        return budgetOption != null;
      case "ngFoods":
        return ngFoods.length > 0;
      case "favoriteAreas":
        return favoriteAreas.length > 0;
      case "favoritePlaces":
        return favoritePlaces.length > 0;
      case "frequentPlaces":
        return frequentPlaces.length > 0;
      case "availability":
        return Object.values(weekdaySlots).some((slot) => slot.daytime || slot.night);
      default:
        return false;
    }
  }, [
    currentField,
    gender,
    birthDate,
    playFrequency,
    drinkFrequency,
    budgetOption,
    ngFoods.length,
    favoriteAreas.length,
    favoritePlaces.length,
    frequentPlaces.length,
    weekdaySlots,
  ]);

  const startDiagnosis = () => {
    setPhase(missingFields.length > 0 ? "profile" : "questions");
  };

  const goToNextProfileStep = (didAnswer: boolean) => {
    if (didAnswer && currentField) {
      setAnsweredFields((prev) =>
        prev.includes(currentField) ? prev : [...prev, currentField]
      );
    }
    if (profileStepIndex + 1 < missingFields.length) {
      setProfileStepIndex(profileStepIndex + 1);
    } else {
      setPhase("questions");
    }
  };

  const handleAnswer = (rating: DiagnosisRating) => {
    const question = DIAGNOSIS_QUESTIONS[questionIndex];
    const nextAnswers = { ...answers, [question.id]: rating };
    setAnswers(nextAnswers);

    if (questionIndex + 1 < DIAGNOSIS_QUESTIONS.length) {
      setQuestionIndex(questionIndex + 1);
      return;
    }

    setResult(computeDiagnosis(nextAnswers));
    setPhase("computing");
  };

  useEffect(() => {
    if (phase !== "computing") return;
    const timer = setTimeout(() => setPhase("result"), 1800);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "result" || !result || !userId || submittedRef.current) return;
    submittedRef.current = true;

    const save = async () => {
      setSaveState("saving");

      const profileUpdates: Record<string, unknown> = {};
      for (const field of answeredFields) {
        switch (field) {
          case "gender":
            profileUpdates.gender = gender;
            break;
          case "birthDate":
            profileUpdates.birthDate = birthDate;
            break;
          case "playFrequency":
            profileUpdates.playFrequency = playFrequency;
            break;
          case "drinkFrequency":
            profileUpdates.drinkFrequency = drinkFrequency;
            break;
          case "budget": {
            const option = budgetOptions.find((item) => item.id === budgetOption);
            if (option) {
              profileUpdates.budgetMin = option.min;
              profileUpdates.budgetMax = option.max;
            }
            break;
          }
          case "ngFoods":
            profileUpdates.ngFoods = ngFoods;
            break;
          case "favoriteAreas":
            profileUpdates.favoriteAreas = favoriteAreas;
            break;
          case "favoritePlaces":
            profileUpdates.favoritePlaces = favoritePlaces;
            break;
        }
      }

      // availability と frequentPlaces は両方 availability JSON にまとめてマージ
      const hasAvailabilityUpdate =
        answeredFields.includes("availability") || answeredFields.includes("frequentPlaces");
      if (hasAvailabilityUpdate) {
        const base =
          existingAvailability && typeof existingAvailability === "object"
            ? { ...(existingAvailability as Record<string, unknown>) }
            : {};
        if (answeredFields.includes("availability")) {
          base.weekdaySlots = weekdaySlots;
        }
        if (answeredFields.includes("frequentPlaces")) {
          base.frequentPlaces = frequentPlaces.map((p) => ({
            placeId: p.placeId,
            name: p.name,
            address: p.address,
            lat: p.lat,
            lng: p.lng,
            photoUrl: p.photoUrl,
          }));
        }
        profileUpdates.availability = base;
      }

      const response = await fetch("/api/profiles/diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          communityType: result.code,
          axisScores: result.axisScores,
          profileUpdates,
        }),
      });

      setSaveState(response.ok ? "saved" : "error");
    };

    save();
  }, [
    phase,
    result,
    userId,
    answeredFields,
    gender,
    birthDate,
    playFrequency,
    drinkFrequency,
    budgetOption,
    ngFoods,
    favoriteAreas,
    favoritePlaces,
    frequentPlaces,
    weekdaySlots,
    existingAvailability,
  ]);

  const restartQuestions = () => {
    submittedRef.current = false;
    setAnswers({});
    setQuestionIndex(0);
    setResult(null);
    setSaveState("idle");
    setPhase("questions");
  };

  const toggleNgFood = (value: string) => {
    setNgFoods((prev) => {
      if (value === NG_FOOD_NONE_OPTION) {
        return prev.includes(NG_FOOD_NONE_OPTION) ? [] : [NG_FOOD_NONE_OPTION];
      }
      const withoutNone = prev.filter((item) => item !== NG_FOOD_NONE_OPTION);
      return withoutNone.includes(value)
        ? withoutNone.filter((item) => item !== value)
        : [...withoutNone, value];
    });
  };

  const addFavoriteArea = () => {
    const value = areaInput.trim();
    if (!value || favoriteAreas.includes(value) || favoriteAreas.length >= 3) return;
    setFavoriteAreas((prev) => [...prev, value]);
    setAreaInput("");
  };

  const toggleSlot = (day: WeekdayKey, key: keyof Slot) => {
    setWeekdaySlots((prev) => ({
      ...prev,
      [day]: { ...prev[day], [key]: !prev[day][key] },
    }));
  };

  const handleSearchFrequentPlaces = async () => {
    if (!placeQuery.trim()) {
      setPlaceSearchMessage("店名やエリアを入力してください。");
      return;
    }
    setIsSearchingPlaces(true);
    setPlaceSearchMessage(null);
    const response = await fetch(
      `/api/places/search?query=${encodeURIComponent(placeQuery)}&limit=6`
    );
    if (!response.ok) {
      setPlaceSearchMessage("検索に失敗しました。時間をおいて再度お試しください。");
      setIsSearchingPlaces(false);
      return;
    }
    const data = (await response.json()) as { places?: PlaceResult[] };
    setPlaceResults(data.places ?? []);
    setPlaceSearchMessage(null);
    setIsSearchingPlaces(false);
  };

  const addFrequentPlace = (place: PlaceResult) => {
    setFrequentPlaces((prev) => {
      if (prev.some((item) => item.placeId === place.placeId)) {
        setPlaceSearchMessage("既に追加済みです。");
        return prev;
      }
      if (prev.length >= 3) {
        setPlaceSearchMessage("よく行くお店は最大3件までです。");
        return prev;
      }
      setPlaceSearchMessage(null);
      return [...prev, place];
    });
  };

  const resultType = result ? getCommunityType(result.code) : null;

  const renderProfileField = () => {
    switch (currentField) {
      case "gender":
        return (
          <div className="flex flex-wrap gap-2">
            {genderOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setGender(option.value)}
                className={chipClass(gender === option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        );
      case "birthDate":
        return (
          <input
            type="date"
            value={birthDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setBirthDate(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm"
          />
        );
      case "playFrequency":
        return (
          <div className="flex flex-wrap gap-2">
            {playFrequencyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPlayFrequency(option.value)}
                className={chipClass(playFrequency === option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        );
      case "drinkFrequency":
        return (
          <div className="flex flex-wrap gap-2">
            {drinkFrequencyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDrinkFrequency(option.value)}
                className={chipClass(drinkFrequency === option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        );
      case "budget":
        return (
          <div className="flex flex-wrap gap-2">
            {budgetOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setBudgetOption(option.id)}
                className={chipClass(budgetOption === option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        );
      case "ngFoods":
        return (
          <div className="flex flex-wrap gap-2">
            {ngFoodOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleNgFood(option)}
                className={chipClass(ngFoods.includes(option))}
              >
                {option}
              </button>
            ))}
          </div>
        );
      case "favoriteAreas":
        return (
          <div>
            <div className="flex gap-2">
              <input
                type="text"
                value={areaInput}
                onChange={(event) => setAreaInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addFavoriteArea();
                  }
                }}
                placeholder="例: 渋谷、梅田"
                className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm"
              />
              <button
                type="button"
                onClick={addFavoriteArea}
                className="rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
              >
                追加
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {favoriteAreas.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() =>
                    setFavoriteAreas((prev) => prev.filter((item) => item !== area))
                  }
                  className={chipClass(true)}
                >
                  {area} ✕
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-[var(--muted)]">最大3つまで登録できます</p>
          </div>
        );
      case "favoritePlaces":
        return (
          <div className="flex flex-wrap gap-2">
            {genreOptions.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() =>
                  setFavoritePlaces((prev) =>
                    prev.includes(genre)
                      ? prev.filter((item) => item !== genre)
                      : [...prev, genre]
                  )
                }
                className={chipClass(favoritePlaces.includes(genre))}
              >
                {genre}
              </button>
            ))}
          </div>
        );
      case "frequentPlaces":
        return (
          <div>
            <div className="flex gap-2">
              <input
                type="text"
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchFrequentPlaces();
                  }
                }}
                placeholder="例: 新宿 居酒屋、銀座 バー"
                className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm"
              />
              <button
                type="button"
                onClick={handleSearchFrequentPlaces}
                disabled={isSearchingPlaces}
                className="rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSearchingPlaces ? "検索中" : "検索"}
              </button>
            </div>
            {placeSearchMessage && (
              <p className="mt-2 text-xs text-[var(--muted)]">{placeSearchMessage}</p>
            )}
            {placeResults.length > 0 && (
              <div className="mt-3 space-y-2 rounded-2xl border border-gray-100 bg-gray-50 p-2">
                {placeResults.map((place) => (
                  <div key={place.placeId} className="flex items-center gap-2 rounded-xl bg-white p-2">
                    {place.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={place.photoUrl}
                        alt={place.name}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-orange-50 text-lg">
                        🍺
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{place.name}</p>
                      <p className="truncate text-[10px] text-[var(--muted)]">{place.address}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addFrequentPlace(place)}
                      disabled={
                        frequentPlaces.some((p) => p.placeId === place.placeId) ||
                        frequentPlaces.length >= 3
                      }
                      className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
                    >
                      追加
                    </button>
                  </div>
                ))}
              </div>
            )}
            {frequentPlaces.length > 0 && (
              <div className="mt-3 space-y-2">
                {frequentPlaces.map((place) => (
                  <div
                    key={place.placeId}
                    className="flex items-center gap-2 rounded-xl border border-orange-100 bg-white p-2"
                  >
                    {place.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={place.photoUrl}
                        alt={place.name}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-orange-50 text-lg">
                        🍺
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{place.name}</p>
                      <p className="truncate text-[10px] text-[var(--muted)]">{place.address}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFrequentPlaces((prev) =>
                          prev.filter((p) => p.placeId !== place.placeId)
                        )
                      }
                      className="shrink-0 rounded-full border border-gray-200 px-2 py-1 text-[10px] font-semibold text-[var(--muted)]"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-[11px] text-[var(--muted)]">最大3件まで登録できます</p>
          </div>
        );
      case "availability":
        return (
          <div className="space-y-2">
            {(Object.keys(dayLabels) as WeekdayKey[]).map((day) => (
              <div key={day} className="flex items-center gap-2">
                <span className="w-8 text-xs font-semibold text-[var(--muted)]">
                  {dayLabels[day]}
                </span>
                <button
                  type="button"
                  onClick={() => toggleSlot(day, "daytime")}
                  className={`flex-1 ${chipClass(weekdaySlots[day].daytime)}`}
                >
                  昼
                </button>
                <button
                  type="button"
                  onClick={() => toggleSlot(day, "night")}
                  className={`flex-1 ${chipClass(weekdaySlots[day].night)}`}
                >
                  夜
                </button>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-orange-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-4 sm:max-w-4xl sm:px-6">
          <Link
            href="/"
            aria-label="ホームへ戻る"
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-[var(--foreground)] shadow-sm"
          >
            <span className="material-symbols-rounded">chevron_left</span>
          </Link>
          <h1 className="text-lg font-semibold">コミュニティ属性診断</h1>
        </div>
      </header>

      {(phase === "profile" || phase === "questions") && (
        <ProgressBar
          progress={totalSteps > 0 ? ((currentStep - 1) / totalSteps) * 100 : 0}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      )}

      <main className="mx-auto max-w-md px-4 py-8 sm:px-6">
        {phase === "loading" && (
          <p className="py-20 text-center text-sm text-[var(--muted)]">読み込み中...</p>
        )}

        {phase === "login" && (
          <div className="py-20 text-center">
            <p className="text-sm text-[var(--muted)]">診断を始めるにはログインが必要です。</p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white"
            >
              ログインする
            </Link>
          </div>
        )}

        {phase === "intro" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-orange-100 bg-white p-6 text-center shadow-sm"
          >
            <p className="text-4xl">🍻</p>
            <h2 className="mt-3 text-xl font-black text-[var(--foreground)]">
              あなたの「居心地タイプ」を診断!
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/80">
              人数・場の雰囲気・関わり方・つながり方の4つの軸から、あなたが一番心地よくいられるコミュニティのタイプを16種類に分類します。
            </p>
            <p className="mt-2 text-xs text-[var(--muted)]">
              全{totalSteps}問・約3分。結果はプロフィールに登録されます。
            </p>
            {missingFields.length > 0 && (
              <p className="mt-2 rounded-2xl bg-orange-50 px-3 py-2 text-xs text-[var(--accent)]">
                はじめにプロフィールの未入力項目({missingFields.length}個)も一緒に埋められます
              </p>
            )}
            <button
              type="button"
              onClick={startDiagnosis}
              className="mt-6 w-full rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-bold text-white shadow-md transition active:scale-[0.98]"
            >
              診断をはじめる
            </button>
          </motion.div>
        )}

        {phase === "profile" && currentField && (
          <motion.div
            key={currentField}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm"
          >
            <p className="text-xs font-semibold text-[var(--accent)]">
              まずはあなたのことを教えて!
            </p>
            <h2 className="mt-2 text-lg font-bold text-[var(--foreground)]">
              {profileFieldTitles[currentField]}
            </h2>
            <div className="mt-5">{renderProfileField()}</div>
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => goToNextProfileStep(false)}
                className="rounded-full px-4 py-2.5 text-xs font-semibold text-[var(--muted)]"
              >
                あとで設定する
              </button>
              <button
                type="button"
                onClick={() => goToNextProfileStep(true)}
                disabled={!isCurrentFieldAnswered}
                className="flex-1 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white shadow-md transition active:scale-[0.98] disabled:opacity-40"
              >
                次へ
              </button>
            </div>
          </motion.div>
        )}

        {phase === "questions" && (
          <AnimatePresence mode="wait">
            <QuestionCard
              key={DIAGNOSIS_QUESTIONS[questionIndex].id}
              question={DIAGNOSIS_QUESTIONS[questionIndex]}
              questionNumber={questionIndex + 1}
              totalQuestions={DIAGNOSIS_QUESTIONS.length}
              onAnswer={handleAnswer}
            />
          </AnimatePresence>
        )}

        {phase === "computing" && (
          <div className="py-20 text-center">
            <motion.p
              animate={{ rotate: [0, 12, -12, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="text-5xl"
            >
              🔮
            </motion.p>
            <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">
              あなたのタイプを分析中...
            </p>
          </div>
        )}

        {phase === "result" && result && resultType && (
          <div>
            <p className="text-center text-sm font-bold text-[var(--accent)]">
              あなたのコミュニティ属性は…
            </p>
            <div className="mt-4">
              <ResultCard type={resultType} axisScores={result.axisScores} />
            </div>

            <p className="mt-3 text-center text-xs text-[var(--muted)]">
              {saveState === "saving" && "プロフィールに保存中..."}
              {saveState === "saved" && "診断結果をプロフィールに登録しました ✔"}
              {saveState === "error" && "保存に失敗しました。時間をおいて再度お試しください。"}
            </p>

            <div className="mt-5 space-y-3">
              <Link
                href="/profile/setup"
                className="block w-full rounded-full bg-[var(--accent)] px-6 py-3.5 text-center text-sm font-bold text-white shadow-md"
              >
                プロフィールを見る
              </Link>
              <button
                type="button"
                onClick={restartQuestions}
                className="block w-full rounded-full border border-orange-200 bg-white px-6 py-3 text-center text-sm font-semibold text-[var(--accent)]"
              >
                もう一度診断する
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
