import { useCustomizer, type ItemTransform } from "@/lib/customizer-context";
import { DecalIcon } from "./decals";
import type { ReactNode, CSSProperties } from "react";

/**
 * Wrap any element to make it customizable when the editor overlay is active.
 * - Applies persisted scale/color/decal/hidden state.
 * - When the editor is on, clicking the element selects it for the Inspector.
 * - Locked surfaces (Player, modals, etc.) simply don't use this wrapper.
 */
export function Editable({
  id,
  children,
  as: As = "div",
  className = "",
  style,
  selectable = true,
}: {
  id: string;
  children: ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
  /** Setting false means it still renders the transform but can't be selected. */
  selectable?: boolean;
}) {
  const { active, selected, setSelected, getItem } = useCustomizer();
  const t: ItemTransform = getItem(id);
  if (t.hidden && !active) return null;

  const isSelected = active && selected === id;
  const transform: CSSProperties = {
    transform: t.scale ? `scale(${t.scale})` : undefined,
    transformOrigin: "center",
    color: t.color ? `rgb(${t.color})` : undefined,
    position: "relative",
    outline: isSelected ? "2px solid rgb(var(--polaris-accent))" : undefined,
    outlineOffset: isSelected ? 2 : 0,
    opacity: t.hidden ? 0.4 : 1,
    ...style,
  };

  // We type to any here just for the dynamic tag.
  const Tag = As as unknown as "div";
  return (
    <Tag
      data-polaris-edit-id={id}
      className={`${className} ${active && selectable ? "cursor-grab ring-1 ring-white/0 hover:ring-white/30" : ""}`}
      style={transform}
      onClickCapture={(e) => {
        if (!active || !selectable) return;
        e.preventDefault();
        e.stopPropagation();
        setSelected(id);
      }}
    >
      {children}
      {t.decal && <DecalIcon id={t.decal} />}
    </Tag>
  );
}