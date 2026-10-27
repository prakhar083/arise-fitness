import { useState, type ReactNode } from 'react';
import { Image, Pressable, View } from 'react-native';
import { EXERCISE_IMAGES } from '../data/exerciseImages';
import { exerciseKey, fmtRest, type Day, type Exercise } from '../data/plan';
import { colors, mix, radius } from '../theme/tokens';
import { Icon } from './Icon';
import { ImageSlot, T, Tag } from './ui';

export type BlockItem = { key: string; ex: Exercise; letter: string; first: boolean };
export type Block = { superset: boolean; items: BlockItem[] };
export type SectionBlocks = { title: string; blocks: Block[] };

/**
 * Group a day into render blocks:
 * Warm Up / Cool Down → one shared card; Workout → one card per exercise; supersets → one lettered card (A1, A2…).
 */
export const buildBlocks = (day: Day): SectionBlocks[] =>
  day.sections.map((sec, si) => {
    let letterN = 0, idx = 0;
    const isWork = sec.title === 'Workout';
    const blocks: Block[] = [];
    let shared: Block | null = null;
    for (const it of sec.items) {
      const L = String.fromCharCode(65 + letterN++);
      if (it.kind === 'superset') {
        blocks.push({ superset: true, items: it.items.map((ex, k) => ({ key: exerciseKey(day.id, si, idx++), ex, letter: L + (k + 1), first: k === 0 })) });
        shared = null;
        continue;
      }
      const item = { key: exerciseKey(day.id, si, idx++), ex: it, letter: L, first: true };
      if (isWork) blocks.push({ superset: false, items: [item] });
      else {
        if (!shared) { shared = { superset: false, items: [] }; blocks.push(shared); }
        item.first = shared.items.length === 0;
        shared.items.push(item);
      }
    }
    return { title: sec.title, blocks };
  });

export const exerciseTags = (ex: Exercise) =>
  ex.kind === 'set'
    ? [['Sets', String(ex.sets)], ['Reps', ex.repsScheme], ...(ex.restSec ? [['Rest', fmtRest(ex.restSec)]] : [])]
    : [['Time', ex.time]];

export const BlockCard = ({ block, children, bg = colors.surface }: { block: Block; children: ReactNode; bg?: string }) => (
  <View style={{
    paddingVertical: 4, paddingHorizontal: 12, borderRadius: radius.lg, backgroundColor: bg, borderWidth: 1,
    borderColor: block.superset ? colors.a600 : colors.n800, marginTop: block.superset ? 6 : 0,
  }}>
    {block.superset ? (
      <View style={{ position: 'absolute', top: -10, left: 0, right: 0, alignItems: 'center', zIndex: 2 }}>
        <View style={{ paddingVertical: 2, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.bg }}>
          <T size={11} color={colors.a200}>Superset</T>
        </View>
      </View>
    ) : null}
    {children}
  </View>
);

/** Image, name, tags and letter badge — shared by the plan and the logger. */
export const ExerciseHeader = ({ item }: { item: BlockItem }) => (
  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
    {EXERCISE_IMAGES[item.ex.name] ? (
      <Image
        source={EXERCISE_IMAGES[item.ex.name]}
        accessibilityLabel={item.ex.name}
        resizeMode="cover"
        style={{ width: 84, height: 64, borderRadius: radius.md, backgroundColor: '#ffffff' }}
      />
    ) : (
      <ImageSlot width={84} height={64}>
        <Icon name="barbell" size={22} color={colors.n700} />
      </ImageSlot>
    )}
    <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
      <T size={14} weight={500} style={{ lineHeight: 18 }}>{item.ex.name}</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        {exerciseTags(item.ex).map(([l, v]) => (
          <Tag key={l}>
            <T size={11} color={colors.n100}>{l}</T>
            <T size={11} weight={500} color={colors.text}>{v}</T>
          </Tag>
        ))}
      </View>
    </View>
    <View style={{ minWidth: 24, height: 24, paddingHorizontal: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
      <T size={12} color={colors.a200}>{item.letter}</T>
    </View>
  </View>
);

/** Plan-mode row: note clamped to one line, tap to expand. */
export const PlanExercise = ({ item }: { item: BlockItem }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 6, paddingVertical: 10, borderTopWidth: 1, borderTopColor: item.first ? 'transparent' : colors.n800 }}>
      <ExerciseHeader item={item} />
      {item.ex.note ? (
        <Pressable onPress={() => setOpen(o => !o)} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }} accessibilityRole="button" accessibilityLabel={open ? 'Collapse note' : 'Expand note'}>
          <T size={12} color={colors.n400} numberOfLines={open ? undefined : 1} style={{ flex: 1, lineHeight: 17 }}>{item.ex.note}</T>
          <Icon name={open ? 'caret-up' : 'caret-down'} size={12} color={colors.n400} style={{ marginTop: 2 }} />
        </Pressable>
      ) : null}
    </View>
  );
};

export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <T size={14} weight={500} style={{ paddingLeft: 2 }}>{children}</T>
);

export const InstructionsCard = ({ text }: { text: string }) => (
  <View style={{ gap: 6, paddingVertical: 14, paddingHorizontal: 16, borderRadius: radius.lg, backgroundColor: mix(colors.bg, 60, '#000000'), boxShadow: '0 0 0 1px #3f424d' }}>
    <T size={13} weight={500}>Instructions</T>
    <T size={13} color={colors.n400}>{text}</T>
  </View>
);
